<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::with('role');

        if ($request->has('role')) {
            $query->whereHas('role', function ($q) use ($request) {
                $q->where('name', $request->role);
            });
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $users = $query->paginate($request->get('per_page', 15));

        return response()->json($users);
    }

    public function store(Request $request)
    {
        $request->validate([
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'required|string|max:255',
            'suffix_name' => 'nullable|string|max:255',
            'birth_date' => 'required|date',
            'gender' => 'required|in:male,female,other',
            'address' => 'required|string',
            'contact_number' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'role_id' => 'required|exists:roles,id',
        ]);

        $user = User::create([
            'first_name' => $request->first_name,
            'middle_name' => $request->middle_name,
            'last_name' => $request->last_name,
            'suffix_name' => $request->suffix_name,
            'birth_date' => $request->birth_date,
            'gender' => $request->gender,
            'address' => $request->address,
            'contact_number' => $request->contact_number,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role_id' => $request->role_id,
            'email_verified_at' => now(),
        ]);

        // Send email notification via Make.com webhook
        $this->sendUserCreatedNotification($user);

        return response()->json([
            'message' => 'User created successfully',
            'user' => $user->load('role')
        ], 201);
    }

    public function show(User $user)
    {
        return response()->json([
            'user' => $user->load('role')
        ]);
    }

    public function update(Request $request, User $user)
    {
        $request->validate([
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'required|string|max:255',
            'suffix_name' => 'nullable|string|max:255',
            'birth_date' => 'required|date',
            'gender' => 'required|in:male,female,other',
            'address' => 'required|string',
            'contact_number' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user)],
            'role_id' => 'required|exists:roles,id',
            'is_active' => 'boolean',
        ]);

        $user->update($request->only([
            'first_name',
            'middle_name',
            'last_name',
            'suffix_name',
            'birth_date',
            'gender',
            'address',
            'contact_number',
            'email',
            'role_id',
            'is_active',
        ]));

        return response()->json([
            'message' => 'User updated successfully',
            'user' => $user->load('role')
        ]);
    }

    public function destroy(User $user)
    {
        // Prevent deletion of the last admin
        if ($user->hasRole('admin')) {
            $adminCount = User::whereHas('role', function ($q) {
                $q->where('name', 'admin');
            })->where('is_active', true)->count();

            if ($adminCount <= 1) {
                return response()->json([
                    'message' => 'Cannot delete the last active admin user'
                ], 422);
            }
        }

        $user->update(['is_active' => false]);

        return response()->json([
            'message' => 'User deactivated successfully'
        ]);
    }

    public function getRoles()
    {
        $roles = Role::all();
        return response()->json(['roles' => $roles]);
    }

    private function sendUserCreatedNotification(User $user)
    {
        $webhookUrl = config('app.make_webhook_url');
        
        if (!$webhookUrl) {
            return;
        }

        try {
            Http::post($webhookUrl, [
                'event' => 'user_created',
                'data' => [
                    'user_id' => $user->id,
                    'name' => $user->full_name,
                    'email' => $user->email,
                    'role' => $user->role->display_name,
                    'created_at' => $user->created_at->toISOString(),
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to send user created notification: ' . $e->getMessage());
        }
    }
}