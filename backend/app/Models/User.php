<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class User extends Model
{
    /** @use HasFactory<UserFactory> */
    use HasFactory;

    protected $fillable = [
        'email',
        'password_hash',
    ];

    protected $hidden = [
        'password_hash',
    ];

    public function ownedClubs(): HasMany
    {
        return $this->hasMany(Club::class, 'owner_id');
    }

    public function clubMemberships(): HasMany
    {
        return $this->hasMany(ClubMember::class);
    }

    public function wallets(): HasMany
    {
        return $this->hasMany(UserWallet::class);
    }

    public function topupRequests(): HasMany
    {
        return $this->hasMany(TopupRequest::class);
    }

    public function handledLedgerEntries(): HasMany
    {
        return $this->hasMany(ClubLedger::class, 'handled_by');
    }

    public function walletForClub(int $clubId): ?UserWallet
    {
        return $this->wallets()->where('club_id', $clubId)->first();
    }

    public function membershipForClub(int $clubId): ?ClubMember
    {
        return $this->clubMemberships()->where('club_id', $clubId)->first();
    }

    public function ownsClub(Club $club): bool
    {
        return $club->owner_id === $this->id;
    }
}
