<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Discount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class DiscountController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = Discount::query();

            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            }

            if ($request->has('type')) {
                $query->where('type', $request->type);
            }

            if ($request->has('is_active')) {
                $query->where('is_active', $request->boolean('is_active'));
            }

            $discounts = $query->orderBy('created_at', 'desc')
                             ->paginate($request->get('per_page', 15));

            return response()->json($discounts);
        } catch (\Exception $e) {
            Log::error('Error fetching discounts: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error fetching discounts',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'type' => 'required|in:percentage,fixed_amount',
                'value' => 'required|numeric|min:0',
                'minimum_amount' => 'nullable|numeric|min:0',
                'maximum_discount' => 'nullable|numeric|min:0',
                'valid_from' => 'required|date',
                'valid_until' => 'required|date|after_or_equal:valid_from',
                'usage_limit' => 'nullable|integer|min:1',
                'is_active' => 'boolean',
            ]);

            // Additional validation for percentage discounts
            if ($request->type === 'percentage' && $request->value > 100) {
                return response()->json([
                    'message' => 'Percentage discount cannot exceed 100%'
                ], 422);
            }

            $discount = Discount::create($request->all());

            return response()->json([
                'message' => 'Discount created successfully',
                'discount' => $discount
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating discount: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error creating discount',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(Discount $discount)
    {
        try {
            return response()->json([
                'discount' => $discount
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching discount: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error fetching discount',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, Discount $discount)
    {
        try {
            $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'type' => 'required|in:percentage,fixed_amount',
                'value' => 'required|numeric|min:0',
                'minimum_amount' => 'nullable|numeric|min:0',
                'maximum_discount' => 'nullable|numeric|min:0',
                'valid_from' => 'required|date',
                'valid_until' => 'required|date|after_or_equal:valid_from',
                'usage_limit' => 'nullable|integer|min:1',
                'is_active' => 'boolean',
            ]);

            // Additional validation for percentage discounts
            if ($request->type === 'percentage' && $request->value > 100) {
                return response()->json([
                    'message' => 'Percentage discount cannot exceed 100%'
                ], 422);
            }

            $discount->update($request->all());

            return response()->json([
                'message' => 'Discount updated successfully',
                'discount' => $discount
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating discount: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error updating discount',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Discount $discount)
    {
        try {
            // Check if discount is being used in any transactions
            if ($discount->transactions()->count() > 0) {
                return response()->json([
                    'message' => 'Cannot delete discount that has been used in transactions'
                ], 422);
            }

            $discount->delete();

            return response()->json([
                'message' => 'Discount deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting discount: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error deleting discount',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getActiveDiscounts()
    {
        try {
            $discounts = Discount::active()
                               ->orderBy('name')
                               ->get();

            return response()->json([
                'status' => 'success',
                'discounts' => $discounts
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching active discounts: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error fetching active discounts',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
