<?php

namespace Tests\Feature;

use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\Concerns\InteractsWithClubApi;
use Tests\TestCase;

class MediaDeliveryTest extends TestCase
{
    use InteractsWithClubApi;
    use RefreshDatabase;

    public function test_public_media_route_serves_uploaded_product_cover(): void
    {
        Storage::fake('public');
        $this->seedClub();
        $token = $this->ownerToken();
        $clubId = $this->clubId();
        $product = Product::query()->where('club_id', $clubId)->firstOrFail();

        $this->withBearer($token)->postJson(
            "/api/clubs/{$clubId}/admin/products/{$product->id}/cover",
            ['image' => UploadedFile::fake()->image('cover.png', 800, 600)],
        )->assertOk();

        $product->refresh();
        $this->assertNotNull($product->cover_image_path);

        $this->get('/api/media/'.$product->cover_image_path)
            ->assertOk()
            ->assertHeader('content-type', 'image/png');
    }

    public function test_media_route_rejects_path_traversal(): void
    {
        $this->getJson('/api/media/../.env')->assertNotFound();
    }
}
