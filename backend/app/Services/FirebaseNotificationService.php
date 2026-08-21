<?php

namespace App\Services;

use App\Models\DeviceToken;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class FirebaseNotificationService
{
    protected static function safeConfig(string $key, $default = null)
    {
        if (function_exists('config')) {
            try {
                return config($key, $default);
            } catch (\Throwable $e) {}
        }
        return $default;
    }

    protected static function safeStoragePath(string $path = ''): string
    {
        if (function_exists('storage_path')) {
            try {
                return storage_path($path);
            } catch (\Throwable $e) {}
        }
        return dirname(__DIR__, 2) . '/storage/' . ltrim($path, '/');
    }

    protected static function safeBasePath(string $path = ''): string
    {
        if (function_exists('base_path')) {
            try {
                return base_path($path);
            } catch (\Throwable $e) {}
        }
        return dirname(__DIR__, 2) . '/' . ltrim($path, '/');
    }

    /**
     * Get Firebase Project ID from configuration or service account.
     */
    public static function getFirebaseProjectId(): string
    {
        $projectId = self::safeConfig('services.firebase.project_id') ?: env('FIREBASE_PROJECT_ID');
        if ($projectId) {
            return $projectId;
        }

        $serviceAccount = self::getServiceAccountData();
        return $serviceAccount['project_id'] ?? 'sakani-fa8db';
    }

    /**
     * Load Firebase Service Account Credentials Array.
     */
    public static function getServiceAccountData(): ?array
    {
        // 1. Direct JSON string from environment variable (ideal for production servers)
        $jsonString = env('FIREBASE_CREDENTIALS_JSON');
        if (!empty($jsonString)) {
            $decoded = json_decode($jsonString, true);
            if (is_array($decoded) && !empty($decoded['private_key']) && !empty($decoded['client_email'])) {
                return $decoded;
            }
        }

        $customPath = self::safeConfig('services.firebase.credentials_file') ?: env('FIREBASE_CREDENTIALS');
        $possiblePaths = array_filter([
            $customPath,
            $customPath ? self::safeBasePath($customPath) : null,
            $customPath ? self::safeStoragePath(str_replace(['storage/app/', 'storage/'], '', $customPath)) : null,
            self::safeStoragePath('app/firebase/service-account.json'),
            self::safeStoragePath('firebase/service-account.json'),
            self::safeBasePath('storage/app/firebase/service-account.json'),
            self::safeBasePath('firebase-service-account.json'),
            self::safeStoragePath('firebase-service-account.json'),
        ]);

        foreach ($possiblePaths as $path) {
            if ($path && file_exists($path)) {
                $content = file_get_contents($path);
                $decoded = json_decode($content, true);
                if (is_array($decoded) && !empty($decoded['private_key']) && !empty($decoded['client_email'])) {
                    return $decoded;
                }
            }
        }

        // Direct environment fallback
        $email = self::safeConfig('services.firebase.client_email') ?: env('FIREBASE_CLIENT_EMAIL');
        $privateKey = self::safeConfig('services.firebase.private_key') ?: env('FIREBASE_PRIVATE_KEY');
        $projectId = self::safeConfig('services.firebase.project_id') ?: env('FIREBASE_PROJECT_ID', 'sakani-fa8db');

        if ($email && $privateKey) {
            return [
                'project_id' => $projectId,
                'client_email' => $email,
                'private_key' => str_replace('\n', "\n", $privateKey),
            ];
        }

        return null;
    }

    /**
     * Generate Google OAuth2 Bearer Access Token for FCM HTTP v1 API.
     */
    public static function getOAuth2AccessToken(): ?string
    {
        try {
            if (class_exists(Cache::class)) {
                return Cache::remember('firebase_fcm_oauth2_token', 3300, function () {
                    return self::generateOAuth2AccessToken();
                });
            }
        } catch (\Throwable $e) {}

        return self::generateOAuth2AccessToken();
    }

    /**
     * Generate token via RSA SHA256 JWT assertion
     */
    public static function generateOAuth2AccessToken(): ?string
    {
        $serviceAccount = self::getServiceAccountData();
        if (!$serviceAccount) {
            return null;
        }

        try {
            $email = $serviceAccount['client_email'];
            $privateKey = str_replace('\n', "\n", $serviceAccount['private_key']);
            $now = time();

            // 1. JWT Header
            $header = rtrim(strtr(base64_encode(json_encode(['alg' => 'RS256', 'typ' => 'JWT'])), '+/', '-_'), '=');

            // 2. JWT Claims
            $claims = rtrim(strtr(base64_encode(json_encode([
                'iss' => $email,
                'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
                'aud' => 'https://oauth2.googleapis.com/token',
                'iat' => $now,
                'exp' => $now + 3600,
            ])), '+/', '-_'), '=');

            $dataToSign = "{$header}.{$claims}";
            $signature = '';

            $success = openssl_sign($dataToSign, $signature, $privateKey, OPENSSL_ALGO_SHA256);
            if (!$success) {
                try { Log::error('Firebase FCM: Failed to sign OAuth2 JWT with private key.'); } catch (\Throwable $e) {}
                return null;
            }

            $encodedSignature = rtrim(strtr(base64_encode($signature), '+/', '-_'), '=');
            $jwtAssertion = "{$dataToSign}.{$encodedSignature}";

            // 3. Exchange JWT for Google OAuth2 Access Token
            $response = Http::asForm()->timeout(10)->post('https://oauth2.googleapis.com/token', [
                'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion' => $jwtAssertion,
            ]);

            if ($response->successful()) {
                $json = $response->json();
                return $json['access_token'] ?? null;
            }

            try { Log::error('Firebase FCM OAuth2 token exchange failed: ' . $response->body()); } catch (\Throwable $e) {}
            return null;
        } catch (\Throwable $e) {
            try { Log::error('Firebase FCM OAuth2 exception: ' . $e->getMessage()); } catch (\Throwable $e) {}
            return null;
        }
    }

    /**
     * Send push notification to specific FCM device tokens using HTTP v1 API.
     *
     * @param array $tokens List of FCM registration tokens
     * @param string $title Notification title
     * @param string $body Notification message body
     * @param array $data Structured payload for routing and entity details
     * @param string $sound Sound identifier ('default', 'admin_alert', etc.)
     * @return array Results summary
     */
    public static function sendToTokens(
        array $tokens,
        string $title,
        string $body,
        array $data = [],
        string $sound = 'default'
    ): array {
        $tokens = array_unique(array_filter($tokens));
        if (empty($tokens)) {
            return ['success_count' => 0, 'failure_count' => 0, 'status' => 'no_tokens'];
        }

        $projectId = self::getFirebaseProjectId();
        $accessToken = self::getOAuth2AccessToken();
        $serverKey = self::safeConfig('services.firebase.server_key') ?: env('FIREBASE_SERVER_KEY');

        // If neither OAuth2 nor Server Key is available, log and return graceful status
        if (!$accessToken && !$serverKey) {
            try {
                Log::info("Firebase Push: Awaiting Credentials. Payload: {$title} - {$body}", [
                    'recipient_count' => count($tokens),
                    'data' => $data,
                ]);
            } catch (\Throwable $e) {}

            return [
                'success_count' => 0,
                'failure_count' => 0,
                'status' => 'AWAITING_FIREBASE_CONFIGURATION',
                'note' => 'Firebase Service Account or Server Key is not configured.',
            ];
        }

        $successCount = 0;
        $failureCount = 0;
        $invalidTokens = [];

        // Stringify all data payload values as required by FCM specifications
        $formattedData = [];
        foreach ($data as $key => $val) {
            $formattedData[(string) $key] = is_array($val) ? json_encode($val) : (string) $val;
        }
        $formattedData['title'] = (string) $title;
        $formattedData['body'] = (string) $body;

        $targetRoute = $data['route'] ?? ($data['link'] ?? '/');

        // Preferred: FCM HTTP v1 API
        if ($accessToken) {
            $v1Url = "https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send";

            foreach ($tokens as $token) {
                try {
                    $messagePayload = [
                        'message' => [
                            'token' => $token,
                            'notification' => [
                                'title' => $title,
                                'body' => $body,
                            ],
                            'data' => $formattedData,
                            'webpush' => [
                                'headers' => [
                                    'Urgency' => 'high',
                                ],
                                'notification' => [
                                    'title' => $title,
                                    'body' => $body,
                                    'icon' => '/favicon.svg',
                                    'badge' => '/favicon.svg',
                                ],
                                'fcm_options' => [
                                    'link' => $targetRoute,
                                ],
                            ],
                        ],
                    ];

                    $response = Http::withToken($accessToken)
                        ->withHeaders(['Content-Type' => 'application/json'])
                        ->timeout(6)
                        ->post($v1Url, $messagePayload);

                    if ($response->successful()) {
                        $successCount++;
                    } else {
                        $failureCount++;
                        $errorBody = $response->json();
                        $errorCode = $errorBody['error']['status'] ?? ($errorBody['error']['details'][0]['errorCode'] ?? '');

                        if (in_array($errorCode, ['UNREGISTERED', 'INVALID_ARGUMENT']) || $response->status() === 404) {
                            $invalidTokens[] = $token;
                        }

                        try { Log::warning("FCM v1 Send failed for token: {$errorCode} - " . $response->body()); } catch (\Throwable $e) {}
                    }
                } catch (\Throwable $e) {
                    $failureCount++;
                    try { Log::error('FCM v1 Send exception: ' . $e->getMessage()); } catch (\Throwable $e) {}
                }
            }
        } else {
            // Legacy FCM endpoint fallback
            $legacyUrl = 'https://fcm.googleapis.com/fcm/send';
            $chunks = array_chunk($tokens, 500);

            foreach ($chunks as $chunk) {
                try {
                    $payload = [
                        'registration_ids' => array_values($chunk),
                        'notification' => [
                            'title' => $title,
                            'body' => $body,
                            'sound' => $sound,
                            'icon' => '/favicon.svg',
                            'click_action' => $targetRoute,
                        ],
                        'data' => $formattedData,
                        'priority' => 'high',
                    ];

                    $response = Http::withHeaders([
                        'Authorization' => 'key=' . $serverKey,
                        'Content-Type' => 'application/json',
                    ])->timeout(6)->post($legacyUrl, $payload);

                    if ($response->successful()) {
                        $json = $response->json();
                        $successCount += $json['success'] ?? 0;
                        $failureCount += $json['failure'] ?? 0;

                        if (!empty($json['results'])) {
                            foreach ($json['results'] as $idx => $res) {
                                if (isset($res['error']) && in_array($res['error'], ['NotRegistered', 'InvalidRegistration'])) {
                                    if (isset($chunk[$idx])) {
                                        $invalidTokens[] = $chunk[$idx];
                                    }
                                }
                            }
                        }
                    } else {
                        $failureCount += count($chunk);
                    }
                } catch (\Throwable $e) {
                    $failureCount += count($chunk);
                }
            }
        }

        // Prune invalid/unregistered tokens automatically
        if (!empty($invalidTokens) && class_exists(DeviceToken::class)) {
            try {
                DeviceToken::whereIn('token', $invalidTokens)->delete();
                Log::info('Pruned ' . count($invalidTokens) . ' invalid/expired FCM tokens.');
            } catch (\Throwable $e) {}
        }

        return [
            'success_count' => $successCount,
            'failure_count' => $failureCount,
            'status' => 'sent',
        ];
    }

    /**
     * Send push notification to all Admin devices.
     */
    public static function sendToAdmin(string $title, string $body, array $data = []): array
    {
        try {
            $tokens = DeviceToken::forAdmins()->pluck('token')->toArray();
            return self::sendToTokens($tokens, $title, $body, array_merge($data, [
                'recipient_type' => 'admin',
            ]), 'admin_alert');
        } catch (\Throwable $e) {
            try { Log::error('Firebase sendToAdmin error: ' . $e->getMessage()); } catch (\Throwable $e) {}
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }

    /**
     * Send push notification to a specific Customer by phone number.
     */
    public static function sendToCustomer(string $phone, string $title, string $body, array $data = []): array
    {
        try {
            $cleanPhone = preg_replace('/\D/', '', $phone);
            if (str_starts_with($cleanPhone, '20') && strlen($cleanPhone) > 10) {
                $cleanPhone = '0' . substr($cleanPhone, 2);
            }

            $tokens = DeviceToken::where('phone', $cleanPhone)
                ->orWhere('phone', $phone)
                ->pluck('token')
                ->toArray();

            return self::sendToTokens($tokens, $title, $body, array_merge($data, [
                'recipient_type' => 'customer',
            ]), 'customer_chime');
        } catch (\Throwable $e) {
            try { Log::error('Firebase sendToCustomer error: ' . $e->getMessage()); } catch (\Throwable $e) {}
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }

    /**
     * Alias for sendToTokens
     */
    public static function sendPush(array $tokens, string $title, string $body, array $data = [], string $sound = 'default'): array
    {
        return self::sendToTokens($tokens, $title, $body, $data, $sound);
    }
}
