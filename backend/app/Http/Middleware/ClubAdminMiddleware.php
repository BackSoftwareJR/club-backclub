<?php

namespace App\Http\Middleware;

use App\Exceptions\ForbiddenApiException;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ClubAdminMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $payload = $request->attributes->get('jwt_payload');

        if ($payload === null || ! ($payload->is_club_owner ?? false)) {
            throw new ForbiddenApiException('Club admin access required.');
        }

        return $next($request);
    }
}
