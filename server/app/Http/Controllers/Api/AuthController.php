<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        try {
            Log::info('Login attempt', ['email' => $request->email]);

            $request->validate([
                'email' => 'required|email',
                'password' => 'required',
            ]);

            // Find user by email
            $user = User::where('email', $request->email)->first();

            if (!$user) {
                Log::warning('User not found', ['email' => $request->email]);
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid credentials'
                ], 401);
            }

            // Check if user is active
            if (!$user->is_active) {
                Log::warning('Inactive user login attempt', ['email' => $request->email]);
                return response()->json([
                    'status' => 'error',
                    'message' => 'Account is inactive'
                ], 401);
            }

            // Check password
            if (!Hash::check($request->password, $user->password)) {
                Log::warning('Invalid password', ['email' => $request->email]);
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid credentials'
                ], 401);
            }

            // Load role relationship
            $user->load('role');

            // Create token
            $token = $user->createToken('auth_token')->plainTextToken;

            Log::info('Login successful', ['user_id' => $user->id, 'email' => $user->email]);

            return response()->json([
                'status' => 'success',
                'message' => 'Login successful',
                'user' => $user,
                'token' => $token,
            ]);

        } catch (\Exception $e) {
            Log::error('Login error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Login failed'
            ], 500);
        }
    }

    public function user(Request $request)
    {
        try {
            $user = $request->user()->load('role');

            return response()->json([
                'status' => 'success',
                'user' => $user
            ]);
        } catch (\Exception $e) {
            Log::error('Get user error', ['message' => $e->getMessage()]);

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to get user data'
            ], 500);
        }
    }

    public function logout(Request $request)
    {
        try {
            $request->user()->currentAccessToken()->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Logged out successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Logout error', ['message' => $e->getMessage()]);

            return response()->json([
                'status' => 'error',
                'message' => 'Logout failed'
            ], 500);
        }
    }
}
