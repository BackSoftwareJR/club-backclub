<?php

namespace App\Http\Controllers\Api\Auth;

use App\Exceptions\ForbiddenApiException;
use App\Exceptions\GhostRedirectException;
use App\Exceptions\PinLockedException;
use App\Exceptions\UnauthorizedApiException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\PinSetupRequest;
use App\Models\ActivityLog;
use App\Models\ClubMember;
use App\Models\SecurityLog;
use App\Services\Auth\IpAuthBlockService;
use App\Services\Auth\JwtService;
use App\Services\Auth\PinLockoutService;
use App\Services\Compliance\ActivityLogService;
use App\Services\Compliance\LegalTermsService;
use App\Services\Security\SecurityLogService;
use App\Services\Treasury\MemberService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Throwable;

class AuthController extends Controller
{
    public function __construct(
        private readonly JwtService $jwtService,
        private readonly PinLockoutService $pinLockoutService,
        private readonly IpAuthBlockService $ipAuthBlockService,
        private readonly MemberService $memberService,
        private readonly LegalTermsService $legalTermsService,
        private readonly ActivityLogService $activityLogService,
        private readonly SecurityLogService $securityLogService,
    ) {}

    public function entry(Request $request, int $clubId, string $nfcUid): JsonResponse
    {
        try {
            $member = $this->resolveMember($clubId, $nfcUid);
        } catch (UnauthorizedApiException) {
            $this->activityLogService->record(
                eventType: 'entry_scan',
                status: ActivityLog::STATUS_FAILURE,
                clubId: $clubId,
                nfcUid: $nfcUid,
                request: $request,
                metadata: ['reason' => 'unknown_card'],
            );
            $this->throwGhostRedirect(
                request: $request,
                violationType: SecurityLog::INVALID_NFC,
                clubId: $clubId,
                nfcUid: $nfcUid,
                metadata: ['reason' => 'unknown_card'],
            );
        }

        if ($member->isSuspended()) {
            $this->activityLogService->record(
                eventType: 'entry_scan',
                status: ActivityLog::STATUS_BLOCKED,
                member: $member,
                request: $request,
                metadata: ['reason' => 'suspended'],
            );
            throw new ForbiddenApiException('Club membership is suspended. Contact your administrator.');
        }

        $this->pinLockoutService->assertNotLocked($member);

        $this->activityLogService->record(
            eventType: 'entry_scan',
            member: $member,
            request: $request,
            metadata: ['requires_pin_setup' => $member->requiresPinSetup()],
        );

        $club = $member->club;

        return response()->json([
            'club_id' => $club->id,
            'nfc_uid' => $member->nfc_uid,
            'requires_pin_setup' => $member->requiresPinSetup(),
            'requires_terms_acceptance' => $this->legalTermsService->requiresAcceptance($member),
            'terms_version' => $this->legalTermsService->currentVersion(),
            'club_name' => $club->name,
            'theme_config' => $club->resolvedThemeConfig(),
        ]);
    }

    public function pinSetup(PinSetupRequest $request): JsonResponse
    {
        $validated = $request->validated();

        try {
            $member = $this->resolveMember((int) $validated['club_id'], $validated['nfc_uid']);
        } catch (UnauthorizedApiException) {
            $this->throwGhostRedirect(
                request: $request,
                violationType: SecurityLog::INVALID_NFC,
                clubId: (int) $validated['club_id'],
                nfcUid: $validated['nfc_uid'],
                metadata: ['reason' => 'unknown_card'],
            );
        }

        if ($member->isSuspended()) {
            throw new ForbiddenApiException('Club membership is suspended. Contact your administrator.');
        }

        if (! $member->requiresPinSetup()) {
            throw new ForbiddenApiException('PIN is already configured for this card.');
        }

        $this->assertTermsAccepted($member, $request);
        $this->pinLockoutService->assertNotLocked($member);

        $member = $this->memberService->setupPin($member, $validated['pin']);
        $this->ipAuthBlockService->clearFailures($request->ip() ?? '0.0.0.0');
        $this->pinLockoutService->resetAttempts($member);

        $this->activityLogService->record(
            eventType: 'pin_setup',
            member: $member,
            request: $request,
        );

        return response()->json($this->buildAuthResponse($member));
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $validated = $request->validated();

        try {
            $member = $this->resolveMember((int) $validated['club_id'], $validated['nfc_uid']);
        } catch (UnauthorizedApiException) {
            $this->activityLogService->record(
                eventType: 'login_attempt',
                status: ActivityLog::STATUS_FAILURE,
                clubId: (int) $validated['club_id'],
                nfcUid: $validated['nfc_uid'],
                request: $request,
                metadata: ['reason' => 'unknown_card'],
            );
            $this->throwGhostRedirect(
                request: $request,
                violationType: SecurityLog::INVALID_NFC,
                clubId: (int) $validated['club_id'],
                nfcUid: $validated['nfc_uid'],
                metadata: ['reason' => 'unknown_card'],
            );
        }

        if ($member->isSuspended()) {
            $this->activityLogService->record(
                eventType: 'login_attempt',
                status: ActivityLog::STATUS_BLOCKED,
                member: $member,
                request: $request,
            );
            throw new ForbiddenApiException('Club membership is suspended. Contact your administrator.');
        }

        if ($member->requiresPinSetup()) {
            throw new ForbiddenApiException('PIN setup is required before login.');
        }

        $this->assertTermsAccepted($member, $request);
        $this->pinLockoutService->assertNotLocked($member);

        if (! Hash::check($validated['pin'], (string) $member->pin_hash)) {
            try {
                $this->pinLockoutService->recordFailedAttempt($member);
            } catch (PinLockedException) {
                $this->ipAuthBlockService->blockForDay($request->ip() ?? '0.0.0.0');
                $this->activityLogService->record(
                    eventType: 'login_attempt',
                    status: ActivityLog::STATUS_BLOCKED,
                    member: $member,
                    request: $request,
                    metadata: ['reason' => 'pin_locked'],
                );
                $this->throwGhostRedirect(
                    request: $request,
                    violationType: SecurityLog::WRONG_PIN,
                    clubId: $member->club_id,
                    nfcUid: $member->nfc_uid,
                    metadata: ['reason' => 'third_invalid_pin', 'blocked_hours' => 24],
                    httpStatus: 429,
                );
            }

            $this->ipAuthBlockService->recordFailureSilently($request->ip() ?? '0.0.0.0');
            $this->activityLogService->record(
                eventType: 'login_attempt',
                status: ActivityLog::STATUS_FAILURE,
                member: $member,
                request: $request,
                metadata: ['reason' => 'invalid_pin'],
            );
            throw new UnauthorizedApiException('Invalid credentials.');
        }

        $this->pinLockoutService->resetAttempts($member);
        $this->ipAuthBlockService->clearFailures($request->ip() ?? '0.0.0.0');

        $this->activityLogService->record(
            eventType: 'login_success',
            member: $member,
            request: $request,
        );

        return response()->json($this->buildAuthResponse($member));
    }

    /**
     * @return array<string, mixed>
     */
    private function buildAuthResponse(ClubMember $member): array
    {
        $club = $member->club;
        $user = $member->user;
        $token = $this->jwtService->issue($user, $club, $member);

        return [
            'token' => $token,
            'expires_in' => $this->jwtService->ttl(),
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
            ],
            'club' => [
                'id' => $club->id,
                'name' => $club->name,
                'theme_config' => $club->resolvedThemeConfig(),
            ],
            'is_club_owner' => $user->ownsClub($club),
        ];
    }

    private function assertTermsAccepted(ClubMember $member, Request $request): void
    {
        if ($this->legalTermsService->requiresAcceptance($member)) {
            $this->activityLogService->record(
                eventType: 'terms_required',
                status: ActivityLog::STATUS_BLOCKED,
                member: $member,
                request: $request,
            );
            throw new ForbiddenApiException('Terms acceptance is required before continuing.');
        }
    }

    /**
     * @param  array<string, mixed>|null  $metadata
     */
    private function throwGhostRedirect(
        Request $request,
        string $violationType,
        ?int $clubId = null,
        ?string $nfcUid = null,
        ?array $metadata = null,
        int $httpStatus = 404,
    ): never {
        try {
            $this->securityLogService->record(
                request: $request,
                violationType: $violationType,
                clubId: $clubId,
                nfcUid: $nfcUid,
                metadata: $metadata,
            );
        } catch (Throwable $exception) {
            report($exception);
        }

        throw new GhostRedirectException(
            violationType: $violationType,
            clubId: $clubId,
            nfcUid: $nfcUid,
            metadata: $metadata,
            httpStatus: $httpStatus,
        );
    }

    private function resolveMember(int $clubId, string $nfcUid): ClubMember
    {
        $member = ClubMember::query()
            ->with(['club', 'user'])
            ->where('club_id', $clubId)
            ->where('nfc_uid', $nfcUid)
            ->first();

        if ($member === null) {
            throw new UnauthorizedApiException('Card not recognized for this club.');
        }

        return $member;
    }
}
