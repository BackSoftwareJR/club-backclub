<?php

namespace App\Services\Auth;

use App\Models\Club;
use App\Models\ClubMember;
use App\Models\User;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Support\Str;
use stdClass;

class JwtService
{
    public function ttl(): int
    {
        return (int) config('jwt.ttl', 7200);
    }

    public function issue(User $user, Club $club, ClubMember $member): string
    {
        $now = time();
        $payload = [
            'iss' => config('app.url'),
            'sub' => $user->id,
            'club_id' => $club->id,
            'club_member_id' => $member->id,
            'is_club_owner' => $user->ownsClub($club),
            'iat' => $now,
            'exp' => $now + $this->ttl(),
        ];

        return JWT::encode($payload, $this->secret(), config('jwt.algorithm', 'HS256'));
    }

    public function decode(string $token): stdClass
    {
        return JWT::decode($token, new Key($this->secret(), config('jwt.algorithm', 'HS256')));
    }

    private function secret(): string
    {
        $secret = config('jwt.secret');

        if (is_string($secret) && Str::startsWith($secret, 'base64:')) {
            return base64_decode(substr($secret, 7));
        }

        return (string) $secret;
    }
}
