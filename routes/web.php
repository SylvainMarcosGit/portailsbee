<?php

use Illuminate\Support\Facades\Route;

// Toutes les routes renvoient vers l'application React
Route::get('/{any?}', function () {
    return view('app');
})->where('any', '.*');
