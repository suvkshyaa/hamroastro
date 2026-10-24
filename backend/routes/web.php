<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| These routes return Blade views or simple pages.
| DO NOT put API routes here.
|
*/

Route::get('/', function () {
    return view('welcome');
});


