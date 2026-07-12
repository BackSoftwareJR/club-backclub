<?php

use App\Http\Controllers\Api\Admin\AdminController;
use App\Http\Controllers\Api\AiController;
use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\PurchaseController;
use App\Http\Controllers\Api\WalletController;
use Illuminate\Support\Facades\Route;

Route::middleware(['throttle:entry', 'ip.auth.block'])->group(function () {
    Route::get('/entry/{club_id}/{nfc_uid}', [AuthController::class, 'entry']);
    Route::post('/auth/pin-setup', [AuthController::class, 'pinSetup']);
    Route::post('/auth/login', [AuthController::class, 'login']);
});

Route::middleware(['jwt.auth', 'club.member.active'])->group(function () {
    Route::prefix('clubs/{club_id}')->middleware('club.scope')->group(function () {
        Route::get('/wallet', [WalletController::class, 'show']);
        Route::post('/wallet/topup-requests', [WalletController::class, 'createTopupRequest']);
        Route::get('/wallet/topup-requests', [WalletController::class, 'listTopupRequests']);

        Route::get('/products', [ProductController::class, 'index']);
        Route::post('/purchases', [PurchaseController::class, 'store']);

        Route::post('/ai/intervene', [AiController::class, 'intervene']);
        Route::post('/ai/chat', [AiController::class, 'chat']);
    });
});

Route::middleware(['jwt.auth', 'club.member.active', 'club.admin'])->group(function () {
    Route::prefix('clubs/{club_id}/admin')->middleware('club.scope')->group(function () {
        Route::get('/treasury', [AdminController::class, 'treasury']);
        Route::get('/topup-requests', [AdminController::class, 'listTopupRequests']);
        Route::post('/topup-requests/{id}/approve', [AdminController::class, 'approveTopupRequest']);
        Route::post('/topup-requests/{id}/reject', [AdminController::class, 'rejectTopupRequest']);
        Route::post('/treasury/injection', [AdminController::class, 'adminInjection']);
        Route::post('/treasury/expense', [AdminController::class, 'recordExpense']);

        Route::get('/members', [AdminController::class, 'listMembers']);
        Route::post('/members', [AdminController::class, 'createMember']);
        Route::patch('/members/{member_id}/reset-pin', [AdminController::class, 'resetPin']);
        Route::patch('/members/{member_id}/suspend', [AdminController::class, 'suspend']);
        Route::patch('/members/{member_id}/revoke-card', [AdminController::class, 'revokeCard']);

        Route::get('/products', [AdminController::class, 'listProducts']);
        Route::post('/products', [AdminController::class, 'storeProduct']);
        Route::patch('/products/{product_id}', [AdminController::class, 'updateProduct']);
        Route::delete('/products/{product_id}', [AdminController::class, 'destroyProduct']);
    });
});
