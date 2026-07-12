<?php

namespace App\Services\Club;

use App\Models\Club;
use App\Models\ClubMember;
use App\Models\User;
use App\Models\UserWallet;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ClubService
{
    /**
     * @return array<int, array<string, mixed>>
     */
    public function listClubsForUser(User $user, int $currentClubId): array
    {
        return $user->clubMemberships()
            ->with('club')
            ->orderBy('club_id')
            ->get()
            ->map(function (ClubMember $membership) use ($user, $currentClubId): array {
                $club = $membership->club;

                return [
                    'id' => $club->id,
                    'name' => $club->name,
                    'is_owner' => $user->ownsClub($club),
                    'is_current' => $club->id === $currentClubId,
                    'member_status' => $membership->status,
                    'nfc_uid' => $membership->nfc_uid,
                    'requires_pin_setup' => $membership->requiresPinSetup(),
                    'theme_config' => $club->resolvedThemeConfig(),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return array{club: Club, member: ClubMember, wallet: UserWallet, nfc_uid: string}
     */
    public function createClubForOwner(User $user, string $name): array
    {
        $trimmedName = trim($name);

        if ($trimmedName === '') {
            throw ValidationException::withMessages([
                'name' => ['Club name is required.'],
            ]);
        }

        return DB::transaction(function () use ($user, $trimmedName) {
            $club = Club::query()->create([
                'owner_id' => $user->id,
                'name' => $trimmedName,
                'theme_config' => Club::defaultThemeConfig(),
            ]);

            $member = ClubMember::query()->create([
                'club_id' => $club->id,
                'user_id' => $user->id,
                'nfc_uid' => $this->generateUniqueNfcUid(),
                'status' => ClubMember::STATUS_ACTIVE,
            ]);

            $wallet = UserWallet::query()->create([
                'club_id' => $club->id,
                'user_id' => $user->id,
                'current_balance' => '0.00',
            ]);

            return [
                'club' => $club->fresh(),
                'member' => $member->fresh(),
                'wallet' => $wallet,
                'nfc_uid' => (string) $member->nfc_uid,
            ];
        });
    }

    private function generateUniqueNfcUid(): string
    {
        for ($attempt = 0; $attempt < 10; $attempt++) {
            $nfcUid = 'NFC-'.strtoupper(bin2hex(random_bytes(6)));

            if (! ClubMember::query()->where('nfc_uid', $nfcUid)->exists()) {
                return $nfcUid;
            }
        }

        throw ValidationException::withMessages([
            'name' => ['Unable to generate a unique NFC UID. Please try again.'],
        ]);
    }
}
