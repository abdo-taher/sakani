<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\LocationController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\AmenityController;
use App\Http\Controllers\Api\PropertyController;
use App\Http\Controllers\Api\PropertyImageController;
use App\Http\Controllers\Api\VideoUploadController;
use App\Http\Controllers\Api\EnhancedVideoUploadController;
use App\Http\Controllers\Api\ReservationController;
use App\Http\Controllers\Api\NeedRequestController;
use App\Http\Controllers\Api\ConfigController;
use App\Http\Controllers\Api\ContactMessageController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\FavoriteController;
use App\Http\Controllers\PropertyTypeController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\StatisticsController;
use App\Http\Controllers\Api\CloudinaryController;
use App\Http\Controllers\Api\MarketingMailController;
use App\Http\Controllers\Api\NotificationController;

// Health check and configuration - No auth required
Route::get('/health', [ConfigController::class, 'health']);
Route::get('/config', [ConfigController::class, 'getConfig']);

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

Route::post('/login', [AuthController::class, 'login']);
Route::post('/login-status', [AuthController::class, 'loginStatus']);
Route::post('/contact-messages', [ContactMessageController::class, 'store']);
Route::post('/reservations', [ReservationController::class, 'store']);
Route::post('/reservations/check', [ReservationController::class, 'check']);
Route::get('/properties', [PropertyController::class, 'index']);
Route::get('/properties/top-viewed', [PropertyController::class, 'topViewed']);
Route::post('/properties/{property}/view', [PropertyController::class, 'recordView']);
Route::get('/properties/{property}', [PropertyController::class, 'show']);
Route::get('/properties/category/{category}', [PropertyController::class, 'byCategory']);
Route::post('/need-requests', [NeedRequestController::class, 'store']);

// Public favorite routes (for guest users using local storage)
Route::prefix('favorites')->group(function () {
    Route::post('/sync', [FavoriteController::class, 'syncGuestFavorites'])->middleware('auth:sanctum')->name('favorites.sync');
});
/*
|--------------------------------------------------------------------------
| Protected Routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::apiResource('locations', LocationController::class);
    Route::apiResource('categories', CategoryController::class);
    Route::apiResource('amenities', AmenityController::class);
    Route::post('/properties', [PropertyController::class, 'store']);
Route::put('/properties/{property}', [PropertyController::class, 'update']);
Route::delete('/properties/{property}', [PropertyController::class, 'destroy']);
Route::patch('/properties/{property}/upload-complete', [PropertyController::class, 'uploadComplete']);
    Route::apiResource('property-images', PropertyImageController::class);
    
    // Enhanced property image routes
    Route::prefix('property-images')->group(function () {
        Route::post('/upload-multiple', [PropertyImageController::class, 'uploadMultiple']);
        Route::post('/update-sort-order', [PropertyImageController::class, 'updateSortOrder']);
        Route::post('/{id}/set-primary', [PropertyImageController::class, 'setPrimary']);
        Route::get('/property/{propertyId}', [PropertyImageController::class, 'getByProperty']);
        Route::get('/types', [PropertyImageController::class, 'getImageTypes']);
    });
    Route::apiResource('reservations', ReservationController::class)
    ->except(['store']);
    Route::apiResource('need-requests', NeedRequestController::class)
    ->except(['store']);
    Route::apiResource('contact-messages', ContactMessageController::class)->except(['store']);
    Route::apiResource('settings', SettingController::class);
    Route::apiResource('property-types', PropertyTypeController::class);
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/statistics', [StatisticsController::class, 'index']);
    Route::post('/cloudinary/signature', [CloudinaryController::class, 'signature']);
    Route::put('/admin/credentials', [AuthController::class, 'updateCredentials']);

    // Marketing emails
    Route::post('/marketing/send', [MarketingMailController::class, 'send']);
    Route::post('/marketing/preview', [MarketingMailController::class, 'preview']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);

    // Video upload routes (Enhanced)
    Route::prefix('videos/enhanced')->group(function () {
        Route::post('/upload', [EnhancedVideoUploadController::class, 'upload']);
        Route::post('/chunked/init', [EnhancedVideoUploadController::class, 'initChunkedUpload']);
        Route::post('/chunked/upload', [EnhancedVideoUploadController::class, 'uploadChunk']);
        Route::post('/chunked/complete', [EnhancedVideoUploadController::class, 'completeChunkedUpload']);
        Route::post('/chunked/cancel', [EnhancedVideoUploadController::class, 'cancelChunkedUpload']);
        Route::get('/config', [EnhancedVideoUploadController::class, 'getConfig']);
    });

    // Video upload routes (Basic - for compatibility)
    Route::prefix('videos')->group(function () {
        Route::post('/upload', [VideoUploadController::class, 'upload']);
        Route::post('/chunked/init', [VideoUploadController::class, 'initChunkedUpload']);
        Route::post('/chunked/upload', [VideoUploadController::class, 'uploadChunk']);
        Route::post('/chunked/complete', [VideoUploadController::class, 'completeChunkedUpload']);
        Route::post('/chunked/cancel', [VideoUploadController::class, 'cancelChunkedUpload']);
        Route::get('/config', [VideoUploadController::class, 'getConfig']);
    });

    // Authenticated user favorites
    Route::prefix('favorites')->group(function () {
        Route::get('/', [FavoriteController::class, 'index'])->name('favorites.index');
        Route::post('/', [FavoriteController::class, 'store'])->name('favorites.store');
        Route::delete('/{propertyId}', [FavoriteController::class, 'destroy'])->name('favorites.destroy');
        Route::post('/toggle', [FavoriteController::class, 'toggle'])->name('favorites.toggle');
        Route::get('/check/{propertyId}', [FavoriteController::class, 'check'])->name('favorites.check');
    });
});