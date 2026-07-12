<?php

namespace App\Http\Concerns;

use App\Models\Product;

trait ValidatesProductPriceConfig
{
    /**
     * @return array<string, mixed>
     */
    protected function priceConfigRules(?string $sellingMode): array
    {
        if ($sellingMode === Product::MODE_CUSTOM_TEXT) {
            return [
                'price_config.flat_price' => ['required', 'numeric', 'min:0'],
                'price_config.unit_label' => ['required', 'string', 'max:50'],
            ];
        }

        if (in_array($sellingMode, [
            Product::MODE_UNIT,
            Product::MODE_WEIGHT,
            Product::MODE_VOLUME,
        ], true)) {
            return [
                'price_config.step_value' => ['required', 'numeric', 'gt:0'],
                'price_config.unit_label' => ['required', 'string', 'max:50'],
                'price_config.price_per_step' => ['required', 'numeric', 'min:0'],
                'price_config.allow_fractions' => ['sometimes', 'boolean'],
            ];
        }

        return [];
    }
}
