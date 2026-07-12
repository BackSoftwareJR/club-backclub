<?php

namespace Tests\Feature;

use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithClubApi;
use Tests\TestCase;

class AdminProductTest extends TestCase
{
    use InteractsWithClubApi;
    use RefreshDatabase;

    public function test_admin_can_list_all_products_including_inactive(): void
    {
        $this->seedClub();
        $token = $this->ownerToken();
        $clubId = $this->clubId();

        $product = Product::query()->where('club_id', $clubId)->firstOrFail();
        $product->update(['is_active' => false]);

        $response = $this->withBearer($token)->getJson("/api/clubs/{$clubId}/admin/products");

        $response->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonFragment(['id' => $product->id, 'is_active' => false]);
    }

    public function test_admin_can_create_product_with_valid_price_config(): void
    {
        $this->seedClub();
        $token = $this->ownerToken();
        $clubId = $this->clubId();

        $response = $this->withBearer($token)->postJson("/api/clubs/{$clubId}/admin/products", [
            'name' => 'House Blend',
            'selling_mode' => 'volume',
            'price_config' => [
                'step_value' => 50,
                'unit_label' => 'ml',
                'price_per_step' => 4.00,
                'allow_fractions' => true,
            ],
            'is_active' => true,
        ]);

        $response->assertCreated()
            ->assertJsonPath('name', 'House Blend')
            ->assertJsonPath('selling_mode', 'volume');

        $this->assertDatabaseHas('products', [
            'club_id' => $clubId,
            'name' => 'House Blend',
            'selling_mode' => 'volume',
        ]);
    }

    public function test_admin_create_rejects_invalid_price_config(): void
    {
        $this->seedClub();
        $token = $this->ownerToken();
        $clubId = $this->clubId();

        $response = $this->withBearer($token)->postJson("/api/clubs/{$clubId}/admin/products", [
            'name' => 'Broken Product',
            'selling_mode' => 'unit',
            'price_config' => [
                'step_value' => 0,
                'unit_label' => '',
                'price_per_step' => -1,
            ],
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['price_config.step_value', 'price_config.unit_label', 'price_config.price_per_step']);
    }

    public function test_admin_can_update_and_deactivate_product(): void
    {
        $this->seedClub();
        $token = $this->ownerToken();
        $clubId = $this->clubId();

        $product = Product::query()->where('club_id', $clubId)->firstOrFail();

        $updateResponse = $this->withBearer($token)->patchJson(
            "/api/clubs/{$clubId}/admin/products/{$product->id}",
            ['name' => 'Updated Name'],
        );

        $updateResponse->assertOk()
            ->assertJsonPath('name', 'Updated Name');

        $deleteResponse = $this->withBearer($token)->deleteJson(
            "/api/clubs/{$clubId}/admin/products/{$product->id}",
        );

        $deleteResponse->assertOk();

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'is_active' => false,
        ]);
    }
}
