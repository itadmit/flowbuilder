import React, { useState, useEffect } from 'react';

const NodeEditModal = ({ node, onSave, onClose, onDelete }) => {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [options, setOptions] = useState([]);
  const [delayType, setDelayType] = useState('wait');
  const [delaySeconds, setDelaySeconds] = useState(5);

  // Initialize form with node data
  useEffect(() => {
    if (node) {
      setName(node.data.name || '');
      setMessage(node.data.message || '');
      
      if (node.data.options) {
        setOptions(node.data.options);
      } else {
        setOptions(['']);
      }
      
      if (node.data.delay) {
        setDelayType(node.data.delay.type || 'wait');
        setDelaySeconds(node.data.delay.seconds || 5);
      }
    }
  }, [node]);

  const handleSave = () => {
    // Create updated node data
    const updatedData = {
      ...node.data,
      name: name || getDefaultNameByType(node.type),
      message: message || ''
    };

    // Handle options for options type
    if (node.type === 'optionsNode') {
      updatedData.options = options.filter(opt => opt.trim() !== '');
      
      // Ensure at least one option
      if (updatedData.options.length === 0) {
        updatedData.options = ['אפשרות 1'];
      }
    }

    // Handle delay settings for delay type
    if (node.type === 'delayNode') {
      updatedData.delay = {
        type: delayType,
        seconds: delayType === 'timeout' ? parseInt(delaySeconds) || 5 : 0
      };
    }

    onSave(updatedData);
  };

  const addOption = () => {
    setOptions([...options, '']);
  };

  const removeOption = (index) => {
    if (options.length > 1) {
      const newOptions = [...options];
      newOptions.splice(index, 1);
      setOptions(newOptions);
    } else {
      alert('חייבת להיות לפחות אפשרות אחת');
    }
  };

  const updateOption = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  // Helper function to get default name by node type
  const getDefaultNameByType = (type) => {
    switch (type) {
      case 'welcomeNode': return 'הודעת פתיחה';
      case 'textNode': return 'הודעת טקסט';
      case 'optionsNode': return 'אפשרויות בחירה';
      case 'delayNode': return 'השהייה';
      default: return 'צומת חדש';
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">עריכת צומת</h2>
          <button className="close-modal" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <form id="node-edit-form">
            <div className="form-group">
              <label htmlFor="node-name">שם הצומת:</label>
              <input 
                type="text" 
                id="node-name" 
                placeholder="לדוגמה: הודעת ברכה"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="node-message">הודעה:</label>
              <textarea 
                id="node-message" 
                placeholder="הטקסט שישלח ללקוח..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              ></textarea>
            </div>
            
            {/* Options fields */}
            {node?.type === 'optionsNode' && (
              <div id="options-fields">
                <h4>אפשרויות בחירה:</h4>
                <p className="hint" style={{ fontSize: '0.85rem', color: 'var(--gray-dark)', marginBottom: '10px' }}>
                  מספר את האפשרויות מ-1. הלקוח יבחר על ידי שליחת מספר.
                </p>
                
                <div id="options-container">
                  {options.map((option, index) => (
                    <div className="option-row" key={index}>
                      <div className="option-num">{index + 1}</div>
                      <input
                        type="text"
                        className="option-text"
                        placeholder={`אפשרות ${index + 1}...`}
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                      />
                      <button
                        type="button"
                        className="remove-option"
                        onClick={() => removeOption(index)}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  ))}
                </div>
                
                <button
                  type="button"
                  className="btn btn-small btn-outline add-option-btn"
                  onClick={addOption}
                >
                  <i className="fas fa-plus"></i> הוסף אפשרות
                </button>
              </div>
            )}
            
            {/* Delay fields */}
            {node?.type === 'delayNode' && (
              <div id="delay-fields">
                <div className="form-group">
                  <label htmlFor="delay-type">סוג השהייה:</label>
                  <select
                    id="delay-type"
                    value={delayType}
                    onChange={(e) => setDelayType(e.target.value)}
                  >
                    <option value="wait">המתנה לתגובה</option>
                    <option value="timeout">השהייה קבועה</option>
                  </select>
                </div>
                
                {delayType === 'timeout' && (
                  <div className="form-group" id="timeout-field">
                    <label htmlFor="delay-seconds">זמן השהייה (שניות):</label>
                    <input
                      type="number"
                      id="delay-seconds"
                      min="1"
                      value={delaySeconds}
                      onChange={(e) => setDelaySeconds(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}
          </form>
        </div>
        <div className="modal-footer">
          {node?.type !== 'welcomeNode' && (
            <button 
              className="btn btn-danger" 
              onClick={() => onDelete && onDelete(node.id)}
            >
              <i className="fas fa-trash"></i> מחק
            </button>
          )}
          <button className="btn btn-outline" onClick={onClose}>ביטול</button>
          <button className="btn btn-primary" id="save-node-btn" onClick={handleSave}>שמירה</button>
        </div>
      </div>
    </div>
  );
};

export default NodeEditModal;