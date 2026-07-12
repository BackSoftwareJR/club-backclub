<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('club_ledger', function (Blueprint $table) {
            $table->id();
            $table->foreignId('club_id')->constrained()->cascadeOnDelete();
            $table->enum('transaction_type', ['user_topup', 'admin_injection', 'admin_expense']);
            $table->decimal('amount', 10, 2);
            $table->text('description');
            $table->foreignId('handled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['club_id', 'created_at']);
            $table->index('handled_by');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('club_ledger');
    }
};
