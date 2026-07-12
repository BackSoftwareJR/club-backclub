<?php

namespace App\Http\Concerns;

use App\Exceptions\UnauthorizedApiException;
use App\Models\User;
use Illuminate\Http\Request;

trait ResolvesJwtContext
{
    protected function jwtPayload(Request $request): object
    {
        $payload = $request->attributes->get('jwt_payload');

        if ($payload === null) {
            throw new UnauthorizedApiException('Missing authentication context.');
        }

        return $payload;
    }

    protected function authUser(Request $request): User
    {
        $user = $request->attributes->get('auth_user');

        if (! $user instanceof User) {
            throw new UnauthorizedApiException('Authenticated user not found.');
        }

        return $user;
    }

    protected function jwtClubId(Request $request): int
    {
        return (int) $this->jwtPayload($request)->club_id;
    }

    protected function jwtClubMemberId(Request $request): int
    {
        return (int) $this->jwtPayload($request)->club_member_id;
    }

    protected function isClubOwner(Request $request): bool
    {
        return (bool) ($this->jwtPayload($request)->is_club_owner ?? false);
    }
}
