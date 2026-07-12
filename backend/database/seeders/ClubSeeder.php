<?php

namespace Database\Seeders;

use App\Models\Club;
use App\Models\ClubMember;
use App\Models\Product;
use App\Models\User;
use App\Models\UserWallet;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ClubSeeder extends Seeder
{
    public function run(): void
    {
        $themeConfig = [
            'template_id' => 3,
            'colors' => [
                'primary' => '#D4AF37',
                'secondary' => '#1A1A1A',
                'background' => '#000000',
                'glass_opacity' => 0.6,
            ],
            'typography' => [
                'heading_font' => 'Playfair Display',
                'body_font' => 'Inter',
            ],
            'assets' => [
                'logo_url' => null,
                'cover_url' => null,
            ],
        ];

        $owner = User::create(['email' => 'owner@velvet.club']);
        $member = User::create(['email' => 'member@velvet.club']);

        $club = Club::create([
            'owner_id' => $owner->id,
            'name' => 'The Velvet Room',
            'theme_config' => $themeConfig,
        ]);

        ClubMember::create([
            'club_id' => $club->id,
            'user_id' => $owner->id,
            'nfc_uid' => 'NFC-OWNER-001',
            'pin_hash' => Hash::make('123456'),
            'status' => ClubMember::STATUS_ACTIVE,
        ]);

        ClubMember::create([
            'club_id' => $club->id,
            'user_id' => $member->id,
            'nfc_uid' => 'NFC-MEMBER-001',
            'pin_hash' => null,
            'status' => ClubMember::STATUS_ACTIVE,
        ]);

        UserWallet::create([
            'club_id' => $club->id,
            'user_id' => $owner->id,
            'current_balance' => 100.00,
        ]);

        UserWallet::create([
            'club_id' => $club->id,
            'user_id' => $member->id,
            'current_balance' => 25.00,
        ]);

        Product::create([
            'club_id' => $club->id,
            'name' => 'Premium Cigarette Pack',
            'selling_mode' => Product::MODE_UNIT,
            'price_config' => [
                'step_value' => 1,
                'unit_label' => 'pack',
                'price_per_step' => 20.00,
                'allow_fractions' => false,
            ],
            'is_active' => true,
        ]);

        Product::create([
            'club_id' => $club->id,
            'name' => 'Loose Tobacco',
            'selling_mode' => Product::MODE_WEIGHT,
            'price_config' => [
                'step_value' => 5,
                'unit_label' => 'grams',
                'price_per_step' => 2.50,
                'allow_fractions' => true,
            ],
            'is_active' => true,
        ]);

        Product::create([
            'club_id' => $club->id,
            'name' => 'Custom Request',
            'selling_mode' => Product::MODE_CUSTOM_TEXT,
            'price_config' => [
                'flat_price' => 15.00,
                'unit_label' => 'request',
            ],
            'is_active' => true,
        ]);
    }
}
