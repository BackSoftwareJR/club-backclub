<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Club extends Model
{
    protected $fillable = [
        'owner_id',
        'name',
        'theme_config',
    ];

    protected function casts(): array
    {
        return [
            'theme_config' => 'array',
        ];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function members(): HasMany
    {
        return $this->hasMany(ClubMember::class);
    }

    public function wallets(): HasMany
    {
        return $this->hasMany(UserWallet::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function topupRequests(): HasMany
    {
        return $this->hasMany(TopupRequest::class);
    }

    public function ledgerEntries(): HasMany
    {
        return $this->hasMany(ClubLedger::class);
    }
}
