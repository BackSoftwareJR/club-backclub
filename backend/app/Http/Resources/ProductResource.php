<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Product */
class ProductResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'selling_mode' => $this->selling_mode,
            'price_config' => $this->price_config,
            'is_active' => $this->is_active,
            'cover_image_url' => $this->coverImageUrl(),
            'gallery' => $this->galleryMedia->map(fn ($media) => [
                'id' => $media->id,
                'image_url' => $media->image_url,
                'sort_order' => $media->sort_order,
            ])->values(),
        ];
    }
}
