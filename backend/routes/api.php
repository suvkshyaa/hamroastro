<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Broadcast;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\UserProfileController;

Broadcast::routes(['middleware' => ['auth:sanctum']]);

// Public routes
Route::post('register', [AuthController::class, 'register']);
Route::post('login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('user', fn(Request $request) => $request->user());
    Route::get('profile',         [UserProfileController::class, 'show']);
    Route::post('profile/update', [UserProfileController::class, 'update']);
    Route::get('messages',              [MessageController::class, 'index']);
    Route::post('messages',             [MessageController::class, 'store']);
    Route::get('chat-users',            [MessageController::class, 'chatUsers']);
    Route::get('users',                 [MessageController::class, 'allUsers']);
    Route::post('messages/mark-read',   [MessageController::class, 'markAsRead']);
    Route::get('admin-info',            [MessageController::class, 'getAdminId']);
    Route::get('check-payment',         [MessageController::class, 'checkPayment']);
    Route::post('users/{userId}/rashi', [MessageController::class, 'updateRashi']);
    Route::post('typing',               [MessageController::class, 'typing']);
    Route::post('status/online',        [MessageController::class, 'setOnline']);
    Route::get('status/{userId}',       [MessageController::class, 'getStatus']);
    Route::post('messages/{messageId}/payment', [MessageController::class, 'markPayment']);
    Route::get('messages/free-status',  [MessageController::class, 'getFreeMessageStatus']);
    Route::get('messages/{userId}',     [MessageController::class, 'show']);
});
