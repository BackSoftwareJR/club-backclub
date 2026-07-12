<?php

namespace App\Services\Ai;

use App\Models\Club;
use App\Models\User;
use App\Models\UserWallet;
use App\Models\WalletTransaction;

class AiContextBuilder
{
    /**
     * @return array<string, mixed>
     */
    public function build(User $user, Club $club): array
    {
        $wallet = UserWallet::query()
            ->where('club_id', $club->id)
            ->where('user_id', $user->id)
            ->first();

        $transactions = [];

        if ($wallet !== null) {
            $transactions = WalletTransaction::query()
                ->with('product')
                ->where('wallet_id', $wallet->id)
                ->orderByDesc('created_at')
                ->limit(10)
                ->get()
                ->map(fn (WalletTransaction $transaction) => [
                    'product_name' => $transaction->product?->name,
                    'amount_deducted' => (string) $transaction->amount_deducted,
                    'metadata' => $transaction->metadata,
                    'created_at' => $transaction->created_at?->toIso8601String(),
                ])
                ->all();
        }

        return [
            'balance' => $wallet ? (string) $wallet->current_balance : '0.00',
            'recent_transactions' => $transactions,
            'theme_config' => $club->theme_config,
        ];
    }
}
