<?php

namespace Tests\Feature;

use App\Models\ClubLedger;
use App\Models\TopupRequest;
use App\Models\UserWallet;
use Database\Seeders\ClubSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithClubApi;
use Tests\TestCase;

class TopupApproveTest extends TestCase
{
    use InteractsWithClubApi;
    use RefreshDatabase;

    public function test_admin_can_approve_pending_topup_request(): void
    {
        $this->seedClub();
        $clubId = $this->clubId();
        $ownerToken = $this->ownerToken();

        $memberWallet = UserWallet::query()
            ->where('club_id', $clubId)
            ->whereHas('user', fn ($query) => $query->where('email', 'member@velvet.club'))
            ->firstOrFail();

        $topupRequest = TopupRequest::query()->create([
            'club_id' => $clubId,
            'user_id' => $memberWallet->user_id,
            'amount' => '50.00',
            'status' => TopupRequest::STATUS_PENDING,
        ]);

        $response = $this->withBearer($ownerToken)
            ->postJson("/api/clubs/{$clubId}/admin/topup-requests/{$topupRequest->id}/approve");

        $response->assertOk()
            ->assertJsonPath('status', 'approved');

        $memberWallet->refresh();
        $this->assertSame('75.00', (string) $memberWallet->current_balance);

        $this->assertDatabaseHas('club_ledger', [
            'club_id' => $clubId,
            'transaction_type' => ClubLedger::TYPE_USER_TOPUP,
            'amount' => '50.00',
        ]);
    }
}
