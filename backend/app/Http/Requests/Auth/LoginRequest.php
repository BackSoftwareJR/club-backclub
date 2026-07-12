<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
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
        return [
            'club_id' => ['required', 'integer', 'exists:clubs,id'],
            'nfc_uid' => ['required', 'string', 'max:64'],
            'pin' => ['required', 'string', 'regex:/^\d{6}$/'],
        ];
    }
}
