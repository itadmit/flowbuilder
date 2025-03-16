// components/Sidebar.jsx
import React, { useState } from 'react';

const Sidebar = ({ createNode, clearCanvas, chatbotsList, loadChatbotById }) => {
  const [selectedChatbot, setSelectedChatbot] = useState('');

  const handleDragStart = (e, type) => {
    console.log('Drag started with type:', type); // שורת לוג
    e.dataTransfer.setData('text/plain', type);
    e.dataTransfer.effectAllowed = 'copy'; // הוסף את זה
    e.currentTarget.classList.add('dragging');
  };
  

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('dragging');
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
        onDragStart={(e) => handleDragStart(e, 'welcome')}
        onDragEnd={handleDragEnd}
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
        onDragStart={(e) => handleDragStart(e, 'text')}
        onDragEnd={handleDragEnd}
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
        onDragStart={(e) => handleDragStart(e, 'options')}
        onDragEnd={handleDragEnd}
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
        onDragStart={(e) => handleDragStart(e, 'delay')}
        onDragEnd={handleDragEnd}
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