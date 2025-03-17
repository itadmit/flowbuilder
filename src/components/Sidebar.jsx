import React, { useState } from 'react';

const Sidebar = ({ clearCanvas, chatbotsList, loadChatbotById }) => {
  const [selectedChatbot, setSelectedChatbot] = useState('');

  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
    event.currentTarget.classList.add('dragging');
  };

  const onDragEnd = (event) => {
    event.currentTarget.classList.remove('dragging');
  };

  const handleLoadChatbot = () => {
    if (selectedChatbot) {
      loadChatbotById(selectedChatbot);
    }
  };

  return (
    <div className="sidebar">
      <h3 className="elements-title">אלמנטים</h3>
      
      <div 
        className="element-item" 
        draggable 
        onDragStart={(e) => onDragStart(e, 'welcomeNode')}
        onDragEnd={onDragEnd}
        data-type="welcome"
      >
        <div className="element-icon">
          <i className="fas fa-comment-dots"></i>
        </div>
        <div className="element-content">
          <div className="element-title">הודעת פתיחה</div>
          <div className="element-desc">ההודעה הראשונה שהלקוח מקבל</div>
        </div>
      </div>
      
      <div 
        className="element-item" 
        draggable 
        onDragStart={(e) => onDragStart(e, 'textNode')}
        onDragEnd={onDragEnd}
        data-type="text"
      >
        <div className="element-icon">
          <i className="fas fa-comment"></i>
        </div>
        <div className="element-content">
          <div className="element-title">הודעת טקסט</div>
          <div className="element-desc">שליחת הודעת טקסט פשוטה</div>
        </div>
      </div>
      
      <div 
        className="element-item" 
        draggable 
        onDragStart={(e) => onDragStart(e, 'optionsNode')}
        onDragEnd={onDragEnd}
        data-type="options"
      >
        <div className="element-icon">
          <i className="fas fa-list-ol"></i>
        </div>
        <div className="element-content">
          <div className="element-title">אפשרויות בחירה</div>
          <div className="element-desc">הצגת אפשרויות בחירה ממוספרות</div>
        </div>
      </div>
      
      <div 
        className="element-item" 
        draggable 
        onDragStart={(e) => onDragStart(e, 'delayNode')}
        onDragEnd={onDragEnd}
        data-type="delay"
      >
        <div className="element-icon">
          <i className="fas fa-clock"></i>
        </div>
        <div className="element-content">
          <div className="element-title">השהייה / המתנה</div>
          <div className="element-desc">המתנה לתגובה או השהייה קבועה</div>
        </div>
      </div>
      
      <div className="sidebar-bottom">
        <button 
          id="clear-canvas" 
          className="btn btn-outline" 
          style={{ width: '100%' }}
          onClick={clearCanvas}
        >
          <i className="fas fa-trash"></i> נקה קנבס
        </button>
        
        {chatbotsList.length > 0 && (
          <div style={{ marginTop: '15px' }}>
            <h4 style={{ marginBottom: '10px' }}>צ'אטבוטים שמורים:</h4>
            <select 
              id="load-chatbot" 
              className="form-control" 
              style={{ width: '100%', marginBottom: '5px' }}
              value={selectedChatbot}
              onChange={(e) => setSelectedChatbot(e.target.value)}
            >
              <option value="">בחר צ'אטבוט...</option>
              {chatbotsList.map((chatbot) => (
                <option key={chatbot.id} value={chatbot.id}>
                  {chatbot.name}
                </option>
              ))}
            </select>
            <button 
              onClick={handleLoadChatbot}
              className="btn btn-outline" 
              style={{ width: '100%' }}
              disabled={!selectedChatbot}
            >
              <i className="fas fa-folder-open"></i> טען צ'אטבוט
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;