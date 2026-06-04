<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // ✅ Only add if column doesn't exist
        if (!Schema::hasColumn('users', 'rashi')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('rashi')->nullable()->after('gender');
            });
        }
    }

    public function down()
    {
        if (Schema::hasColumn('users', 'rashi')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('rashi');
            });
        }
    }
};
