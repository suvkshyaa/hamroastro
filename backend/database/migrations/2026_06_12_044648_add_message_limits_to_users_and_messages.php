<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Track free messages used by each customer globally
        Schema::table('users', function (Blueprint $table) {
            $table->integer('free_messages_used')->default(0);
        });

        // Track free normal messages used per question
        Schema::table('messages', function (Blueprint $table) {
            $table->integer('question_id')->nullable(); // which paid question this normal message belongs to
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('free_messages_used');
        });
        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn('question_id');
        });
    }
};
