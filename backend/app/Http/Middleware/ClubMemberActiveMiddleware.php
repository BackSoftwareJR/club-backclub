<?php

namespace App\Http\Middleware;

use App\Exceptions\ForbiddenApiException;
use App\Models\ClubMember;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ClubMemberActiveMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $payload = $request->attributes->get('jwt_payload');

        if ($payload === null) {
            return $next($request);
        }

        $member = ClubMember::query()->find($payload->club_member_id ?? null);

        if ($member === null || $member->isSuspended()) {
            throw new ForbiddenApiException('Club membership is suspended.');
        }

        return $next($request);
    }
}
