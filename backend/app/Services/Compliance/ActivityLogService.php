<?php

namespace App\Services\Compliance;

use App\Models\ActivityLog;
use App\Models\ClubMember;
use App\Models\LegalAcceptance;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class ActivityLogService
{
    /**
     * @param  array<string, mixed>|null  $metadata
     */
    public function record(
        string $eventType,
        string $status = ActivityLog::STATUS_SUCCESS,
        ?ClubMember $member = null,
        ?int $clubId = null,
        ?string $nfcUid = null,
        ?Request $request = null,
        ?array $metadata = null,
    ): ActivityLog {
        return ActivityLog::query()->create([
            'club_id' => $member?->club_id ?? $clubId,
            'user_id' => $member?->user_id,
            'club_member_id' => $member?->id,
            'nfc_uid' => $nfcUid ?? $member?->nfc_uid,
            'event_type' => $eventType,
            'status' => $status,
            'ip_address' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
            'metadata' => $metadata,
            'occurred_at' => Carbon::now(),
        ]);
    }
}
