<?php

namespace App\Services\Ai;

use App\Models\User;
use App\Models\UserWallet;
use App\Models\WalletTransaction;
use Illuminate\Support\Carbon;

class CoachTriggerService
{
    private const THRESHOLD_EUR = '30.00';

    private const LOOKBACK_DAYS = 7;

    public function shouldIntervene(User $user, int $clubId): bool
    {
        return bccomp($this->getWeeklySpend($user, $clubId), self::THRESHOLD_EUR, 2) > 0;
    }

    public function getWeeklySpend(User $user, int $clubId): string
    {
        $wallet = UserWallet::query()
            ->where('club_id', $clubId)
            ->where('user_id', $user->id)
            ->first();

        if ($wallet === null) {
            return '0.00';
        }

        $since = Carbon::now()->subDays(self::LOOKBACK_DAYS);

        $totalSpend = WalletTransaction::query()
            ->where('wallet_id', $wallet->id)
            ->where('created_at', '>=', $since)
            ->sum('amount_deducted');

        return number_format((float) $totalSpend, 2, '.', '');
    }
}
