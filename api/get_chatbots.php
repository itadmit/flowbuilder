<?php
require_once('../db_config.php');

try {
    $conn = getDbConnection();
    
    // Query to get all chatbots (only basic info, not the full data)
    $query = "SELECT id, name, description, created_at, updated_at FROM chatbots ORDER BY updated_at DESC";
    $result = $conn->query($query);
    
    $chatbots = [];
    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $chatbots[] = $row;
        }
        sendJsonResponse(['success' => true, 'chatbots' => $chatbots]);
    } else {
        sendJsonResponse(['success' => true, 'chatbots' => []]);
    }
} catch (Exception $e) {
    sendJsonResponse(['success' => false, 'error' => 'An error occurred: ' . $e->getMessage()]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>