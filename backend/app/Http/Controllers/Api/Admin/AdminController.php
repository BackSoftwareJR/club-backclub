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
use App\Models\WalletTransaction;
use App\Models\UserWallet;
use App\Services\Compliance\ActivityLogService;
use Carbon\CarbonImmutable;
use App\Services\Treasury\MemberService;
use App\Services\Treasury\TopupService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    use ResolvesJwtContext;

    public function __construct(
        private readonly TopupService $topupService,
        private readonly MemberService $memberService,
        private readonly ActivityLogService $activityLogService,
    ) {}

    public function treasury(int $clubId): JsonResponse
    {
        $cashFlowTotal = number_format(
            (float) ClubLedger::query()->where('club_id', $clubId)->sum('amount'),
            2,
            '.',
            '',
        );

        $ledger = ClubLedger::query()
            ->where('club_id', $clubId)
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'cash_flow_total' => $cashFlowTotal,
            'ledger' => LedgerEntryResource::collection($ledger),
        ]);
    }

    public function analytics(int $clubId): JsonResponse
    {
        $today = CarbonImmutable::today();
        $startDate = $today->subDays(29);
        $baselineBeforeWindow = (float) ClubLedger::query()
            ->where('club_id', $clubId)
            ->where('created_at', '<', $startDate)
            ->sum('amount');

        /** @var Collection<int, object{day: string, amount: string}> $dailyLedgerRaw */
        $dailyLedgerRaw = ClubLedger::query()
            ->selectRaw('DATE(created_at) as day, SUM(amount) as amount')
            ->where('club_id', $clubId)
            ->whereBetween('created_at', [$startDate, $today->endOfDay()])
            ->groupBy('day')
            ->orderBy('day')
            ->get();

        $ledgerByDay = $dailyLedgerRaw->keyBy('day');
        $runningTotal = $baselineBeforeWindow;
        $cassaTrend = [];

        foreach (range(0, 29) as $index) {
            $date = $startDate->addDays($index);
            $dayKey = $date->toDateString();
            $dailyAmount = (float) ($ledgerByDay->get($dayKey)->amount ?? 0);
            $runningTotal += $dailyAmount;
            $cassaTrend[] = [
                'date' => $dayKey,
                'daily_delta' => number_format($dailyAmount, 2, '.', ''),
                'cumulative_total' => number_format($runningTotal, 2, '.', ''),
            ];
        }

        $topConsumedProducts = WalletTransaction::query()
            ->join('user_wallets', 'user_wallets.id', '=', 'wallet_transactions.wallet_id')
            ->join('products', 'products.id', '=', 'wallet_transactions.product_id')
            ->where('user_wallets.club_id', $clubId)
            ->groupBy('products.id', 'products.name')
            ->orderByRaw('COUNT(wallet_transactions.id) DESC')
            ->limit(5)
            ->get([
                'products.id as product_id',
                'products.name as product_name',
                DB::raw('COUNT(wallet_transactions.id) as purchases_count'),
                DB::raw('SUM(wallet_transactions.amount_deducted) as total_spent'),
            ])
            ->map(fn (object $row): array => [
                'product_id' => (int) $row->product_id,
                'product_name' => (string) $row->product_name,
                'purchases_count' => (int) $row->purchases_count,
                'total_spent' => number_format((float) $row->total_spent, 2, '.', ''),
            ])
            ->values();

        $memberBase = ClubMember::query()->where('club_id', $clubId);
        $totalMembers = (int) $memberBase->count();
        $membersWithWallet = UserWallet::query()
            ->where('club_id', $clubId)
            ->where('current_balance', '<=', 10)
            ->count();

        $spenderAggregate = WalletTransaction::query()
            ->join('user_wallets', 'user_wallets.id', '=', 'wallet_transactions.wallet_id')
            ->join('users', 'users.id', '=', 'user_wallets.user_id')
            ->where('user_wallets.club_id', $clubId)
            ->selectRaw('users.email as email, SUM(wallet_transactions.amount_deducted) as total_spent')
            ->groupBy('users.email')
            ->orderByDesc('total_spent')
            ->first();

        $transactionsCount = (int) WalletTransaction::query()
            ->join('user_wallets', 'user_wallets.id', '=', 'wallet_transactions.wallet_id')
            ->where('user_wallets.club_id', $clubId)
            ->count();

        $uniquePurchasers = (int) WalletTransaction::query()
            ->join('user_wallets', 'user_wallets.id', '=', 'wallet_transactions.wallet_id')
            ->where('user_wallets.club_id', $clubId)
            ->distinct('user_wallets.user_id')
            ->count('user_wallets.user_id');

        return response()->json([
            'cassa_trend' => $cassaTrend,
            'top_consumed_products' => $topConsumedProducts,
            'member_vice_stats' => [
                'total_members' => $totalMembers,
                'active_spenders' => $uniquePurchasers,
                'low_balance_members' => (int) $membersWithWallet,
                'total_purchases' => $transactionsCount,
                'top_spender_email' => (string) ($spenderAggregate->email ?? 'N/A'),
                'top_spender_total' => number_format((float) ($spenderAggregate->total_spent ?? 0), 2, '.', ''),
            ],
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

        $member = ClubMember::query()
            ->where('club_id', $clubId)
            ->where('user_id', (int) $validated['user_id'])
            ->first();

        if ($member !== null) {
            $this->activityLogService->record(
                eventType: 'admin_injection',
                member: $member,
                request: $request,
                metadata: ['amount' => $amount, 'ledger_id' => $result['ledger']->id],
            );
        }

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

        $this->activityLogService->record(
            eventType: 'member_created',
            member: $result['member'],
            request: $request,
            metadata: ['email' => $validated['email'], 'nfc_uid' => $validated['nfc_uid']],
        );

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

    public function listProducts(int $clubId): JsonResponse
    {
        $products = Product::query()
            ->with('galleryMedia')
            ->where('club_id', $clubId)
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => ProductResource::collection($products),
        ]);
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

        return response()->json(new ProductResource($product->load('galleryMedia')), 201);
    }

    public function updateProduct(UpdateProductRequest $request, int $clubId, int $productId): JsonResponse
    {
        $product = Product::query()
            ->where('club_id', $clubId)
            ->findOrFail($productId);

        $product->update($request->validated());

        return response()->json(new ProductResource($product->fresh()->load('galleryMedia')));
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
