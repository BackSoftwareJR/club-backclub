<?php

namespace Tests\Feature;

use App\Models\ClubMember;
use App\Models\IpAuthBlock;
use App\Models\SecurityLog;
use App\Services\Auth\IpAuthBlockService;
use Database\Seeders\ClubSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\Concerns\InteractsWithClubApi;
use Tests\TestCase;

class AuthLoginTest extends TestCase
{
    use InteractsWithClubApi;
    use RefreshDatabase;

    public function test_entry_returns_pin_setup_for_new_member(): void
    {
        $this->seedClub();

        $response = $this->getJson('/api/entry/'.$this->clubId().'/NFC-MEMBER-001');

        $response->assertOk()
            ->assertJsonPath('requires_pin_setup', true)
            ->assertJsonPath('nfc_uid', 'NFC-MEMBER-001');
    }

    public function test_entry_returns_login_flow_for_existing_member(): void
    {
        $this->seedClub();

        $response = $this->getJson('/api/entry/'.$this->clubId().'/NFC-OWNER-001');

        $response->assertOk()
            ->assertJsonPath('requires_pin_setup', false)
            ->assertJsonStructure(['club_name', 'theme_config']);
    }

    public function test_entry_ghost_redirects_and_logs_unknown_card(): void
    {
        $this->seedClub();

        $response = $this->getJson('/api/entry/'.$this->clubId().'/NFC-UNKNOWN');

        $response->assertNotFound()
            ->assertJsonPath('error', 'ghost_redirect')
            ->assertJsonPath('redirect_url', 'https://www.google.com');

        $this->assertDatabaseHas('security_logs', [
            'club_id' => $this->clubId(),
            'violation_type' => SecurityLog::INVALID_NFC,
            'nfc_uid' => 'NFC-UNKNOWN',
        ]);
    }

    public function test_entry_rejects_suspended_member(): void
    {
        $this->seedClub();

        ClubMember::query()->where('nfc_uid', 'NFC-OWNER-001')->update([
            'status' => ClubMember::STATUS_SUSPENDED,
        ]);

        $response = $this->getJson('/api/entry/'.$this->clubId().'/NFC-OWNER-001');

        $response->assertForbidden()
            ->assertJsonPath('error', 'forbidden');
    }

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

    public function test_login_ghost_redirects_and_blocks_ip_after_three_failed_attempts(): void
    {
        $this->seedClub();

        for ($i = 0; $i < 2; $i++) {
            $this->postJson('/api/auth/login', [
                'club_id' => $this->clubId(),
                'nfc_uid' => 'NFC-OWNER-001',
                'pin' => '000000',
            ])->assertUnauthorized();
        }

        $response = $this->postJson('/api/auth/login', [
            'club_id' => $this->clubId(),
            'nfc_uid' => 'NFC-OWNER-001',
            'pin' => '000000',
        ]);

        $response->assertStatus(429)
            ->assertJsonPath('error', 'ghost_redirect')
            ->assertJsonPath('redirect_url', 'https://www.google.com');

        $this->assertTrue(
            IpAuthBlock::query()->where('ip_address', '127.0.0.1')->first()?->isBlocked() ?? false
        );
        $this->assertDatabaseHas('security_logs', [
            'club_id' => $this->clubId(),
            'violation_type' => SecurityLog::WRONG_PIN,
            'nfc_uid' => 'NFC-OWNER-001',
        ]);
    }

    public function test_login_rejects_suspended_member(): void
    {
        $this->seedClub();

        ClubMember::query()->where('nfc_uid', 'NFC-OWNER-001')->update([
            'status' => ClubMember::STATUS_SUSPENDED,
        ]);

        $response = $this->postJson('/api/auth/login', [
            'club_id' => $this->clubId(),
            'nfc_uid' => 'NFC-OWNER-001',
            'pin' => '123456',
        ]);

        $response->assertForbidden()
            ->assertJsonPath('error', 'forbidden');
    }

    public function test_blocked_ip_receives_ghost_redirect(): void
    {
        $this->seedClub();
        app(IpAuthBlockService::class)->blockForDay('127.0.0.1');

        $response = $this->postJson('/api/auth/login', [
            'club_id' => $this->clubId(),
            'nfc_uid' => 'NFC-UNKNOWN',
            'pin' => '000000',
        ]);

        $response->assertStatus(429)
            ->assertJsonPath('error', 'ghost_redirect');

        $this->assertTrue(
            IpAuthBlock::query()->where('ip_address', '127.0.0.1')->first()?->isBlocked() ?? false
        );
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

    public function test_pin_setup_rejects_already_configured_pin(): void
    {
        $this->seedClub();

        $response = $this->postJson('/api/auth/pin-setup', [
            'club_id' => $this->clubId(),
            'nfc_uid' => 'NFC-OWNER-001',
            'pin' => '111111',
        ]);

        $response->assertForbidden()
            ->assertJsonPath('error', 'forbidden');
    }

    public function test_pin_setup_rejects_suspended_member(): void
    {
        $this->seedClub();

        ClubMember::query()->where('nfc_uid', 'NFC-MEMBER-001')->update([
            'status' => ClubMember::STATUS_SUSPENDED,
        ]);

        $response = $this->postJson('/api/auth/pin-setup', [
            'club_id' => $this->clubId(),
            'nfc_uid' => 'NFC-MEMBER-001',
            'pin' => '654321',
        ]);

        $response->assertForbidden()
            ->assertJsonPath('error', 'forbidden');
    }
}
