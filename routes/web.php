<?php

use Illuminate\Support\Facades\Route;

// Politique de confidentialité de l'extension navigateur : page publique (sans connexion),
// référencée par les fiches des boutiques. Doit rester avant la route attrape-tout.
Route::view('/extension/confidentialite', 'extension-confidentialite')->name('extension.confidentialite');

// Toutes les routes renvoient vers l'application React
Route::get('/{any?}', function () {
    return view('app');
})->where('any', '.*');
