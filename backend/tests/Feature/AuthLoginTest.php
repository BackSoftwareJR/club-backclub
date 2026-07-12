<?php

namespace Tests\Feature;

use App\Models\ClubMember;
use App\Models\Product;
use App\Models\UserWallet;
use Database\Seeders\ClubSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\Concerns\InteractsWithClubApi;
use Tests\TestCase;

class AuthLoginTest extends TestCase
{
    use InteractsWithClubApi;
    use RefreshDatabase;

    public function test_owner_can_login_with_valid_pin(): void
    {
        $this->seedClub();

        $response = $this->postJson('/api/auth/login', [
            'club_id' => $this->clubId(),
            'nfc_uid' => 'NFC-OWNER-001',
            'pin' => '123456',
        ]);

        $response->assertOk()
            ->assertJsonStructure([
                'token',
                'expires_in',
                'user' => ['id', 'email'],
                'club' => ['id', 'name', 'theme_config'],
                'is_club_owner',
            ])
            ->assertJsonPath('is_club_owner', true);
    }

    public function test_login_rejects_invalid_pin(): void
    {
        $this->seedClub();

        $response = $this->postJson('/api/auth/login', [
            'club_id' => $this->clubId(),
            'nfc_uid' => 'NFC-OWNER-001',
            'pin' => '000000',
        ]);

        $response->assertUnauthorized()
            ->assertJsonPath('error', 'unauthorized');
    }

    public function test_pin_setup_issues_token_for_new_member(): void
    {
        $this->seedClub();

        $response = $this->postJson('/api/auth/pin-setup', [
            'club_id' => $this->clubId(),
            'nfc_uid' => 'NFC-MEMBER-001',
            'pin' => '654321',
        ]);

        $response->assertOk()
            ->assertJsonPath('is_club_owner', false)
            ->assertJsonStructure(['token']);

        $member = ClubMember::query()->where('nfc_uid', 'NFC-MEMBER-001')->firstOrFail();
        $this->assertTrue(Hash::check('654321', (string) $member->pin_hash));
    }
}
