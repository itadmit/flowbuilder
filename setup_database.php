<?php
// Database setup script
require_once('db_config.php');

// Create connection with root privileges
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Create database if not exists
$sql = "CREATE DATABASE IF NOT EXISTS " . DB_NAME . " CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
if ($conn->query($sql) !== TRUE) {
    die("Error creating database: " . $conn->error);
}
echo "Database created or already exists.<br>";

// Select the database
$conn->select_db(DB_NAME);

// Create chatbots table
$sql = "CREATE TABLE IF NOT EXISTS chatbots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    data LONGTEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)";

if ($conn->query($sql) !== TRUE) {
    die("Error creating chatbots table: " . $conn->error);
}
echo "Chatbots table created or already exists.<br>";

// Create whatsapp_settings table
$sql = "CREATE TABLE IF NOT EXISTS whatsapp_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    api_key VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    status VARCHAR(50) DEFAULT 'disconnected',
    last_connected TIMESTAMP NULL DEFAULT NULL,
    qr_code TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)";

if ($conn->query($sql) !== TRUE) {
    die("Error creating whatsapp_settings table: " . $conn->error);
}
echo "WhatsApp settings table created or already exists.<br>";

// Close connection
$conn->close();

echo "<br>Database setup completed successfully!";
?>