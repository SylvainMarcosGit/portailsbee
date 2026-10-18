<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('applications', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('url');
            $table->text('description')->nullable();
            $table->foreignId('category_id')->constrained('categories')->restrictOnDelete();
            $table->string('logo')->nullable();
            $table->string('version')->default('1.0.0');
            $table->date('deployment_date');
            $table->string('developed_by');
            $table->boolean('is_active')->default(true);
            // Coffre d'identifiants : remplissage automatique par l'extension SBEE
            $table->enum('sso_mode', ['none', 'fill', 'fill_submit', 'silent'])->default('none');
            $table->string('login_url_pattern', 500)->nullable();
            $table->enum('identifier_type', ['email', 'matricule', 'username', 'autre'])->default('username');
            $table->string('username_selector')->nullable();
            $table->string('password_selector')->nullable();
            $table->string('submit_selector')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('applications');
    }
};
