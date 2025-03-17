// components/Node.jsx - Revised with better connection support
import React, { useRef, useEffect } from 'react';

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

  useEffect(() => {
    const nodeElement = nodeRef.current;
    if (!nodeElement) return;

    // Position the node
    nodeElement.style.left = `${node.x * scale}px`;
    nodeElement.style.top = `${node.y * scale}px`;
    // We use transform-origin to ensure scaling happens from the top-left corner
    nodeElement.style.transformOrigin = '0 0';
    nodeElement.style.transform = `scale(${scale})`;
    nodeElement.setAttribute('data-x', node.x);
    nodeElement.setAttribute('data-y', node.y);
  }, [node.x, node.y, scale]);

  // Emit a custom event when a node is moved to trigger connection redrawing
  useEffect(() => {
    const nodeMovedEvent = new CustomEvent('node-moved', {
      detail: { nodeId: node.id, x: node.x, y: node.y }
    });
    
    // Dispatch the event on the document
    if (node.x && node.y) {
      document.dispatchEvent(nodeMovedEvent);
    }
  }, [node.id, node.x, node.y]);

  const handleMouseDown = (e) => {
    // Don't start drag if clicking on a button or connector
    if (e.target.closest('.node-btn') || e.target.closest('.connector')) {
      return;
    }

    // Set this node as active
    setActiveNode(node.id);

    // Only start dragging if clicking on the header
    if (e.target.closest('.node-header')) {
      const nodeElement = nodeRef.current;
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
  };

  const handleMouseMove = (e) => {
    if (!dragData.current.isDragging) return;

    const dx = (e.clientX - dragData.current.initialX) / scale;
    const dy = (e.clientY - dragData.current.initialY) / scale;

    const newX = dragData.current.startX + dx;
    const newY = dragData.current.startY + dy;

    const nodeElement = nodeRef.current;
    nodeElement.style.left = `${newX}px`;
    nodeElement.style.top = `${newY}px`;
    nodeElement.setAttribute('data-x', newX / scale);
    nodeElement.setAttribute('data-y', newY / scale);
  };

  const handleMouseUp = (e) => {
    if (!dragData.current.isDragging) return;

    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);

    const nodeElement = nodeRef.current;
    const newX = parseFloat(nodeElement.getAttribute('data-x'));
    const newY = parseFloat(nodeElement.getAttribute('data-y'));

    // Dispatch a custom event to notify parent that we need to redraw connections
    const updateEvent = new CustomEvent('node-moved', { 
      detail: { nodeId: node.id, x: newX, y: newY } 
    });
    document.dispatchEvent(updateEvent);

    dragData.current.isDragging = false;
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    openNodeEdit(node.id);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    deleteNode(node.id);
  };

  const handleConnectorMouseDown = (e, index) => {
    e.stopPropagation();
    e.preventDefault();
    startDragConnection(e, node.id, index);
  };

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
              className="connector" 
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
          className="connector" 
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
        position: 'absolute',
        left: `${node.x * scale}px`, 
        top: `${node.y * scale}px`,
        transformOrigin: '0 0',
        transform: `scale(${scale})`,
        zIndex: isActive ? 20 : 10, // Ensure active nodes are above others
        width: '300px' // Ensure width is explicitly set
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
      <div className="node-footer" style={{ display: 'flex', justifyContent: 'center', margin: '10px 0' }}>
        {renderConnectors()}
      </div>
    </div>
  );
};

export default Node;