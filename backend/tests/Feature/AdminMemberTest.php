<?php

namespace Tests\Feature;

use App\Models\ClubMember;
use App\Models\User;
use App\Models\UserWallet;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\Concerns\InteractsWithClubApi;
use Tests\TestCase;

class AdminMemberTest extends TestCase
{
    use InteractsWithClubApi;
    use RefreshDatabase;

    public function test_admin_can_list_members_with_wallet_balances(): void
    {
        $this->seedClub();
        $clubId = $this->clubId();
        $ownerToken = $this->ownerToken();

        $response = $this->withBearer($ownerToken)
            ->getJson("/api/clubs/{$clubId}/admin/members");

        $response->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonFragment(['email' => 'owner@velvet.club', 'wallet_balance' => '100.00'])
            ->assertJsonFragment(['email' => 'member@velvet.club', 'wallet_balance' => '25.00']);
    }

    public function test_admin_can_create_member_with_email_and_nfc_uid(): void
    {
        $this->seedClub();
        $clubId = $this->clubId();
        $ownerToken = $this->ownerToken();

        $response = $this->withBearer($ownerToken)
            ->postJson("/api/clubs/{$clubId}/admin/members", [
                'email' => 'new.member@velvet.club',
                'nfc_uid' => 'NFC-NEW-001',
            ]);

        $response->assertCreated()
            ->assertJsonPath('email', 'new.member@velvet.club')
            ->assertJsonPath('nfc_uid', 'NFC-NEW-001')
            ->assertJsonPath('status', 'active')
            ->assertJsonPath('requires_pin_setup', true)
            ->assertJsonPath('wallet_balance', '0.00');

        $this->assertDatabaseHas('club_members', [
            'club_id' => $clubId,
            'nfc_uid' => 'NFC-NEW-001',
            'status' => ClubMember::STATUS_ACTIVE,
        ]);

        $userId = User::query()->where('email', 'new.member@velvet.club')->value('id');

        $this->assertDatabaseHas('user_wallets', [
            'club_id' => $clubId,
            'user_id' => $userId,
            'current_balance' => '0.00',
        ]);
    }

    public function test_create_member_rejects_duplicate_nfc_uid(): void
    {
        $this->seedClub();
        $clubId = $this->clubId();
        $ownerToken = $this->ownerToken();

        $response = $this->withBearer($ownerToken)
            ->postJson("/api/clubs/{$clubId}/admin/members", [
                'email' => 'duplicate@velvet.club',
                'nfc_uid' => 'NFC-MEMBER-001',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['nfc_uid']);
    }

    public function test_create_member_rejects_existing_club_member_email(): void
    {
        $this->seedClub();
        $clubId = $this->clubId();
        $ownerToken = $this->ownerToken();

        $response = $this->withBearer($ownerToken)
            ->postJson("/api/clubs/{$clubId}/admin/members", [
                'email' => 'member@velvet.club',
                'nfc_uid' => 'NFC-ANOTHER-001',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_admin_can_reset_pin_suspend_and_revoke_card(): void
    {
        $this->seedClub();
        $clubId = $this->clubId();
        $ownerToken = $this->ownerToken();

        $member = ClubMember::query()
            ->where('club_id', $clubId)
            ->where('nfc_uid', 'NFC-MEMBER-001')
            ->firstOrFail();

        $member->update(['pin_hash' => Hash::make('123456')]);

        $resetResponse = $this->withBearer($ownerToken)
            ->patchJson("/api/clubs/{$clubId}/admin/members/{$member->id}/reset-pin");

        $resetResponse->assertOk()
            ->assertJsonPath('requires_pin_setup', true);

        $suspendResponse = $this->withBearer($ownerToken)
            ->patchJson("/api/clubs/{$clubId}/admin/members/{$member->id}/suspend");

        $suspendResponse->assertOk()
            ->assertJsonPath('status', 'suspended');

        $revokeResponse = $this->withBearer($ownerToken)
            ->patchJson("/api/clubs/{$clubId}/admin/members/{$member->id}/revoke-card");

        $revokeResponse->assertOk()
            ->assertJsonPath('nfc_uid', null);

        $member->refresh();
        $this->assertNull($member->pin_hash);
        $this->assertSame(ClubMember::STATUS_SUSPENDED, $member->status);
        $this->assertNull($member->nfc_uid);
    }

    public function test_member_cannot_access_admin_member_endpoints(): void
    {
        $this->seedClub();
        $clubId = $this->clubId();
        $memberToken = $this->memberToken();

        $this->withBearer($memberToken)
            ->getJson("/api/clubs/{$clubId}/admin/members")
            ->assertForbidden();

        $this->withBearer($memberToken)
            ->postJson("/api/clubs/{$clubId}/admin/members", [
                'email' => 'blocked@velvet.club',
                'nfc_uid' => 'NFC-BLOCKED',
            ])
            ->assertForbidden();
    }
}
