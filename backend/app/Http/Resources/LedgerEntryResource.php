<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\ClubLedger */
class LedgerEntryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'transaction_type' => $this->transaction_type,
            'amount' => (string) $this->amount,
            'description' => $this->description,
            'handled_by' => $this->handled_by,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
