<?php

namespace App\Http\Controllers\Api;

use App\Http\Concerns\ResolvesJwtContext;
use App\Http\Controllers\Controller;
use App\Http\Requests\Ai\AiChatRequest;
use App\Http\Requests\Ai\AiInterveneRequest;
use App\Models\Club;
use App\Models\Product;
use App\Services\Ai\AiContextBuilder;
use App\Services\Ai\AiPromptBuilder;
use App\Services\Ai\CanopywaveClient;
use App\Services\Ai\CoachTriggerService;
use App\Services\Treasury\PricingService;
use Illuminate\Http\JsonResponse;

class AiController extends Controller
{
    use ResolvesJwtContext;

    public function __construct(
        private readonly CoachTriggerService $coachTriggerService,
        private readonly PricingService $pricingService,
        private readonly AiContextBuilder $aiContextBuilder,
        private readonly AiPromptBuilder $aiPromptBuilder,
        private readonly CanopywaveClient $canopywaveClient,
    ) {}

    public function intervene(AiInterveneRequest $request, int $clubId): JsonResponse
    {
        $validated = $request->validated();
        $user = $this->authUser($request);

        if (! $this->coachTriggerService->shouldIntervene($user, $clubId)) {
            return response()->json(['intervention_required' => false]);
        }

        $product = Product::query()
            ->where('club_id', $clubId)
            ->where('is_active', true)
            ->findOrFail($validated['product_id']);

        $intendedCost = $this->pricingService->calculatePrice($product, (float) $validated['quantity']);
        $club = Club::query()->findOrFail($clubId);
        $context = $this->aiContextBuilder->build($user, $club);
        $weeklySpend = $this->coachTriggerService->getWeeklySpend($user, $clubId);

        $messages = $this->aiPromptBuilder->buildCoachMessages(
            $context,
            $product,
            $intendedCost,
            (float) $validated['quantity'],
            $validated['custom_note'] ?? null,
            $weeklySpend,
        );

        $message = $this->canopywaveClient->chat($messages);

        if ($message === null) {
            return response()->json(['intervention_required' => false]);
        }

        return response()->json([
            'intervention_required' => true,
            'message' => $message,
            'persona' => 'coach',
        ]);
    }

    public function chat(AiChatRequest $request, int $clubId): JsonResponse
    {
        $validated = $request->validated();
        $user = $this->authUser($request);
        $club = Club::query()->findOrFail($clubId);
        $context = $this->aiContextBuilder->build($user, $club);

        $product = null;

        if (! empty($validated['product_id'])) {
            $product = Product::query()
                ->where('club_id', $clubId)
                ->find($validated['product_id']);
        }

        $messages = $this->aiPromptBuilder->buildSommelierMessages(
            $context,
            $validated['message'],
            $product,
        );

        $message = $this->canopywaveClient->chat($messages);

        if ($message === null) {
            return response()->json([
                'message' => '',
                'persona' => 'sommelier',
            ]);
        }

        return response()->json([
            'message' => $message,
            'persona' => 'sommelier',
        ]);
    }
}
