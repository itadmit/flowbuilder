import React, { useState, useEffect } from 'react';

const ConnectModal = ({ onConnect, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connectionResult, setConnectionResult] = useState({ success: false, message: '' });
  const [checkInterval, setCheckIntervalId] = useState(null);

  // Load saved settings when modal opens
  useEffect(() => {
    fetch('api/get_whatsapp_settings.php')
      .then(response => response.json())
      .then(data => {
        if (data.success && data.settings) {
          setApiKey(data.settings.api_key || '');
          setPhoneNumber(data.settings.phone_number || '');
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
    setConnectionResult({ success: false, message: '' });

    try {
      const result = await onConnect(apiKey, phoneNumber);

      if (result.success) {
        if (result.status === 'qr_ready') {
          // QR code is ready, load it
          loadQrCode(apiKey);
        } else if (result.status === 'connected') {
          // Already connected
          setConnectionResult({
            success: true,
            message: 'החיבור הצליח! הצ\'אטבוט שלך מוכן לשימוש.'
          });
        } else {
          setConnectionResult({
            success: true,
            message: `סטטוס החיבור: ${result.status}`
          });
        }
      } else {
        setConnectionResult({
          success: false,
          message: result.error || 'לא ניתן להתחבר'
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

  const loadQrCode = (apiKey) => {
    fetch(`api/whatsapp_qr.php?api_key=${encodeURIComponent(apiKey)}`)
      .then(response => response.json())
      .then(data => {
        if (data.success && data.qr_code) {
          setQrCode(data.qr_code);
          setShowQR(true);

          // Start interval to check connection status
          const intervalId = setInterval(() => {
            checkConnectionStatus(apiKey);
          }, 3000);

          setCheckIntervalId(intervalId);
        } else {
          setConnectionResult({
            success: false,
            message: `שגיאה בטעינת קוד QR: ${data.error || 'לא ניתן לקבל קוד'}`
          });
        }
      })
      .catch(error => {
        console.error('QR code loading error:', error);
        setConnectionResult({
          success: false,
          message: 'שגיאה בטעינת קוד QR'
        });
      });
  };

  const checkConnectionStatus = (apiKey) => {
    fetch(`api/check_connection.php?api_key=${encodeURIComponent(apiKey)}`)
      .then(response => response.json())
      .then(statusData => {
        if (statusData.success && statusData.connected) {
          if (checkInterval) {
            clearInterval(checkInterval);
            setCheckIntervalId(null);
          }

          setConnectionResult({
            success: true,
            message: 'החיבור הצליח! הצ\'אטבוט שלך מוכן לשימוש.'
          });
        }
      })
      .catch(error => {
        console.error('Error checking connection status:', error);
      });
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
            
            {showQR && (
              <div id="qr-container" style={{ textAlign: 'center', marginTop: '20px' }}>
                <p>סרוק את קוד ה-QR באמצעות וואטסאפ בטלפון שלך:</p>
                <img id="qr-code" src={qrCode} alt="QR Code" style={{ maxWidth: '100%', margin: '15px 0' }} />
                <p><strong>הוראות:</strong> פתח את וואטסאפ &gt; הגדרות &gt; התקנים מקושרים &gt; קישור התקן</p>
              </div>
            )}
            
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