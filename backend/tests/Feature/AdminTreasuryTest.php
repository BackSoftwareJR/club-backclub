<?php

namespace Tests\Feature;

use App\Models\ClubLedger;
use App\Models\Product;
use App\Models\User;
use App\Models\UserWallet;
use App\Models\WalletTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithClubApi;
use Tests\TestCase;

class AdminTreasuryTest extends TestCase
{
    use InteractsWithClubApi;
    use RefreshDatabase;

    public function test_admin_can_view_treasury_with_accurate_cash_flow_total(): void
    {
        $this->seedClub();
        $clubId = $this->clubId();
        $ownerToken = $this->ownerToken();

        ClubLedger::query()->create([
            'club_id' => $clubId,
            'transaction_type' => ClubLedger::TYPE_USER_TOPUP,
            'amount' => '50.00',
            'description' => 'Approved top-up',
            'handled_by' => User::query()->where('email', 'owner@velvet.club')->value('id'),
        ]);

        ClubLedger::query()->create([
            'club_id' => $clubId,
            'transaction_type' => ClubLedger::TYPE_ADMIN_INJECTION,
            'amount' => '30.00',
            'description' => 'Manual correction',
            'handled_by' => User::query()->where('email', 'owner@velvet.club')->value('id'),
        ]);

        ClubLedger::query()->create([
            'club_id' => $clubId,
            'transaction_type' => ClubLedger::TYPE_ADMIN_EXPENSE,
            'amount' => '-20.00',
            'description' => 'Wholesale stock',
            'handled_by' => User::query()->where('email', 'owner@velvet.club')->value('id'),
        ]);

        $response = $this->withBearer($ownerToken)
            ->getJson("/api/clubs/{$clubId}/admin/treasury");

        $response->assertOk()
            ->assertJsonPath('cash_flow_total', '60.00')
            ->assertJsonCount(3, 'ledger');
    }

    public function test_admin_can_record_expense_as_negative_ledger_entry(): void
    {
        $this->seedClub();
        $clubId = $this->clubId();
        $ownerToken = $this->ownerToken();

        $response = $this->withBearer($ownerToken)
            ->postJson("/api/clubs/{$clubId}/admin/treasury/expense", [
                'amount' => '120.00',
                'description' => 'Wholesale stock',
            ]);

        $response->assertCreated()
            ->assertJsonPath('transaction_type', ClubLedger::TYPE_ADMIN_EXPENSE)
            ->assertJsonPath('amount', '-120.00')
            ->assertJsonPath('description', 'Wholesale stock');

        $this->assertDatabaseHas('club_ledger', [
            'club_id' => $clubId,
            'transaction_type' => ClubLedger::TYPE_ADMIN_EXPENSE,
            'amount' => '-120.00',
        ]);
    }

    public function test_expense_rejects_non_positive_amount(): void
    {
        $this->seedClub();
        $clubId = $this->clubId();
        $ownerToken = $this->ownerToken();

        $response = $this->withBearer($ownerToken)
            ->postJson("/api/clubs/{$clubId}/admin/treasury/expense", [
                'amount' => '0',
                'description' => 'Invalid expense',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['amount']);
    }

    public function test_admin_can_inject_funds_into_member_wallet(): void
    {
        $this->seedClub();
        $clubId = $this->clubId();
        $ownerToken = $this->ownerToken();

        $memberWallet = UserWallet::query()
            ->where('club_id', $clubId)
            ->whereHas('user', fn ($query) => $query->where('email', 'member@velvet.club'))
            ->firstOrFail();

        $response = $this->withBearer($ownerToken)
            ->postJson("/api/clubs/{$clubId}/admin/treasury/injection", [
                'user_id' => $memberWallet->user_id,
                'amount' => '30.00',
                'description' => 'Manual correction',
            ]);

        $response->assertCreated()
            ->assertJsonPath('user_id', $memberWallet->user_id)
            ->assertJsonPath('new_balance', '55.00');

        $memberWallet->refresh();
        $this->assertSame('55.00', (string) $memberWallet->current_balance);

        $this->assertDatabaseHas('club_ledger', [
            'club_id' => $clubId,
            'transaction_type' => ClubLedger::TYPE_ADMIN_INJECTION,
            'amount' => '30.00',
            'description' => 'Manual correction',
        ]);
    }

    public function test_injection_rejects_user_without_club_wallet(): void
    {
        $this->seedClub();
        $clubId = $this->clubId();
        $ownerToken = $this->ownerToken();

        $outsider = User::query()->create(['email' => 'outsider@example.com']);

        $response = $this->withBearer($ownerToken)
            ->postJson("/api/clubs/{$clubId}/admin/treasury/injection", [
                'user_id' => $outsider->id,
                'amount' => '10.00',
                'description' => 'Should fail',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['user_id']);
    }

    public function test_member_cannot_access_treasury_endpoints(): void
    {
        $this->seedClub();
        $clubId = $this->clubId();
        $memberToken = $this->memberToken();

        $this->withBearer($memberToken)
            ->getJson("/api/clubs/{$clubId}/admin/treasury")
            ->assertForbidden();

        $this->withBearer($memberToken)
            ->postJson("/api/clubs/{$clubId}/admin/treasury/expense", [
                'amount' => '10.00',
                'description' => 'Blocked',
            ])
            ->assertForbidden();
    }

    public function test_admin_can_view_analytics_dashboard_payload(): void
    {
        $this->seedClub();
        $clubId = $this->clubId();
        $ownerToken = $this->ownerToken();

        $ownerWallet = UserWallet::query()
            ->where('club_id', $clubId)
            ->whereHas('user', fn ($query) => $query->where('email', 'owner@velvet.club'))
            ->firstOrFail();

        $product = Product::query()
            ->where('club_id', $clubId)
            ->where('selling_mode', Product::MODE_UNIT)
            ->firstOrFail();

        WalletTransaction::query()->create([
            'wallet_id' => $ownerWallet->id,
            'product_id' => $product->id,
            'amount_deducted' => '20.00',
            'metadata' => ['quantity' => 1],
            'created_at' => now()->subDays(1),
        ]);

        ClubLedger::query()->create([
            'club_id' => $clubId,
            'transaction_type' => ClubLedger::TYPE_USER_TOPUP,
            'amount' => '50.00',
            'description' => 'Top-up',
            'handled_by' => User::query()->where('email', 'owner@velvet.club')->value('id'),
            'created_at' => now()->subDays(2),
        ]);

        $response = $this->withBearer($ownerToken)->getJson("/api/clubs/{$clubId}/admin/analytics");

        $response->assertOk()
            ->assertJsonCount(30, 'cassa_trend')
            ->assertJsonPath('top_consumed_products.0.product_name', $product->name)
            ->assertJsonPath('top_consumed_products.0.purchases_count', 1)
            ->assertJsonPath('member_vice_stats.total_members', 2)
            ->assertJsonPath('member_vice_stats.total_purchases', 1)
            ->assertJsonPath('member_vice_stats.top_spender_email', 'owner@velvet.club');
    }
}
