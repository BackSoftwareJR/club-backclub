<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\LegalAcceptance;
use Database\Seeders\ClubSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithClubApi;
use Tests\TestCase;

class LegalComplianceTest extends TestCase
{
    use InteractsWithClubApi;
    use RefreshDatabase;

    public function test_public_can_fetch_legal_terms(): void
    {
        $response = $this->getJson('/api/legal/terms');

        $response->assertOk()
            ->assertJsonPath('data.version', config('legal.version'))
            ->assertJsonStructure(['data' => ['title', 'summary', 'sections', 'effective_date']]);
    }

    public function test_entry_flags_missing_terms_acceptance(): void
    {
        $this->seedClub();

        $member = \App\Models\ClubMember::query()->where('nfc_uid', 'NFC-OWNER-001')->firstOrFail();
        LegalAcceptance::query()->where('user_id', $member->user_id)->delete();

        $response = $this->getJson('/api/entry/'.$this->clubId().'/NFC-OWNER-001');

        $response->assertOk()
            ->assertJsonPath('requires_terms_acceptance', true);
    }

    public function test_login_blocked_without_terms_acceptance(): void
    {
        $this->seedClub();

        $member = \App\Models\ClubMember::query()->where('nfc_uid', 'NFC-OWNER-001')->firstOrFail();
        LegalAcceptance::query()->where('user_id', $member->user_id)->delete();

        $this->postJson('/api/auth/login', [
            'club_id' => $member->club_id,
            'nfc_uid' => 'NFC-OWNER-001',
            'pin' => '123456',
        ])->assertForbidden();
    }

    public function test_member_can_accept_terms_via_nfc_context(): void
    {
        $this->seedClub();

        $member = \App\Models\ClubMember::query()->where('nfc_uid', 'NFC-MEMBER-001')->firstOrFail();
        LegalAcceptance::query()->where('user_id', $member->user_id)->delete();

        $this->postJson('/api/legal/accept', [
            'club_id' => $member->club_id,
            'nfc_uid' => 'NFC-MEMBER-001',
            'terms_version' => config('legal.version'),
            'identity_declaration' => true,
        ])->assertOk()
            ->assertJsonPath('accepted', true);

        $this->assertDatabaseHas('legal_acceptances', [
            'user_id' => $member->user_id,
            'club_id' => $member->club_id,
            'terms_version' => config('legal.version'),
        ]);

        $this->assertDatabaseHas('activity_logs', [
            'club_id' => $member->club_id,
            'event_type' => 'terms_accepted',
        ]);

        $log = ActivityLog::query()
            ->where('club_id', $member->club_id)
            ->where('event_type', 'terms_accepted')
            ->latest('id')
            ->firstOrFail();

        $this->assertSame('Julian Rovera', $log->metadata['declared_identity'] ?? null);
        $this->assertTrue($log->metadata['identity_declaration_recorded'] ?? false);
    }

    public function test_create_member_rejects_real_email_provider(): void
    {
        $this->seedClub();
        $token = $this->ownerToken();

        $this->withToken($token)->postJson('/api/clubs/'.$this->clubId().'/admin/members', [
            'email' => 'player@gmail.com',
            'nfc_uid' => 'NFC-TEST-001',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_create_member_accepts_fictional_game_email(): void
    {
        $this->seedClub();
        $token = $this->ownerToken();

        $this->withToken($token)->postJson('/api/clubs/'.$this->clubId().'/admin/members', [
            'email' => 'player@velvet.club',
            'nfc_uid' => 'NFC-TEST-002',
        ])->assertCreated();

        $this->assertDatabaseHas('users', ['email' => 'player@velvet.club']);
    }

    public function test_owner_can_list_activity_logs(): void
    {
        $this->seedClub();
        $token = $this->ownerToken();

        ActivityLog::query()->create([
            'club_id' => $this->clubId(),
            'event_type' => 'entry_scan',
            'status' => ActivityLog::STATUS_SUCCESS,
            'nfc_uid' => 'NFC-OWNER-001',
            'occurred_at' => now(),
        ]);

        $this->withToken($token)->getJson('/api/clubs/'.$this->clubId().'/admin/activity-logs')
            ->assertOk()
            ->assertJsonFragment(['event_type' => 'entry_scan']);
    }

    public function test_create_club_requires_terms_acceptance(): void
    {
        $this->seedClub();
        $token = $this->ownerToken();

        $this->withToken($token)->postJson('/api/me/clubs', [
            'name' => 'No Terms Club',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['terms_accepted', 'terms_version', 'identity_declaration']);
    }
}
