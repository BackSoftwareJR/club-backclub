<?php

namespace App\Services\Treasury;

use App\Exceptions\ForbiddenApiException;
use App\Exceptions\TopupRequestNotPendingException;
use App\Models\ClubLedger;
use App\Models\TopupRequest;
use App\Models\User;
use App\Models\UserWallet;
use Illuminate\Support\Facades\DB;

class TopupService
{
    public function createRequest(User $user, int $clubId, string $amount): TopupRequest
    {
        return TopupRequest::query()->create([
            'club_id' => $clubId,
            'user_id' => $user->id,
            'amount' => $amount,
            'status' => TopupRequest::STATUS_PENDING,
        ]);
    }

    public function approve(TopupRequest $request, User $admin): TopupRequest
    {
        if ($request->status !== TopupRequest::STATUS_PENDING) {
            throw new TopupRequestNotPendingException;
        }

        return DB::transaction(function () use ($request, $admin) {
            $locked = TopupRequest::query()
                ->whereKey($request->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($locked->status !== TopupRequest::STATUS_PENDING) {
                throw new TopupRequestNotPendingException;
            }

            $wallet = UserWallet::query()
                ->where('club_id', $locked->club_id)
                ->where('user_id', $locked->user_id)
                ->lockForUpdate()
                ->firstOrFail();

            $newBalance = bcadd((string) $wallet->current_balance, (string) $locked->amount, 2);
            $wallet->update(['current_balance' => $newBalance]);

            $locked->update(['status' => TopupRequest::STATUS_APPROVED]);

            ClubLedger::query()->create([
                'club_id' => $locked->club_id,
                'transaction_type' => ClubLedger::TYPE_USER_TOPUP,
                'amount' => $locked->amount,
                'description' => 'Approved top-up request #'.$locked->id,
                'handled_by' => $admin->id,
            ]);

            return $locked->fresh();
        });
    }

    public function reject(TopupRequest $request, User $admin, ?string $adminNote = null): TopupRequest
    {
        if ($request->status !== TopupRequest::STATUS_PENDING) {
            throw new TopupRequestNotPendingException;
        }

        return DB::transaction(function () use ($request, $adminNote) {
            $locked = TopupRequest::query()
                ->whereKey($request->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($locked->status !== TopupRequest::STATUS_PENDING) {
                throw new TopupRequestNotPendingException;
            }

            $locked->update([
                'status' => TopupRequest::STATUS_REJECTED,
                'admin_note' => $adminNote,
            ]);

            return $locked->fresh();
        });
    }

    /**
     * @return array{wallet: UserWallet, ledger: ClubLedger}
     */
    public function adminInjection(int $clubId, int $userId, string $amount, string $description, User $admin): array
    {
        return DB::transaction(function () use ($clubId, $userId, $amount, $description, $admin) {
            $wallet = UserWallet::query()
                ->where('club_id', $clubId)
                ->where('user_id', $userId)
                ->lockForUpdate()
                ->first();

            if ($wallet === null) {
                throw new ForbiddenApiException('User wallet not found for this club.');
            }

            $newBalance = bcadd((string) $wallet->current_balance, $amount, 2);
            $wallet->update(['current_balance' => $newBalance]);

            $ledger = ClubLedger::query()->create([
                'club_id' => $clubId,
                'transaction_type' => ClubLedger::TYPE_ADMIN_INJECTION,
                'amount' => $amount,
                'description' => $description,
                'handled_by' => $admin->id,
            ]);

            return [
                'wallet' => $wallet->fresh(),
                'ledger' => $ledger,
            ];
        });
    }

    public function recordExpense(int $clubId, string $amount, string $description, User $admin): ClubLedger
    {
        $negativeAmount = bcsub('0', $amount, 2);

        return ClubLedger::query()->create([
            'club_id' => $clubId,
            'transaction_type' => ClubLedger::TYPE_ADMIN_EXPENSE,
            'amount' => $negativeAmount,
            'description' => $description,
            'handled_by' => $admin->id,
        ]);
    }
}
