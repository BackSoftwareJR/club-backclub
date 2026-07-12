<?php

namespace Tests\Feature;

use App\Models\ClubMember;
use App\Models\Product;
use App\Models\UserWallet;
use Database\Seeders\ClubSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithClubApi;
use Tests\TestCase;

class PurchaseTest extends TestCase
{
    use InteractsWithClubApi;
    use RefreshDatabase;

    public function test_purchase_deducts_wallet_balance_with_row_lock(): void
    {
        $this->seedClub();
        $token = $this->ownerToken();
        $clubId = $this->clubId();

        $product = Product::query()
            ->where('club_id', $clubId)
            ->where('selling_mode', 'weight')
            ->firstOrFail();

        $response = $this->withBearer($token)->postJson("/api/clubs/{$clubId}/purchases", [
            'product_id' => $product->id,
            'quantity' => 7,
        ]);

        $response->assertOk()
            ->assertJsonPath('amount_deducted', '3.50')
            ->assertJsonPath('new_balance', '96.50');

        $this->assertDatabaseHas('wallet_transactions', [
            'product_id' => $product->id,
            'amount_deducted' => '3.50',
        ]);

        $this->assertDatabaseCount('club_ledger', 0);
    }

    public function test_purchase_returns_402_when_balance_insufficient(): void
    {
        $this->seedClub();
        $token = $this->ownerToken();
        $clubId = $this->clubId();

        UserWallet::query()
            ->where('club_id', $clubId)
            ->whereHas('user', fn ($query) => $query->where('email', 'owner@velvet.club'))
            ->update(['current_balance' => '1.00']);

        $product = Product::query()
            ->where('club_id', $clubId)
            ->where('selling_mode', 'unit')
            ->firstOrFail();

        $response = $this->withBearer($token)->postJson("/api/clubs/{$clubId}/purchases", [
            'product_id' => $product->id,
            'quantity' => 1,
        ]);

        $response->assertStatus(402)
            ->assertJsonPath('error', 'insufficient_funds');
    }

    public function test_purchase_rejects_invalid_quantity_for_non_fractional_product(): void
    {
        $this->seedClub();
        $token = $this->ownerToken();
        $clubId = $this->clubId();

        $product = Product::query()
            ->where('club_id', $clubId)
            ->where('selling_mode', 'unit')
            ->firstOrFail();

        $response = $this->withBearer($token)->postJson("/api/clubs/{$clubId}/purchases", [
            'product_id' => $product->id,
            'quantity' => 1.5,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('error', 'invalid_quantity');
    }

    public function test_custom_text_purchase_deducts_flat_price(): void
    {
        $this->seedClub();
        $token = $this->ownerToken();
        $clubId = $this->clubId();

        $product = Product::query()
            ->where('club_id', $clubId)
            ->where('selling_mode', 'custom_text')
            ->firstOrFail();

        $response = $this->withBearer($token)->postJson("/api/clubs/{$clubId}/purchases", [
            'product_id' => $product->id,
            'quantity' => 1,
            'custom_note' => 'Extra ice please',
        ]);

        $response->assertOk()
            ->assertJsonPath('amount_deducted', '15.00')
            ->assertJsonPath('new_balance', '85.00');

        $this->assertDatabaseHas('wallet_transactions', [
            'product_id' => $product->id,
            'amount_deducted' => '15.00',
        ]);
    }
}
