<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = Product::with('category');

            if ($request->has('category_id') && $request->category_id) {
                $query->where('category_id', $request->category_id);
            }

            if ($request->has('active_only') && $request->active_only) {
                $query->where('is_active', true);
            }

            if ($request->has('low_stock') && $request->low_stock) {
                $query->whereRaw('stock_quantity <= min_stock_level');
            }

            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('sku', 'like', "%{$search}%")
                      ->orWhere('barcode', 'like', "%{$search}%");
                });
            }

            $products = $query->orderBy('created_at', 'desc')
                            ->paginate($request->get('per_page', 15));

            return response()->json($products);
        } catch (\Exception $e) {
            Log::error('Error fetching products: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error fetching products',
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
                'sku' => 'required|string|max:255|unique:products',
                'barcode' => 'nullable|string|max:255|unique:products',
                'category_id' => 'required|exists:categories,id',
                'price' => 'required|numeric|min:0',
                'cost' => 'required|numeric|min:0',
                'stock_quantity' => 'required|integer|min:0',
                'min_stock_level' => 'required|integer|min:0',
                'image_url' => 'nullable|url',
            ]);

            $product = Product::create($request->all());

            // Create initial stock movement
            if ($product->stock_quantity > 0) {
                StockMovement::create([
                    'product_id' => $product->id,
                    'user_id' => auth()->id(),
                    'type' => 'in',
                    'quantity' => $product->stock_quantity,
                    'previous_stock' => 0,
                    'new_stock' => $product->stock_quantity,
                    'reason' => 'Initial stock',
                    'reference_number' => 'INIT-' . $product->sku,
                ]);
            }

            return response()->json([
                'message' => 'Product created successfully',
                'product' => $product->load('category')
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating product: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error creating product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(Product $product)
    {
        try {
            return response()->json([
                'product' => $product->load('category', 'stockMovements.user')
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching product: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error fetching product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, Product $product)
    {
        try {
            $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'sku' => 'required|string|max:255|unique:products,sku,' . $product->id,
                'barcode' => 'nullable|string|max:255|unique:products,barcode,' . $product->id,
                'category_id' => 'required|exists:categories,id',
                'price' => 'required|numeric|min:0',
                'cost' => 'required|numeric|min:0',
                'min_stock_level' => 'required|integer|min:0',
                'image_url' => 'nullable|url',
                'is_active' => 'boolean',
            ]);

            $previousStock = $product->stock_quantity;
            $newStock = $request->input('stock_quantity', $previousStock);

            // Update all fields except stock_quantity first
            $product->update($request->except(['stock_quantity', 'is_active']));

            // Handle stock adjustment if quantity has changed
            if ($newStock != $previousStock) {
                $product->update(['stock_quantity' => $newStock]);

                StockMovement::create([
                    'product_id' => $product->id,
                    'user_id' => auth()->id(),
                    'type' => 'adjustment',
                    'quantity' => $newStock - $previousStock,
                    'previous_stock' => $previousStock,
                    'new_stock' => $newStock,
                    'reason' => 'Manual edit from products page',
                ]);
            }

            // Handle is_active separately to allow toggling
            if ($request->has('is_active')) {
                $product->update(['is_active' => $request->is_active]);
            }

            return response()->json([
                'message' => 'Product updated successfully',
                'product' => $product->fresh()->load('category')
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating product: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error updating product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Product $product)
    {
        try {
            $product->update(['is_active' => false]);

            return response()->json([
                'message' => 'Product deactivated successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error deactivating product: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error deactivating product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function adjustStock(Request $request, Product $product)
    {
        try {
            $request->validate([
                'type' => 'required|in:in,out,adjustment',
                'quantity' => 'required|integer|min:1',
                'reason' => 'required|string|max:255',
                'reference_number' => 'nullable|string|max:255',
            ]);

            $previousStock = $product->stock_quantity;
            $quantity = $request->quantity;

            switch ($request->type) {
                case 'in':
                    $newStock = $previousStock + $quantity;
                    break;
                case 'out':
                    $newStock = max(0, $previousStock - $quantity);
                    break;
                case 'adjustment':
                    $newStock = $quantity;
                    $quantity = $newStock - $previousStock;
                    break;
            }

            $product->update(['stock_quantity' => $newStock]);

            StockMovement::create([
                'product_id' => $product->id,
                'user_id' => auth()->id(),
                'type' => $request->type,
                'quantity' => abs($quantity),
                'previous_stock' => $previousStock,
                'new_stock' => $newStock,
                'reason' => $request->reason,
                'reference_number' => $request->reference_number,
            ]);

            return response()->json([
                'message' => 'Stock adjusted successfully',
                'product' => $product->fresh()
            ]);
        } catch (\Exception $e) {
            Log::error('Error adjusting stock: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error adjusting stock',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getLowStockProducts()
    {
        try {
            $products = Product::with('category')
                ->whereRaw('stock_quantity <= min_stock_level')
                ->where('is_active', true)
                ->get();

            return response()->json([
                'products' => $products
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching low stock products: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error fetching low stock products',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}