<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\User;
use App\Models\Category;
use App\Models\Product;
use App\Models\Discount;
use App\Models\Transaction;
use App\Models\TransactionItem;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create roles
        $adminRole = Role::create([
            'name' => 'admin',
            'display_name' => 'Administrator',
            'description' => 'Full system access'
        ]);

        $managerRole = Role::create([
            'name' => 'manager',
            'display_name' => 'Manager',
            'description' => 'Management access'
        ]);

        $cashierRole = Role::create([
            'name' => 'cashier',
            'display_name' => 'Cashier',
            'description' => 'POS access'
        ]);

        // Create admin user with the correct email
        $admin = User::create([
            'first_name' => 'Admin',
            'last_name' => 'User',
            'email' => 'admin@chiccheckout.com',
            'password' => Hash::make('password'),
            'role_id' => $adminRole->id,
            'contact_number' => '09123456789',
            'address' => 'Admin Address',
            'birth_date' => '1990-01-01',
            'gender' => 'male',
            'is_active' => true,
        ]);

        // Create additional test users
        $manager = User::create([
            'first_name' => 'Manager',
            'last_name' => 'User',
            'email' => 'manager@chiccheckout.com',
            'password' => Hash::make('password'),
            'role_id' => $managerRole->id,
            'contact_number' => '09123456788',
            'address' => 'Manager Address',
            'birth_date' => '1985-01-01',
            'gender' => 'female',
            'is_active' => true,
        ]);

        $cashier = User::create([
            'first_name' => 'Cashier',
            'last_name' => 'User',
            'email' => 'cashier@chiccheckout.com',
            'password' => Hash::make('password'),
            'role_id' => $cashierRole->id,
            'contact_number' => '09123456787',
            'address' => 'Cashier Address',
            'birth_date' => '1995-01-01',
            'gender' => 'male',
            'is_active' => true,
        ]);

        // Create categories
        $category = Category::create([
            'name' => 'General',
            'description' => 'General products'
        ]);

        // Create products
        $product1 = Product::create([
            'name' => 'Sample Product 1',
            'description' => 'A sample product for testing',
            'sku' => 'SP001',
            'category_id' => $category->id,
            'price' => 100.00,
            'cost' => 50.00,
            'stock_quantity' => 100,
            'min_stock_level' => 10,
            'is_active' => true,
        ]);

        $product2 = Product::create([
            'name' => 'Sample Product 2',
            'description' => 'Another sample product',
            'sku' => 'SP002',
            'category_id' => $category->id,
            'price' => 200.00,
            'cost' => 100.00,
            'stock_quantity' => 50,
            'min_stock_level' => 5,
            'is_active' => true,
        ]);

        // Create sample discounts
        Discount::create([
            'name' => '10% Off',
            'description' => '10% discount on all items',
            'type' => 'percentage',
            'value' => 10.00,
            'minimum_amount' => 100.00,
            'maximum_discount' => 500.00,
            'valid_from' => now()->subDays(30),
            'valid_until' => now()->addDays(30),
            'usage_limit' => null,
            'used_count' => 0,
            'is_active' => true,
        ]);

        Discount::create([
            'name' => 'Senior Citizen Discount',
            'description' => '20% discount for senior citizens',
            'type' => 'percentage',
            'value' => 20.00,
            'minimum_amount' => 0.00,
            'maximum_discount' => null,
            'valid_from' => now()->subDays(365),
            'valid_until' => now()->addDays(365),
            'usage_limit' => null,
            'used_count' => 0,
            'is_active' => true,
        ]);

        Discount::create([
            'name' => '₱50 Off',
            'description' => '₱50 fixed discount',
            'type' => 'fixed_amount',
            'value' => 50.00,
            'minimum_amount' => 200.00,
            'maximum_discount' => null,
            'valid_from' => now()->subDays(7),
            'valid_until' => now()->addDays(30),
            'usage_limit' => 100,
            'used_count' => 0,
            'is_active' => true,
        ]);

        // Create sample transaction
        $transaction = Transaction::create([
            'transaction_number' => 'TXN-' . now()->format('YmdHis') . '-001',
            'user_id' => $cashier->id,
            'customer_name' => 'John Doe',
            'customer_email' => 'john@example.com',
            'subtotal' => 300.00,
            'discount_id' => null,
            'discount_amount' => 0.00,
            'tax_amount' => 0.00,
            'total_amount' => 300.00,
            'amount_paid' => 300.00,
            'change_amount' => 0.00,
            'payment_method' => 'cash',
        ]);

        // Create transaction items
        TransactionItem::create([
            'transaction_id' => $transaction->id,
            'product_id' => $product1->id,
            'quantity' => 2,
            'unit_price' => 100.00,
            'total_price' => 200.00,
        ]);

        TransactionItem::create([
            'transaction_id' => $transaction->id,
            'product_id' => $product2->id,
            'quantity' => 1,
            'unit_price' => 100.00,
            'total_price' => 100.00,
        ]);
    }
}