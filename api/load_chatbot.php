<?php
require_once('../db_config.php');
// Check if ID is provided
if (!isset($_GET['id']) || empty($_GET['id'])) {
    sendJsonResponse(['success' => false, 'error' => 'No chatbot ID provided']);
}

$chatbotId = $_GET['id'];
try {
    $conn = getDbConnection();
    // Sanitize input
    $chatbotId = $conn->real_escape_string($chatbotId);
    
    // Query to get chatbot
    $query = "SELECT id, name, description, data, created_at, updated_at FROM chatbots WHERE id = '$chatbotId'";
    $result = $conn->query($query);
    
    if ($result && $result->num_rows > 0) {
        $chatbot = $result->fetch_assoc();
        
        // Log raw data for debugging
        error_log("Raw data from DB: " . $chatbot['data']);
        
        // Decode the JSON data
        $flowData = json_decode($chatbot['data'], true);
        
        // Check for JSON errors
        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log("JSON decode error: " . json_last_error_msg());
            sendJsonResponse(['success' => false, 'error' => 'Error decoding JSON data']);
            exit;
        }
        
        // Create the result object with the expected structure
        $result = [
            'success' => true,
            'chatbot' => [
                'id' => $chatbot['id'],
                'name' => $chatbot['name'],
                'description' => $chatbot['description'],
                'created_at' => $chatbot['created_at'],
                'updated_at' => $chatbot['updated_at'],
                'flow' => $flowData  // Send the entire flow structure directly
            ]
        ];
        
        // Log the final structure
        error_log("Response structure: " . print_r($result, true));
        
        sendJsonResponse($result);
    } else {
        sendJsonResponse(['success' => false, 'error' => 'Chatbot not found']);
    }
} catch (Exception $e) {
    error_log("Exception in load_chatbot.php: " . $e->getMessage());
    sendJsonResponse(['success' => false, 'error' => 'An error occurred: ' . $e->getMessage()]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>