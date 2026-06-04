<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class UserProfileController extends Controller
{
    // ✅ Get profile directly from User model
    public function show(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        return response()->json($user);
    }

    // ✅ Update profile directly on User model
    public function update(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $validated = $request->validate([
            'name'         => 'sometimes|string|max:255',
            'gender'       => 'sometimes|string|max:20',
            'dob_nep'      => 'sometimes|nullable|string|max:50',
            'birth_time'   => 'sometimes|nullable|string|max:20',
            'perm_country' => 'sometimes|nullable|string|max:100',
            'perm_city'    => 'sometimes|nullable|string|max:100',
            'perm_street'  => 'sometimes|nullable|string|max:255',
            'temp_country' => 'sometimes|nullable|string|max:100',
            'temp_city'    => 'sometimes|nullable|string|max:100',
            'temp_street'  => 'sometimes|nullable|string|max:255',
        ]);

        // ✅ Update users table directly
        $user->update($validated);

        Log::info("User {$user->id} ({$user->name}) updated their profile");

        // ✅ Return fresh data from DB
        return response()->json([
            'message' => 'Profile updated successfully',
            'user'    => $user->fresh()
        ]);
    }
}
