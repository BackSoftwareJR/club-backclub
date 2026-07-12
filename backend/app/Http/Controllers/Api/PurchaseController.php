<?php

namespace App\Http\Controllers\Api;

use App\Http\Concerns\ResolvesJwtContext;
use App\Http\Controllers\Controller;
use App\Http\Requests\Purchase\CreatePurchaseRequest;
use App\Models\Product;
use App\Services\Compliance\ActivityLogService;
use App\Services\Treasury\PurchaseService;
use Illuminate\Http\JsonResponse;

class PurchaseController extends Controller
{
    use ResolvesJwtContext;

    public function __construct(
        private readonly PurchaseService $purchaseService,
        private readonly ActivityLogService $activityLogService,
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

        $member = \App\Models\ClubMember::query()
            ->where('club_id', $clubId)
            ->where('user_id', $this->authUser($request)->id)
            ->first();

        if ($member !== null) {
            $this->activityLogService->record(
                eventType: 'purchase',
                member: $member,
                request: $request,
                metadata: [
                    'product_id' => $product->id,
                    'quantity' => $validated['quantity'],
                    'total' => $result['total'] ?? null,
                ],
            );
        }

        return response()->json($result);
    }
}
