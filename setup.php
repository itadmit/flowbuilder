<?php
// Setup page
session_start();

$setupComplete = false;
$errorMessage = '';
$successMessage = '';

// Process setup request
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['setup'])) {
    try {
        // Include the setup script
        require_once('setup_database.php');
        $setupComplete = true;
        $successMessage = 'ההתקנה הושלמה בהצלחה! אתה יכול להיכנס למערכת כעת.';
    } catch (Exception $e) {
        $errorMessage = 'שגיאה בהתקנה: ' . $e->getMessage();
    }
}
?>
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>התקנת FlowBuilder</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Hebrew:wght@300;400;500;600;700&display=swap">
    <style>
        :root {
            --primary-color: #25D366;
            --primary-dark: #128C7E;
            --secondary-color: #34B7F1;
            --dark-color: #075E54;
            --light-color: #ECE5DD;
            --success-color: #4CAF50;
            --error-color: #F44336;
            --warning-color: #FF9800;
            --gray-light: #f5f5f5;
            --gray: #e0e0e0;
            --gray-dark: #757575;
            --shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Noto Sans Hebrew', sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f9f9f9;
            padding: 30px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
        }
        
        .setup-container {
            background-color: white;
            border-radius: 10px;
            box-shadow: var(--shadow);
            padding: 30px;
            max-width: 600px;
            width: 100%;
        }
        
        h1 {
            color: var(--primary-color);
            margin-bottom: 20px;
            text-align: center;
        }
        
        .logo-container {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 30px;
        }
        
        .logo-icon {
            font-size: 2.5rem;
            color: var(--primary-color);
            margin-left: 10px;
        }
        
        .setup-info {
            margin-bottom: 20px;
            padding: 15px;
            border-radius: 5px;
            background-color: var(--gray-light);
        }
        
        .info-title {
            font-weight: 600;
            margin-bottom: 10px;
            color: var(--dark-color);
        }
        
        .setup-step {
            margin-bottom: 10px;
            display: flex;
            align-items: center;
        }
        
        .step-number {
            width: 24px;
            height: 24px;
            background-color: var(--primary-color);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 600;
            margin-left: 10px;
        }
        
        .button {
            display: inline-block;
            padding: 10px 20px;
            background-color: var(--primary-color);
            color: white;
            border: none;
            border-radius: 5px;
            font-weight: 600;
            cursor: pointer;
            text-align: center;
            text-decoration: none;
            font-family: 'Noto Sans Hebrew', sans-serif;
            font-size: 1rem;
            transition: background-color 0.3s;
        }
        
        .button:hover {
            background-color: var(--primary-dark);
        }
        
        .button-outline {
            background-color: transparent;
            color: var(--dark-color);
            border: 2px solid var(--dark-color);
        }
        
        .button-outline:hover {
            background-color: var(--dark-color);
            color: white;
        }
        
        .alert {
            padding: 10px 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        
        .alert-success {
            background-color: rgba(76, 175, 80, 0.1);
            color: var(--success-color);
            border: 1px solid var(--success-color);
        }
        
        .alert-error {
            background-color: rgba(244, 67, 54, 0.1);
            color: var(--error-color);
            border: 1px solid var(--error-color);
        }
        
        .buttons {
            margin-top: 20px;
            display: flex;
            justify-content: center;
            gap: 10px;
        }
    </style>
</head>
<body>
    <div class="setup-container">
        <div class="logo-container">
            <i class="fas fa-comments logo-icon"></i>
            <h1>התקנת FlowBuilder</h1>
        </div>
        
        <?php if ($successMessage): ?>
            <div class="alert alert-success">
                <?php echo $successMessage; ?>
            </div>
        <?php endif; ?>
        
        <?php if ($errorMessage): ?>
            <div class="alert alert-error">
                <?php echo $errorMessage; ?>
            </div>
        <?php endif; ?>
        
        <?php if (!$setupComplete): ?>
            <div class="setup-info">
                <div class="info-title">ברוכים הבאים להתקנת FlowBuilder</div>
                <p>לפני שתוכל להשתמש במערכת, יש להתקין את מסד הנתונים.</p>
                <p>ודא שיש לך את הפרטים הבאים:</p>
                
                <div class="setup-step">
                    <div class="step-number">1</div>
                    <div>שרת MySQL פעיל עם הגדרות ברירת המחדל (localhost)</div>
                </div>
                
                <div class="setup-step">
                    <div class="step-number">2</div>
                    <div>משתמש 'root' עם סיסמה 'root' (ניתן לשנות ב-db_config.php)</div>
                </div>
                
                <div class="setup-step">
                    <div class="step-number">3</div>
                    <div>הרשאות ליצירת מסדי נתונים וטבלאות</div>
                </div>
            </div>
            
            <form method="post" action="">
                <div class="buttons">
                    <button type="submit" name="setup" class="button">התקן עכשיו</button>
                </div>
            </form>
        <?php else: ?>
            <div class="buttons">
                <a href="index.php" class="button">כניסה למערכת</a>
            </div>
        <?php endif; ?>
    </div>
</body>
</html>