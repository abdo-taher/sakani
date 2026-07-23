<?php

// Simple test script for favorites API
require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Foundation\Testing\TestCase;

echo "Testing Favorites API...\n\n";

$baseUrl = 'http://localhost:8000/api';

// Test 1: Login
echo "1. Testing login...\n";
$loginData = [
    'username' => 'admin',
    'password' => 'admin123'
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $baseUrl . '/login');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($loginData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$loginResult = json_decode($response, true);

if ($loginResult && isset($loginResult['access_token'])) {
    $token = $loginResult['access_token'];
    echo "✓ Login successful\n";
} else {
    echo "✗ Login failed: " . $response . "\n";
    exit(1);
}

curl_close($ch);

// Test 2: Get properties list
echo "\n2. Getting properties list...\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $baseUrl . '/properties');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: application/json'
]);

$response = curl_exec($ch);
$properties = json_decode($response, true);

if ($properties && isset($properties['data']) && count($properties['data']) > 0) {
    $firstProperty = $properties['data'][0];
    $propertyId = $firstProperty['id'];
    echo "✓ Found properties, using property ID: {$propertyId}\n";
} else {
    echo "✗ No properties found\n";
    exit(1);
}

curl_close($ch);

// Test 3: Add to favorites
echo "\n3. Testing add to favorites...\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $baseUrl . '/favorites');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['property_id' => $propertyId]));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json',
    'Authorization: Bearer ' . $token
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$result = json_decode($response, true);

if ($result && $result['success']) {
    echo "✓ Added to favorites successfully\n";
} else {
    echo "✗ Failed to add to favorites: " . $response . "\n";
}

curl_close($ch);

// Test 4: Get favorites list
echo "\n4. Testing get favorites...\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $baseUrl . '/favorites');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: application/json',
    'Authorization: Bearer ' . $token
]);

$response = curl_exec($ch);
$favorites = json_decode($response, true);

if ($favorites && $favorites['success'] && count($favorites['data']) > 0) {
    echo "✓ Retrieved favorites list: " . count($favorites['data']) . " items\n";
    echo "First favorite: " . $favorites['data'][0]['name'] . "\n";
} else {
    echo "✗ Failed to get favorites: " . $response . "\n";
}

curl_close($ch);

// Test 5: Toggle favorite (should remove it)
echo "\n5. Testing toggle favorite (remove)...\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $baseUrl . '/favorites/toggle');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['property_id' => $propertyId]));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json',
    'Authorization: Bearer ' . $token
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$result = json_decode($response, true);

if ($result && $result['success']) {
    echo "✓ Toggle successful: " . $result['message'] . "\n";
} else {
    echo "✗ Toggle failed: " . $response . "\n";
}

curl_close($ch);

echo "\n✅ All tests completed!\n";