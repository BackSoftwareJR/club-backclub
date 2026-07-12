<?php

namespace App\Http\Requests\Admin;

use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
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
            'name' => ['sometimes', 'string', 'max:255'],
            'selling_mode' => ['sometimes', Rule::in([
                Product::MODE_UNIT,
                Product::MODE_WEIGHT,
                Product::MODE_VOLUME,
                Product::MODE_CUSTOM_TEXT,
            ])],
            'price_config' => ['sometimes', 'array'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
