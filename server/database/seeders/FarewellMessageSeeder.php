<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\FarewellMessage;
use App\Models\User;

class FarewellMessageSeeder extends Seeder
{
    public function run(): void
    {
        $adminUser = User::where('email', 'admin@example.com')->first();

        if (!$adminUser) {
            return;
        }

        $messages = [
            'Thank you for your purchase!',
            'Have a great day!',
            'We appreciate your business!',
            'Come back soon!',
            'Thank you for choosing ChicCheckout!',
            'Your beauty, our passion!',
            'Stay beautiful!',
            'Thanks for shopping with us!',
        ];

        foreach ($messages as $message) {
            FarewellMessage::create([
                'message' => $message,
                'is_active' => true,
                'created_by' => $adminUser->id,
            ]);
        }
    }
}