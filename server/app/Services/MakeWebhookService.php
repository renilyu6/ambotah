<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MakeWebhookService
{
    private $webhookUrl;

    public function __construct()
    {
        $this->webhookUrl = 'https://hook.eu2.make.com/8372gsmclmlfb8c2aoq1la18obgqkcq8';
    }

    public function sendFeedback($feedback)
    {
        return $this->sendWebhook('customer_feedback', [
            'feedback_id' => $feedback->id,
            'transaction_id' => $feedback->transaction_id,
            'customer_name' => $feedback->customer_name,
            'customer_email' => $feedback->customer_email,
            'rating' => $feedback->rating,
            'comment' => $feedback->comment,
            'created_at' => $feedback->created_at->toISOString(),
        ]);
    }

    public function sendTransaction($transaction)
    {
        return $this->sendWebhook('new_transaction', [
            'transaction_id' => $transaction->id,
            'transaction_number' => $transaction->transaction_number,
            'customer_name' => $transaction->customer_name,
            'customer_email' => $transaction->customer_email,
            'total_amount' => $transaction->total_amount,
            'payment_method' => $transaction->payment_method,
            'created_at' => $transaction->created_at->toISOString(),
        ]);
    }

    private function sendWebhook($event, $data)
    {
        try {
            if (!$this->webhookUrl) {
                Log::warning('Make.com webhook URL not configured');
                return false;
            }

            $payload = [
                'event' => $event,
                'timestamp' => now()->toISOString(),
                'data' => $data
            ];

            Log::info("Sending {$event} notification to Make.com:", $payload);

            $response = Http::timeout(10)->post($this->webhookUrl, $payload);

            if ($response->successful()) {
                Log::info("Successfully sent {$event} notification to Make.com");
                return true;
            } else {
                Log::warning("Failed to send {$event} notification to Make.com", [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                return false;
            }
        } catch (\Exception $e) {
            Log::error("Failed to send {$event} notification to Make.com: " . $e->getMessage());
            return false;
        }
    }
}
