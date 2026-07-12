<?php

namespace App\Http\Requests\Admin;

use App\Rules\GamePlayEmail;
use Illuminate\Foundation\Http\FormRequest;

class CreateMemberRequest extends FormRequest
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
            'email' => ['required', 'email', 'max:255', new GamePlayEmail()],
            'nfc_uid' => ['required', 'string', 'max:64', 'unique:club_members,nfc_uid'],
        ];
    }
}
