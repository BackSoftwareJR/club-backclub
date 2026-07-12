<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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

    public function walletTransactions(): HasMany
    {
        return $this->hasMany(WalletTransaction::class);
    }
}
