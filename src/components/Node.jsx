// components/Node.jsx - תיקון התנהגות המחברים
import React, { useRef, useEffect, useCallback, useState } from 'react';

const Node = ({ 
  node, 
  scale, 
  isActive, 
  setActiveNode, 
  openNodeEdit, 
  deleteNode, 
  startDragConnection, 
  getIconByType 
}) => {
  const nodeRef = useRef(null);
  const dragData = useRef({ isDragging: false, startX: 0, startY: 0, initialX: 0, initialY: 0 });
  const [connectorActive, setConnectorActive] = useState(false);

  // Position the node whenever its coordinates or scale changes
  useEffect(() => {
    const nodeElement = nodeRef.current;
    if (!nodeElement) return;

    // Position the node
    nodeElement.style.left = `${node.x * scale}px`;
    nodeElement.style.top = `${node.y * scale}px`;
    nodeElement.style.transform = `scale(${scale})`;
    nodeElement.setAttribute('data-x', node.x);
    nodeElement.setAttribute('data-y', node.y);
  }, [node.x, node.y, scale]);

  const handleMouseDown = useCallback((e) => {
    // Don't start drag if clicking on a button or connector
    if (e.target.closest('.node-btn') || e.target.closest('.connector')) {
      return;
    }

    // Set this node as active
    setActiveNode(node.id);

    // Only start dragging if clicking on the header
    if (e.target.closest('.node-header')) {
      const nodeElement = nodeRef.current;
      if (!nodeElement) return;
      
      const initialX = e.clientX;
      const initialY = e.clientY;
      const startX = parseFloat(nodeElement.style.left) || 0;
      const startY = parseFloat(nodeElement.style.top) || 0;

      dragData.current = {
        isDragging: true,
        startX,
        startY,
        initialX,
        initialY
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  }, [node.id, setActiveNode]);

  const handleMouseMove = useCallback((e) => {
    if (!dragData.current.isDragging) return;

    const dx = (e.clientX - dragData.current.initialX) / scale;
    const dy = (e.clientY - dragData.current.initialY) / scale;

    const newX = dragData.current.startX + dx;
    const newY = dragData.current.startY + dy;

    const nodeElement = nodeRef.current;
    if (!nodeElement) return;
    
    nodeElement.style.left = `${newX}px`;
    nodeElement.style.top = `${newY}px`;
    nodeElement.setAttribute('data-x', newX);
    nodeElement.setAttribute('data-y', newY);
  }, [scale]);

  const handleMouseUp = useCallback(() => {
    if (!dragData.current.isDragging) return;

    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);

    // Update the node position in state
    const nodeElement = nodeRef.current;
    if (!nodeElement) return;
    
    const newX = parseFloat(nodeElement.getAttribute('data-x'));
    const newY = parseFloat(nodeElement.getAttribute('data-y'));

    // This would be handled by the parent component
    // updateNodePosition(node.id, newX, newY);

    dragData.current.isDragging = false;
  }, [handleMouseMove]);

  const handleEditClick = useCallback((e) => {
    e.stopPropagation();
    openNodeEdit(node.id);
  }, [node.id, openNodeEdit]);

  const handleDeleteClick = useCallback((e) => {
    e.stopPropagation();
    deleteNode(node.id);
  }, [node.id, deleteNode]);

  // עדכון של מאזין המחברים
  const handleConnectorMouseDown = useCallback((e, index) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('לחיצה על מחבר:', index, 'של נוד:', node.id);
    setConnectorActive(true);
    
    // קריאה לפונקצית התחלת גרירת חיבור
    startDragConnection(e, node.id, index);
    
    // הוספת מאזין לסיום הגרירה
    const handleGlobalMouseUp = () => {
      setConnectorActive(false);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
    
    document.addEventListener('mouseup', handleGlobalMouseUp);
  }, [node.id, startDragConnection]);

  const renderNodeContent = () => {
    let content = (
      <div className="node-message">{node.message}</div>
    );

    if (node.type === 'options' && node.options && node.options.length > 0) {
      content = (
        <>
          <div className="node-message">{node.message}</div>
          <div className="options-list">
            {node.options.map((option, index) => (
              <div className="option-item" key={index}>
                <div className="option-number">{index + 1}</div>
                {option}
              </div>
            ))}
          </div>
        </>
      );
    } else if (node.type === 'delay' && node.delay) {
      const delayText = node.delay.type === 'wait'
        ? 'ממתין לתגובה מהמשתמש'
        : `ממתין ${node.delay.seconds} שניות`;

      content = (
        <>
          <div className="node-message">{node.message}</div>
          <div className="delay-info">
            <i className="fas fa-clock"></i> {delayText}
          </div>
        </>
      );
    }

    return content;
  };

  const renderConnectors = () => {
    if (node.type === 'options' && node.options) {
      return (
        <>
          {node.options.map((_, index) => (
            <span 
              key={index}
              className={`connector ${connectorActive ? 'connector-active' : ''}`}
              data-index={index} 
              title={`חיבור לאפשרות ${index + 1}`}
              onMouseDown={(e) => handleConnectorMouseDown(e, index)}
            ></span>
          ))}
        </>
      );
    } else if (node.type !== 'delay' || (node.type === 'delay' && node.delay && node.delay.type === 'timeout')) {
      return (
        <span 
          className={`connector ${connectorActive ? 'connector-active' : ''}`}
          data-index={0} 
          title="חיבור להמשך"
          onMouseDown={(e) => handleConnectorMouseDown(e, 0)}
        ></span>
      );
    }
    return null;
  };

  return (
    <div
      id={node.id}
      ref={nodeRef}
      className={`node ${node.type} ${isActive ? 'active' : ''}`}
      style={{ 
        left: `${node.x}px`, 
        top: `${node.y}px`,
        transform: `scale(${scale})`
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="node-header">
        <div className="node-title">
          <i className={getIconByType(node.type)}></i>
          {node.name}
        </div>
        <div className="node-actions">
          <button 
            className="node-btn edit-node" 
            title="ערוך"
            onClick={handleEditClick}
          >
            <i className="fas fa-edit"></i>
          </button>
          <button 
            className="node-btn delete-node" 
            title="מחק"
            onClick={handleDeleteClick}
            disabled={node.type === 'welcome'}
          >
            <i className="fas fa-trash"></i>
          </button>
        </div>
      </div>
      <div className="node-content">
        {renderNodeContent()}
      </div>
      <div className="node-footer">
        {renderConnectors()}
      </div>
    </div>
  );
};

export default React.memo(Node);