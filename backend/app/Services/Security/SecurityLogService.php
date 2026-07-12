<?php

namespace App\Services\Security;

use App\Models\SecurityLog;
use Illuminate\Http\Request;

class SecurityLogService
{
    /**
     * @param  array<string, mixed>|null  $metadata
     */
    public function record(
        Request $request,
        string $violationType,
        ?int $clubId = null,
        ?string $nfcUid = null,
        ?array $metadata = null,
        ?string $attemptedRoute = null,
    ): SecurityLog {
        return SecurityLog::query()->create([
            'club_id' => $clubId,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'violation_type' => mb_substr($violationType, 0, 64),
            'attempted_route' => mb_substr($attemptedRoute ?? '/'.$request->path(), 0, 255),
            'nfc_uid' => $nfcUid === null ? null : mb_substr($nfcUid, 0, 64),
            'metadata' => $metadata,
            'occurred_at' => now(),
        ]);
    }
}
