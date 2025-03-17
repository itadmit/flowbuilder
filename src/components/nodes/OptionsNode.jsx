import React from 'react';
import { Handle, Position } from 'reactflow';

const OptionsNode = ({ data, selected }) => {
  return (
    <div className={`node options-node ${selected ? 'selected' : ''}`}>
      <div className="node-header options-header">
        <div className="node-title">
          <i className="fas fa-list-ol"></i>
          {data.name}
        </div>
        <div className="node-actions">
          {/* The edit and delete actions are handled by ReactFlow's node click handlers */}
        </div>
      </div>
      <div className="node-content">
        <div className="node-message">{data.message}</div>
        <div className="options-list">
          {data.options && data.options.map((option, index) => (
            <div className="option-item" key={index}>
              <div className="option-number">{index + 1}</div>
              {option}
            </div>
          ))}
        </div>
      </div>
      
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#25D366', width: '10px', height: '10px' }}
      />
      
      {/* Output handles for each option */}
      {data.options && data.options.map((_, index) => (
        <Handle
          key={index}
          type="source"
          position={Position.Bottom}
          id={`option-${index}`}
          style={{
            background: '#25D366',
            width: '10px',
            height: '10px',
            left: `${(index + 1) * (100 / (data.options.length + 1))}%` // Distribute handles evenly
          }}
        />
      ))}
    </div>
  );
};

export default OptionsNode;