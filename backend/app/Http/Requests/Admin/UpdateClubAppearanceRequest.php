<?php

namespace App\Http\Requests\Admin;

use App\Models\Club;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateClubAppearanceRequest extends FormRequest
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
            'template_id' => ['required', 'integer', 'between:1,4'],
            'colors' => ['required', 'array'],
            'colors.primary' => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'colors.secondary' => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'colors.background' => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'typography' => ['required', 'array'],
            'typography.preset' => ['required', Rule::in([
                Club::TYPOGRAPHY_ELEGANT,
                Club::TYPOGRAPHY_MODERN,
            ])],
            'interactions' => ['required', 'array'],
            'interactions.sounds_enabled' => ['required', 'boolean'],
            'interactions.haptics_enabled' => ['required', 'boolean'],
        ];
    }
}
