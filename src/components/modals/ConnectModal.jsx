import React, { useState, useEffect } from 'react';

const ConnectModal = ({ onConnect, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connectionResult, setConnectionResult] = useState({ success: false, message: '' });
  const [checkInterval, setCheckIntervalId] = useState(null);

  console.log("ConnectModal loaded - updated with full API support"); 

  // Load saved settings when modal opens
  useEffect(() => {
    fetch('api/get_whatsapp_settings.php')
      .then(response => response.json())
      .then(data => {
        if (data.success && data.settings) {
          setApiKey(data.settings.api_key || '');
          setPhoneNumber(data.settings.phone_number || '');
          console.log("Loaded settings from server");
        }
      })
      .catch(error => {
        console.error('Error loading WhatsApp settings:', error);
      });

    // Clear any existing interval when component mounts
    return () => {
      if (checkInterval) {
        clearInterval(checkInterval);
      }
    };
  }, []);

  const handleConnect = async () => {
    if (!apiKey) {
      alert('יש להזין מפתח API תקין');
      return;
    }
  
    if (!phoneNumber) {
      alert('יש להזין מספר טלפון תקין');
      return;
    }
  
    setConnecting(true);
    setConnectionResult({ success: false, message: 'בודק את החיבור...' });
    
    console.log("Connecting with API key:", apiKey.substring(0, 10) + "...");
  
    try {
      // בדיקת סטטוס
      const statusResponse = await fetch('https://rappelsend.co.il/api/status', {
        method: 'GET',
        headers: {
          'X-API-Key': apiKey
        }
      });
      
      const statusData = await statusResponse.json();
      console.log("Status check response:", statusData);
      
      if (statusData.success) {
        // יש חיבור קיים
        setConnectionResult({
          success: true,
          message: `החיבור קיים בסטטוס: ${statusData.status}`
        });
        
        // עדכון מקומי
        updateLocalSettings(apiKey, phoneNumber);
      } else if (statusData.error === 'Connection not found') {
        // אין חיבור - ניסיון לשלוח הודעה ישירה כדי לבדוק אם עובד בכל זאת
        console.log("No connection found, trying to send a message anyway");
        
        try {
          const sendResponse = await fetch('https://rappelsend.co.il/api/send-message', {
            method: 'POST',
            headers: {
              'X-API-Key': apiKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              phone: phoneNumber,
              message: "בדיקת חיבור"
            })
          });
          
          const sendData = await sendResponse.json();
          console.log("Send message response:", sendData);
          
          if (sendData.success) {
            // אם שליחת ההודעה עובדת, החיבור קיים אבל לא מופיע בנתיב /status
            setConnectionResult({
              success: true,
              message: `החיבור פעיל! הודעת בדיקה נשלחה בהצלחה.`
            });
            
            // עדכון מקומי
            updateLocalSettings(apiKey, phoneNumber);
          } else {
            // אין חיבור כלל
            setConnectionResult({
              success: false,
              message: `לא נמצא חיבור עם מפתח API זה. נא ליצור חיבור במערכת RappelSend.`
            });
          }
        } catch (sendError) {
          console.error("Error sending test message:", sendError);
          setConnectionResult({
            success: false,
            message: `שגיאה בבדיקת החיבור. נא ליצור חיבור במערכת RappelSend.`
          });
        }
      } else {
        // שגיאה אחרת
        setConnectionResult({
          success: false,
          message: statusData.error || 'שגיאה לא ידועה'
        });
      }
    } catch (error) {
      console.error('WhatsApp connection error:', error);
      setConnectionResult({
        success: false,
        message: 'שגיאה בחיבור לוואטסאפ'
      });
    } finally {
      setConnecting(false);
    }
  };

  const updateLocalSettings = async (apiKey, phoneNumber) => {
    try {
      const formData = new FormData();
      formData.append('api_key', apiKey);
      formData.append('phone_number', phoneNumber);
      
      await fetch('/api/whatsapp_connect.php', {
        method: 'POST',
        body: formData
      });
      console.log("Updated local database");
    } catch (error) {
      console.error("Error updating local settings:", error);
    }
  };

  // Clean up interval when component unmounts
  useEffect(() => {
    return () => {
      if (checkInterval) {
        clearInterval(checkInterval);
      }
    };
  }, [checkInterval]);

  return (
    <div className="modal-backdrop" id="connect-modal">
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">חיבור לוואטסאפ</h2>
          <button className="close-modal" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <form id="connect-form">
            <div className="form-group">
              <label htmlFor="api-key">מפתח API של WhatsConnect:</label>
              <input
                type="text"
                id="api-key"
                placeholder="הכנס את מפתח ה-API שלך כאן..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="phone-number">מספר הטלפון שלך:</label>
              <input
                type="tel"
                id="phone-number"
                placeholder="לדוגמה: 972501234567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <small style={{ display: 'block', marginTop: '5px', color: 'var(--gray-dark)' }}>
                יש להזין מספר עם קידומת מדינה, ללא מקפים או רווחים
              </small>
            </div>
            
            {connectionResult.message && (
              <div id="connection-result" style={{ marginTop: '20px' }}>
                <div className={`alert alert-${connectionResult.success ? 'success' : 'error'}`}>
                  {connectionResult.message}
                </div>
              </div>
            )}
          </form>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>סגור</button>
          <button
            className="btn btn-primary"
            id="connect-whatsapp-btn"
            onClick={handleConnect}
            disabled={connecting}
          >
            {connecting ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> מתחבר...
              </>
            ) : 'התחבר לוואטסאפ'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConnectModal;