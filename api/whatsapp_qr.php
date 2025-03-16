<?php
require_once('../db_config.php');

// Check if API key is provided
if (!isset($_GET['api_key']) || empty($_GET['api_key'])) {
    sendJsonResponse(['success' => false, 'error' => 'API key is required']);
}

$apiKey = $_GET['api_key'];

try {
    $conn = getDbConnection();
    
    // Sanitize input
    $apiKey = $conn->real_escape_string($apiKey);
    
    // Get QR code for the API key
    $query = "SELECT qr_code, status FROM whatsapp_settings WHERE api_key = '$apiKey' LIMIT 1";
    $result = $conn->query($query);
    
    if ($result && $result->num_rows > 0) {
        $row = $result->fetch_assoc();
        
        if ($row['status'] === 'connected') {
            sendJsonResponse([
                'success' => true,
                'connected' => true,
                'message' => 'Already connected to WhatsApp'
            ]);
        } else if (!empty($row['qr_code'])) {
            sendJsonResponse([
                'success' => true,
                'qr_code' => $row['qr_code'],
                'status' => $row['status']
            ]);
        } else {
            // No QR code yet, need to generate one (in real app, would call WhatsApp API)
            sendJsonResponse([
                'success' => false,
                'error' => 'No QR code available. Try reconnecting first.'
            ]);
        }
    } else {
        sendJsonResponse([
            'success' => false,
            'error' => 'Settings not found for the provided API key'
        ]);
    }
} catch (Exception $e) {
    sendJsonResponse(['success' => false, 'error' => 'An error occurred: ' . $e->getMessage()]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>