<?php

namespace App\Services\Auth;

use App\Exceptions\PinLockedException;
use App\Models\ClubMember;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class PinLockoutService
{
    private const MAX_ATTEMPTS = 3;

    private const LOCKOUT_MINUTES = 1440;

    public function assertNotLocked(ClubMember $member): void
    {
        $member->refresh();

        if ($member->isPinLocked()) {
            throw new PinLockedException;
        }

        if ($member->pin_locked_until?->isPast()) {
            $this->resetAttempts($member);
        }
    }

    public function recordFailedAttempt(ClubMember $member): void
    {
        $lockedOut = DB::transaction(function () use ($member): bool {
            $locked = ClubMember::query()
                ->whereKey($member->id)
                ->lockForUpdate()
                ->firstOrFail();

            $attempts = $locked->failed_pin_attempts + 1;

            if ($locked->pin_locked_until?->isPast()) {
                $attempts = 1;
            }

            $attributes = ['failed_pin_attempts' => $attempts];

            if ($attempts >= self::MAX_ATTEMPTS) {
                $attributes['pin_locked_until'] = Carbon::now()->addMinutes(self::LOCKOUT_MINUTES);
            }

            $locked->update($attributes);

            return $attempts >= self::MAX_ATTEMPTS;
        });

        if ($lockedOut) {
            throw new PinLockedException;
        }
    }

    public function resetAttempts(ClubMember $member): void
    {
        $member->update([
            'failed_pin_attempts' => 0,
            'pin_locked_until' => null,
        ]);
    }
}
