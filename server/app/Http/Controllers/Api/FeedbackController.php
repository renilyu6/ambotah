<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Feedback;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class FeedbackController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = Feedback::with('transaction');

            if ($request->has('rating') && $request->rating) {
                $query->where('rating', $request->rating);
            }

            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('customer_email', 'like', "%{$search}%")
                      ->orWhere('customer_name', 'like', "%{$search}%")
                      ->orWhere('comment', 'like', "%{$search}%");
                });
            }

            $feedback = $query->orderBy('created_at', 'desc')
                            ->paginate($request->get('per_page', 15));

            return response()->json($feedback);
        } catch (\Exception $e) {
            Log::error('Error fetching feedback: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error fetching feedback',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            Log::info('Feedback submission request:', $request->all());

            $request->validate([
                'transaction_id' => 'required|exists:transactions,id',
                'customer_name' => 'required|string|max:255',
                'customer_email' => 'required|email|max:255',
                'rating' => 'required|integer|min:1|max:5',
                'comment' => 'nullable|string|max:1000',
            ]);

            $feedback = Feedback::create([
                'transaction_id' => $request->transaction_id,
                'customer_name' => $request->customer_name,
                'customer_email' => $request->customer_email,
                'rating' => $request->rating,
                'comment' => $request->comment,
            ]);

            Log::info('Feedback created successfully:', $feedback->toArray());

            // Send to Make.com webhook
            $this->sendFeedbackNotification($feedback);

            return response()->json([
                'message' => 'Feedback submitted successfully',
                'feedback' => $feedback->load('transaction')
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation error:', $e->errors());
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error creating feedback: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'message' => 'Error submitting feedback',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(Feedback $feedback)
    {
        try {
            return response()->json([
                'feedback' => $feedback->load('transaction')
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching feedback: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error fetching feedback',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getAnalytics(Request $request)
    {
        try {
            $dateFrom = $request->get('date_from', now()->subDays(30)->toDateString());
            $dateTo = $request->get('date_to', now()->toDateString());

            $totalFeedback = Feedback::whereBetween('created_at', [$dateFrom, $dateTo])->count();
            $averageRating = Feedback::whereBetween('created_at', [$dateFrom, $dateTo])->avg('rating') ?? 0;

            $ratingDistribution = [
                5 => Feedback::whereBetween('created_at', [$dateFrom, $dateTo])->where('rating', 5)->count(),
                4 => Feedback::whereBetween('created_at', [$dateFrom, $dateTo])->where('rating', 4)->count(),
                3 => Feedback::whereBetween('created_at', [$dateFrom, $dateTo])->where('rating', 3)->count(),
                2 => Feedback::whereBetween('created_at', [$dateFrom, $dateTo])->where('rating', 2)->count(),
                1 => Feedback::whereBetween('created_at', [$dateFrom, $dateTo])->where('rating', 1)->count(),
            ];

            $recentFeedback = Feedback::with('transaction')
                ->whereBetween('created_at', [$dateFrom, $dateTo])
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get();

            return response()->json([
                'data' => [
                    'total_feedback' => $totalFeedback,
                    'average_rating' => round($averageRating, 1),
                    'rating_distribution' => $ratingDistribution,
                    'recent_feedback' => $recentFeedback,
                    'date_range' => [
                        'from' => $dateFrom,
                        'to' => $dateTo
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching feedback analytics: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error fetching feedback analytics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function sendFeedbackNotification($feedback)
    {
        $webhookUrl = 'https://hook.eu2.make.com/8372gsmclmlfb8c2aoq1la18obgqkcq8';

        // Try multiple payload formats
        $payloads = [
            // Format 1: Structured format
            [
                'event' => 'customer_feedback',
                'timestamp' => now()->toISOString(),
                'feedback_id' => $feedback->id,
                'transaction_id' => $feedback->transaction_id,
                'customer_name' => $feedback->customer_name,
                'customer_email' => $feedback->customer_email,
                'rating' => $feedback->rating,
                'comment' => $feedback->comment,
                'created_at' => $feedback->created_at->toISOString(),
            ],
            // Format 2: Flat format
            [
                'name' => $feedback->customer_name,
                'email' => $feedback->customer_email,
                'message' => $feedback->comment,
                'rating' => $feedback->rating,
                'transaction_id' => $feedback->transaction_id,
                'timestamp' => now()->toISOString(),
            ],
            // Format 3: Simple format
            [
                'customer_name' => $feedback->customer_name,
                'customer_email' => $feedback->customer_email,
                'rating' => $feedback->rating,
                'comment' => $feedback->comment,
            ]
        ];

        foreach ($payloads as $index => $payload) {
            try {
                Log::info("Attempting Make.com webhook - Format " . ($index + 1), $payload);

                // Try different HTTP configurations
                $httpConfigs = [
                    // Config 1: Standard JSON
                    ['Content-Type' => 'application/json'],
                    // Config 2: Form data
                    ['Content-Type' => 'application/x-www-form-urlencoded'],
                    // Config 3: With User-Agent
                    [
                        'Content-Type' => 'application/json',
                        'User-Agent' => 'ChicCheckout-POS/1.0',
                        'Accept' => 'application/json'
                    ]
                ];

                foreach ($httpConfigs as $configIndex => $headers) {
                    try {
                        Log::info("Trying HTTP config " . ($configIndex + 1) . " with headers:", $headers);

                        if ($headers['Content-Type'] === 'application/x-www-form-urlencoded') {
                            $response = Http::withHeaders($headers)
                                ->timeout(30)
                                ->asForm()
                                ->post($webhookUrl, $payload);
                        } else {
                            $response = Http::withHeaders($headers)
                                ->timeout(30)
                                ->post($webhookUrl, $payload);
                        }

                        Log::info("Make.com webhook response - Format " . ($index + 1) . ", Config " . ($configIndex + 1), [
                            'status' => $response->status(),
                            'successful' => $response->successful(),
                            'headers' => $response->headers(),
                            'body' => $response->body(),
                        ]);

                        if ($response->successful()) {
                            Log::info('Successfully sent feedback notification to Make.com');
                            return; // Exit if successful
                        }

                    } catch (\Exception $e) {
                        Log::error("HTTP Config " . ($configIndex + 1) . " failed: " . $e->getMessage());
                        continue;
                    }
                }

            } catch (\Exception $e) {
                Log::error("Payload format " . ($index + 1) . " failed: " . $e->getMessage());
                continue;
            }
        }

        // If all attempts failed, try a simple cURL approach
        $this->sendWithCurl($webhookUrl, $feedback);
    }

    private function sendWithCurl($webhookUrl, $feedback)
    {
        try {
            $payload = [
                'name' => $feedback->customer_name,
                'email' => $feedback->customer_email,
                'message' => $feedback->comment,
                'rating' => $feedback->rating,
                'transaction_id' => $feedback->transaction_id,
                'timestamp' => now()->toISOString(),
            ];

            Log::info('Attempting cURL request to Make.com:', $payload);

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $webhookUrl);
            curl_setopt($ch, CURLOPT_POST, 1);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/json',
                'Content-Length: ' . strlen(json_encode($payload))
            ]);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);
            curl_close($ch);

            Log::info('cURL response from Make.com:', [
                'http_code' => $httpCode,
                'response' => $response,
                'error' => $error,
                'payload_sent' => $payload
            ]);

            if ($httpCode >= 200 && $httpCode < 300) {
                Log::info('Successfully sent feedback notification via cURL');
            } else {
                Log::warning('cURL request failed', [
                    'http_code' => $httpCode,
                    'response' => $response,
                    'error' => $error
                ]);
            }

        } catch (\Exception $e) {
            Log::error('cURL request to Make.com failed: ' . $e->getMessage());
        }
    }
}