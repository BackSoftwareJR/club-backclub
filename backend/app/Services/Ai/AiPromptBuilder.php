<?php

namespace App\Services\Ai;

use App\Models\Product;
use Illuminate\Support\Carbon;

class AiPromptBuilder
{
    /**
     * @param  array<string, mixed>  $context
     * @return array<int, array{role: string, content: string}>
     */
    public function buildCoachMessages(
        array $context,
        Product $product,
        string $intendedCost,
        float $quantity,
        ?string $customNote,
        string $weeklySpend,
    ): array {
        $balance = (string) ($context['balance'] ?? '0.00');
        $unitLabel = $product->price_config['unit_label'] ?? 'unit';

        $personaPrompt = sprintf(
            'You are the Coach of this private club. The user wants to buy %s for €%s (quantity: %s %s). They have already spent €%s this week on similar items. Their current wallet balance is €%s. Remind them of the money they are burning. Be concise, slightly provocative, but elegant. Do not forbid the purchase — create positive friction only.',
            $product->name,
            $intendedCost,
            rtrim(rtrim(number_format($quantity, 2, '.', ''), '0'), '.'),
            $unitLabel,
            $weeklySpend,
            $balance,
        );

        $userIntent = 'The member is about to proceed with this purchase. Provide a brief purchase friction message.';

        if ($customNote !== null && $customNote !== '') {
            $userIntent .= ' Custom request note: '.$customNote;
        }

        return [
            ['role' => 'system', 'content' => $personaPrompt],
            ['role' => 'system', 'content' => $this->formatUserContext($context)],
            ['role' => 'user', 'content' => $userIntent],
        ];
    }

    /**
     * @param  array<string, mixed>  $context
     * @return array<int, array{role: string, content: string}>
     */
    public function buildSommelierMessages(array $context, string $userMessage, ?Product $product = null): array
    {
        if ($product !== null) {
            $personaPrompt = sprintf(
                'You are the Sommelier of this luxury club. The user selected %s. Describe the best way to enjoy it. Suggest pairing it with a specific moment or mood. Your tone must be highly sophisticated, knowledgeable, and aligned with luxury standards.',
                $product->name,
            );
        } else {
            $personaPrompt = 'You are the Sommelier of this luxury club. The user is seeking advice on mindful, high-quality consumption. Elevate the experience — shift focus from compulsive consumption to sophisticated tasting and usage. Your tone must be highly sophisticated, knowledgeable, and aligned with luxury standards.';
        }

        return [
            ['role' => 'system', 'content' => $personaPrompt],
            ['role' => 'system', 'content' => $this->formatUserContext($context)],
            ['role' => 'user', 'content' => $userMessage],
        ];
    }

    /**
     * @param  array<string, mixed>  $context
     */
    private function formatUserContext(array $context): string
    {
        $balance = (string) ($context['balance'] ?? '0.00');
        $purchases = $this->formatRecentPurchases($context['recent_transactions'] ?? []);
        $tone = $this->formatThemeTone($context['theme_config'] ?? []);

        return "USER CONTEXT: Balance: {$balance}. Last Purchases: {$purchases}.{$tone}";
    }

    /**
     * @param  array<string, mixed>  $themeConfig
     */
    private function formatThemeTone(array $themeConfig): string
    {
        if ($themeConfig === []) {
            return '';
        }

        $parts = [];

        $templateId = $themeConfig['template_id'] ?? null;
        if (is_int($templateId) || is_string($templateId)) {
            $parts[] = "template {$templateId}";
        }

        $colors = $themeConfig['colors'] ?? [];
        if (is_array($colors)) {
            if (! empty($colors['primary'])) {
                $parts[] = 'primary accent '.$colors['primary'];
            }
            if (! empty($colors['secondary'])) {
                $parts[] = 'secondary tone '.$colors['secondary'];
            }
        }

        $typography = $themeConfig['typography'] ?? [];
        if (is_array($typography)) {
            if (! empty($typography['heading_font'])) {
                $parts[] = 'heading font '.$typography['heading_font'];
            }
            if (! empty($typography['body_font'])) {
                $parts[] = 'body font '.$typography['body_font'];
            }
        }

        if ($parts === []) {
            return '';
        }

        return ' Club tone: '.implode(', ', $parts).'. Match your voice to this aesthetic.';
    }

    /**
     * @param  array<int, array<string, mixed>>  $transactions
     */
    private function formatRecentPurchases(array $transactions): string
    {
        if ($transactions === []) {
            return 'none';
        }

        $formatted = [];

        foreach ($transactions as $transaction) {
            $metadata = $transaction['metadata'] ?? [];
            $quantity = $metadata['quantity'] ?? null;
            $unitLabel = $metadata['unit_label'] ?? 'item';
            $productName = $transaction['product_name'] ?? null;
            $amount = $transaction['amount_deducted'] ?? '0.00';
            $when = $this->formatRelativeTime($transaction['created_at'] ?? null);

            $label = $productName ?? ($quantity !== null ? "{$quantity} {$unitLabel}" : 'purchase');

            if ($quantity !== null) {
                $formatted[] = sprintf('%s — %s %s (€%s, %s)', $label, $quantity, $unitLabel, $amount, $when);
            } else {
                $formatted[] = sprintf('%s (€%s, %s)', $label, $amount, $when);
            }
        }

        return implode(', ', $formatted);
    }

    private function formatRelativeTime(?string $isoTimestamp): string
    {
        if ($isoTimestamp === null) {
            return 'recently';
        }

        try {
            return Carbon::parse($isoTimestamp)->diffForHumans();
        } catch (\Throwable) {
            return 'recently';
        }
    }
}
