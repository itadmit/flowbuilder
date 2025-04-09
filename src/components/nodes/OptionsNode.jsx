import React, { useEffect, useRef } from 'react';
import { Handle, Position } from 'reactflow';

const OptionsNode = ({ data, selected }) => {
  // Array to store references to option elements
  const optionRefs = useRef([]);

  // Initialize references array when options change
  useEffect(() => {
    if (data.options) {
      optionRefs.current = Array(data.options.length)
        .fill()
        .map(() => React.createRef());
    }
  }, [data.options]);

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
          {data.options &&
            data.options.map((option, index) => (
              <div
                className="option-item"
                key={index}
                ref={(el) => (optionRefs.current[index] = el)}
                style={{ position: 'relative' }} // כדי לאפשר מיקום מוחלט של ה-Handle
              >
                {/* ה-Handle לכל אפשרות */}
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`option-${index}`}
                  style={{
                    background: '#25D366',
                    width: '10px',
                    height: '10px',
                    position: 'absolute',
                    right: '-15px',         // יוצא קצת מהגבול, כדי שהנקודה תהיה על הקצה
                    top: '50%',            // מרכז אנכי של ה־option-item
                    transform: 'translateY(-50%)'
                  }}
                />
                <div className="option-number">{index + 1}</div>
                {option}
              </div>
            ))}
        </div>
      </div>

      {/* Input handle at the top */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: '#25D366',
          width: '10px',
          height: '10px'
        }}
      />
    </div>
  );
};

export default OptionsNode;
