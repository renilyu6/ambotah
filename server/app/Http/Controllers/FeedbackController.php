<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class FeedbackController extends Controller
{
    public function store(Request $request)
    {
        // Validate the incoming request
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'message' => 'required|string',
        ]);

        // Send a POST request to the new Make.com webhook
        $response = Http::post('https://hook.eu2.make.com/8372gsmclmlfb8c2aoq1la18obgqkcq8', [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'message' => $validated['message'],
            'timestamp' => now()->toISOString(),
            'source' => 'feedback_form'
        ]);

        // Return a JSON response based on the success of the POST request
        return response()->json([
            'message' => $response->successful()
                ? 'Thank you for your feedback!'
                : 'Failed to submit feedback',
            'success' => $response->successful(),
        ], $response->successful() ? 200 : 500);
    }
}
