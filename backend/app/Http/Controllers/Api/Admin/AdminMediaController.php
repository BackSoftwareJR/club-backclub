<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ReorderProductGalleryRequest;
use App\Http\Requests\Admin\UpdateClubAppearanceRequest;
use App\Http\Requests\Admin\UploadImageRequest;
use App\Http\Resources\ClubIdentityResource;
use App\Http\Resources\ProductResource;
use App\Models\Club;
use App\Models\Product;
use App\Models\ProductMedia;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AdminMediaController extends Controller
{
    public function showClubIdentity(int $clubId): JsonResponse
    {
        $club = Club::query()->findOrFail($clubId);

        return response()->json([
            'data' => new ClubIdentityResource($club),
        ]);
    }

    public function updateClubAppearance(UpdateClubAppearanceRequest $request, int $clubId): JsonResponse
    {
        $club = Club::query()->findOrFail($clubId);
        $validated = $request->validated();
        $currentTheme = $club->resolvedThemeConfig();
        $typography = Club::typographyPreset($validated['typography']['preset']);

        $club->update([
            'theme_config' => [
                'template_id' => (int) $validated['template_id'],
                'colors' => [
                    'primary' => strtoupper((string) $validated['colors']['primary']),
                    'secondary' => strtoupper((string) $validated['colors']['secondary']),
                    'background' => strtoupper((string) $validated['colors']['background']),
                    'glass_opacity' => (float) data_get($currentTheme, 'colors.glass_opacity', 0.6),
                ],
                'typography' => $typography,
                'interactions' => [
                    'sounds_enabled' => (bool) $validated['interactions']['sounds_enabled'],
                    'haptics_enabled' => (bool) $validated['interactions']['haptics_enabled'],
                ],
                'assets' => [
                    'logo_url' => $club->logoImageUrl(),
                    'cover_url' => $club->heroImageUrl(),
                ],
            ],
        ]);

        return response()->json([
            'data' => new ClubIdentityResource($club->fresh()),
        ]);
    }

    public function uploadClubLogo(UploadImageRequest $request, int $clubId): JsonResponse
    {
        $club = Club::query()->findOrFail($clubId);
        $newPath = $this->storeImage($request, "clubs/{$clubId}/identity/logo");
        $oldPath = $club->logo_image_path;
        $club->update(['logo_image_path' => $newPath]);

        $this->deleteIfExists($oldPath);

        return response()->json([
            'data' => new ClubIdentityResource($club->fresh()),
        ]);
    }

    public function deleteClubLogo(int $clubId): JsonResponse
    {
        $club = Club::query()->findOrFail($clubId);
        $this->deleteIfExists($club->logo_image_path);
        $club->update(['logo_image_path' => null]);

        return response()->json([
            'data' => new ClubIdentityResource($club->fresh()),
        ]);
    }

    public function uploadClubHero(UploadImageRequest $request, int $clubId): JsonResponse
    {
        $club = Club::query()->findOrFail($clubId);
        $newPath = $this->storeImage($request, "clubs/{$clubId}/identity/hero");
        $oldPath = $club->hero_image_path;
        $club->update(['hero_image_path' => $newPath]);

        $this->deleteIfExists($oldPath);

        return response()->json([
            'data' => new ClubIdentityResource($club->fresh()),
        ]);
    }

    public function deleteClubHero(int $clubId): JsonResponse
    {
        $club = Club::query()->findOrFail($clubId);
        $this->deleteIfExists($club->hero_image_path);
        $club->update(['hero_image_path' => null]);

        return response()->json([
            'data' => new ClubIdentityResource($club->fresh()),
        ]);
    }

    public function uploadProductCover(UploadImageRequest $request, int $clubId, int $productId): JsonResponse
    {
        $product = $this->resolveProduct($clubId, $productId);
        $newPath = $this->storeImage($request, "clubs/{$clubId}/products/{$productId}/cover");
        $oldPath = $product->cover_image_path;
        $product->update(['cover_image_path' => $newPath]);

        $this->deleteIfExists($oldPath);

        return response()->json(new ProductResource($product->fresh()->load('galleryMedia')));
    }

    public function deleteProductCover(int $clubId, int $productId): JsonResponse
    {
        $product = $this->resolveProduct($clubId, $productId);
        $this->deleteIfExists($product->cover_image_path);
        $product->update(['cover_image_path' => null]);

        return response()->json(new ProductResource($product->fresh()->load('galleryMedia')));
    }

    public function uploadProductGalleryImage(UploadImageRequest $request, int $clubId, int $productId): JsonResponse
    {
        $product = $this->resolveProduct($clubId, $productId);
        $imagePath = $this->storeImage($request, "clubs/{$clubId}/products/{$productId}/gallery");
        $nextOrder = (int) ProductMedia::query()
            ->where('product_id', $product->id)
            ->max('sort_order') + 1;

        ProductMedia::query()->create([
            'product_id' => $product->id,
            'image_path' => $imagePath,
            'sort_order' => $nextOrder,
        ]);

        return response()->json(new ProductResource($product->fresh()->load('galleryMedia')), 201);
    }

    public function deleteProductGalleryImage(int $clubId, int $productId, int $mediaId): JsonResponse
    {
        $product = $this->resolveProduct($clubId, $productId);
        $media = ProductMedia::query()
            ->where('product_id', $product->id)
            ->findOrFail($mediaId);

        $this->deleteIfExists($media->image_path);
        $media->delete();
        $this->normalizeGalleryOrder($product->id);

        return response()->json(new ProductResource($product->fresh()->load('galleryMedia')));
    }

    public function reorderProductGallery(
        ReorderProductGalleryRequest $request,
        int $clubId,
        int $productId
    ): JsonResponse {
        $product = $this->resolveProduct($clubId, $productId);
        $mediaIds = $request->validated('media_ids');

        DB::transaction(function () use ($product, $mediaIds): void {
            foreach ($mediaIds as $index => $id) {
                ProductMedia::query()
                    ->where('product_id', $product->id)
                    ->where('id', $id)
                    ->update(['sort_order' => $index + 1]);
            }
        });

        return response()->json(new ProductResource($product->fresh()->load('galleryMedia')));
    }

    private function resolveProduct(int $clubId, int $productId): Product
    {
        return Product::query()
            ->where('club_id', $clubId)
            ->findOrFail($productId);
    }

    private function normalizeGalleryOrder(int $productId): void
    {
        $gallery = ProductMedia::query()
            ->where('product_id', $productId)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        DB::transaction(function () use ($gallery): void {
            foreach ($gallery as $index => $media) {
                $media->update(['sort_order' => $index + 1]);
            }
        });
    }

    private function storeImage(UploadImageRequest $request, string $directory): string
    {
        $file = $request->file('image');
        $filename = Str::uuid()->toString().'.'.$file->getClientOriginalExtension();

        return $file->storeAs($directory, $filename, 'public');
    }

    private function deleteIfExists(?string $path): void
    {
        if (! $path) {
            return;
        }

        if (Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }
}
