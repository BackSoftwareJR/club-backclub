<?php

namespace App\Http\Middleware;

use App\Exceptions\IpBlockedException;
use App\Models\SecurityLog;
use App\Services\Auth\IpAuthBlockService;
use App\Services\Security\SecurityLogService;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class GhostSecurityMiddleware
{
    public function __construct(
        private readonly IpAuthBlockService $ipAuthBlockService,
        private readonly SecurityLogService $securityLogService,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        try {
            $this->ipAuthBlockService->assertNotBlocked($request->ip() ?? '0.0.0.0');
        } catch (IpBlockedException) {
            $this->recordSafely($request, SecurityLog::BLOCKED_IP);

            return $this->ghostResponse(429);
        }

        $response = $next($request);

        if ($response->getStatusCode() === 429) {
            $payload = $response instanceof JsonResponse ? $response->getData(true) : [];
            if (($payload['error'] ?? null) === 'ghost_redirect') {
                return $response;
            }

            $this->recordSafely($request, SecurityLog::BLOCKED_IP, ['reason' => 'rate_limit']);

            return $this->ghostResponse(429);
        }

        return $response;
    }

    private function ghostResponse(int $status): JsonResponse
    {
        return response()->json([
            'message' => 'Resource not found.',
            'error' => 'ghost_redirect',
            'redirect_url' => 'https://www.google.com',
        ], $status);
    }

    /**
     * @param  array<string, mixed>|null  $metadata
     */
    private function recordSafely(Request $request, string $violationType, ?array $metadata = null): void
    {
        try {
            $this->securityLogService->record(
                request: $request,
                violationType: $violationType,
                metadata: $metadata,
            );
        } catch (Throwable $exception) {
            report($exception);
        }
    }
}
