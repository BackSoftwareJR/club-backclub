<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdminInjectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $clubId = (int) $this->route('club_id');

        return [
            'user_id' => [
                'required',
                'integer',
                Rule::exists('user_wallets', 'user_id')->where(fn ($query) => $query->where('club_id', $clubId)),
            ],
            'amount' => ['required', 'numeric', 'gt:0', 'regex:/^\d+(\.\d{1,2})?$/'],
            'description' => ['required', 'string', 'max:500'],
        ];
    }
}
