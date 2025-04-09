<?php
require_once('../db_config.php');

// Set content type to JSON
header('Content-Type: application/json');

// Check if API key is provided (optional)
$apiKey = isset($_GET['api_key']) ? $_GET['api_key'] : null;

try {
    $conn = getDbConnection();
    
    // If no API key provided in the request, get it from the database
    if (empty($apiKey)) {
        try {
            $query = "SELECT api_key FROM whatsapp_settings ORDER BY last_connected DESC LIMIT 1";
            $result = $conn->query($query);
            
            if ($result && $result->num_rows > 0) {
                $apiKey = $result->fetch_assoc()['api_key'];
            } else {
                sendJsonResponse(['success' => false, 'connected' => false, 'error' => 'No WhatsApp settings found']);
                exit;
            }
        } catch (Exception $e) {
            error_log("Database error: " . $e->getMessage());
            sendJsonResponse(['success' => false, 'connected' => false, 'error' => 'Database error']);
            exit;
        }
    }
    
    // Validate API key
    if (empty($apiKey)) {
        sendJsonResponse(['success' => false, 'connected' => false, 'error' => 'API key is required']);
        exit;
    }
    
    // Check the connection status using the WhatsConnect API
    $status_url = 'https://rappelsend.co.il/api/status';
    
    $ch = curl_init($status_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'X-API-Key: ' . $apiKey,
        'Content-Type: application/json'
    ]);
    
    $response = curl_exec($ch);
    $status_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    // Check for valid response
    if ($status_code == 200) {
        $status_data = json_decode($response, true);
        
        // Check if connected and active
        $connected = ($status_data['status'] === 'connected' && $status_data['active']);
        
        // Update the database with the latest status
        if ($connected) {
            $query = "UPDATE whatsapp_settings SET status = 'connected', last_connected = NOW() WHERE api_key = '$apiKey'";
            $conn->query($query);
        } else {
            $query = "UPDATE whatsapp_settings SET status = '{$status_data['status']}' WHERE api_key = '$apiKey'";
            $conn->query($query);
        }
        
        sendJsonResponse([
            'success' => true,
            'connected' => $connected,
            'status' => $status_data['status'] ?? 'unknown',
            'lastConnected' => $status_data['lastConnected'] ?? null
        ]);
    } else {
        // API request failed
        sendJsonResponse([
            'success' => false,
            'connected' => false,
            'error' => 'Failed to check WhatsApp connection status',
            'details' => json_decode($response, true) ?? 'Error connecting to WhatsConnect API'
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