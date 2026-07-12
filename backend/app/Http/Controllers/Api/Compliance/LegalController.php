<?php

namespace App\Http\Controllers\Api\Compliance;

use App\Exceptions\ForbiddenApiException;
use App\Exceptions\GhostRedirectException;
use App\Http\Controllers\Controller;
use App\Http\Concerns\ResolvesJwtContext;
use App\Http\Requests\Compliance\AcceptLegalTermsRequest;
use App\Models\ClubMember;
use App\Models\SecurityLog;
use App\Services\Compliance\ActivityLogService;
use App\Services\Compliance\LegalTermsService;
use App\Services\Security\SecurityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LegalController extends Controller
{
    use ResolvesJwtContext;

    public function __construct(
        private readonly LegalTermsService $legalTermsService,
        private readonly ActivityLogService $activityLogService,
        private readonly SecurityLogService $securityLogService,
    ) {}

    public function show(): JsonResponse
    {
        return response()->json([
            'data' => $this->legalTermsService->payload(),
        ]);
    }

    public function accept(AcceptLegalTermsRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $member = ClubMember::query()
            ->with('user')
            ->where('club_id', (int) $validated['club_id'])
            ->where('nfc_uid', $validated['nfc_uid'])
            ->first();

        if ($member === null) {
            $this->securityLogService->record(
                request: $request,
                violationType: SecurityLog::INVALID_NFC,
                clubId: (int) $validated['club_id'],
                nfcUid: $validated['nfc_uid'],
                metadata: ['reason' => 'terms_accept_unknown_card'],
            );
            throw new GhostRedirectException(
                violationType: SecurityLog::INVALID_NFC,
                clubId: (int) $validated['club_id'],
                nfcUid: $validated['nfc_uid'],
            );
        }

        $version = $validated['terms_version'] ?? $this->legalTermsService->currentVersion();

        if ($version !== $this->legalTermsService->currentVersion()) {
            throw new ForbiddenApiException('Terms version mismatch. Reload and accept the current terms.');
        }

        $acceptance = $this->legalTermsService->accept($member->user, $member->club_id, $request, $version);

        $this->activityLogService->record(
            eventType: 'terms_accepted',
            member: $member,
            request: $request,
            metadata: [
                'terms_version' => $version,
                'acceptance_id' => $acceptance->id,
            ],
        );

        return response()->json([
            'accepted' => true,
            'terms_version' => $version,
            'accepted_at' => $acceptance->accepted_at?->toIso8601String(),
        ]);
    }

    public function activityLogs(Request $request, int $clubId): JsonResponse
    {
        $this->assertClubOwner($request, $clubId);

        $logs = \App\Models\ActivityLog::query()
            ->where('club_id', $clubId)
            ->orderByDesc('occurred_at')
            ->limit(200)
            ->get()
            ->map(fn ($log) => [
                'id' => $log->id,
                'event_type' => $log->event_type,
                'status' => $log->status,
                'nfc_uid' => $log->nfc_uid,
                'user_id' => $log->user_id,
                'club_member_id' => $log->club_member_id,
                'ip_address' => $log->ip_address,
                'metadata' => $log->metadata,
                'occurred_at' => $log->occurred_at?->toIso8601String(),
            ]);

        return response()->json(['data' => $logs]);
    }

    private function assertClubOwner(Request $request, int $clubId): void
    {
        if (! $this->isClubOwner($request) || $this->jwtClubId($request) !== $clubId) {
            throw new ForbiddenApiException('Admin access required.');
        }
    }
}
