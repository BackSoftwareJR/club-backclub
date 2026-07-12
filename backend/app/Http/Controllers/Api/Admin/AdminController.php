<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Concerns\ResolvesJwtContext;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AdminExpenseRequest;
use App\Http\Requests\Admin\AdminInjectionRequest;
use App\Http\Requests\Admin\CreateMemberRequest;
use App\Http\Requests\Admin\RejectTopupRequest;
use App\Http\Requests\Admin\StoreProductRequest;
use App\Http\Requests\Admin\UpdateProductRequest;
use App\Http\Resources\LedgerEntryResource;
use App\Http\Resources\MemberResource;
use App\Http\Resources\ProductResource;
use App\Http\Resources\TopupRequestResource;
use App\Models\Club;
use App\Models\ClubLedger;
use App\Models\ClubMember;
use App\Models\Product;
use App\Models\TopupRequest;
use App\Models\UserWallet;
use App\Services\Treasury\MemberService;
use App\Services\Treasury\TopupService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    use ResolvesJwtContext;

    public function __construct(
        private readonly TopupService $topupService,
        private readonly MemberService $memberService,
    ) {}

    public function treasury(int $clubId): JsonResponse
    {
        $ledger = ClubLedger::query()
            ->where('club_id', $clubId)
            ->orderByDesc('created_at')
            ->get();

        $cashFlowTotal = $ledger->reduce(
            fn (string $carry, ClubLedger $entry) => bcadd($carry, (string) $entry->amount, 2),
            '0.00',
        );

        return response()->json([
            'cash_flow_total' => $cashFlowTotal,
            'ledger' => LedgerEntryResource::collection($ledger),
        ]);
    }

    public function listTopupRequests(Request $request, int $clubId): JsonResponse
    {
        $query = TopupRequest::query()->where('club_id', $clubId);

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        $requests = $query->orderByDesc('created_at')->paginate(20);

        return TopupRequestResource::collection($requests)->response();
    }

    public function approveTopupRequest(int $clubId, int $id): JsonResponse
    {
        $topupRequest = $this->resolveTopupRequest($clubId, $id);
        $approved = $this->topupService->approve($topupRequest, $this->authUser(request()));

        return response()->json(new TopupRequestResource($approved));
    }

    public function rejectTopupRequest(RejectTopupRequest $request, int $clubId, int $id): JsonResponse
    {
        $topupRequest = $this->resolveTopupRequest($clubId, $id);
        $rejected = $this->topupService->reject(
            $topupRequest,
            $this->authUser($request),
            $request->validated('admin_note'),
        );

        return response()->json(new TopupRequestResource($rejected));
    }

    public function adminInjection(AdminInjectionRequest $request, int $clubId): JsonResponse
    {
        $validated = $request->validated();
        $amount = number_format((float) $validated['amount'], 2, '.', '');

        $result = $this->topupService->adminInjection(
            $clubId,
            (int) $validated['user_id'],
            $amount,
            $validated['description'],
            $this->authUser($request),
        );

        return response()->json([
            'user_id' => $result['wallet']->user_id,
            'new_balance' => (string) $result['wallet']->current_balance,
            'ledger_id' => $result['ledger']->id,
        ], 201);
    }

    public function recordExpense(AdminExpenseRequest $request, int $clubId): JsonResponse
    {
        $validated = $request->validated();
        $amount = number_format((float) $validated['amount'], 2, '.', '');

        $ledger = $this->topupService->recordExpense(
            $clubId,
            $amount,
            $validated['description'],
            $this->authUser($request),
        );

        return response()->json(new LedgerEntryResource($ledger), 201);
    }

    public function listMembers(int $clubId): JsonResponse
    {
        $members = ClubMember::query()
            ->with('user')
            ->where('club_id', $clubId)
            ->orderBy('id')
            ->get()
            ->map(function (ClubMember $member) use ($clubId) {
                $wallet = UserWallet::query()
                    ->where('club_id', $clubId)
                    ->where('user_id', $member->user_id)
                    ->first();

                $member->wallet_balance = $wallet?->current_balance ?? '0.00';

                return $member;
            });

        return response()->json([
            'data' => MemberResource::collection($members),
        ]);
    }

    public function createMember(CreateMemberRequest $request, int $clubId): JsonResponse
    {
        $validated = $request->validated();
        $club = Club::query()->findOrFail($clubId);

        $result = $this->memberService->createMember(
            $club,
            $validated['email'],
            $validated['nfc_uid'],
        );

        $result['member']->load('user');
        $result['member']->wallet_balance = $result['wallet']->current_balance;

        return response()->json(new MemberResource($result['member']), 201);
    }

    public function resetPin(int $clubId, int $memberId): JsonResponse
    {
        $member = $this->resolveMember($clubId, $memberId);
        $updated = $this->memberService->resetPin($member);
        $updated->load('user');

        return response()->json(new MemberResource($updated));
    }

    public function suspend(int $clubId, int $memberId): JsonResponse
    {
        $member = $this->resolveMember($clubId, $memberId);
        $updated = $this->memberService->suspend($member);
        $updated->load('user');

        return response()->json(new MemberResource($updated));
    }

    public function revokeCard(int $clubId, int $memberId): JsonResponse
    {
        $member = $this->resolveMember($clubId, $memberId);
        $updated = $this->memberService->revokeCard($member);
        $updated->load('user');

        return response()->json(new MemberResource($updated));
    }

    public function storeProduct(StoreProductRequest $request, int $clubId): JsonResponse
    {
        $validated = $request->validated();

        $product = Product::query()->create([
            'club_id' => $clubId,
            'name' => $validated['name'],
            'selling_mode' => $validated['selling_mode'],
            'price_config' => $validated['price_config'],
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json(new ProductResource($product), 201);
    }

    public function updateProduct(UpdateProductRequest $request, int $clubId, int $productId): JsonResponse
    {
        $product = Product::query()
            ->where('club_id', $clubId)
            ->findOrFail($productId);

        $product->update($request->validated());

        return response()->json(new ProductResource($product->fresh()));
    }

    public function destroyProduct(int $clubId, int $productId): JsonResponse
    {
        $product = Product::query()
            ->where('club_id', $clubId)
            ->findOrFail($productId);

        $product->update(['is_active' => false]);

        return response()->json(['message' => 'Product deactivated.']);
    }

    private function resolveTopupRequest(int $clubId, int $id): TopupRequest
    {
        return TopupRequest::query()
            ->where('club_id', $clubId)
            ->findOrFail($id);
    }

    private function resolveMember(int $clubId, int $memberId): ClubMember
    {
        return ClubMember::query()
            ->where('club_id', $clubId)
            ->findOrFail($memberId);
    }
}
