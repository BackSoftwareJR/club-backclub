<?php

namespace App\Http\Middleware;

use App\Exceptions\ClubScopeException;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ClubScopeMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $routeClubId = $request->route('club_id');
        $payload = $request->attributes->get('jwt_payload');

        if ($routeClubId === null || $payload === null) {
            return $next($request);
        }

        if ((int) $routeClubId !== (int) ($payload->club_id ?? 0)) {
            throw new ClubScopeException;
        }

        return $next($request);
    }
}
