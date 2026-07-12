<?php

namespace App\Services\Treasury;

use App\Exceptions\InvalidQuantityException;
use App\Models\Product;

class PricingService
{
    public function calculatePrice(Product $product, float $quantity): string
    {
        $price = $this->resolvePrice($product, $quantity);

        return number_format($price, 2, '.', '');
    }

    public function resolvePrice(Product $product, float $quantity): float
    {
        $config = $product->price_config;
        $sellingMode = $product->selling_mode;

        if ($sellingMode === Product::MODE_CUSTOM_TEXT) {
            return (float) $config['flat_price'];
        }

        $step = (float) $config['step_value'];
        $pricePerStep = (float) $config['price_per_step'];
        $allowFractions = (bool) ($config['allow_fractions'] ?? false);

        if (! $allowFractions && fmod($quantity, $step) != 0.0) {
            throw new InvalidQuantityException;
        }

        return ($quantity / $step) * $pricePerStep;
    }
}
