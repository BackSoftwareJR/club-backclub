<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClubLedger extends Model
{
    public const TYPE_USER_TOPUP = 'user_topup';

    public const TYPE_ADMIN_INJECTION = 'admin_injection';

    public const TYPE_ADMIN_EXPENSE = 'admin_expense';

    protected $table = 'club_ledger';

    protected $fillable = [
        'club_id',
        'transaction_type',
        'amount',
        'description',
        'handled_by',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
        ];
    }

    public function club(): BelongsTo
    {
        return $this->belongsTo(Club::class);
    }

    public function handler(): BelongsTo
    {
        return $this->belongsTo(User::class, 'handled_by');
    }
}
