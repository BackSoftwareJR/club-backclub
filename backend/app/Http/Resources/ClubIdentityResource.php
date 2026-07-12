<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Club */
class ClubIdentityResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'club_id' => $this->id,
            'logo_image_url' => $this->logoImageUrl(),
            'hero_image_url' => $this->heroImageUrl(),
            'theme_config' => $this->resolvedThemeConfig(),
        ];
    }
}
