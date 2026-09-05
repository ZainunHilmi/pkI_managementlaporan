<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\SparepartController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\DashboardController;

// Public routes
Route::post('/login', [AuthController::class, 'login']);
Route::get('/health', fn () => response()->json(['ok' => true, 'time' => now()->toIso8601String()]));

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    // Dashboard
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    Route::get('/dashboard/chart/stock', [DashboardController::class, 'stockChart']);
    Route::get('/dashboard/chart/transactions', [DashboardController::class, 'transactionChart']);

    // Spareparts - accessible by all authenticated users
    Route::get('/spareparts', [SparepartController::class, 'index']);
    Route::get('/spareparts/{partId}', [SparepartController::class, 'show']);

    // Transactions - all users can view
    Route::get('/transactions', [TransactionController::class, 'index']);

    // Admin only routes
    Route::middleware('admin')->group(function () {
        // Sparepart CRUD
        Route::post('/spareparts', [SparepartController::class, 'store']);
        Route::put('/spareparts/{partId}', [SparepartController::class, 'update']);
        Route::delete('/spareparts/{partId}', [SparepartController::class, 'destroy']);

        // User CRUD
        Route::get('/users', [UserController::class, 'index']);
        Route::get('/users/{id}', [UserController::class, 'show']);
        Route::post('/users', [UserController::class, 'store']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        Route::delete('/users/{id}', [UserController::class, 'destroy']);

        // Transaction CRUD (admin can add stock-in/out)
        Route::post('/transactions', [TransactionController::class, 'store']);
    });

    // Mechanic can take parts (stock out only)
    Route::post('/transactions/take', [TransactionController::class, 'takePart']);
});
