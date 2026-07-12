<?php

namespace App\Http\Controllers\Api;

use App\Http\Concerns\ResolvesJwtContext;
use App\Http\Controllers\Controller;
use App\Http\Requests\Purchase\CreatePurchaseRequest;
use App\Models\Product;
use App\Services\Treasury\PurchaseService;
use Illuminate\Http\JsonResponse;

class PurchaseController extends Controller
{
    use ResolvesJwtContext;

    public function __construct(
        private readonly PurchaseService $purchaseService,
    ) {}

    public function store(CreatePurchaseRequest $request, int $clubId): JsonResponse
    {
        $validated = $request->validated();

        $product = Product::query()
            ->where('club_id', $clubId)
            ->where('is_active', true)
            ->findOrFail($validated['product_id']);

        $result = $this->purchaseService->purchase(
            $this->authUser($request),
            $clubId,
            $product,
            (float) $validated['quantity'],
            $validated['custom_note'] ?? null,
        );

        return response()->json($result);
    }
}
