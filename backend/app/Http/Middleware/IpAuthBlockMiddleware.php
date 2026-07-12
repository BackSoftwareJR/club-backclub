<?php

namespace App\Http\Middleware;

use App\Services\Auth\IpAuthBlockService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IpAuthBlockMiddleware
{
    public function __construct(
        private readonly IpAuthBlockService $ipAuthBlockService,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $this->ipAuthBlockService->assertNotBlocked($request->ip() ?? '0.0.0.0');

        return $next($request);
    }
}
