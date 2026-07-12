<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('cover_image_path')->nullable()->after('is_active');
        });

        Schema::table('clubs', function (Blueprint $table) {
            $table->string('logo_image_path')->nullable()->after('theme_config');
            $table->string('hero_image_path')->nullable()->after('logo_image_path');
        });
    }

    public function down(): void
    {
        Schema::table('clubs', function (Blueprint $table) {
            $table->dropColumn(['logo_image_path', 'hero_image_path']);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('cover_image_path');
        });
    }
};
