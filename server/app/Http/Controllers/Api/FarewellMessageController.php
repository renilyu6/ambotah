<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FarewellMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class FarewellMessageController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = FarewellMessage::query();

            if ($request->has('active_only') && $request->active_only) {
                $query->where('is_active', true);
            }

            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where('message', 'like', "%{$search}%");
            }

            $messages = $query->orderBy('created_at', 'desc')
                            ->paginate($request->get('per_page', 15));

            return response()->json($messages);
        } catch (\Exception $e) {
            Log::error('Error fetching farewell messages: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error fetching farewell messages',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $request->validate([
                'message' => 'required|string|max:500',
                'is_active' => 'boolean',
            ]);

            $farewellMessage = FarewellMessage::create([
                'message' => $request->message,
                'is_active' => $request->get('is_active', true),
                'created_by' => auth()->id(),
            ]);

            return response()->json([
                'message' => 'Farewell message created successfully',
                'farewell_message' => $farewellMessage
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating farewell message: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error creating farewell message',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(FarewellMessage $farewellMessage)
    {
        try {
            return response()->json([
                'farewell_message' => $farewellMessage->load('creator')
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching farewell message: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error fetching farewell message',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, FarewellMessage $farewellMessage)
    {
        try {
            $request->validate([
                'message' => 'required|string|max:500',
                'is_active' => 'boolean',
            ]);

            $farewellMessage->update([
                'message' => $request->message,
                'is_active' => $request->get('is_active', $farewellMessage->is_active),
            ]);

            return response()->json([
                'message' => 'Farewell message updated successfully',
                'farewell_message' => $farewellMessage
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating farewell message: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error updating farewell message',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(FarewellMessage $farewellMessage)
    {
        try {
            $farewellMessage->delete();

            return response()->json([
                'message' => 'Farewell message deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting farewell message: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error deleting farewell message',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getRandom()
    {
        try {
            $message = FarewellMessage::where('is_active', true)
                ->inRandomOrder()
                ->first();

            if (!$message) {
                // Return default message if no custom messages exist
                return response()->json([
                    'message' => [
                        'id' => null,
                        'message' => 'Thank you for your purchase!',
                        'is_active' => true
                    ]
                ]);
            }

            return response()->json([
                'message' => $message
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching random farewell message: ' . $e->getMessage());
            return response()->json([
                'message' => [
                    'id' => null,
                    'message' => 'Thank you for your purchase!',
                    'is_active' => true
                ]
            ]);
        }
    }
}