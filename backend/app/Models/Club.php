<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Club extends Model
{
    public const TYPOGRAPHY_ELEGANT = 'elegant_serif';

    public const TYPOGRAPHY_MODERN = 'modern_sans';

    protected $fillable = [
        'owner_id',
        'name',
        'theme_config',
        'logo_image_path',
        'hero_image_path',
    ];

    protected function casts(): array
    {
        return [
            'theme_config' => 'array',
        ];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function members(): HasMany
    {
        return $this->hasMany(ClubMember::class);
    }

    public function wallets(): HasMany
    {
        return $this->hasMany(UserWallet::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function topupRequests(): HasMany
    {
        return $this->hasMany(TopupRequest::class);
    }

    public function ledgerEntries(): HasMany
    {
        return $this->hasMany(ClubLedger::class);
    }

    public function logoImageUrl(): ?string
    {
        if ($this->logo_image_path) {
            return Storage::disk('public')->url($this->logo_image_path);
        }

        $logoFromTheme = data_get($this->theme_config, 'assets.logo_url');

        return is_string($logoFromTheme) && $logoFromTheme !== '' ? $logoFromTheme : null;
    }

    public function heroImageUrl(): ?string
    {
        if ($this->hero_image_path) {
            return Storage::disk('public')->url($this->hero_image_path);
        }

        $coverFromTheme = data_get($this->theme_config, 'assets.cover_url');

        return is_string($coverFromTheme) && $coverFromTheme !== '' ? $coverFromTheme : null;
    }

    /**
     * @return array<string, mixed>
     */
    public function resolvedThemeConfig(): array
    {
        $themeConfig = is_array($this->theme_config) ? $this->theme_config : [];
        $themeConfig = array_replace_recursive(self::defaultThemeConfig(), $themeConfig);
        $assets = is_array($themeConfig['assets'] ?? null) ? $themeConfig['assets'] : [];

        $assets['logo_url'] = $this->logoImageUrl();
        $assets['cover_url'] = $this->heroImageUrl();
        $themeConfig['assets'] = $assets;
        $themeConfig['template_id'] = (int) $themeConfig['template_id'];
        $themeConfig['colors']['glass_opacity'] = max(0.1, min(0.95, (float) $themeConfig['colors']['glass_opacity']));

        return $themeConfig;
    }

    /**
     * @return array<string, mixed>
     */
    public static function defaultThemeConfig(): array
    {
        return [
            'template_id' => 3,
            'colors' => [
                'primary' => '#D4AF37',
                'secondary' => '#1A1A1A',
                'background' => '#000000',
                'glass_opacity' => 0.6,
            ],
            'typography' => self::typographyPreset(self::TYPOGRAPHY_ELEGANT),
            'interactions' => [
                'sounds_enabled' => true,
                'haptics_enabled' => true,
            ],
            'assets' => [
                'logo_url' => null,
                'cover_url' => null,
            ],
        ];
    }

    /**
     * @return array{preset: string, heading_font: string, body_font: string}
     */
    public static function typographyPreset(string $preset): array
    {
        return match ($preset) {
            self::TYPOGRAPHY_MODERN => [
                'preset' => self::TYPOGRAPHY_MODERN,
                'heading_font' => "Inter, 'Helvetica Neue', Arial, sans-serif",
                'body_font' => "Inter, 'Helvetica Neue', Arial, sans-serif",
            ],
            default => [
                'preset' => self::TYPOGRAPHY_ELEGANT,
                'heading_font' => "'Playfair Display', 'Times New Roman', Times, serif",
                'body_font' => "'Cormorant Garamond', Georgia, 'Times New Roman', serif",
            ],
        };
    }
}
