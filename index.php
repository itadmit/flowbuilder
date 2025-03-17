<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
// Main entry point
session_start();

// Check if the database exists and tables are set up
$dbCheckNeeded = true;

if ($dbCheckNeeded) {
    // Try to connect to the database
    @$testConn = new mysqli('localhost', 'root', 'root', 'flow_builder');
    
    // If connection fails or tables don't exist, redirect to setup
    if ($testConn->connect_error || !$testConn->query("SHOW TABLES LIKE 'chatbots'")->num_rows) {
        header('Location: setup.php');
        exit;
    }
    
    $testConn->close();
}
?>
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FlowBuilder - בניית צ'אטבוטים בקלות</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Hebrew:wght@300;400;500;600;700&display=swap">
    <style>
        /* Loading screen styles */
        .loading-screen {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: #f9f9f9;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        }
        
        .spinner {
            border: 5px solid #f3f3f3;
            border-top: 5px solid #25D366;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        #root{
            width:100%
        }
    </style>
</head>
<body>
    <!-- Loading screen -->
    <div class="loading-screen" id="loading-screen">
        <div class="spinner"></div>
        <h2>טוען את FlowBuilder...</h2>
    </div>
    
    <!-- React root -->
    <div id="root"></div>
    
    <!-- React app bundle -->
    <script src="dist/bundle.js"></script>
    
    <script>
        // Hide loading screen when app is loaded
        window.addEventListener('load', function() {
            setTimeout(function() {
                document.getElementById('loading-screen').style.display = 'none';
            }, 500);
        });
    </script>

</body>
</html>