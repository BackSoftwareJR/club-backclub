<?php

namespace App\Http\Requests\Admin;

use App\Http\Concerns\ValidatesProductPriceConfig;
use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateProductRequest extends FormRequest
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

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if (! $this->has('price_config')) {
                return;
            }

            $sellingMode = $this->input('selling_mode');

            if (! is_string($sellingMode)) {
                $clubId = (int) $this->route('club_id');
                $productId = (int) $this->route('product_id');

                $product = Product::query()
                    ->where('club_id', $clubId)
                    ->find($productId);

                $sellingMode = $product?->selling_mode;
            }

            if (! is_string($sellingMode)) {
                $validator->errors()->add('price_config', 'Selling mode is required when updating price config.');

                return;
            }

            $nestedRules = $this->priceConfigRules($sellingMode);
            $nestedValidator = validator(
                ['price_config' => $this->input('price_config')],
                $nestedRules,
            );

            if ($nestedValidator->fails()) {
                foreach ($nestedValidator->errors()->messages() as $field => $messages) {
                    foreach ($messages as $message) {
                        $validator->errors()->add($field, $message);
                    }
                }
            }
        });
    }
}
