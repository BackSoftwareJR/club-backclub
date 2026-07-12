<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SecurityLog extends Model
{
    public const DIRECT_URL_ACCESS = 'Direct URL Access';

    public const WRONG_PIN = 'Wrong PIN';

    public const INVALID_NFC = 'Invalid NFC';

    public const BLOCKED_IP = 'Blocked IP';

    protected $fillable = [
        'club_id',
        'ip_address',
        'user_agent',
        'violation_type',
        'attempted_route',
        'nfc_uid',
        'metadata',
        'occurred_at',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'occurred_at' => 'datetime',
        ];
    }

    public function club(): BelongsTo
    {
        return $this->belongsTo(Club::class);
    }
}
