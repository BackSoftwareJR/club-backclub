<?php

namespace Tests\Feature;

use App\Models\Club;
use App\Models\ClubMember;
use App\Models\User;
use App\Models\UserWallet;
use Database\Seeders\ClubSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithClubApi;
use Tests\TestCase;

class ClubScopeTest extends TestCase
{
    use InteractsWithClubApi;
    use RefreshDatabase;

    public function test_jwt_cannot_access_another_club_wallet(): void
    {
        $this->seedClub();
        $token = $this->ownerToken();
        $otherClub = $this->createSecondaryClub();

        $response = $this->withBearer($token)
            ->getJson("/api/clubs/{$otherClub->id}/wallet");

        $response->assertForbidden()
            ->assertJsonPath('error', 'club_scope_mismatch');
    }

    private function createSecondaryClub(): Club
    {
        $owner = User::query()->where('email', 'owner@velvet.club')->firstOrFail();

        $club = Club::query()->create([
            'owner_id' => $owner->id,
            'name' => 'Second Club',
            'theme_config' => ['template_id' => 1, 'colors' => []],
        ]);

        ClubMember::query()->create([
            'club_id' => $club->id,
            'user_id' => $owner->id,
            'nfc_uid' => 'NFC-OTHER-CLUB',
            'pin_hash' => bcrypt('123456'),
            'status' => ClubMember::STATUS_ACTIVE,
        ]);

        UserWallet::query()->create([
            'club_id' => $club->id,
            'user_id' => $owner->id,
            'current_balance' => '10.00',
        ]);

        return $club;
    }
}
