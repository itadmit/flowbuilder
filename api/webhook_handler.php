<?php
require_once('../db_config.php');

// הגדרות לוג
error_log("Webhook handler started: " . date('Y-m-d H:i:s'));

// קבלת הנתונים
$raw_post_data = file_get_contents('php://input');
error_log("Webhook received: " . $raw_post_data);

// פענוח JSON
$webhook_data = json_decode($raw_post_data, true);

// בדיקה שיש JSON תקין
if (json_last_error() !== JSON_ERROR_NONE) {
    error_log("JSON Error: " . json_last_error_msg());
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON data']);
    exit;
}

// לוג של המידע שהתקבל
error_log("Decoded webhook data: " . print_r($webhook_data, true));

// וידוא שיש את השדה event
if (!isset($webhook_data['event'])) {
    error_log("Missing event field in webhook data");
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid webhook data: missing event field']);
    exit;
}

// בדוק אם מדובר בהודעה מקבוצה ומתעלם במקרה כזה
if (isset($webhook_data['from']) && strpos($webhook_data['from'], '@g.us') !== false) {
    error_log("Ignoring group message from: " . $webhook_data['from']);
    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Group message ignored']);
    exit;
}

try {
    $conn = getDbConnection();
    
    // טיפול לפי סוג האירוע
    switch ($webhook_data['event']) {
        case 'message':
            // טיפול בהודעה נכנסת מוואטסאפ
            if (isset($webhook_data['from']) && isset($webhook_data['content'])) {
                $phone = $conn->real_escape_string($webhook_data['from']);
                // התוכן יכול להיות במבנים שונים
                $message = '';
                
                // בדיקת סוג ההודעה
                if (isset($webhook_data['content']['type']) && $webhook_data['content']['type'] === 'text') {
                    $message = $conn->real_escape_string($webhook_data['content']['text']);
                } else if (isset($webhook_data['content']['text'])) {
                    $message = $conn->real_escape_string($webhook_data['content']['text']);
                } else if (is_string($webhook_data['content'])) {
                    $message = $conn->real_escape_string($webhook_data['content']);
                } else {
                    // להודעות לא טקסטואליות, שמור את סוג התוכן
                    $message = $conn->real_escape_string('Content type: ' . (isset($webhook_data['content']['type']) ? $webhook_data['content']['type'] : 'unknown'));
                }
                
                $messageId = isset($webhook_data['message_id']) ? $conn->real_escape_string($webhook_data['message_id']) : 'unknown';
                
                // שמירת ההודעה הנכנסת במסד הנתונים
                $query = "INSERT INTO incoming_messages (phone_number, message, message_id, created_at) 
                          VALUES ('$phone', '$message', '$messageId', NOW())";
                          
                if ($conn->query($query)) {
                    $incomingMessageId = $conn->insert_id;
                    
                    // עיבוד ההודעה עם תגובת הצ'אטבוט המתאימה
                    processChatbotResponse($phone, $message, $incomingMessageId, $conn);
                    
                    // מענה לוואטסקונקט שקיבלנו את ההודעה
                    error_log("Message received and logged successfully.");
                    echo json_encode(['success' => true, 'message' => 'Message received and processed']);
                } else {
                    error_log("Database error when logging incoming message: " . $conn->error);
                    http_response_code(500);
                    echo json_encode(['success' => false, 'error' => 'Failed to log message: ' . $conn->error]);
                }
            } else {
                error_log("Missing from or content fields in message webhook");
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Invalid message format']);
            }
            break;
            
        case 'status':
            // טיפול בעדכוני סטטוס הודעות
            if (isset($webhook_data['messageId']) && isset($webhook_data['status'])) {
                $messageId = $conn->real_escape_string($webhook_data['messageId']);
                $status = $conn->real_escape_string($webhook_data['status']);
                
                // עדכון סטטוס ההודעה במסד הנתונים
                $query = "UPDATE message_logs SET status = '$status' WHERE message_id = '$messageId'";
                if ($conn->query($query)) {
                    error_log("Message status updated: $messageId -> $status");
                    echo json_encode(['success' => true, 'message' => 'Status updated']);
                } else {
                    error_log("Failed to update message status: " . $conn->error);
                    http_response_code(500);
                    echo json_encode(['success' => false, 'error' => 'Failed to update status']);
                }
            } else {
                error_log("Missing fields in status webhook");
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Invalid status format']);
            }
            break;
            
        case 'connection':
            // טיפול בשינויי סטטוס חיבור
            $status = isset($webhook_data['status']) ? $conn->real_escape_string($webhook_data['status']) : 'unknown';
            
            // עדכון סטטוס חיבור וואטסאפ במסד הנתונים
            $query = "UPDATE whatsapp_settings SET status = '$status'";
            if ($status === 'connected') {
                $query .= ", last_connected = NOW()";
            }
            $query .= " ORDER BY id DESC LIMIT 1";
            
            if ($conn->query($query)) {
                error_log("WhatsApp connection status updated: $status");
                echo json_encode(['success' => true, 'message' => 'Connection status updated']);
            } else {
                error_log("Failed to update connection status: " . $conn->error);
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Failed to update connection status']);
            }
            break;
            
        default:
            // טיפול באירועים אחרים
            error_log("Unhandled webhook event type: " . $webhook_data['event']);
            echo json_encode(['success' => true, 'message' => 'Event received but not processed']);
    }
} catch (Exception $e) {
    error_log("Exception in webhook_handler.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'An error occurred: ' . $e->getMessage()]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}

/**
 * עיבוד הודעה נכנסת עם תגובת הצ'אטבוט המתאימה
 * 
 * @param string $phone מספר הטלפון לשליחת התגובה
 * @param string $message טקסט ההודעה הנכנסת
 * @param int $messageId המזהה במסד הנתונים של ההודעה הנכנסת
 * @param mysqli $conn חיבור למסד הנתונים
 */
function processChatbotResponse($phone, $message, $messageId, $conn) {
    // בדוק אם קיימת שיחה פעילה למספר הזה
    $query = "SELECT * FROM chatbot_sessions WHERE phone_number = '$phone' LIMIT 1";
    $result = $conn->query($query);
    $session = null;
    
    // קבלת הצ'אטבוט האחרון שעודכן
    $chatbotQuery = "SELECT id, data FROM chatbots ORDER BY updated_at DESC LIMIT 1";
    $chatbotResult = $conn->query($chatbotQuery);
    
    if (!$chatbotResult || $chatbotResult->num_rows === 0) {
        error_log("No chatbot found in the database");
        sendWhatsAppResponse($phone, 'שלום! תודה על פנייתך, מישהו יחזור אליך בהקדם.');
        return;
    }
    
    $chatbot = $chatbotResult->fetch_assoc();
    $chatbotId = $chatbot['id'];
    $chatbotData = json_decode($chatbot['data'], true);
    
    // אם ה-JSON מאוחסן כמחרוזת עם תווי escape, נסה לנקות אותם
    if (!$chatbotData) {
        $cleanData = stripslashes($chatbot['data']);
        $chatbotData = json_decode($cleanData, true);
    }
    
    error_log("Chatbot data loaded for ID: $chatbotId");
    
    if (!$chatbotData || !isset($chatbotData['nodes']) || !isset($chatbotData['edges'])) {
        error_log("Invalid chatbot data structure for chatbot ID: $chatbotId");
        error_log("Chatbot data: " . substr(print_r($chatbot['data'], true), 0, 200) . "...");
        sendWhatsAppResponse($phone, 'שגיאה במערכת. אנא נסה שוב מאוחר יותר.');
        return;
    }
    
    error_log("Chatbot structure - Nodes: " . count($chatbotData['nodes']) . ", Edges: " . count($chatbotData['edges']));
    
    // סימון ההודעה כמעובדת
    $query = "UPDATE incoming_messages SET processed = 1 WHERE id = $messageId";
    $conn->query($query);
    
    // אם קיימת שיחה פעילה
    if ($result && $result->num_rows > 0) {
        $session = $result->fetch_assoc();
        $currentNodeId = $session['current_node_id'];
        
        error_log("Existing session found for $phone, current node: $currentNodeId");
        
        // מצא את הצומת הנוכחי
        $currentNode = null;
        foreach ($chatbotData['nodes'] as $node) {
            if ($node['id'] === $currentNodeId) {
                $currentNode = $node;
                break;
            }
        }
        
        if (!$currentNode) {
            error_log("Current node $currentNodeId not found in chatbot");
            
            // התחל שיחה חדשה
            startNewSession($phone, $chatbotId, $chatbotData, $conn);
            return;
        }
        
        // טיפול בהודעת המשתמש בהתאם לסוג הצומת הנוכחי
        if ($currentNode['type'] === 'optionsNode') {
            processOptionsNodeResponse($phone, $message, $currentNode, $chatbotData, $conn);
        } else if ($currentNode['type'] === 'textNode' || $currentNode['type'] === 'welcomeNode') {
            // לצמתים רגילים, פשוט עבור לצומת הבא אם קיים
            moveToNextNode($phone, $currentNodeId, $chatbotData, $conn);
        } else if ($currentNode['type'] === 'delayNode') {
            // אם זה צומת השהייה, פשוט קבל את התגובה מהמשתמש ועבור הלאה
            moveToNextNode($phone, $currentNodeId, $chatbotData, $conn);
        } else {
            error_log("Unknown node type: " . $currentNode['type']);
            sendWhatsAppResponse($phone, 'אירעה שגיאה, מתחיל שיחה מחדש...');
            startNewSession($phone, $chatbotId, $chatbotData, $conn);
        }
    } else {
        // אם אין שיחה פעילה, התחל שיחה חדשה
        startNewSession($phone, $chatbotId, $chatbotData, $conn);
    }
}

/**
 * התחלת שיחה חדשה
 */
function startNewSession($phone, $chatbotId, $chatbotData, $conn) {
    error_log("Starting new session for $phone with chatbot $chatbotId");
    
    // מצא את צומת הפתיחה
    $welcomeNode = null;
    foreach ($chatbotData['nodes'] as $node) {
        if ($node['type'] === 'welcomeNode') {
            $welcomeNode = $node;
            break;
        }
    }
    
    if (!$welcomeNode) {
        error_log("No welcome node found in chatbot $chatbotId");
        sendWhatsAppResponse($phone, 'ברוך הבא! איך אוכל לעזור לך?');
        return;
    }
    
    // שמור את השיחה החדשה
    $welcomeNodeId = $welcomeNode['id'];
    $query = "INSERT INTO chatbot_sessions (phone_number, chatbot_id, current_node_id, last_interaction) 
              VALUES ('$phone', $chatbotId, '$welcomeNodeId', NOW())
              ON DUPLICATE KEY UPDATE 
              chatbot_id = $chatbotId, 
              current_node_id = '$welcomeNodeId', 
              last_interaction = NOW()";
    
    if (!$conn->query($query)) {
        error_log("Error creating new session: " . $conn->error);
    }
    
    // שלח את הודעת הפתיחה
    $welcomeMessage = $welcomeNode['data']['message'] ?? 'ברוך הבא! איך אוכל לעזור לך?';
    
    // אם זה צומת אפשרויות, הוסף את האפשרויות באותה הודעה
    if (isset($welcomeNode['data']['options']) && is_array($welcomeNode['data']['options'])) {
        $welcomeMessage .= "\n\n";
        foreach ($welcomeNode['data']['options'] as $index => $option) {
            $welcomeMessage .= ($index + 1) . '. ' . $option . "\n";
        }
    }
    
    sendWhatsAppResponse($phone, $welcomeMessage);
    
    // מעבר אוטומטי לצומת הבא אם קיים
    moveToNextNode($phone, $welcomeNodeId, $chatbotData, $conn);
}

/**
 * עיבוד תגובה לצומת אפשרויות
 */
function processOptionsNodeResponse($phone, $message, $currentNode, $chatbotData, $conn) {
    error_log("Processing options node response for $phone: '$message'");
    
    $selectedOptionIndex = null;
    
    // נסה לזהות אם המשתמש בחר אפשרות (מספר או טקסט)
    if (is_numeric($message)) {
        $optionIndex = intval($message) - 1; // המשתמשים מתחילים ממספר 1
        
        if (isset($currentNode['data']['options'][$optionIndex])) {
            $selectedOptionIndex = $optionIndex;
        }
    } else {
        // חיפוש טקסטואלי באפשרויות
        foreach ($currentNode['data']['options'] as $index => $option) {
            if (strtolower(trim($option)) === strtolower(trim($message))) {
                $selectedOptionIndex = $index;
                break;
            }
        }
    }
    
    if ($selectedOptionIndex !== null) {
        error_log("User selected option $selectedOptionIndex");
        
        // מצא את הקצה שמתאים לאפשרות שנבחרה
        $nextNodeId = null;
        
        // הפורמט של ה-edge הוא: "option-X" כאשר X הוא האינדקס של האפשרות
        $sourceHandle = "option-" . $selectedOptionIndex;
        
        foreach ($chatbotData['edges'] as $edge) {
            // בדוק אם ה-source הוא הצומת הנוכחי וה-sourceHandle מתאים לאפשרות
            if ($edge['source'] === $currentNode['id'] && $edge['sourceHandle'] === $sourceHandle) {
                $nextNodeId = $edge['target'];
                error_log("Found edge: {$edge['id']} connecting to node: $nextNodeId");
                break;
            }
        }
        
        if ($nextNodeId) {
            // מצא את הצומת הבא
            $nextNode = null;
            foreach ($chatbotData['nodes'] as $node) {
                if ($node['id'] === $nextNodeId) {
                    $nextNode = $node;
                    break;
                }
            }
            
            if ($nextNode) {
                // עדכן את הצומת הנוכחי בשיחה
                $query = "UPDATE chatbot_sessions SET 
                          current_node_id = '$nextNodeId', 
                          last_interaction = NOW() 
                          WHERE phone_number = '$phone'";
                          
                if (!$conn->query($query)) {
                    error_log("DB error updating session: " . $conn->error);
                }
                
                // שלח את הודעת הצומת הבא עם האפשרויות באותה הודעה אם צריך
                $nextMessage = $nextNode['data']['message'] ?? 'המשך...';
                
                if ($nextNode['type'] === 'optionsNode' && 
                    isset($nextNode['data']['options']) && 
                    is_array($nextNode['data']['options'])) {
                    $nextMessage .= "\n\n";
                    foreach ($nextNode['data']['options'] as $index => $option) {
                        $nextMessage .= ($index + 1) . '. ' . $option . "\n";
                    }
                }
                
                sendWhatsAppResponse($phone, $nextMessage);
                return;
            }
        }
        
        // אם לא נמצא צומת המשך, שלח הודעת שגיאה
        sendWhatsAppResponse($phone, 'אין המשך מוגדר לאפשרות זו.');
    } else {
        // המשתמש לא בחר אפשרות תקפה
        $optionsMessage = 'אנא בחר אפשרות מהרשימה:' . "\n\n";
        
        // שלח שוב את האפשרויות
        if (isset($currentNode['data']['options']) && is_array($currentNode['data']['options'])) {
            foreach ($currentNode['data']['options'] as $index => $option) {
                $optionsMessage .= ($index + 1) . '. ' . $option . "\n";
            }
        }
        
        sendWhatsAppResponse($phone, $optionsMessage);
    }
}

/**
 * מעבר לצומת הבא
 */
function moveToNextNode($phone, $currentNodeId, $chatbotData, $conn) {
    error_log("Moving to next node from $currentNodeId");
    
    // מצא את הקצה היוצא מהצומת הנוכחי
    $nextNodeId = null;
    
    // בדוק אם יש קצה יוצא מהצומת הנוכחי
    foreach ($chatbotData['edges'] as $edge) {
        if ($edge['source'] === $currentNodeId && 
            (empty($edge['sourceHandle']) || $edge['sourceHandle'] === 'out')) {
            $nextNodeId = $edge['target'];
            error_log("Found edge to next node: $nextNodeId");
            break;
        }
    }
    
    if ($nextNodeId) {
        // מצא את הצומת הבא
        $nextNode = null;
        foreach ($chatbotData['nodes'] as $node) {
            if ($node['id'] === $nextNodeId) {
                $nextNode = $node;
                break;
            }
        }
        
        if ($nextNode) {
            // עדכן את הצומת הנוכחי בשיחה
            $query = "UPDATE chatbot_sessions SET 
                      current_node_id = '$nextNodeId', 
                      last_interaction = NOW() 
                      WHERE phone_number = '$phone'";
                      
            if (!$conn->query($query)) {
                error_log("DB error updating session: " . $conn->error);
            }
            
            // שלח את הודעת הצומת הבא עם האפשרויות באותה הודעה אם צריך
            $nextMessage = $nextNode['data']['message'] ?? 'המשך...';
            
            if ($nextNode['type'] === 'optionsNode' && 
                isset($nextNode['data']['options']) && 
                is_array($nextNode['data']['options'])) {
                $nextMessage .= "\n\n";
                foreach ($nextNode['data']['options'] as $index => $option) {
                    $nextMessage .= ($index + 1) . '. ' . $option . "\n";
                }
            }
            
            sendWhatsAppResponse($phone, $nextMessage);
        }
    }
    // אם אין צומת המשך, פשוט המשך
}

/**
 * שליחת תגובת וואטסאפ למספר טלפון מסוים
 * 
 * @param string $phone מספר הטלפון לשליחת ההודעה
 * @param string $message טקסט ההודעה לשליחה
 * @return bool true אם ההודעה נשלחה בהצלחה, false אחרת
 */
function sendWhatsAppResponse($phone, $message) {
    try {
        // קבלת מפתח API ממסד הנתונים
        $conn = getDbConnection();
        $query = "SELECT api_key FROM whatsapp_settings ORDER BY last_connected DESC LIMIT 1";
        $result = $conn->query($query);
        
        if ($result && $result->num_rows > 0) {
            $apiKey = $result->fetch_assoc()['api_key'];
            
            // סגירת חיבור למסד הנתונים לפני ביצוע בקשת HTTP
            $conn->close();
            
            // שליחת הודעה באמצעות API וואטסאפ
            $url = 'https://rappelsend.co.il/api/send-message';
            
            $data = [
                'phone' => $phone,
                'message' => $message
            ];
            
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'X-API-Key: ' . $apiKey,
                'Content-Type: application/json'
            ]);
            
            $response = curl_exec($ch);
            $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            // לוג התוצאה
            error_log("WhatsApp response sent to $phone. Status: $statusCode, Response: $response");
            
            // רישום ההודעה שנשלחה
            logSentMessage($phone, $message, $response);
            
            return ($statusCode >= 200 && $statusCode < 300);
        } else {
            error_log("No WhatsApp settings found in database");
            return false;
        }
    } catch (Exception $e) {
        error_log("Error sending WhatsApp response: " . $e->getMessage());
        return false;
    }
}

/**
 * שמירת לוג של הודעה שנשלחה
 */
function logSentMessage($phone, $message, $response) {
    try {
        $conn = getDbConnection();
        
        // חילוץ message_id מהתשובה
        $messageId = '';
        $responseData = json_decode($response, true);
        if ($responseData && isset($responseData['messageId'])) {
            $messageId = $conn->real_escape_string($responseData['messageId']);
        }
        
        // שמירת ההודעה בטבלת הלוגים
        $message = $conn->real_escape_string($message);
        $phone = $conn->real_escape_string($phone);
        
        $query = "INSERT INTO message_logs (phone_number, message, message_id, status, created_at) 
                  VALUES ('$phone', '$message', '$messageId', 'sent', NOW())";
        $conn->query($query);
        
        $conn->close();
    } catch (Exception $e) {
        error_log("Error logging sent message: " . $e->getMessage());
    }
}

/**
 * וידוא שטבלאות מסד הנתונים קיימות
 */
function ensureDatabaseTablesExist() {
    try {
        $conn = getDbConnection();
        
        // בדיקה וייצור טבלת chatbot_sessions אם לא קיימת
        $query = "CREATE TABLE IF NOT EXISTS chatbot_sessions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            phone_number VARCHAR(20) NOT NULL,
            chatbot_id INT NOT NULL,
            current_node_id VARCHAR(50) NOT NULL,
            state_data TEXT NULL,
            last_interaction DATETIME NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE INDEX (phone_number)
        )";
        $conn->query($query);
        
        // בדיקה וייצור טבלת incoming_messages אם לא קיימת
        $query = "CREATE TABLE IF NOT EXISTS incoming_messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            phone_number VARCHAR(20) NOT NULL,
            message TEXT NOT NULL,
            message_id VARCHAR(50) NOT NULL,
            processed TINYINT(1) DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )";
        $conn->query($query);
        
        // בדיקה וייצור טבלת message_logs אם לא קיימת
        $query = "CREATE TABLE IF NOT EXISTS message_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            phone_number VARCHAR(20) NOT NULL,
            message TEXT NOT NULL,
            message_id VARCHAR(50) NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'pending',
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )";
        $conn->query($query);
        
        $conn->close();
    } catch (Exception $e) {
        error_log("Error ensuring database tables: " . $e->getMessage());
    }
}

// יצירת הטבלאות בעת הצורך
ensureDatabaseTablesExist();
?>