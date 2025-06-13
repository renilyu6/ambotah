<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            [
                'name' => 'admin',
                'display_name' => 'Administrator',
                'description' => 'Full system access with all permissions'
            ],
            [
                'name' => 'manager',
                'display_name' => 'Manager',
                'description' => 'Access to reports, products, transactions, and limited settings'
            ],
            [
                'name' => 'cashier',
                'display_name' => 'Cashier',
                'description' => 'Access to POS system only'
            ]
        ];

        foreach ($roles as $role) {
            Role::firstOrCreate(
                ['name' => $role['name']],
                $role
            );
        }
    }
}