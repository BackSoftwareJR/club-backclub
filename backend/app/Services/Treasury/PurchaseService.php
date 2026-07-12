<?php

namespace App\Services\Treasury;

use App\Exceptions\InsufficientFundsException;
use App\Models\Product;
use App\Models\User;
use App\Models\UserWallet;
use App\Models\WalletTransaction;
use Illuminate\Support\Facades\DB;

class PurchaseService
{
    public function __construct(
        private readonly PricingService $pricingService,
    ) {}

    /**
     * @return array{transaction_id: int, amount_deducted: string, new_balance: string}
     */
    public function purchase(User $user, int $clubId, Product $product, float $quantity, ?string $customNote = null): array
    {
        $amount = $this->pricingService->calculatePrice($product, $quantity);

        return DB::transaction(function () use ($user, $clubId, $product, $quantity, $customNote, $amount) {
            $wallet = UserWallet::query()
                ->where('club_id', $clubId)
                ->where('user_id', $user->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (bccomp((string) $wallet->current_balance, $amount, 2) < 0) {
                throw new InsufficientFundsException;
            }

            $newBalance = bcsub((string) $wallet->current_balance, $amount, 2);
            $wallet->update(['current_balance' => $newBalance]);

            $metadata = [
                'quantity' => $quantity,
                'unit_label' => $product->price_config['unit_label'] ?? null,
            ];

            if ($customNote !== null) {
                $metadata['custom_note'] = $customNote;
            }

            $transaction = WalletTransaction::query()->create([
                'wallet_id' => $wallet->id,
                'product_id' => $product->id,
                'amount_deducted' => $amount,
                'metadata' => $metadata,
                'created_at' => now(),
            ]);

            return [
                'transaction_id' => $transaction->id,
                'amount_deducted' => $amount,
                'new_balance' => $newBalance,
            ];
        });
    }
}
