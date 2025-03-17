import React, { useState, useEffect } from 'react';

const SaveModal = ({ chatbotData, onSave, onClose }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState({ success: false, message: '' });

  // Initialize form with chatbot data if available
  useEffect(() => {
    if (chatbotData) {
      setName(chatbotData.name || '');
      setDescription(chatbotData.description || '');
    }
  }, [chatbotData]);

  const handleSave = async () => {
    if (!name) {
      alert('יש להזין שם לצ\'אטבוט');
      return;
    }

    setSaving(true);
    setSaveResult({ success: false, message: '' });

    try {
      const result = await onSave(name, description);

      if (result.success) {
        setSaveResult({
          success: true,
          message: 'הצ\'אטבוט נשמר בהצלחה!'
        });
      } else {
        setSaveResult({
          success: false,
          message: result.error || 'שגיאה בשמירת הצ\'אטבוט'
        });
      }
    } catch (error) {
      console.error('Error saving chatbot:', error);
      setSaveResult({
        success: false,
        message: 'שגיאה בשמירת הצ\'אטבוט'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" id="save-modal">
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">שמירת הצ'אטבוט</h2>
          <button className="close-modal" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <form id="save-form">
            <div className="form-group">
              <label htmlFor="chatbot-name">שם הצ'אטבוט:</label>
              <input 
                type="text" 
                id="chatbot-name" 
                placeholder="לדוגמה: צ'אטבוט שירות לקוחות" 
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="chatbot-description">תיאור:</label>
              <textarea 
                id="chatbot-description" 
                placeholder="תיאור קצר של הצ'אטבוט והמטרה שלו..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>
            </div>
            
            {saveResult.message && (
              <div id="save-result" style={{ marginTop: '20px' }}>
                <div className={`alert alert-${saveResult.success ? 'success' : 'error'}`}>
                  {saveResult.message}
                </div>
              </div>
            )}
          </form>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>ביטול</button>
          <button 
            className="btn btn-primary" 
            id="do-save-btn" 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> שומר...
              </>
            ) : 'שמור צ\'אטבוט'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveModal;