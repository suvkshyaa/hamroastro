<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;


class ProfileController extends Controller
{
    /**
     * GET /api/profile
     * Returns the logged-in user's full profile from users table
     */
    public function show(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        return response()->json([
            'id'           => $user->id,
            'name'         => $user->name,
            'email'        => $user->email,
            'gender'       => $user->gender,
            'dob_nep'      => $user->dob_nep,
            'birth_time'   => $user->birth_time,
            'temp_country' => $user->temp_country,
            'temp_city'    => $user->temp_city,
            'temp_street'  => $user->temp_street,
            'perm_country' => $user->perm_country,
            'perm_city'    => $user->perm_city,
            'perm_street'  => $user->perm_street,
            'photo'        => $user->photo ? url('storage/' . $user->photo) : null,
            'role'         => $user->role,
        ]);
    }

    /**
     * POST /api/profile/update
     * Updates the logged-in user's profile on users table directly
     */
    public function update(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $validated = $request->validate([
            'name'         => 'sometimes|string|max:255',
            'gender'       => 'sometimes|string|in:male,female,other',
            'dob_nep'      => 'nullable|string|max:50',
            'birth_time'   => 'nullable|string|max:50',
            'temp_country' => 'nullable|string|max:100',
            'temp_city'    => 'nullable|string|max:100',
            'temp_street'  => 'nullable|string|max:255',
            'perm_country' => 'nullable|string|max:100',
            'perm_city'    => 'nullable|string|max:100',
            'perm_street'  => 'nullable|string|max:255',
            'photo'        => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        // Handle photo upload
        if ($request->hasFile('photo')) {
            // Delete old photo if exists
            if ($user->photo) {
                Storage::disk('public')->delete($user->photo);
            }
            $path = $request->file('photo')->store('profile-photos', 'public');
            $validated['photo'] = $path;
        }

        // Update user record directly
        $user->update($validated);
        $user->refresh();

        return response()->json([
            'message'      => 'Profile updated successfully',
            'user'         => [
                'id'           => $user->id,
                'name'         => $user->name,
                'email'        => $user->email,
                'gender'       => $user->gender,
                'dob_nep'      => $user->dob_nep,
                'birth_time'   => $user->birth_time,
                'temp_country' => $user->temp_country,
                'temp_city'    => $user->temp_city,
                'temp_street'  => $user->temp_street,
                'perm_country' => $user->perm_country,
                'perm_city'    => $user->perm_city,
                'perm_street'  => $user->perm_street,
                'photo'        => $user->photo ? url('storage/' . $user->photo) : null,
                'role'         => $user->role,
            ],
        ]);
    }
}
