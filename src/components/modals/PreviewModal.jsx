// components/modals/PreviewModal.jsx
import React, { useState, useEffect, useRef } from 'react';

const PreviewModal = ({ nodes, onClose }) => {
  const [messages, setMessages] = useState([]);
  const messagesContainerRef = useRef(null);

  // Initialize preview with welcome message
  useEffect(() => {
    if (Object.keys(nodes).length === 0) {
      setMessages([{
        type: 'bot',
        text: 'אין הודעת פתיחה מוגדרת',
        time: getCurrentTime()
      }]);
      return;
    }

    const welcomeNode = Object.values(nodes).find(node => node.type === 'welcome');
    if (!welcomeNode) {
      setMessages([{
        type: 'bot',
        text: 'אין הודעת פתיחה מוגדרת',
        time: getCurrentTime()
      }]);
      return;
    }

    let initialMessages = [{
      type: 'bot',
      text: welcomeNode.message,
      time: getCurrentTime()
    }];

    // Add options if available
    if (welcomeNode.type === 'options' && welcomeNode.options && welcomeNode.options.length > 0) {
      let optionsText = '';
      welcomeNode.options.forEach((option, index) => {
        optionsText += `${index + 1}. ${option}\n`;
      });
      
      initialMessages.push({
        type: 'bot',
        text: optionsText,
        time: getCurrentTime()
      });
    }

    setMessages(initialMessages);
  }, [nodes]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Get current time in HH:MM format
  const getCurrentTime = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  // Add a bot message
  const addBotMessage = (text) => {
    setMessages([...messages, {
      type: 'bot',
      text,
      time: getCurrentTime()
    }]);
  };

  // Add a user message
  const addUserMessage = (text) => {
    setMessages([...messages, {
      type: 'user',
      text,
      time: getCurrentTime()
    }]);
  };

  // Restart the preview
  const restartPreview = () => {
    const welcomeNode = Object.values(nodes).find(node => node.type === 'welcome');
    if (!welcomeNode) {
      setMessages([{
        type: 'bot',
        text: 'אין הודעת פתיחה מוגדרת',
        time: getCurrentTime()
      }]);
      return;
    }

    let initialMessages = [{
      type: 'bot',
      text: welcomeNode.message,
      time: getCurrentTime()
    }];

    // Add options if available
    if (welcomeNode.type === 'options' && welcomeNode.options && welcomeNode.options.length > 0) {
      let optionsText = '';
      welcomeNode.options.forEach((option, index) => {
        optionsText += `${index + 1}. ${option}\n`;
      });
      
      initialMessages.push({
        type: 'bot',
        text: optionsText,
        time: getCurrentTime()
      });
    }

    setMessages(initialMessages);
  };

  return (
    <div className="modal-backdrop" id="preview-modal">
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">תצוגה מקדימה</h2>
          <button className="close-modal" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body" style={{ display: 'flex', justifyContent: 'center', padding: 0 }}>
          <div className="preview-phone">
            <div className="preview-header">
              <div className="preview-avatar">
                <i className="fas fa-robot"></i>
              </div>
              <div className="preview-contact">
                <h3>הצ'אטבוט שלי</h3>
                <p>מקוון</p>
              </div>
            </div>
            <div className="preview-messages" id="preview-messages" ref={messagesContainerRef}>
              {messages.map((message, index) => (
                <div key={index} className={`preview-message preview-${message.type}`}>
                  {message.text.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      {i < message.text.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))}
                  <div className="preview-time">{message.time}</div>
                </div>
              ))}
            </div>
            <div className="preview-input">
              <input type="text" placeholder="הקלד הודעה..." disabled />
              <button className="preview-send"><i className="fas fa-paper-plane"></i></button>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>סגור</button>
          <button className="btn btn-primary" id="restart-preview-btn" onClick={restartPreview}>
            התחל מחדש
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;