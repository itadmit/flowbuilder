// components/Canvas.jsx - A more direct approach
import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import Node from './Node';

const Canvas = forwardRef(({ 
  nodes, 
  scale, 
  zoomIn, 
  zoomOut, 
  zoomReset, 
  activeNode, 
  setActiveNode, 
  openNodeEdit, 
  deleteNode, 
  startDragConnection, 
  getIconByType, 
  getConnectionColor,
  updateConnections,
  chatbotTitle,
  createNode,
  updateNodePosition
}, ref) => {
  const canvasRef = useRef(null);
  const connectionsRef = useRef([]);

  // Forward the canvas ref to parent
  useImperativeHandle(ref, () => ({
    drawConnections
  }));

  // Set up drag and drop handlers for new nodes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleDragOver = (e) => {
      e.preventDefault();
    };

    const handleDrop = (e) => {
      e.preventDefault();
      const nodeType = e.dataTransfer.getData('text/plain');
      
      // Prevent adding more than one welcome node
      if (nodeType === 'welcome' && document.querySelector('.node.welcome')) {
        alert('יכולה להיות רק הודעת פתיחה אחת');
        return;
      }
      
      // Calculate new node position
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left + canvas.scrollLeft) / scale;
      const y = (e.clientY - rect.top + canvas.scrollTop) / scale;
      
      // Call the createNode function from props
      createNode(nodeType, x, y);
    };

    canvas.addEventListener('dragover', handleDragOver);
    canvas.addEventListener('drop', handleDrop);

    return () => {
      canvas.removeEventListener('dragover', handleDragOver);
      canvas.removeEventListener('drop', handleDrop);
    };
  }, [scale, createNode]);

  // Update connections whenever nodes change or scale changes
  useEffect(() => {
    console.log("Nodes updated, redrawing connections");
    // Use a timeout to ensure nodes are rendered before drawing connections
    const timer = setTimeout(() => {
      drawConnections();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [nodes, scale]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      drawConnections();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Set up listeners for node movement
  useEffect(() => {
    const handleNodeMoved = (e) => {
      if (updateNodePosition) {
        updateNodePosition(e.detail.nodeId, e.detail.x, e.detail.y);
      }
      setTimeout(() => drawConnections(), 50);
    };

    document.addEventListener('node-moved', handleNodeMoved);
    return () => {
      document.removeEventListener('node-moved', handleNodeMoved);
    };
  }, [updateNodePosition]);

  // Draw all connections between nodes
  const drawConnections = () => {
    console.log("Drawing connections");
    
    // Remove all existing connections
    connectionsRef.current.forEach(conn => {
      if (conn && conn.parentNode) {
        conn.parentNode.removeChild(conn);
      }
    });
    connectionsRef.current = [];

    // Get canvas element
    const canvas = canvasRef.current;
    if (!canvas) {
      console.log("Canvas ref is null");
      return;
    }

    // Create new connections
    Object.keys(nodes).forEach(nodeId => {
      const node = nodes[nodeId];
      if (node.connections && node.connections.length > 0) {
        node.connections.forEach(connection => {
          try {
            drawConnection(connection);
          } catch (error) {
            console.error("Error drawing connection:", error);
          }
        });
      }
    });
  };

  // Draw a single connection
  const drawConnection = (connection) => {
    const sourceNode = document.getElementById(connection.source);
    const targetNode = document.getElementById(connection.target);

    if (!sourceNode) {
      console.log(`Source node ${connection.source} not found`);
      return;
    }
    
    if (!targetNode) {
      console.log(`Target node ${connection.target} not found`);
      return;
    }

    // Find the appropriate connector in source node
    const sourceConnectors = sourceNode.querySelectorAll('.connector');
    if (!sourceConnectors.length) {
      console.log(`No connectors found in source node ${connection.source}`);
      return;
    }
    
    if (connection.sourceIndex >= sourceConnectors.length) {
      console.log(`Source index ${connection.sourceIndex} is out of bounds`);
      return;
    }
    
    const sourceConnector = sourceConnectors[connection.sourceIndex];
    
    // Calculate positions relative to canvas
    const canvas = canvasRef.current;
    const canvasRect = canvas.getBoundingClientRect();

    const sourceRect = sourceConnector.getBoundingClientRect();
    
    // Use node center as target point if it has no connectors
    let targetRect;
    const targetConnectors = targetNode.querySelectorAll('.connector');
    if (targetConnectors.length > 0) {
      targetRect = targetConnectors[0].getBoundingClientRect();
    } else {
      // Use node center
      targetRect = targetNode.getBoundingClientRect();
      targetRect = {
        left: targetRect.left + targetRect.width / 2,
        top: targetRect.top + targetRect.height / 2,
        width: 0,
        height: 0
      };
    }

    // Start point - center of source connector
    const x1 = sourceRect.left + sourceRect.width/2 - canvasRect.left + canvas.scrollLeft;
    const y1 = sourceRect.top + sourceRect.height/2 - canvasRect.top + canvas.scrollTop;

    // End point - center of target connector/node
    const x2 = targetRect.left + targetRect.width/2 - canvasRect.left + canvas.scrollLeft;
    const y2 = targetRect.top + targetRect.height/2 - canvasRect.top + canvas.scrollTop;

    // Create connection element
    const connectionEl = document.createElement('div');
    connectionEl.className = 'connection';
    connectionEl.style.zIndex = '5'; // Ensure it's below nodes but visible

    // Create SVG
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");

    // Calculate SVG bounds
    const minX = Math.min(x1, x2) - 20;
    const minY = Math.min(y1, y2) - 20;
    const width = Math.abs(x2 - x1) + 40;
    const height = Math.abs(y2 - y1) + 40;

    // Set SVG attributes
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
    svg.style.position = "absolute";
    svg.style.left = minX + "px";
    svg.style.top = minY + "px";
    svg.style.overflow = "visible";
    svg.style.pointerEvents = "none"; // Allow clicking through

    // Create connection path
    const path = document.createElementNS(svgNS, "path");

    // Calculate control points for curved line
    const curvature = 0.5;
    const cpX1 = x1;
    const cpY1 = y1 + (y2 - y1) * curvature;
    const cpX2 = x2;
    const cpY2 = y2 - (y2 - y1) * curvature;

    // Calculate points relative to SVG position
    const localX1 = x1 - minX;
    const localY1 = y1 - minY;
    const localX2 = x2 - minX;
    const localY2 = y2 - minY;
    const localCpX1 = cpX1 - minX;
    const localCpY1 = cpY1 - minY;
    const localCpX2 = cpX2 - minX;
    const localCpY2 = cpY2 - minY;

    // Define path
    const d = `M ${localX1} ${localY1} C ${localCpX1} ${localCpY1}, ${localCpX2} ${localCpY2}, ${localX2} ${localY2}`;
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", getConnectionColor(connection.source));
    path.setAttribute("stroke-width", "2");

    // Add arrow
    const arrow = document.createElementNS(svgNS, "polygon");

    // Calculate arrow angle
    const angle = Math.atan2(localY2 - localCpY2, localX2 - localCpX2);
    const size = 8;

    // Calculate arrow points
    const arrowPoints = [
      localX2, localY2,
      localX2 - size * Math.cos(angle - Math.PI / 6), localY2 - size * Math.sin(angle - Math.PI / 6),
      localX2 - size * Math.cos(angle + Math.PI / 6), localY2 - size * Math.sin(angle + Math.PI / 6)
    ];

    arrow.setAttribute("points", arrowPoints.join(","));
    arrow.setAttribute("fill", getConnectionColor(connection.source));

    // Add elements to SVG
    svg.appendChild(path);
    svg.appendChild(arrow);
    connectionEl.appendChild(svg);

    // Add connection to canvas
    canvas.appendChild(connectionEl);
    connectionsRef.current.push(connectionEl);
    
    console.log(`Connection drawn from ${connection.source} to ${connection.target}`);
  };

  return (
    <div className="canvas-container">
      <div className="canvas-header">
        <div className="canvas-title">
          {chatbotTitle}
        </div>
        <div className="canvas-actions">
          <button id="zoom-out" className="btn btn-small btn-outline" onClick={zoomOut}>
            <i className="fas fa-search-minus"></i>
          </button>
          <button id="zoom-reset" className="btn btn-small btn-outline" onClick={zoomReset}>
            <i className="fas fa-compress"></i>
          </button>
          <button id="zoom-in" className="btn btn-small btn-outline" onClick={zoomIn}>
            <i className="fas fa-search-plus"></i>
          </button>
        </div>
      </div>
      <div className="canvas" id="flow-canvas" ref={canvasRef}>
        {Object.entries(nodes).map(([id, node]) => (
          <Node 
            key={id}
            node={node}
            scale={scale}
            isActive={activeNode === id}
            setActiveNode={setActiveNode}
            openNodeEdit={openNodeEdit}
            deleteNode={deleteNode}
            startDragConnection={startDragConnection}
            getIconByType={getIconByType}
          />
        ))}
      </div>
    </div>
  );
});

export default Canvas;