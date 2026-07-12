<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IpAuthBlock extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'ip_address',
        'failed_attempts',
        'blocked_until',
        'updated_at',
    ];

    protected function casts(): array
    {
        return [
            'failed_attempts' => 'integer',
            'blocked_until' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function isBlocked(): bool
    {
        return $this->blocked_until !== null && $this->blocked_until->isFuture();
    }
}
