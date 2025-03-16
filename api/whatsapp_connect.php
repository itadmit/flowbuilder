<?php
require_once('../db_config.php');

// Check for POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(['success' => false, 'error' => 'Invalid request method']);
}

// Check required fields
if (!isset($_POST['api_key']) || empty($_POST['api_key'])) {
    sendJsonResponse(['success' => false, 'error' => 'API key is required']);
}

if (!isset($_POST['phone_number']) || empty($_POST['phone_number'])) {
    sendJsonResponse(['success' => false, 'error' => 'Phone number is required']);
}

$apiKey = $_POST['api_key'];
$phoneNumber = $_POST['phone_number'];

try {
    $conn = getDbConnection();
    
    // Sanitize input
    $apiKey = $conn->real_escape_string($apiKey);
    $phoneNumber = $conn->real_escape_string($phoneNumber);
    
    // Save settings to database
    $query = "SELECT id FROM whatsapp_settings LIMIT 1";
    $result = $conn->query($query);
    
    if ($result && $result->num_rows > 0) {
        // Update existing settings
        $settingsRow = $result->fetch_assoc();
        $query = "UPDATE whatsapp_settings SET api_key = '$apiKey', phone_number = '$phoneNumber', updated_at = NOW() WHERE id = '{$settingsRow['id']}'";
        $conn->query($query);
    } else {
        // Insert new settings
        $query = "INSERT INTO whatsapp_settings (api_key, phone_number) VALUES ('$apiKey', '$phoneNumber')";
        $conn->query($query);
    }
    
    // Now we need to connect to WhatsApp API (this is a simulation)
    // In a real app, you would make a call to WhatsApp Cloud API or any other service
    
    // Simulate API call and get a response
    // In reality, you would use cURL or another HTTP client
    $connectionResult = simulateWhatsAppConnection($apiKey, $phoneNumber);
    
    // Update status in database
    $status = $connectionResult['success'] ? $connectionResult['status'] : 'error';
    $query = "UPDATE whatsapp_settings SET status = '$status'";
    
    // If we got a QR code, save it
    if (isset($connectionResult['qr_code'])) {
        $qrCode = $conn->real_escape_string($connectionResult['qr_code']);
        $query .= ", qr_code = '$qrCode'";
    }
    
    // If connected, update last_connected timestamp
    if ($status === 'connected') {
        $query .= ", last_connected = NOW()";
    }
    
    $query .= " WHERE api_key = '$apiKey'";
    $conn->query($query);
    
    sendJsonResponse($connectionResult);
} catch (Exception $e) {
    sendJsonResponse(['success' => false, 'error' => 'An error occurred: ' . $e->getMessage()]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}

// Simulation function for WhatsApp connection
// In a real app, this would call the actual WhatsApp API
function simulateWhatsAppConnection($apiKey, $phoneNumber) {
    // This is a simulation - in reality, you would call the actual API
    
    // For testing purposes, let's simulate different statuses based on the API key
    $apiKeyLength = strlen($apiKey);
    
    // Simulate successful connection (already connected)
    if ($apiKeyLength > 10 && substr($apiKey, -1) === '1') {
        return [
            'success' => true,
            'status' => 'connected',
            'message' => 'Already connected to WhatsApp'
        ];
    }
    
    // Simulate QR code needed
    if ($apiKeyLength > 5) {
        // Generate a fake QR code data URL (in reality, this would come from the WhatsApp API)
        $qrCode = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsAQAAAABRBrPYAAADKklEQVR42u2aTY7kIAyFLSUWWXKE5Ahr7nL6LHMEjpAliyipwXm4sZ3uUTczmkUvUKlUqgQI89mAMeDFx8fHx8fHx8fHxx8ex8z1BuvjdrDbAtZ1nasDADOYRFjV7Vbfa4ENMCwCzLwGavXRbwHIzVbNGkDmbb6A9a2TSwpNTdJ8s27zhjY7QPM2vxrm4yXNzSP1ekHMGwCww24RZN0AqZkrbDaMF6w3dPPy0ubzrWlm9/O9hbV5mz+beXnJ0TMAm2XeH8CgZr4eTeu9ofkKE2luu5bMvs1Xs+zN7dZcwxZB5tGTsJr9IcJ8sSJQ3YaWBvgwwHxbL5xvmMG23QCafXvJ0eRlTw9L5l4fMIzZoaH5tl5ozu3M3OClfBNpm2+waC+gljZfqCVJs8u3zQsYTYw0d/MNjDQxb7/9IcvGwXwx4lK8iWUGm3e6tXla3y0ZABj0m8EAb/YO9sYWnYAYGfAKdsDa5pvZvdhvT8FoBzTvtAxQ98PsrpllvVjS8/WDeSHnRJrZB4Cw6BQ7YLbf0QZA8+7aAJNu6w63qKwOgEWC3G9FDwY5eATk9qn3vHr5tjNGdnAGw3nbrzJ2+wFm2I23+T/D9Gwes8T2q6Ue8ygwA/N2vNUK66UBsO3vDlgze9jCYgVzBsOZdnADXMu8PCbAcO7wgqx+vQJjZwjbfAOs+drQ2+ZVLGl7aQVzBiPNnOsVmMX87jcLpHnf2R1gZod5aX2XmB2AFQZ298s8rcOzbX8HDGdvQb+aN7zFSvNQexI7YDR3oZiXCB1QLOcAjOZXSybADLZcHcMGAFK8GTDTfCXCfIMVS7oDZsA9nUXFYt6OVJ/abwOE/t4v83L85NuM+LDqBljbvKzAyKjsAG1ufwMkdQwXL2l+v31svgHCfA/Hw3p5aQXzGxgtxHKkadEQ+P8x77/4aL55WWpJK9gCVuy39RIpcQcU82Lm7Q8tbQZ7pZ5x2AE6XwH58hbA1sO1ZOL36zkELJsv93u1jgKzmbdYxeosVrBtviuWbQWDuT08r9bh9osBIvOyiIQf4F9O9vHx8fHx8fHx8ZPHH1cyfYokcGvrAAAAAElFTkSuQmCC";
        
        return [
            'success' => true,
            'status' => 'qr_ready',
            'qr_code' => $qrCode,
            'message' => 'Scan QR code to connect'
        ];
    }
    
    // Simulate error
    return [
        'success' => false,
        'error' => 'Invalid API key'
    ];
}
?>