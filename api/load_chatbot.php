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
        
        // Decode the JSON data
        $chatbot['nodes'] = json_decode($chatbot['data'], true);
        unset($chatbot['data']); // Remove the raw JSON data
        
        sendJsonResponse(['success' => true, 'chatbot' => $chatbot]);
    } else {
        sendJsonResponse(['success' => false, 'error' => 'Chatbot not found']);
    }
} catch (Exception $e) {
    sendJsonResponse(['success' => false, 'error' => 'An error occurred: ' . $e->getMessage()]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>