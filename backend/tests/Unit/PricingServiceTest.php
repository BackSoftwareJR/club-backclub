<?php

namespace Tests\Unit;

use App\Exceptions\InvalidQuantityException;
use App\Models\Product;
use App\Services\Treasury\PricingService;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class PricingServiceTest extends TestCase
{
    private PricingService $pricingService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->pricingService = new PricingService;
    }

    #[Test]
    public function it_calculates_pro_rata_price_when_fractions_allowed(): void
    {
        $product = new Product([
            'selling_mode' => Product::MODE_WEIGHT,
            'price_config' => [
                'step_value' => 5,
                'unit_label' => 'grams',
                'price_per_step' => 2.50,
                'allow_fractions' => true,
            ],
        ]);

        $this->assertSame('3.50', $this->pricingService->calculatePrice($product, 7));
    }

    #[Test]
    public function it_rejects_non_multiple_quantities_when_fractions_disallowed(): void
    {
        $product = new Product([
            'selling_mode' => Product::MODE_UNIT,
            'price_config' => [
                'step_value' => 1,
                'unit_label' => 'pack',
                'price_per_step' => 20.00,
                'allow_fractions' => false,
            ],
        ]);

        $this->expectException(InvalidQuantityException::class);
        $this->pricingService->calculatePrice($product, 1.5);
    }
}
