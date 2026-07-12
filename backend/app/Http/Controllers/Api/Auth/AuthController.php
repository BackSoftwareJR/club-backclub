<?php

namespace App\Http\Controllers\Api\Auth;

use App\Exceptions\ForbiddenApiException;
use App\Exceptions\UnauthorizedApiException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\PinSetupRequest;
use App\Models\ClubMember;
use App\Services\Auth\IpAuthBlockService;
use App\Services\Auth\JwtService;
use App\Services\Auth\PinLockoutService;
use App\Services\Treasury\MemberService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function __construct(
        private readonly JwtService $jwtService,
        private readonly PinLockoutService $pinLockoutService,
        private readonly IpAuthBlockService $ipAuthBlockService,
        private readonly MemberService $memberService,
    ) {}

    public function entry(Request $request, int $clubId, string $nfcUid): JsonResponse
    {
        try {
            $member = $this->resolveMember($clubId, $nfcUid);
        } catch (UnauthorizedApiException) {
            $this->ipAuthBlockService->recordFailure($request->ip() ?? '0.0.0.0');
            throw new UnauthorizedApiException('Card not recognized for this club.');
        }

        if ($member->isSuspended()) {
            throw new ForbiddenApiException('Club membership is suspended. Contact your administrator.');
        }

        $this->pinLockoutService->assertNotLocked($member);

        $club = $member->club;

        return response()->json([
            'club_id' => $club->id,
            'nfc_uid' => $member->nfc_uid,
            'requires_pin_setup' => $member->requiresPinSetup(),
            'club_name' => $club->name,
            'theme_config' => $club->resolvedThemeConfig(),
        ]);
    }

    public function pinSetup(PinSetupRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $member = $this->resolveMember((int) $validated['club_id'], $validated['nfc_uid']);

        if ($member->isSuspended()) {
            $this->ipAuthBlockService->recordFailure($request->ip() ?? '0.0.0.0');
            throw new ForbiddenApiException('Club membership is suspended. Contact your administrator.');
        }

        if (! $member->requiresPinSetup()) {
            $this->ipAuthBlockService->recordFailure($request->ip() ?? '0.0.0.0');
            throw new ForbiddenApiException('PIN is already configured for this card.');
        }

        $this->pinLockoutService->assertNotLocked($member);

        $member = $this->memberService->setupPin($member, $validated['pin']);
        $this->ipAuthBlockService->clearFailures($request->ip() ?? '0.0.0.0');
        $this->pinLockoutService->resetAttempts($member);

        return response()->json($this->buildAuthResponse($member));
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $validated = $request->validated();

        try {
            $member = $this->resolveMember((int) $validated['club_id'], $validated['nfc_uid']);
        } catch (UnauthorizedApiException) {
            $this->ipAuthBlockService->recordFailure($request->ip() ?? '0.0.0.0');
            throw new UnauthorizedApiException('Invalid credentials.');
        }

        if ($member->isSuspended()) {
            $this->ipAuthBlockService->recordFailure($request->ip() ?? '0.0.0.0');
            throw new ForbiddenApiException('Club membership is suspended. Contact your administrator.');
        }

        if ($member->requiresPinSetup()) {
            $this->ipAuthBlockService->recordFailure($request->ip() ?? '0.0.0.0');
            throw new ForbiddenApiException('PIN setup is required before login.');
        }

        $this->pinLockoutService->assertNotLocked($member);

        if (! Hash::check($validated['pin'], (string) $member->pin_hash)) {
            try {
                $this->pinLockoutService->recordFailedAttempt($member);
            } catch (\App\Exceptions\PinLockedException $exception) {
                $this->ipAuthBlockService->recordFailure($request->ip() ?? '0.0.0.0');
                throw $exception;
            }

            $this->ipAuthBlockService->recordFailure($request->ip() ?? '0.0.0.0');
            throw new UnauthorizedApiException('Invalid credentials.');
        }

        $this->pinLockoutService->resetAttempts($member);
        $this->ipAuthBlockService->clearFailures($request->ip() ?? '0.0.0.0');

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
