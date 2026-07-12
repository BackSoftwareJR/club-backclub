<?php

namespace App\Http\Controllers\Api\Security;

use App\Exceptions\ForbiddenApiException;
use App\Http\Controllers\Controller;
use App\Http\Concerns\ResolvesJwtContext;
use App\Models\SecurityLog;
use App\Services\Security\SecurityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SecurityController extends Controller
{
    use ResolvesJwtContext;

    public function __construct(
        private readonly SecurityLogService $securityLogService,
    ) {}

    public function reportDirectAccess(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'attempted_route' => ['required', 'string', 'max:255', 'regex:/^\/[^\r\n]*$/'],
        ]);

        $duplicate = SecurityLog::query()
            ->where('ip_address', $request->ip())
            ->where('violation_type', SecurityLog::DIRECT_URL_ACCESS)
            ->where('attempted_route', $validated['attempted_route'])
            ->where('occurred_at', '>=', now()->subMinute())
            ->exists();

        if ($duplicate) {
            return response()->json(['recorded' => true], 202);
        }

        $this->securityLogService->record(
            request: $request,
            violationType: SecurityLog::DIRECT_URL_ACCESS,
            attemptedRoute: $validated['attempted_route'],
        );

        return response()->json(['recorded' => true], 202);
    }

    public function radar(Request $request, int $clubId): JsonResponse
    {
        if ($this->authUser($request)->email !== config('legal.owner_email_key')) {
            throw new ForbiddenApiException('Owner access required.');
        }

        $logs = SecurityLog::query()
            ->where(function ($query) use ($clubId) {
                $query->where('club_id', $clubId)
                    ->orWhereNull('club_id');
            })
            ->latest('occurred_at')
            ->limit(200)
            ->get()
            ->map(fn (SecurityLog $log) => [
                'id' => $log->id,
                'violation_type' => $log->violation_type,
                'attempted_route' => $log->attempted_route,
                'ip_address' => $log->ip_address,
                'user_agent' => $log->user_agent,
                'nfc_uid' => $log->nfc_uid,
                'metadata' => $log->metadata,
                'occurred_at' => $log->occurred_at?->toIso8601String(),
            ]);

        return response()->json([
            'data' => $logs,
            'has_recent_intrusions' => SecurityLog::query()
                ->where(function ($query) use ($clubId) {
                    $query->where('club_id', $clubId)
                        ->orWhereNull('club_id');
                })
                ->where('occurred_at', '>=', now()->subDay())
                ->exists(),
        ]);
    }
}
