<?php

namespace App\Services\Auth;

use App\Exceptions\PinLockedException;
use App\Models\ClubMember;
use Illuminate\Support\Carbon;

class PinLockoutService
{
    private const MAX_ATTEMPTS = 5;

    private const LOCKOUT_MINUTES = 15;

    public function assertNotLocked(ClubMember $member): void
    {
        $member->refresh();

        if ($member->isPinLocked()) {
            throw new PinLockedException;
        }
    }

    public function recordFailedAttempt(ClubMember $member): void
    {
        $member->refresh();
        $attempts = $member->failed_pin_attempts + 1;

        $attributes = ['failed_pin_attempts' => $attempts];

        if ($attempts >= self::MAX_ATTEMPTS) {
            $attributes['pin_locked_until'] = Carbon::now()->addMinutes(self::LOCKOUT_MINUTES);
        }

        $member->update($attributes);

        if ($attempts >= self::MAX_ATTEMPTS) {
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
