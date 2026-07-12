<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('club_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('club_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('nfc_uid', 64)->nullable()->unique();
            $table->string('pin_hash')->nullable();
            $table->enum('status', ['active', 'suspended'])->default('active');
            $table->unsignedTinyInteger('failed_pin_attempts')->default(0);
            $table->timestamp('pin_locked_until')->nullable();
            $table->timestamps();

            $table->unique(['club_id', 'user_id']);
            $table->index('club_id');
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('club_members');
    }
};
