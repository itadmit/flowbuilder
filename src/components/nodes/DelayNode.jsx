import React from 'react';
import { Handle, Position } from 'reactflow';

const DelayNode = ({ data, selected }) => {
  // Determine delay text
  const delayText = data.delay?.type === 'wait'
    ? 'ממתין לתגובה מהמשתמש'
    : `ממתין ${data.delay?.seconds || 5} שניות`;

  return (
    <div className={`node delay-node ${selected ? 'selected' : ''}`}>
      <div className="node-header delay-header">
        <div className="node-title">
          <i className="fas fa-clock"></i>
          {data.name}
        </div>
        <div className="node-actions">
          {/* The edit and delete actions are handled by ReactFlow's node click handlers */}
        </div>
      </div>
      <div className="node-content">
        <div className="node-message">{data.message}</div>
        <div className="delay-info">
          <i className="fas fa-clock"></i> {delayText}
        </div>
      </div>
      
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#FF9800', width: '10px', height: '10px' }}
      />
      
      {/* Output handle - only if this is a timeout-based delay */}
      {data.delay?.type === 'timeout' && (
        <Handle
          type="source"
          position={Position.Bottom}
          style={{ background: '#FF9800', width: '10px', height: '10px' }}
          id="out"
        />
      )}
    </div>
  );
};

export default DelayNode;