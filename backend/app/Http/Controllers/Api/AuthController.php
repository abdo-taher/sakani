<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required|string|max:255',
            'password' => 'required|string|min:6',
        ]);

        // Rate limiting by IP
        $ipKey = 'login_attempts_ip_' . $request->ip();
        
        // Rate limiting by username to prevent brute force on specific accounts
        $usernameKey = 'login_attempts_username_' . $request->username;

        if (RateLimiter::tooManyAttempts($ipKey, 5) || RateLimiter::tooManyAttempts($usernameKey, 3)) {
            $ipSeconds = RateLimiter::availableIn($ipKey);
            $usernameSeconds = RateLimiter::availableIn($usernameKey);
            
            $seconds = max($ipSeconds, $usernameSeconds);
            $minutes = ceil($seconds / 60);

            return response()->json([
                'message' => "تم تجاوز عدد المحاولات. حاول مرة أخرى بعد {$minutes} دقيقة.",
                'seconds' => $seconds,
            ], 429);
        }

        $user = User::where('username', $request->username)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            // Increment both IP and username rate limits
            RateLimiter::hit($ipKey, 600); // 10 minutes
            RateLimiter::hit($usernameKey, 1800); // 30 minutes for username attempts
            
            return response()->json([
                'message' => 'اسم المستخدم أو كلمة المرور غير صحيحة'
            ], 401);
        }

        // Check if user account is active
        if (isset($user->status) && $user->status !== 'active') {
            return response()->json([
                'message' => 'حسابك غير مفعل أو محظور'
            ], 403);
        }

        // Clear rate limits on successful login
        RateLimiter::clear($ipKey);
        RateLimiter::clear($usernameKey);

        // Revoke old tokens for security
        $user->tokens()->delete();

        $token = $user->createToken('admin-token', ['*'], now()->addDays(1))->plainTextToken;

        return response()->json([
            'message' => 'تم تسجيل الدخول بنجاح',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'role' => $user->role,
            ]
        ]);
    }

    public function loginStatus(Request $request)
    {
        // مفيش حاجة اسمها username هنا خالص، الفحص بقى على أساس الـ IP بس
        $key = 'login_attempts_' . $request->ip();

        if (RateLimiter::tooManyAttempts($key, 5)) {

            $seconds = RateLimiter::availableIn($key);

            $minutes = ceil($seconds / 60);

            return response()->json([
                'locked' => true,
                'seconds' => $seconds,
                'message' => "تم تجاوز عدد المحاولات. حاول مرة أخرى بعد {$minutes} دقيقة."
            ]);
        }

        return response()->json([
            'locked' => false
        ]);
    }
    public function logout(Request $request)
{
    $request->user()->currentAccessToken()->delete();

    return response()->json([
        'message' => 'تم تسجيل الخروج بنجاح'
    ]);
}
public function updateCredentials(Request $request)
{
    $validated = $request->validate([
        'username' => 'required|string|max:255|unique:users,username,' . $request->user()->id,
        'password' => 'required|string|min:6|confirmed',
    ]);

    $user = $request->user();

    $user->update([
        'username' => $validated['username'],
        'password' => Hash::make($validated['password']),
    ]);

    return response()->json([
        'message' => 'تم تحديث بيانات تسجيل الدخول بنجاح.',
    ]);
}
}