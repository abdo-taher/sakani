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
use App\Http\Controllers\Api\RoomController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\TagController;
use App\Http\Controllers\Api\PropertySubmissionController;
use App\Http\Controllers\Api\CustomerIntelligenceController;
use App\Http\Controllers\Api\MediaUploadController;
use App\Http\Controllers\Api\ReferralFeedbackController;
use App\Http\Controllers\Api\FeedbackCampaignController;

// Health check and configuration - No auth required
Route::get('/health', [ConfigController::class, 'health']);
Route::get('/config', [ConfigController::class, 'getConfig']);
Route::post('/media/upload', [MediaUploadController::class, 'upload']);
Route::delete('/media/delete', [MediaUploadController::class, 'destroy']);

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

Route::post('/login', [AuthController::class, 'login'])->name('login');
Route::post('/login-status', [AuthController::class, 'loginStatus']);
Route::post('/contact-messages', [ContactMessageController::class, 'store']);
Route::post('/contact-messages/{id}/reply', [ContactMessageController::class, 'reply']);
Route::get('/contact-messages', [ContactMessageController::class, 'index']);
Route::post('/reservations', [ReservationController::class, 'store']);
Route::get('/reservations', [ReservationController::class, 'index']);
Route::post('/reservations/check', [ReservationController::class, 'check']);
Route::get('/properties', [PropertyController::class, 'index']);
Route::get('/properties/top-viewed', [PropertyController::class, 'topViewed']);
Route::get('/properties/best', [PropertyController::class, 'bestProperties']);
Route::get('/properties/offers', [PropertyController::class, 'bestOffers']);
Route::get('/properties/{property}/related', [PropertyController::class, 'relatedProperties']);
Route::post('/properties/{property}/view', [PropertyController::class, 'recordView']);
Route::get('/properties/{property}', [PropertyController::class, 'show']);
Route::get('/properties/category/{category}', [PropertyController::class, 'byCategory']);
Route::post('/need-requests', [NeedRequestController::class, 'store']);
Route::get('/tags', [TagController::class, 'index']);
Route::get('/settings', [SettingController::class, 'index']);
Route::get('/locations', [LocationController::class, 'index']);
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/amenities', [AmenityController::class, 'index']);
Route::get('/property-types', [PropertyTypeController::class, 'index']);
Route::get('/statistics/public', [StatisticsController::class, 'publicStats']);

// Device Tokens & Customer Push Notifications & Customer Reservations
Route::post('/device-tokens', [NotificationController::class, 'storeDeviceToken']);
Route::delete('/device-tokens', [NotificationController::class, 'destroyDeviceToken']);
Route::get('/customer/notifications', [NotificationController::class, 'customerIndex']);
Route::post('/customer/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
Route::get('/customer/reservations', [ReservationController::class, 'customerIndex']);
// Public property submission for review
Route::post('/properties/submit', [PropertySubmissionController::class, 'submit']);

// Public acquisition feedback (How users found us)
Route::post('/feedback/referral', [ReferralFeedbackController::class, 'store']);
Route::get('/feedback/campaigns/active', [FeedbackCampaignController::class, 'active']);
Route::post('/feedback/responses', [FeedbackCampaignController::class, 'storeResponse']);
Route::get('/feedback/campaigns', [FeedbackCampaignController::class, 'index']);
Route::post('/feedback/campaigns', [FeedbackCampaignController::class, 'store']);
Route::put('/feedback/campaigns/{id}', [FeedbackCampaignController::class, 'update']);
Route::delete('/feedback/campaigns/{id}', [FeedbackCampaignController::class, 'destroy']);
Route::get('/feedback/responses', [FeedbackCampaignController::class, 'responses']);
Route::get('/feedback/stats', [FeedbackCampaignController::class, 'stats']);

// Public favorite routes (for guest users using local storage)
Route::prefix('favorites')->group(function () {
    Route::post('/sync', [FavoriteController::class, 'syncGuestFavorites'])->middleware('auth:sanctum')->name('favorites.sync');
});

/*
|--------------------------------------------------------------------------
| Protected Routes (Admin Only)
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::apiResource('locations', LocationController::class)->except(['index']);
    Route::apiResource('categories', CategoryController::class)->except(['index']);
    Route::apiResource('amenities', AmenityController::class)->except(['index']);
    Route::post('/properties', [PropertyController::class, 'store']);
    Route::put('/properties/{property}', [PropertyController::class, 'update']);
    Route::put('/properties/{property}/offer', [PropertyController::class, 'updateOffer']);
    Route::delete('/properties/{property}', [PropertyController::class, 'destroy']);
    Route::patch('/properties/{property}/upload-complete', [PropertyController::class, 'uploadComplete']);

    // Room routes
    Route::get('/rooms/{room}', [RoomController::class, 'show']);
    Route::post('/properties/{id}/rooms', [RoomController::class, 'store']);
    Route::put('/rooms/{room}', [RoomController::class, 'update']);
    Route::delete('/rooms/{room}', [RoomController::class, 'destroy']);
    Route::post('/rooms/{room}/images', [RoomController::class, 'uploadImage']);
    Route::delete('/room-images/{image}', [RoomController::class, 'destroyImage']);
    Route::patch('/rooms/{room}/upload-complete', [RoomController::class, 'markUploadComplete']);
    Route::apiResource('property-images', PropertyImageController::class);

    // Enhanced property image routes
    Route::prefix('property-images')->group(function () {
        Route::post('/upload-multiple', [PropertyImageController::class, 'uploadMultiple']);
        Route::post('/update-sort-order', [PropertyImageController::class, 'updateSortOrder']);
        Route::post('/{id}/set-primary', [PropertyImageController::class, 'setPrimary']);
        Route::get('/property/{propertyId}', [PropertyImageController::class, 'getByProperty']);
        Route::get('/types', [PropertyImageController::class, 'getImageTypes']);
    });

    Route::apiResource('reservations', ReservationController::class)->except(['store']);
    Route::apiResource('need-requests', NeedRequestController::class)->except(['store']);
    Route::post('contact-messages/{id}/reply', [ContactMessageController::class, 'reply']);
    Route::apiResource('contact-messages', ContactMessageController::class)->except(['store']);
    Route::apiResource('settings', SettingController::class)->except(['index']);
    Route::post('/settings/bulk', [SettingController::class, 'store']);
    Route::apiResource('property-types', PropertyTypeController::class)->except(['index']);
    Route::apiResource('tags', TagController::class)->except(['index']);
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/statistics', [StatisticsController::class, 'index']);
    Route::post('/cloudinary/signature', [CloudinaryController::class, 'signature']);
    Route::put('/admin/credentials', [AuthController::class, 'updateCredentials']);

    // Marketing emails
    Route::post('/marketing/send', [MarketingMailController::class, 'send']);
    Route::post('/marketing/preview', [MarketingMailController::class, 'preview']);

    // Acquisition & Referral Feedback
    Route::get('/feedback/referrals', [ReferralFeedbackController::class, 'index']);
    Route::get('/feedback/referrals/stats', [ReferralFeedbackController::class, 'stats']);
    Route::delete('/feedback/referrals/{id}', [ReferralFeedbackController::class, 'destroy']);

    // Property Submissions Review Workflow
    Route::get('/property-submissions', [PropertySubmissionController::class, 'index']);
    Route::post('/property-submissions/{id}/approve', [PropertySubmissionController::class, 'approve']);
    Route::post('/property-submissions/{id}/reject', [PropertySubmissionController::class, 'reject']);

    // Customer & Contact Intelligence
    Route::get('/customers', [CustomerIntelligenceController::class, 'index']);
    Route::get('/customers/{phone}', [CustomerIntelligenceController::class, 'show']);
    Route::post('/customers/recommend-properties', [CustomerIntelligenceController::class, 'recommendProperties']);
    Route::get('/customers/match-properties/{needRequestId}', [CustomerIntelligenceController::class, 'matchPropertiesForNeedRequest']);

    // Notifications & FCM Admin Push & Manual Broadcast
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);
    Route::post('/admin/device-tokens', [NotificationController::class, 'storeAdminDeviceToken']);
    Route::get('/admin/notifications/active-recipients-count', [NotificationController::class, 'getActiveRecipientsCount']);
    Route::post('/admin/notifications/send-manual', [NotificationController::class, 'sendManualNotification']);

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
