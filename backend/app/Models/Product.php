<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Support\MediaUrl;

class Product extends Model
{
    public const MODE_UNIT = 'unit';

    public const MODE_WEIGHT = 'weight';

    public const MODE_VOLUME = 'volume';

    public const MODE_CUSTOM_TEXT = 'custom_text';

    protected $fillable = [
        'club_id',
        'name',
        'selling_mode',
        'price_config',
        'is_active',
        'cover_image_path',
    ];

    protected function casts(): array
    {
        return [
            'price_config' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function club(): BelongsTo
    {
        return $this->belongsTo(Club::class);
    }

    public function galleryMedia(): HasMany
    {
        return $this->hasMany(ProductMedia::class)->orderBy('sort_order')->orderBy('id');
    }

    public function walletTransactions(): HasMany
    {
        return $this->hasMany(WalletTransaction::class);
    }

    public function coverImageUrl(): ?string
    {
        if (! $this->cover_image_path) {
            return null;
        }

        return MediaUrl::fromPath($this->cover_image_path);
    }
}
