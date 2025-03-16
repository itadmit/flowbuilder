<?php
require_once('../db_config.php');

try {
    $conn = getDbConnection();
    
    // Get the WhatsApp settings
    $query = "SELECT api_key, phone_number, status, last_connected FROM whatsapp_settings ORDER BY last_connected DESC LIMIT 1";
    $result = $conn->query($query);
    
    if ($result && $result->num_rows > 0) {
        $settings = $result->fetch_assoc();
        sendJsonResponse([
            'success' => true,
            'settings' => $settings
        ]);
    } else {
        sendJsonResponse([
            'success' => true,
            'settings' => null,
            'message' => 'No WhatsApp settings found'
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