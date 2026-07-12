<?php

namespace App\Services\Compliance;

use App\Models\ClubMember;
use App\Models\LegalAcceptance;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class LegalTermsService
{
    public function currentVersion(): string
    {
        return (string) config('legal.version');
    }

    /**
     * @return array<string, mixed>
     */
    public function payload(): array
    {
        return [
            'version' => $this->currentVersion(),
            'effective_date' => config('legal.effective_date'),
            'title' => config('legal.title'),
            'summary' => config('legal.summary'),
            'disclaimer' => config('legal.disclaimer'),
            'sections' => config('legal.sections', []),
        ];
    }

    public function hasAccepted(User $user, int $clubId, ?string $version = null): bool
    {
        $version ??= $this->currentVersion();

        return LegalAcceptance::query()
            ->where('user_id', $user->id)
            ->where('club_id', $clubId)
            ->where('terms_version', $version)
            ->exists();
    }

    public function requiresAcceptance(ClubMember $member): bool
    {
        return ! $this->hasAccepted($member->user, $member->club_id);
    }

    public function accept(User $user, int $clubId, Request $request, ?string $version = null): LegalAcceptance
    {
        $version ??= $this->currentVersion();

        return LegalAcceptance::query()->updateOrCreate(
            [
                'user_id' => $user->id,
                'club_id' => $clubId,
                'terms_version' => $version,
            ],
            [
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'accepted_at' => Carbon::now(),
            ],
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function identityDeclarationMetadata(?string $context = null): array
    {
        $metadata = [
            'declared_identity' => (string) config('legal.owner_identity_name', 'Julian Rovera'),
            'identity_declaration_recorded' => true,
        ];

        if ($context !== null) {
            $metadata['context'] = $context;
        }

        return $metadata;
    }
}
