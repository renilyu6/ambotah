<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\Product;
use App\Models\Discount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = Transaction::with(['user', 'items.product', 'discount']);

            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('transaction_number', 'like', "%{$search}%")
                      ->orWhere('customer_name', 'like', "%{$search}%")
                      ->orWhere('customer_email', 'like', "%{$search}%");
                });
            }

            if ($request->has('date_from') && $request->date_from) {
                $query->whereDate('created_at', '>=', $request->date_from);
            }

            if ($request->has('date_to') && $request->date_to) {
                $query->whereDate('created_at', '<=', $request->date_to);
            }

            $transactions = $query->orderBy('created_at', 'desc')
                                 ->paginate($request->get('per_page', 15));

            return response()->json($transactions);
        } catch (\Exception $e) {
            Log::error('Error fetching transactions: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error fetching transactions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $request->validate([
                'customer_name' => 'nullable|string|max:255',
                'customer_email' => 'nullable|email|max:255',
                'payment_method' => 'required|in:cash,card,digital_wallet',
                'amount_paid' => 'required|numeric|min:0',
                'discount_id' => 'nullable|exists:discounts,id',
                'items' => 'required|array|min:1',
                'items.*.product_id' => 'required|exists:products,id',
                'items.*.quantity' => 'required|integer|min:1',
                'items.*.unit_price' => 'required|numeric|min:0',
            ]);

            DB::beginTransaction();

            // Calculate totals
            $subtotal = 0;
            $items = [];

            foreach ($request->items as $item) {
                $product = Product::findOrFail($item['product_id']);

                // Check stock availability
                if ($product->stock_quantity < $item['quantity']) {
                    throw new \Exception("Insufficient stock for product: {$product->name}");
                }

                $itemTotal = $item['quantity'] * $item['unit_price'];
                $subtotal += $itemTotal;

                $items[] = [
                    'product' => $product,
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'total_price' => $itemTotal,
                ];
            }

            // Apply discount if provided
            $discount = null;
            $discountAmount = 0;

            if ($request->discount_id) {
                $discount = Discount::findOrFail($request->discount_id);
                $discountAmount = $discount->calculateDiscountAmount($subtotal);
            }

            // Calculate tax (8%)
            $taxableAmount = $subtotal - $discountAmount;
            $taxAmount = $taxableAmount * 0.08;
            $totalAmount = $taxableAmount + $taxAmount;

            // Calculate change
            $changeAmount = max(0, $request->amount_paid - $totalAmount);

            // Generate transaction number
            $transactionNumber = 'TXN-' . date('Ymd') . '-' . str_pad(Transaction::whereDate('created_at', today())->count() + 1, 4, '0', STR_PAD_LEFT);

            // Create transaction
            $transaction = Transaction::create([
                'transaction_number' => $transactionNumber,
                'user_id' => auth()->id(),
                'customer_name' => $request->customer_name,
                'customer_email' => $request->customer_email,
                'subtotal' => $subtotal,
                'discount_id' => $discount?->id,
                'discount_amount' => $discountAmount,
                'tax_amount' => $taxAmount,
                'total_amount' => $totalAmount,
                'amount_paid' => $request->amount_paid,
                'change_amount' => $changeAmount,
                'payment_method' => $request->payment_method,
            ]);

            // Create transaction items and update stock
            foreach ($items as $item) {
                TransactionItem::create([
                    'transaction_id' => $transaction->id,
                    'product_id' => $item['product']->id,
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'total_price' => $item['total_price'],
                ]);

                // Update product stock
                $item['product']->decrement('stock_quantity', $item['quantity']);
            }

            DB::commit();

            // Load relationships for response
            $transaction->load(['user', 'items.product', 'discount']);

            return response()->json([
                'message' => 'Transaction created successfully',
                'transaction' => $transaction
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Transaction creation failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Transaction failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(Transaction $transaction)
    {
        try {
            $transaction->load(['user', 'items.product', 'discount']);

            return response()->json([
                'transaction' => $transaction
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching transaction: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error fetching transaction',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getDailySales(Request $request)
    {
        try {
            $date = $request->get('date', today());

            $sales = Transaction::whereDate('created_at', $date)
                ->selectRaw('
                    COUNT(*) as total_transactions,
                    SUM(subtotal) as total_subtotal,
                    SUM(discount_amount) as total_discounts,
                    SUM(tax_amount) as total_tax,
                    SUM(total_amount) as total_sales
                ')
                ->first();

            return response()->json([
                'date' => $date,
                'sales' => $sales
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching daily sales: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error fetching daily sales',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getMonthlyReport(Request $request)
    {
        try {
            $month = $request->get('month', date('n'));
            $year = $request->get('year', date('Y'));

            $sales = Transaction::whereMonth('created_at', $month)
                ->whereYear('created_at', $year)
                ->selectRaw('
                    DATE(created_at) as date,
                    COUNT(*) as transactions,
                    SUM(total_amount) as total_sales
                ')
                ->groupBy('date')
                ->orderBy('date')
                ->get();

            return response()->json([
                'month' => $month,
                'year' => $year,
                'daily_sales' => $sales
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching monthly report: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error fetching monthly report',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}