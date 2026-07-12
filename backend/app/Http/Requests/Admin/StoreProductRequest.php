<?php

namespace App\Http\Requests\Admin;

use App\Http\Concerns\ValidatesProductPriceConfig;
use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductRequest extends FormRequest
{
    use ValidatesProductPriceConfig;

    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $sellingMode = $this->input('selling_mode');

        return [
            'name' => ['required', 'string', 'max:255'],
            'selling_mode' => ['required', Rule::in([
                Product::MODE_UNIT,
                Product::MODE_WEIGHT,
                Product::MODE_VOLUME,
                Product::MODE_CUSTOM_TEXT,
            ])],
            'price_config' => ['required', 'array'],
            'is_active' => ['sometimes', 'boolean'],
            ...$this->priceConfigRules(is_string($sellingMode) ? $sellingMode : null),
        ];
    }
}
