<?php

namespace Tests\Feature;

use App\Models\Club;
use App\Models\User;
use Database\Seeders\ClubSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithClubApi;
use Tests\TestCase;

class UserClubTest extends TestCase
{
    use InteractsWithClubApi;
    use RefreshDatabase;

    public function test_authenticated_user_can_list_their_clubs(): void
    {
        $this->seedClub();
        $token = $this->ownerToken();

        $response = $this->withToken($token)->getJson('/api/me/clubs');

        $response->assertOk()
            ->assertJsonPath('current_club_id', $this->clubId())
            ->assertJsonCount(1, 'clubs')
            ->assertJsonFragment(['name' => 'The Velvet Room', 'is_owner' => true, 'is_current' => true]);
    }

    public function test_authenticated_user_can_create_a_new_club(): void
    {
        $this->seedClub();
        $token = $this->ownerToken();
        $ownerId = User::query()->where('email', 'owner@velvet.club')->value('id');

        $response = $this->withToken($token)->postJson('/api/me/clubs', [
            'name' => 'Midnight Lounge',
            'terms_version' => config('legal.version'),
            'terms_accepted' => true,
            'identity_declaration' => true,
        ]);

        $response->assertCreated()
            ->assertJsonPath('club.name', 'Midnight Lounge')
            ->assertJsonPath('requires_pin_setup', true)
            ->assertJsonStructure(['nfc_uid', 'entry_path']);

        $this->assertDatabaseHas('clubs', [
            'name' => 'Midnight Lounge',
            'owner_id' => $ownerId,
        ]);

        $newClubId = Club::query()->where('name', 'Midnight Lounge')->value('id');
        $this->assertDatabaseHas('club_members', [
            'club_id' => $newClubId,
            'user_id' => $ownerId,
        ]);
        $this->assertDatabaseHas('user_wallets', [
            'club_id' => $newClubId,
            'user_id' => $ownerId,
            'current_balance' => '0.00',
        ]);
    }

    public function test_create_club_requires_name(): void
    {
        $this->seedClub();
        $token = $this->ownerToken();

        $this->withToken($token)->postJson('/api/me/clubs', ['name' => ''])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name']);
    }

    public function test_me_clubs_requires_authentication(): void
    {
        $this->getJson('/api/me/clubs')->assertUnauthorized();
    }
}
