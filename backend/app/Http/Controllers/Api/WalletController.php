<?php

namespace App\Http\Controllers\Api;

use App\Http\Concerns\ResolvesJwtContext;
use App\Http\Controllers\Controller;
use App\Http\Requests\Wallet\CreateTopupRequest;
use App\Http\Resources\TopupRequestResource;
use App\Models\TopupRequest;
use App\Models\UserWallet;
use App\Services\Treasury\TopupService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WalletController extends Controller
{
    use ResolvesJwtContext;

    public function __construct(
        private readonly TopupService $topupService,
    ) {}

    public function show(Request $request, int $clubId): JsonResponse
    {
        $wallet = UserWallet::query()
            ->where('club_id', $clubId)
            ->where('user_id', $this->authUser($request)->id)
            ->firstOrFail();

        return response()->json([
            'current_balance' => (string) $wallet->current_balance,
            'club_id' => $wallet->club_id,
        ]);
    }

    public function createTopupRequest(CreateTopupRequest $request, int $clubId): JsonResponse
    {
        $amount = number_format((float) $request->validated('amount'), 2, '.', '');

        $topupRequest = $this->topupService->createRequest(
            $this->authUser($request),
            $clubId,
            $amount,
        );

        return response()->json(new TopupRequestResource($topupRequest), 201);
    }

    public function listTopupRequests(Request $request, int $clubId): JsonResponse
    {
        $requests = TopupRequest::query()
            ->where('club_id', $clubId)
            ->where('user_id', $this->authUser($request)->id)
            ->orderByDesc('created_at')
            ->paginate(20);

        return TopupRequestResource::collection($requests)->response();
    }
}
