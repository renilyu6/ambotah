<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

Route::get('/', function () {
    return view('welcome');
});

// Debug route to test webhook
Route::get('/test-make-webhook', function () {
    $webhookUrl = 'https://hook.eu2.make.com/8372gsmclmlfb8c2aoq1la18obgqkcq8';

    $testData = [
        'test' => true,
        'name' => 'Debug Test',
        'email' => 'debug@test.com',
        'message' => 'Testing from Laravel debug route',
        'rating' => 5,
        'timestamp' => now()->toISOString()
    ];

    try {
        $response = Http::timeout(30)->post($webhookUrl, $testData);

        return response()->json([
            'success' => $response->successful(),
            'status' => $response->status(),
            'response' => $response->body(),
            'data_sent' => $testData
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage(),
            'data_sent' => $testData
        ]);
    }
});

// Webhook receiver for testing
Route::post('/webhook-receiver', function (Illuminate\Http\Request $request) {
    Log::info('Webhook received:', [
        'headers' => $request->headers->all(),
        'body' => $request->all(),
        'raw_body' => $request->getContent()
    ]);

    return response()->json(['received' => true]);
});
