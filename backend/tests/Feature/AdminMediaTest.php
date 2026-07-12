<?php

namespace Tests\Feature;

use App\Models\Club;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\Concerns\InteractsWithClubApi;
use Tests\TestCase;

class AdminMediaTest extends TestCase
{
    use InteractsWithClubApi;
    use RefreshDatabase;

    public function test_admin_can_manage_product_cover_and_gallery(): void
    {
        Storage::fake('public');
        $this->seedClub();
        $token = $this->ownerToken();
        $clubId = $this->clubId();
        $product = Product::query()->where('club_id', $clubId)->firstOrFail();

        $coverResponse = $this->withBearer($token)->postJson(
            "/api/clubs/{$clubId}/admin/products/{$product->id}/cover",
            ['image' => UploadedFile::fake()->image('cover.png', 1200, 800)],
        );

        $coverResponse->assertOk()
            ->assertJsonPath('id', $product->id)
            ->assertJsonPath('gallery', [])
            ->assertJsonPath('cover_image_url', fn ($url) => is_string($url) && str_contains($url, 'clubs/'));

        $galleryA = $this->withBearer($token)->postJson(
            "/api/clubs/{$clubId}/admin/products/{$product->id}/gallery",
            ['image' => UploadedFile::fake()->image('gallery-a.jpg', 1200, 800)],
        );
        $galleryB = $this->withBearer($token)->postJson(
            "/api/clubs/{$clubId}/admin/products/{$product->id}/gallery",
            ['image' => UploadedFile::fake()->image('gallery-b.jpg', 1200, 800)],
        );

        $galleryB->assertCreated()->assertJsonCount(2, 'gallery');
        $idsInCurrentOrder = array_map(
            fn (array $item): int => (int) $item['id'],
            $galleryB->json('gallery'),
        );
        $idsInReverseOrder = array_reverse($idsInCurrentOrder);

        $reorder = $this->withBearer($token)->patchJson(
            "/api/clubs/{$clubId}/admin/products/{$product->id}/gallery/reorder",
            ['media_ids' => $idsInReverseOrder],
        );

        $reorder->assertOk()
            ->assertJsonPath('gallery.0.id', $idsInReverseOrder[0])
            ->assertJsonPath('gallery.0.sort_order', 1)
            ->assertJsonPath('gallery.1.id', $idsInReverseOrder[1])
            ->assertJsonPath('gallery.1.sort_order', 2);

        $deleteOne = $this->withBearer($token)->deleteJson(
            "/api/clubs/{$clubId}/admin/products/{$product->id}/gallery/{$idsInReverseOrder[0]}",
        );

        $deleteOne->assertOk()
            ->assertJsonCount(1, 'gallery');

        $deleteCover = $this->withBearer($token)->deleteJson(
            "/api/clubs/{$clubId}/admin/products/{$product->id}/cover",
        );

        $deleteCover->assertOk()
            ->assertJsonPath('cover_image_url', null);

        $this->assertDatabaseHas('product_media', [
            'id' => $idsInReverseOrder[1],
            'product_id' => $product->id,
            'sort_order' => 1,
        ]);

        $this->assertDatabaseMissing('product_media', [
            'id' => $idsInReverseOrder[0],
        ]);

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'cover_image_path' => null,
        ]);

        $galleryA->assertCreated();
    }

    public function test_admin_upload_rejects_invalid_file_types_and_sizes(): void
    {
        Storage::fake('public');
        $this->seedClub();
        $token = $this->ownerToken();
        $clubId = $this->clubId();
        $product = Product::query()->where('club_id', $clubId)->firstOrFail();

        $invalidType = $this->withBearer($token)->postJson(
            "/api/clubs/{$clubId}/admin/products/{$product->id}/cover",
            ['image' => UploadedFile::fake()->create('payload.txt', 10, 'text/plain')],
        );

        $invalidType->assertStatus(422)
            ->assertJsonPath('error', 'validation_error')
            ->assertJsonValidationErrors(['image']);

        $tooLarge = $this->withBearer($token)->postJson(
            "/api/clubs/{$clubId}/admin/products/{$product->id}/cover",
            ['image' => UploadedFile::fake()->image('too-large.jpg')->size(7000)],
        );

        $tooLarge->assertStatus(422)
            ->assertJsonPath('error', 'validation_error')
            ->assertJsonValidationErrors(['image']);
    }

    public function test_admin_can_manage_club_identity_images(): void
    {
        Storage::fake('public');
        $this->seedClub();
        $token = $this->ownerToken();
        $clubId = $this->clubId();

        $logoResponse = $this->withBearer($token)->postJson(
            "/api/clubs/{$clubId}/admin/identity/logo",
            ['image' => UploadedFile::fake()->image('logo.webp', 600, 600)],
        );
        $heroResponse = $this->withBearer($token)->postJson(
            "/api/clubs/{$clubId}/admin/identity/hero",
            ['image' => UploadedFile::fake()->image('hero.jpg', 1920, 1080)],
        );

        $logoResponse->assertOk()
            ->assertJsonPath('data.logo_image_url', fn ($url) => is_string($url) && str_contains($url, 'clubs/'));
        $heroResponse->assertOk()
            ->assertJsonPath('data.hero_image_url', fn ($url) => is_string($url) && str_contains($url, 'clubs/'))
            ->assertJsonPath('data.theme_config.assets.logo_url', fn ($url) => is_string($url));

        $identity = $this->withBearer($token)->getJson("/api/clubs/{$clubId}/admin/identity");
        $identity->assertOk()
            ->assertJsonPath('data.club_id', $clubId)
            ->assertJsonPath('data.theme_config.assets.cover_url', fn ($url) => is_string($url));

        $this->withBearer($token)->deleteJson("/api/clubs/{$clubId}/admin/identity/logo")
            ->assertOk()
            ->assertJsonPath('data.logo_image_url', null);

        $this->withBearer($token)->deleteJson("/api/clubs/{$clubId}/admin/identity/hero")
            ->assertOk()
            ->assertJsonPath('data.hero_image_url', null);

        $this->assertDatabaseHas('clubs', [
            'id' => $clubId,
            'logo_image_path' => null,
            'hero_image_path' => null,
        ]);
    }

    public function test_admin_can_update_club_appearance_theme(): void
    {
        $this->seedClub();
        $token = $this->ownerToken();
        $clubId = $this->clubId();

        $response = $this->withBearer($token)->patchJson("/api/clubs/{$clubId}/admin/appearance", [
            'template_id' => 4,
            'colors' => [
                'primary' => '#123456',
                'secondary' => '#654321',
                'background' => '#111111',
            ],
            'typography' => [
                'preset' => 'modern_sans',
            ],
            'interactions' => [
                'sounds_enabled' => false,
                'haptics_enabled' => true,
            ],
        ]);

        $response->assertOk()
            ->assertJsonPath('data.theme_config.template_id', 4)
            ->assertJsonPath('data.theme_config.colors.primary', '#123456')
            ->assertJsonPath('data.theme_config.colors.secondary', '#654321')
            ->assertJsonPath('data.theme_config.colors.background', '#111111')
            ->assertJsonPath('data.theme_config.typography.preset', 'modern_sans')
            ->assertJsonPath('data.theme_config.interactions.sounds_enabled', false)
            ->assertJsonPath('data.theme_config.interactions.haptics_enabled', true);
    }

    public function test_admin_appearance_update_rejects_invalid_colors_and_template(): void
    {
        $this->seedClub();
        $token = $this->ownerToken();
        $clubId = $this->clubId();

        $response = $this->withBearer($token)->patchJson("/api/clubs/{$clubId}/admin/appearance", [
            'template_id' => 99,
            'colors' => [
                'primary' => 'blue',
                'secondary' => '#654321',
                'background' => '#111111',
            ],
            'typography' => [
                'preset' => 'legacy',
            ],
            'interactions' => [
                'sounds_enabled' => true,
                'haptics_enabled' => true,
            ],
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['template_id', 'colors.primary', 'typography.preset']);
    }

    public function test_auth_payload_contains_uploaded_identity_assets(): void
    {
        Storage::fake('public');
        $this->seedClub();
        $club = Club::query()->firstOrFail();

        $club->update([
            'logo_image_path' => UploadedFile::fake()->image('logo.png')->store('clubs/'.$club->id.'/identity/logo', 'public'),
            'hero_image_path' => UploadedFile::fake()->image('hero.png')->store('clubs/'.$club->id.'/identity/hero', 'public'),
        ]);

        $login = $this->postJson('/api/auth/login', [
            'club_id' => $club->id,
            'nfc_uid' => 'NFC-OWNER-001',
            'pin' => '123456',
        ]);

        $login->assertOk()
            ->assertJsonPath('club.theme_config.assets.logo_url', fn ($url) => is_string($url) && str_contains($url, 'clubs/'))
            ->assertJsonPath('club.theme_config.assets.cover_url', fn ($url) => is_string($url) && str_contains($url, 'clubs/'));
    }
}
