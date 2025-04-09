<?php
require_once('../db_config.php');
// מניעת הצגת שגיאות כ-HTML (חשוב כשעובדים עם API)
header('Content-Type: application/json');

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
    
    // Connect to WhatsConnect API to verify the API key
    $statusUrl = 'https://rappelsend.co.il/api/status';
    
    // Initialize cURL session
    $ch = curl_init($statusUrl);
    
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
    // Set cURL options
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'X-API-Key: ' . $apiKey,
        'Content-Type: application/json'
    ]);
    
    // Execute cURL session
    $response = curl_exec($ch);
    if ($response === false) {
        error_log("cURL Error: " . curl_error($ch));
        sendJsonResponse(['success' => false, 'error' => 'cURL Error: ' . curl_error($ch)]);
        exit;
    }
    
    // לפני קריאת ה-API
error_log("API call to: $statusUrl with API key: [hidden]");

// אחרי קריאת ה-API
error_log("API response code: $httpCode");
error_log("API response: $response");
    
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    // Close cURL session
    curl_close($ch);
    
    // Check if the API call was successful
    if ($httpCode === 200) {
        $statusData = json_decode($response, true);
        
        // Check if already connected
        if ($statusData['status'] === 'connected' && $statusData['active']) {
            // Update status in database
            $query = "UPDATE whatsapp_settings SET status = 'connected', last_connected = NOW() WHERE api_key = '$apiKey'";
            $conn->query($query);
            
            sendJsonResponse([
                'success' => true,
                'status' => 'connected',
                'message' => 'החיבור הצליח! הצ\'אטבוט שלך מוכן לשימוש.'
            ]);
        } else {
            // Need to generate QR code (initiate connection)
            // Note: In the real WhatsConnect API, there might be a specific endpoint for this
            // For now, simulate a QR code initiation process
            
            // Here we would typically call the WhatsConnect API to generate a QR code
            // Since we don't have the exact endpoint, we'll simulate it
            
            // Set up a webhook to receive messages (if WhatsConnect supports this)
            $setupWebhookUrl = 'https://rappelsend.co.il/api/webhooks';
            
            $webhookData = [
                'url' => 'https://your-server.com/api/webhook_handler.php',
                'events' => ['message', 'status']
            ];
            
            $ch = curl_init($setupWebhookUrl);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($webhookData));
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'X-API-Key: ' . $apiKey,
                'Content-Type: application/json'
            ]);
            
            $webhookResponse = curl_exec($ch);
            curl_close($ch);
            
            // Generate a placeholder QR code data URL for demonstration
            // In a real scenario, this would come from the WhatsConnect API
            $qrCode = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsAQAAAABRBrPYAAADKklEQVR42u2aTY7kIAyFLSUWWXKE5Ahr7nL6LHMEjpAliyipwXm4sZ3uUTczmkUvUKlUqgQI89mAMeDFx8fHx8fHx8fHxx8ex8z1BuvjdrDbAtZ1nasDADOYRFjV7Vbfa4ENMCwCzLwGavXRbwHIzVbNGkDmbb6A9a2TSwpNTdJ8s27zhjY7QPM2vxrm4yXNzSP1ekHMGwCww24RZN0AqZkrbDaMF6w3dPPy0ubzrWlm9/O9hbV5mz+beXnJ0TMAm2XeH8CgZr4eTeu9ofkKE2luu5bMvs1Xs+zN7dZcwxZB5tGTsJr9IcJ8sSJQ3YaWBvgwwHxbL5xvmMG23QCafXvJ0eRlTw9L5l4fMIzZoaH5tl5ozu3M3OClfBNpm2+waC+gljZfqCVJs8u3zQsYTYw0d/MNjDQxb7/9IcvGwXwx4lK8iWUGm3e6tXla3y0ZABj0m8EAb/YO9sYWnYAYGfAKdsDa5pvZvdhvT8FoBzTvtAxQ98PsrpllvVjS8/WDeSHnRJrZB4Cw6BQ7YLbf0QZA8+7aAJNu6w63qKwOgEWC3G9FDwY5eATk9qn3vHr5tjNGdnAGw3nbrzJ2+wFm2I23+T/D9Gwes8T2q6Ue8ygwA/N2vNUK66UBsO3vDlgze9jCYgVzBsOZdnADXMu8PCbAcO7wgqx+vQJjZwjbfAOs+drQ2+ZVLGl7aQVzBiPNnOsVmMX87jcLpHnf2R1gZod5aX2XmB2AFQZ298s8rcOzbX8HDGdvQb+aN7zFSvNQexI7YDR3oZiXCB1QLOcAjOZXSybADLZcHcMGAFK8GTDTfCXCfIMVS7oDZsA9nUXFYt6OVJ/abwOE/t4v83L85NuM+LDqBljbvKzAyKjsAG1ufwMkdQwXL2l+v31svgHCfA/Hw3p5aQXzGxgtxHKkadEQ+P8x77/4aL55WWpJK9gCVuy39RIpcQcU82Lm7Q8tbQZ7pZ5x2AE6XwH58hbA1sO1ZOL36zkELJsv93u1jgKzmbdYxeosVrBtviuWbQWDuT08r9bh9osBIvOyiIQf4F9O9vHx8fHx8fHx8ZPHH1cyfYokcGvrAAAAAElFTkSuQmCC";
            
            // Update database with QR code
            $qrCode = $conn->real_escape_string($qrCode);
            $query = "UPDATE whatsapp_settings SET status = 'qr_ready', qr_code = '$qrCode' WHERE api_key = '$apiKey'";
            $conn->query($query);
            
            sendJsonResponse([
                'success' => true,
                'status' => 'qr_ready',
                'message' => 'סרוק את קוד ה-QR כדי להתחבר לוואטסאפ'
            ]);
        }
    } else {
        // API key is invalid or other error occurred
        $errorResponse = json_decode($response, true);
        $errorMessage = isset($errorResponse['error']) ? $errorResponse['error'] : 'שגיאה בהתחברות ל-WhatsConnect API';
        
        // Update status in database
        $query = "UPDATE whatsapp_settings SET status = 'error' WHERE api_key = '$apiKey'";
        $conn->query($query);
        
        sendJsonResponse([
            'success' => false,
            'error' => $errorMessage
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