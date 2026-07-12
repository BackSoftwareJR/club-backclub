<?php

namespace App\Services\Auth;

use App\Exceptions\IpBlockedException;
use App\Models\IpAuthBlock;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class IpAuthBlockService
{
    private const MAX_ATTEMPTS = 3;

    private const BLOCK_MINUTES = 1440;

    public function assertNotBlocked(string $ipAddress): void
    {
        $record = IpAuthBlock::query()->where('ip_address', $ipAddress)->first();

        if ($record !== null && $record->isBlocked()) {
            throw new IpBlockedException;
        }

        if ($record?->blocked_until?->isPast()) {
            $this->clearFailures($ipAddress);
        }
    }

    public function recordFailure(string $ipAddress): void
    {
        if ($this->recordFailureSilently($ipAddress)) {
            throw new IpBlockedException;
        }
    }

    public function recordFailureSilently(string $ipAddress): bool
    {
        return DB::transaction(function () use ($ipAddress): bool {
            IpAuthBlock::query()->firstOrCreate(
                ['ip_address' => $ipAddress],
                ['failed_attempts' => 0, 'updated_at' => now()],
            );

            $record = IpAuthBlock::query()
                ->where('ip_address', $ipAddress)
                ->lockForUpdate()
                ->firstOrFail();

            if ($record->blocked_until?->isPast()) {
                $record->update(['failed_attempts' => 0, 'blocked_until' => null]);
                $record->refresh();
            }

            $attempts = $record->failed_attempts + 1;
            $attributes = [
                'failed_attempts' => $attempts,
                'updated_at' => now(),
            ];

            if ($attempts >= self::MAX_ATTEMPTS) {
                $attributes['blocked_until'] = Carbon::now()->addMinutes(self::BLOCK_MINUTES);
            }

            $record->update($attributes);

            return $attempts >= self::MAX_ATTEMPTS;
        });
    }

    public function blockForDay(string $ipAddress): void
    {
        IpAuthBlock::query()->updateOrCreate(
            ['ip_address' => $ipAddress],
            [
                'failed_attempts' => self::MAX_ATTEMPTS,
                'blocked_until' => Carbon::now()->addDay(),
                'updated_at' => now(),
            ],
        );
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
