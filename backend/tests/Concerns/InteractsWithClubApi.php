<?php

namespace Tests\Concerns;

use App\Models\Club;
use App\Models\ClubMember;
use Database\Seeders\ClubSeeder;

trait InteractsWithClubApi
{
    protected function seedClub(): void
    {
        $this->seed(ClubSeeder::class);
    }

    protected function ownerToken(): string
    {
        return $this->tokenForNfc('NFC-OWNER-001');
    }

    protected function memberToken(): string
    {
        return $this->tokenForNfc('NFC-MEMBER-001');
    }

    protected function tokenForNfc(string $nfcUid, string $pin = '123456'): string
    {
        $member = ClubMember::query()->where('nfc_uid', $nfcUid)->firstOrFail();

        if ($member->requiresPinSetup()) {
            $member->update(['pin_hash' => bcrypt($pin)]);
        }

        $response = $this->postJson('/api/auth/login', [
            'club_id' => $member->club_id,
            'nfc_uid' => $nfcUid,
            'pin' => $pin,
        ]);

        $response->assertOk();

        return $response->json('token');
    }

    protected function clubId(): int
    {
        return Club::query()->firstOrFail()->id;
    }

    protected function withBearer(string $token): static
    {
        return $this->withHeader('Authorization', 'Bearer '.$token);
    }
}
