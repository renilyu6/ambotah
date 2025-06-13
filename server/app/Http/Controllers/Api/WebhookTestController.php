<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WebhookTestController extends Controller
{
    public function testMakeWebhook(Request $request)
    {
        try {
            $webhookUrl = 'https://hook.eu2.make.com/8372gsmclmlfb8c2aoq1la18obgqkcq8';

            $testPayload = [
                'event' => 'test_webhook',
                'timestamp' => now()->toISOString(),
                'message' => 'This is a test from Laravel',
                'data' => [
                    'test_id' => rand(1000, 9999),
                    'customer_name' => 'Test Customer',
                    'customer_email' => 'test@example.com',
                    'rating' => 5,
                    'comment' => 'This is a test feedback message',
                    'created_at' => now()->toISOString(),
                ]
            ];

            Log::info('Testing Make.com webhook with payload:', $testPayload);

            // Try different HTTP methods and headers
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'User-Agent' => 'ChicCheckout-Laravel/1.0',
            ])->timeout(30)->post($webhookUrl, $testPayload);

            Log::info('Make.com webhook response:', [
                'status' => $response->status(),
                'headers' => $response->headers(),
                'body' => $response->body(),
            ]);

            return response()->json([
                'success' => $response->successful(),
                'status' => $response->status(),
                'response_body' => $response->body(),
                'payload_sent' => $testPayload,
            ]);

        } catch (\Exception $e) {
            Log::error('Webhook test failed:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'payload_sent' => $testPayload ?? null,
            ], 500);
        }
    }
}