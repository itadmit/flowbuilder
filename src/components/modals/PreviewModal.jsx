import React, { useState, useEffect, useRef } from 'react';

const PreviewModal = ({ nodes, edges, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [currentNodeId, setCurrentNodeId] = useState(null);
  const messagesContainerRef = useRef(null);

  // Initialize preview with welcome message
  useEffect(() => {
    // Find the welcome node
    const welcomeNode = nodes.find(node => node.type === 'welcomeNode');
    
    if (!welcomeNode) {
      setMessages([{
        type: 'bot',
        text: 'אין הודעת פתיחה מוגדרת',
        time: getCurrentTime()
      }]);
      return;
    }

    // Set as initial node
    setCurrentNodeId(welcomeNode.id);
    
    // Add welcome message
    let initialMessages = [{
      type: 'bot',
      text: welcomeNode.data.message,
      time: getCurrentTime()
    }];

    // Add options if this is an options node
    if (welcomeNode.type === 'optionsNode' && welcomeNode.data.options) {
      let optionsText = '';
      welcomeNode.data.options.forEach((option, index) => {
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

  // Handle node transitions
  useEffect(() => {
    if (!currentNodeId) return;
    
    const currentNode = nodes.find(node => node.id === currentNodeId);
    if (!currentNode) return;
    
    // If this is an options node waiting for input, don't auto-advance
    if (currentNode.type === 'optionsNode') return;
    
    // If this is a delay node waiting for input, don't auto-advance
    if (currentNode.type === 'delayNode' && currentNode.data.delay?.type === 'wait') return;
    
    // If this is a timeout delay, simulate the delay
    if (currentNode.type === 'delayNode' && currentNode.data.delay?.type === 'timeout') {
      const seconds = currentNode.data.delay?.seconds || 5;
      const timer = setTimeout(() => {
        processNextNode();
      }, 1000); // In a real preview, you'd use seconds * 1000
      
      return () => clearTimeout(timer);
    } else {
      // For other nodes, process the next one
      processNextNode();
    }
  }, [currentNodeId, nodes, edges]);

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

  // Process the next node in the flow
  const processNextNode = () => {
    // Find outgoing edges from current node
    const outgoingEdges = edges.filter(edge => edge.source === currentNodeId);
    
    if (outgoingEdges.length === 0) return;
    
    // Get the next node (for now, just take the first edge)
    const nextNodeId = outgoingEdges[0].target;
    const nextNode = nodes.find(node => node.id === nextNodeId);
    
    if (!nextNode) return;
    
    // Add the next node's message
    addBotMessage(nextNode.data.message);
    
    // Add options if this is an options node
    if (nextNode.type === 'optionsNode' && nextNode.data.options) {
      let optionsText = '';
      nextNode.data.options.forEach((option, index) => {
        optionsText += `${index + 1}. ${option}\n`;
      });
      
      addBotMessage(optionsText);
    }
    
    // Set as current node
    setCurrentNodeId(nextNodeId);
  };

  // Handle user input for options
  const handleOptionSelect = (optionIndex) => {
    const currentNode = nodes.find(node => node.id === currentNodeId);
    
    if (!currentNode || currentNode.type !== 'optionsNode') return;
    
    // Make sure the option exists
    if (!currentNode.data.options || optionIndex >= currentNode.data.options.length) return;
    
    // Add user message
    addUserMessage(currentNode.data.options[optionIndex]);
    
    // Find the specific edge for this option
    const edgeId = `option-${optionIndex}`;
    const edge = edges.find(e => e.source === currentNodeId && e.sourceHandle === edgeId);
    
    if (!edge) return;
    
    // Get the next node
    const nextNodeId = edge.target;
    const nextNode = nodes.find(node => node.id === nextNodeId);
    
    if (!nextNode) return;
    
    // Add the next node's message
    addBotMessage(nextNode.data.message);
    
    // Add options if this is an options node
    if (nextNode.type === 'optionsNode' && nextNode.data.options) {
      let optionsText = '';
      nextNode.data.options.forEach((option, index) => {
        optionsText += `${index + 1}. ${option}\n`;
      });
      
      addBotMessage(optionsText);
    }
    
    // Set as current node
    setCurrentNodeId(nextNodeId);
  };

  // Simulate user response to a wait delay
  const handleDelayResponse = () => {
    const currentNode = nodes.find(node => node.id === currentNodeId);
    
    if (!currentNode || currentNode.type !== 'delayNode' || currentNode.data.delay?.type !== 'wait') return;
    
    // Add user message
    addUserMessage('תגובה מהמשתמש');
    
    // Process next node
    processNextNode();
  };

  // Add a bot message
  const addBotMessage = (text) => {
    setMessages(prev => [...prev, {
      type: 'bot',
      text,
      time: getCurrentTime()
    }]);
  };

  // Add a user message
  const addUserMessage = (text) => {
    setMessages(prev => [...prev, {
      type: 'user',
      text,
      time: getCurrentTime()
    }]);
  };

  // Restart the preview
  const restartPreview = () => {
    // Find the welcome node
    const welcomeNode = nodes.find(node => node.type === 'welcomeNode');
    
    if (!welcomeNode) {
      setMessages([{
        type: 'bot',
        text: 'אין הודעת פתיחה מוגדרת',
        time: getCurrentTime()
      }]);
      return;
    }

    // Set as current node
    setCurrentNodeId(welcomeNode.id);
    
    // Add welcome message
    let initialMessages = [{
      type: 'bot',
      text: welcomeNode.data.message,
      time: getCurrentTime()
    }];

    // Add options if this is an options node
    if (welcomeNode.type === 'optionsNode' && welcomeNode.data.options) {
      let optionsText = '';
      welcomeNode.data.options.forEach((option, index) => {
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

  // Render option buttons for options nodes
  const renderInteractionOptions = () => {
    const currentNode = nodes.find(node => node.id === currentNodeId);
    
    if (!currentNode) return null;
    
    if (currentNode.type === 'optionsNode' && currentNode.data.options) {
      return (
        <div className="preview-options">
          {currentNode.data.options.map((option, index) => (
            <button
              key={index}
              className="preview-option-btn"
              onClick={() => handleOptionSelect(index)}
            >
              {index + 1}. {option}
            </button>
          ))}
        </div>
      );
    }
    
    if (currentNode.type === 'delayNode' && currentNode.data.delay?.type === 'wait') {
      return (
        <div className="preview-options">
          <button
            className="preview-option-btn"
            onClick={handleDelayResponse}
          >
            שלח תגובה
          </button>
        </div>
      );
    }
    
    return null;
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
            <div className="preview-interaction">
              {renderInteractionOptions()}
              <div className="preview-input">
                <input type="text" placeholder="הקלד הודעה..." disabled />
                <button className="preview-send" disabled><i className="fas fa-paper-plane"></i></button>
              </div>
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