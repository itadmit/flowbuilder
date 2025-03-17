<?php
require_once('../db_config.php');

// Check for POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(['success' => false, 'error' => 'Invalid request method']);
}

// Check if data was submitted
if (!isset($_POST['chatbot_data'])) {
    sendJsonResponse(['success' => false, 'error' => 'No data provided']);
}

// Get and decode the JSON data
$chatbotData = json_decode($_POST['chatbot_data'], true);
if (json_last_error() !== JSON_ERROR_NONE) {
    sendJsonResponse(['success' => false, 'error' => 'Invalid JSON data']);
}

// Add detailed logging
error_log('Received data structure: ' . print_r($chatbotData, true));

// Validate required fields
if (empty($chatbotData['name'])) {
    sendJsonResponse(['success' => false, 'error' => 'Name is required']);
}

// Check if nodes exist - now looking in the flow structure
if (empty($chatbotData['flow']) || empty($chatbotData['flow']['nodes'])) {
    error_log('Nodes missing. Data structure: ' . print_r($chatbotData, true));
    sendJsonResponse(['success' => false, 'error' => 'No nodes to save']);
}

try {
    $conn = getDbConnection();
    
    // Prepare the data for storage
    $name = $conn->real_escape_string($chatbotData['name']);
    $description = $conn->real_escape_string($chatbotData['description'] ?? '');
    
    // Store the entire flow data (nodes and edges)
    $data = $conn->real_escape_string(json_encode($chatbotData['flow']));
    
    // Check if we're updating an existing chatbot or creating a new one
    if (isset($chatbotData['id']) && !empty($chatbotData['id'])) {
        // Update existing chatbot
        $chatbotId = $conn->real_escape_string($chatbotData['id']);
        $query = "UPDATE chatbots SET name = '$name', description = '$description', data = '$data', updated_at = NOW() WHERE id = '$chatbotId'";
        
        if ($conn->query($query)) {
            sendJsonResponse(['success' => true, 'message' => 'Chatbot updated successfully', 'chatbot_id' => $chatbotId]);
        } else {
            sendJsonResponse(['success' => false, 'error' => 'Failed to update chatbot: ' . $conn->error]);
        }
    } else {
        // Create new chatbot
        $query = "INSERT INTO chatbots (name, description, data) VALUES ('$name', '$description', '$data')";
        
        if ($conn->query($query)) {
            $chatbotId = $conn->insert_id;
            sendJsonResponse(['success' => true, 'message' => 'Chatbot saved successfully', 'chatbot_id' => $chatbotId]);
        } else {
            sendJsonResponse(['success' => false, 'error' => 'Failed to save chatbot: ' . $conn->error]);
        }
    }
} catch (Exception $e) {
    sendJsonResponse(['success' => false, 'error' => 'An error occurred: ' . $e->getMessage()]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}

?>