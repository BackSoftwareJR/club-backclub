<?php

namespace Tests\Feature;

use App\Models\SecurityLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithClubApi;
use Tests\TestCase;

class GhostSecurityTest extends TestCase
{
    use InteractsWithClubApi;
    use RefreshDatabase;

    public function test_direct_url_report_is_persisted_with_forensic_context(): void
    {
        $this->postJson('/api/security/direct-access', [
            'attempted_route' => '/admin/private',
        ], [
            'User-Agent' => 'GhostProbe/1.0',
        ])->assertAccepted()
            ->assertJsonPath('recorded', true);

        $this->assertDatabaseHas('security_logs', [
            'violation_type' => SecurityLog::DIRECT_URL_ACCESS,
            'attempted_route' => '/admin/private',
            'ip_address' => '127.0.0.1',
            'user_agent' => 'GhostProbe/1.0',
        ]);
    }

    public function test_owner_can_read_security_radar(): void
    {
        $this->seedClub();
        SecurityLog::query()->create([
            'club_id' => $this->clubId(),
            'ip_address' => '192.0.2.1',
            'violation_type' => SecurityLog::INVALID_NFC,
            'attempted_route' => '/entry/1/fake',
            'nfc_uid' => 'fake',
            'occurred_at' => now(),
        ]);

        $this->withToken($this->ownerToken())
            ->getJson('/api/clubs/'.$this->clubId().'/admin/security-radar')
            ->assertOk()
            ->assertJsonPath('has_recent_intrusions', true)
            ->assertJsonPath('data.0.violation_type', SecurityLog::INVALID_NFC);
    }

    public function test_non_owner_cannot_read_security_radar(): void
    {
        $this->seedClub();

        $this->withToken($this->memberToken())
            ->getJson('/api/clubs/'.$this->clubId().'/admin/security-radar')
            ->assertForbidden();
    }

    public function test_invalid_nfc_redirects_without_consuming_pin_attempts(): void
    {
        $this->seedClub();

        for ($attempt = 0; $attempt < 3; $attempt++) {
            $this->getJson('/api/entry/'.$this->clubId().'/NFC-UNKNOWN-'.$attempt)
                ->assertNotFound()
                ->assertJsonPath('error', 'ghost_redirect');
        }

        $this->assertDatabaseMissing('ip_auth_blocks', [
            'ip_address' => '127.0.0.1',
        ]);
    }

    public function test_overlong_invalid_nfc_still_returns_ghost_response(): void
    {
        $this->seedClub();
        $nfcUid = str_repeat('X', 200);

        $this->getJson('/api/entry/'.$this->clubId().'/'.$nfcUid)
            ->assertNotFound()
            ->assertJsonPath('error', 'ghost_redirect');

        $this->assertSame(
            64,
            strlen((string) SecurityLog::query()->latest('id')->value('nfc_uid')),
        );
    }

    public function test_unknown_nfc_cannot_accept_terms(): void
    {
        $this->seedClub();

        $this->postJson('/api/legal/accept', [
            'club_id' => $this->clubId(),
            'nfc_uid' => 'NFC-UNKNOWN',
            'terms_version' => config('legal.version'),
            'identity_declaration' => true,
        ])->assertNotFound()
            ->assertJsonPath('error', 'ghost_redirect');
    }
}
