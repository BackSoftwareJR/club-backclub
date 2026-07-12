<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\TopupRequest */
class TopupRequestResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'amount' => (string) $this->amount,
            'status' => $this->status,
            'admin_note' => $this->admin_note,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
