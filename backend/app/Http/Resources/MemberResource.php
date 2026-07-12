<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\ClubMember */
class MemberResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'email' => $this->whenLoaded('user', fn () => $this->user->email),
            'nfc_uid' => $this->nfc_uid,
            'status' => $this->status,
            'requires_pin_setup' => $this->requiresPinSetup(),
            'wallet_balance' => $this->when(
                isset($this->wallet_balance),
                fn () => (string) $this->wallet_balance,
            ),
        ];
    }
}
