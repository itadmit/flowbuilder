<?php
require_once('../db_config.php');

// Check if API key is provided (optional)
$apiKey = isset($_GET['api_key']) ? $_GET['api_key'] : null;

try {
    $conn = getDbConnection();
    
    // Prepare query depending on whether API key is provided
    if ($apiKey) {
        $apiKey = $conn->real_escape_string($apiKey);
        $query = "SELECT status, last_connected FROM whatsapp_settings WHERE api_key = '$apiKey' LIMIT 1";
    } else {
        $query = "SELECT status, last_connected FROM whatsapp_settings ORDER BY last_connected DESC LIMIT 1";
    }
    
    $result = $conn->query($query);
    
    if ($result && $result->num_rows > 0) {
        $settings = $result->fetch_assoc();
        $isConnected = ($settings['status'] === 'connected');
        
        sendJsonResponse([
            'success' => true,
            'connected' => $isConnected,
            'status' => $settings['status'],
            'last_connected' => $settings['last_connected']
        ]);
    } else {
        sendJsonResponse([
            'success' => true,
            'connected' => false,
            'status' => 'never_connected',
            'message' => 'No connection settings found'
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