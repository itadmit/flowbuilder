import React from 'react';
import { Handle, Position } from 'reactflow';

const WelcomeNode = ({ data, selected }) => {
  return (
    <div className={`node welcome-node ${selected ? 'selected' : ''}`}>
      <div className="node-header welcome-header">
        <div className="node-title">
          <i className="fas fa-comment-dots"></i>
          {data.name}
        </div>
        <div className="node-actions">
          {/* The edit and delete actions are handled by ReactFlow's node click handlers */}
        </div>
      </div>
      <div className="node-content">
        <div className="node-message">{data.message}</div>
      </div>
      
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#4CAF50', width: '10px', height: '10px' }}
        id="out"
      />
    </div>
  );
};

export default WelcomeNode;