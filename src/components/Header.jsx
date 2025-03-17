import React from 'react';

const Header = ({ isConnected, openPreviewModal, openConnectModal, openSaveModal, chatbotName }) => {
  return (
    <header className="main-header">
      <div className="container">
        <div className="logo">
          <h1>FlowBuilder</h1>
          <span className="tagline">בניית צ'אטבוטים לוואטסאפ בקלות</span>
        </div>
        <div className="header-actions">
          <div className="connection-status">
            <div className={`status-indicator ${isConnected ? 'status-connected' : 'status-disconnected'}`}></div>
            <span>{isConnected ? 'מחובר' : 'מנותק'}</span>
          </div>
          <button id="preview-btn" className="btn btn-outline" onClick={openPreviewModal}>
            <i className="fas fa-eye"></i> תצוגה מקדימה
          </button>
          <button id="connect-btn" className="btn btn-outline" onClick={openConnectModal}>
            <i className="fas fa-plug"></i> חיבור לוואטסאפ
          </button>
          <button id="save-btn" className="btn btn-primary" onClick={openSaveModal}>
            <i className="fas fa-save"></i> שמירה
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;