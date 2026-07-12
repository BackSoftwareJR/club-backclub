<?php

namespace Tests\Feature;

use App\Models\ClubLedger;
use App\Models\TopupRequest;
use App\Models\UserWallet;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithClubApi;
use Tests\TestCase;

class WalletTopupTest extends TestCase
{
    use InteractsWithClubApi;
    use RefreshDatabase;

    public function test_member_can_view_wallet_balance(): void
    {
        $this->seedClub();
        $clubId = $this->clubId();

        $response = $this->withBearer($this->memberToken())
            ->getJson("/api/clubs/{$clubId}/wallet");

        $response->assertOk()
            ->assertJsonPath('current_balance', '25.00')
            ->assertJsonPath('club_id', $clubId);
    }

    public function test_member_can_create_topup_request(): void
    {
        $this->seedClub();
        $clubId = $this->clubId();

        $response = $this->withBearer($this->memberToken())
            ->postJson("/api/clubs/{$clubId}/wallet/topup-requests", [
                'amount' => '50.00',
            ]);

        $response->assertCreated()
            ->assertJsonPath('amount', '50.00')
            ->assertJsonPath('status', 'pending');

        $this->assertDatabaseHas('topup_requests', [
            'club_id' => $clubId,
            'amount' => '50.00',
            'status' => TopupRequest::STATUS_PENDING,
        ]);
    }

    public function test_create_topup_request_rejects_invalid_amount(): void
    {
        $this->seedClub();
        $clubId = $this->clubId();

        $response = $this->withBearer($this->memberToken())
            ->postJson("/api/clubs/{$clubId}/wallet/topup-requests", [
                'amount' => '-10',
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('error', 'validation_error');
    }

    public function test_member_can_list_own_topup_requests(): void
    {
        $this->seedClub();
        $clubId = $this->clubId();
        $memberWallet = UserWallet::query()
            ->where('club_id', $clubId)
            ->whereHas('user', fn ($query) => $query->where('email', 'member@velvet.club'))
            ->firstOrFail();

        TopupRequest::query()->create([
            'club_id' => $clubId,
            'user_id' => $memberWallet->user_id,
            'amount' => '30.00',
            'status' => TopupRequest::STATUS_PENDING,
        ]);

        $response = $this->withBearer($this->memberToken())
            ->getJson("/api/clubs/{$clubId}/wallet/topup-requests");

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.amount', '30.00')
            ->assertJsonPath('data.0.status', 'pending');
    }

    public function test_admin_can_reject_pending_topup_request(): void
    {
        $this->seedClub();
        $clubId = $this->clubId();

        $memberWallet = UserWallet::query()
            ->where('club_id', $clubId)
            ->whereHas('user', fn ($query) => $query->where('email', 'member@velvet.club'))
            ->firstOrFail();

        $topupRequest = TopupRequest::query()->create([
            'club_id' => $clubId,
            'user_id' => $memberWallet->user_id,
            'amount' => '40.00',
            'status' => TopupRequest::STATUS_PENDING,
        ]);

        $response = $this->withBearer($this->ownerToken())
            ->postJson("/api/clubs/{$clubId}/admin/topup-requests/{$topupRequest->id}/reject", [
                'admin_note' => 'Insufficient proof of payment',
            ]);

        $response->assertOk()
            ->assertJsonPath('status', 'rejected')
            ->assertJsonPath('admin_note', 'Insufficient proof of payment');

        $memberWallet->refresh();
        $this->assertSame('25.00', (string) $memberWallet->current_balance);
    }

    public function test_approve_already_processed_request_returns_422(): void
    {
        $this->seedClub();
        $clubId = $this->clubId();

        $memberWallet = UserWallet::query()
            ->where('club_id', $clubId)
            ->whereHas('user', fn ($query) => $query->where('email', 'member@velvet.club'))
            ->firstOrFail();

        $topupRequest = TopupRequest::query()->create([
            'club_id' => $clubId,
            'user_id' => $memberWallet->user_id,
            'amount' => '10.00',
            'status' => TopupRequest::STATUS_APPROVED,
        ]);

        $response = $this->withBearer($this->ownerToken())
            ->postJson("/api/clubs/{$clubId}/admin/topup-requests/{$topupRequest->id}/approve");

        $response->assertStatus(422)
            ->assertJsonPath('error', 'topup_not_pending');
    }

    public function test_admin_injection_credits_wallet_and_writes_ledger(): void
    {
        $this->seedClub();
        $clubId = $this->clubId();

        $memberWallet = UserWallet::query()
            ->where('club_id', $clubId)
            ->whereHas('user', fn ($query) => $query->where('email', 'member@velvet.club'))
            ->firstOrFail();

        $response = $this->withBearer($this->ownerToken())
            ->postJson("/api/clubs/{$clubId}/admin/treasury/injection", [
                'user_id' => $memberWallet->user_id,
                'amount' => '15.00',
                'description' => 'Manual correction',
            ]);

        $response->assertCreated()
            ->assertJsonPath('new_balance', '40.00');

        $this->assertDatabaseHas('club_ledger', [
            'club_id' => $clubId,
            'transaction_type' => ClubLedger::TYPE_ADMIN_INJECTION,
            'amount' => '15.00',
            'description' => 'Manual correction',
        ]);
    }
}
