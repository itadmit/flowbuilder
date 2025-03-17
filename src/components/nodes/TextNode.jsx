import React from 'react';
import { Handle, Position } from 'reactflow';

const TextNode = ({ data, selected }) => {
  return (
    <div className={`node text-node ${selected ? 'selected' : ''}`}>
      <div className="node-header">
        <div className="node-title">
          <i className="fas fa-comment"></i>
          {data.name}
        </div>
        <div className="node-actions">
          {/* The edit and delete actions are handled by ReactFlow's node click handlers */}
        </div>
      </div>
      <div className="node-content">
        <div className="node-message">{data.message}</div>
      </div>
      
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#34B7F1', width: '10px', height: '10px' }}
      />
      
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#34B7F1', width: '10px', height: '10px' }}
        id="out"
      />
    </div>
  );
};

export default TextNode;