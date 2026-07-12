<?php

namespace App\Services\Auth;

use App\Exceptions\IpBlockedException;
use App\Models\IpAuthBlock;
use Illuminate\Support\Carbon;

class IpAuthBlockService
{
    private const MAX_ATTEMPTS = 10;

    private const BLOCK_MINUTES = 5;

    public function assertNotBlocked(string $ipAddress): void
    {
        $record = IpAuthBlock::query()->where('ip_address', $ipAddress)->first();

        if ($record !== null && $record->isBlocked()) {
            throw new IpBlockedException;
        }
    }

    public function recordFailure(string $ipAddress): void
    {
        $record = IpAuthBlock::query()->firstOrCreate(
            ['ip_address' => $ipAddress],
            ['failed_attempts' => 0, 'updated_at' => now()],
        );

        $attempts = $record->failed_attempts + 1;
        $attributes = [
            'failed_attempts' => $attempts,
            'updated_at' => now(),
        ];

        if ($attempts >= self::MAX_ATTEMPTS) {
            $attributes['blocked_until'] = Carbon::now()->addMinutes(self::BLOCK_MINUTES);
        }

        $record->update($attributes);

        if ($attempts >= self::MAX_ATTEMPTS) {
            throw new IpBlockedException;
        }
    }

    public function clearFailures(string $ipAddress): void
    {
        IpAuthBlock::query()
            ->where('ip_address', $ipAddress)
            ->update([
                'failed_attempts' => 0,
                'blocked_until' => null,
                'updated_at' => now(),
            ]);
    }
}
