<?php

namespace App\Services\Treasury;

use App\Exceptions\ForbiddenApiException;
use App\Models\Club;
use App\Models\ClubMember;
use App\Models\User;
use App\Models\UserWallet;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class MemberService
{
    /**
     * @return array{user: User, member: ClubMember, wallet: UserWallet}
     */
    public function createMember(Club $club, string $email, string $nfcUid): array
    {
        return DB::transaction(function () use ($club, $email, $nfcUid) {
            $user = User::query()->firstOrCreate(['email' => $email]);

            $alreadyMember = ClubMember::query()
                ->where('club_id', $club->id)
                ->where('user_id', $user->id)
                ->exists();

            if ($alreadyMember) {
                throw ValidationException::withMessages([
                    'email' => ['This user is already a member of this club.'],
                ]);
            }

            $member = ClubMember::query()->create([
                'club_id' => $club->id,
                'user_id' => $user->id,
                'nfc_uid' => $nfcUid,
                'status' => ClubMember::STATUS_ACTIVE,
            ]);

            $wallet = UserWallet::query()->create([
                'club_id' => $club->id,
                'user_id' => $user->id,
                'current_balance' => '0.00',
            ]);

            return [
                'user' => $user,
                'member' => $member,
                'wallet' => $wallet,
            ];
        });
    }

    public function resetPin(ClubMember $member): ClubMember
    {
        $member->update([
            'pin_hash' => null,
            'failed_pin_attempts' => 0,
            'pin_locked_until' => null,
        ]);

        return $member->fresh();
    }

    public function suspend(ClubMember $member): ClubMember
    {
        $member->update(['status' => ClubMember::STATUS_SUSPENDED]);

        return $member->fresh();
    }

    public function revokeCard(ClubMember $member): ClubMember
    {
        $member->update(['nfc_uid' => null]);

        return $member->fresh();
    }

    public function setupPin(ClubMember $member, string $pin): ClubMember
    {
        return DB::transaction(function () use ($member, $pin) {
            $locked = ClubMember::query()
                ->whereKey($member->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (! $locked->requiresPinSetup()) {
                throw new ForbiddenApiException('PIN is already configured for this card.');
            }

            $locked->update([
                'pin_hash' => Hash::make($pin),
                'failed_pin_attempts' => 0,
                'pin_locked_until' => null,
            ]);

            return $locked->fresh();
        });
    }
}
