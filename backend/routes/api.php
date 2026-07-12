<?php

use App\Http\Controllers\Api\Admin\AdminController;
use App\Http\Controllers\Api\Admin\AdminMediaController;
use App\Http\Controllers\Api\AiController;
use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\Compliance\LegalController;
use App\Http\Controllers\Api\MediaController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\PurchaseController;
use App\Http\Controllers\Api\Security\SecurityController;
use App\Http\Controllers\Api\User\UserClubController;
use App\Http\Controllers\Api\WalletController;
use Illuminate\Support\Facades\Route;

Route::get('/legal/terms', [LegalController::class, 'show']);
Route::get('/media/{path}', [MediaController::class, 'show'])->where('path', '.*');
Route::post('/security/direct-access', [SecurityController::class, 'reportDirectAccess'])
    ->middleware('throttle:6,1');

Route::middleware(['ghost.security', 'throttle:entry'])->group(function () {
    Route::get('/entry/{club_id}/{nfc_uid}', [AuthController::class, 'entry']);
    Route::post('/legal/accept', [LegalController::class, 'accept']);
    Route::post('/auth/pin-setup', [AuthController::class, 'pinSetup']);
    Route::post('/auth/login', [AuthController::class, 'login']);
});

Route::middleware(['jwt.auth'])->group(function () {
    Route::get('/me/clubs', [UserClubController::class, 'index']);
    Route::post('/me/clubs', [UserClubController::class, 'store']);
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
        Route::get('/analytics', [AdminController::class, 'analytics']);
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
        Route::post('/products/{product_id}/cover', [AdminMediaController::class, 'uploadProductCover']);
        Route::delete('/products/{product_id}/cover', [AdminMediaController::class, 'deleteProductCover']);
        Route::post('/products/{product_id}/gallery', [AdminMediaController::class, 'uploadProductGalleryImage']);
        Route::delete('/products/{product_id}/gallery/{media_id}', [AdminMediaController::class, 'deleteProductGalleryImage']);
        Route::patch('/products/{product_id}/gallery/reorder', [AdminMediaController::class, 'reorderProductGallery']);

        Route::get('/identity', [AdminMediaController::class, 'showClubIdentity']);
        Route::patch('/appearance', [AdminMediaController::class, 'updateClubAppearance']);
        Route::post('/identity/logo', [AdminMediaController::class, 'uploadClubLogo']);
        Route::delete('/identity/logo', [AdminMediaController::class, 'deleteClubLogo']);
        Route::post('/identity/hero', [AdminMediaController::class, 'uploadClubHero']);
        Route::delete('/identity/hero', [AdminMediaController::class, 'deleteClubHero']);

        Route::get('/activity-logs', [LegalController::class, 'activityLogs']);
        Route::get('/security-radar', [SecurityController::class, 'radar']);
    });
});
