<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('feedback', function (Blueprint $table) {
            // Drop old columns if they exist
            if (Schema::hasColumn('feedback', 'email')) {
                $table->dropColumn('email');
            }
            if (Schema::hasColumn('feedback', 'message')) {
                $table->dropColumn('message');
            }

            // Add new columns if they don't exist
            if (!Schema::hasColumn('feedback', 'customer_name')) {
                $table->string('customer_name')->after('transaction_id');
            }
            if (!Schema::hasColumn('feedback', 'customer_email')) {
                $table->string('customer_email')->after('customer_name');
            }
            if (!Schema::hasColumn('feedback', 'comment')) {
                $table->text('comment')->nullable()->after('rating');
            }
        });
    }

    public function down(): void
    {
        Schema::table('feedback', function (Blueprint $table) {
            // Reverse the changes
            if (Schema::hasColumn('feedback', 'customer_name')) {
                $table->dropColumn('customer_name');
            }
            if (Schema::hasColumn('feedback', 'customer_email')) {
                $table->dropColumn('customer_email');
            }
            if (Schema::hasColumn('feedback', 'comment')) {
                $table->dropColumn('comment');
            }

            // Add back old columns
            $table->string('email')->after('rating');
            $table->text('message')->nullable()->after('email');
        });
    }
};