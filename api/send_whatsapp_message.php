<?php
require_once('../db_config.php');

// Check if the request is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(['success' => false, 'error' => 'Invalid request method']);
    exit;
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

// Check if JSON is valid
if ($input === null) {
    sendJsonResponse(['success' => false, 'error' => 'Invalid JSON data']);
    exit;
}

// Get the phone number and message from the request
$phone = isset($input['phone']) ? trim($input['phone']) : '';
$message = isset($input['message']) ? trim($input['message']) : '';
$api_key = isset($input['api_key']) ? trim($input['api_key']) : '';

// If no API key provided, get it from the database
if (empty($api_key)) {
    try {
        $conn = getDbConnection();
        $query = "SELECT api_key FROM whatsapp_settings ORDER BY last_connected DESC LIMIT 1";
        $result = $conn->query($query);
        
        if ($result && $result->num_rows > 0) {
            $api_key = $result->fetch_assoc()['api_key'];
        } else {
            sendJsonResponse(['success' => false, 'error' => 'No WhatsApp settings found']);
            exit;
        }
    } catch (Exception $e) {
        error_log("Database error: " . $e->getMessage());
        sendJsonResponse(['success' => false, 'error' => 'Database error']);
        exit;
    } finally {
        if (isset($conn)) {
            $conn->close();
        }
    }
}

// Validate inputs
if (empty($api_key)) {
    sendJsonResponse(['success' => false, 'error' => 'API key is required']);
    exit;
}

if (empty($phone)) {
    sendJsonResponse(['success' => false, 'error' => 'Phone number is required']);
    exit;
}

if (empty($message)) {
    sendJsonResponse(['success' => false, 'error' => 'Message is required']);
    exit;
}

// Format phone number if needed (remove spaces, +, etc.)
$phone = preg_replace('/[^0-9]/', '', $phone);

// Make sure the phone number includes the country code
if (!preg_match('/^[0-9]{10,15}$/', $phone)) {
    sendJsonResponse(['success' => false, 'error' => 'Invalid phone number format']);
    exit;
}

// Send the message using the WhatsConnect API
$message_url = 'https://rappelsend.co.il/api/messages';

$ch = curl_init($message_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'phone' => $phone,
    'message' => $message
]));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'X-API-Key: ' . $api_key,
    'Content-Type: application/json'
]);

$response = curl_exec($ch);
$status_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// Log the API call
error_log("WhatsConnect API call: Status code: $status_code, Response: $response");

// Check for valid response
if ($status_code >= 200 && $status_code < 300) {
    $response_data = json_decode($response, true);
    
    // Log the successful message
    try {
        $conn = getDbConnection();
        $phone_escaped = $conn->real_escape_string($phone);
        $message_escaped = $conn->real_escape_string($message);
        $message_id = isset($response_data['messageId']) ? $conn->real_escape_string($response_data['messageId']) : 'unknown';
        
        $query = "INSERT INTO message_logs (phone_number, message, status, message_id, created_at) 
                  VALUES ('$phone_escaped', '$message_escaped', 'sent', '$message_id', NOW())";
        $conn->query($query);
    } catch (Exception $e) {
        error_log("Database error when logging message: " . $e->getMessage());
    } finally {
        if (isset($conn)) {
            $conn->close();
        }
    }
    
    sendJsonResponse([
        'success' => true,
        'messageId' => $response_data['messageId'] ?? null,
        'timestamp' => $response_data['timestamp'] ?? time()
    ]);
} else {
    // API request failed
    $error_data = json_decode($response, true);
    
    // Log the failed message
    try {
        $conn = getDbConnection();
        $phone_escaped = $conn->real_escape_string($phone);
        $message_escaped = $conn->real_escape_string($message);
        $error_msg = isset($error_data['error']) ? substr($conn->real_escape_string($error_data['error']), 0, 255) : 'API error';
        
        $query = "INSERT INTO message_logs (phone_number, message, status, error, created_at) 
                  VALUES ('$phone_escaped', '$message_escaped', 'failed', '$error_msg', NOW())";
        $conn->query($query);
    } catch (Exception $e) {
        error_log("Database error when logging message: " . $e->getMessage());
    } finally {
        if (isset($conn)) {
            $conn->close();
        }
    }
    
    sendJsonResponse([
        'success' => false,
        'error' => 'Failed to send WhatsApp message',
        'details' => $error_data ?? 'Error connecting to WhatsConnect API'
    ]);
}
?>