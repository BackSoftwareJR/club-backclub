<?php

namespace App\Http\Requests\Compliance;

use Illuminate\Foundation\Http\FormRequest;

class AcceptLegalTermsRequest extends FormRequest
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
            'terms_version' => ['required', 'string', 'max:32'],
            'identity_declaration' => ['required', 'accepted'],
        ];
    }
}
