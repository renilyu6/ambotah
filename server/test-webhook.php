<?php

// Simple test script to test Make.com webhook
$webhookUrl = 'https://hook.eu2.make.com/8372gsmclmlfb8c2aoq1la18obgqkcq8';

$testData = [
    'test' => true,
    'name' => 'Test Customer',
    'email' => 'test@example.com',
    'message' => 'This is a test message from PHP',
    'rating' => 5,
    'timestamp' => date('c')
];

echo "Testing Make.com webhook...\n";
echo "URL: $webhookUrl\n";
echo "Data: " . json_encode($testData, JSON_PRETTY_PRINT) . "\n\n";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $webhookUrl);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($testData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'User-Agent: PHP-Test-Script/1.0'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_VERBOSE, true);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);

echo "Response Code: $httpCode\n";
echo "Response Body: $response\n";
echo "cURL Error: $error\n";

curl_close($ch);