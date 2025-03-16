// Put this code in a new file: direct-connections.js

document.addEventListener('DOMContentLoaded', () => {
    // Let React initialize first
    setTimeout(fixConnectionsAndDragging, 2000);
  });
  
  function fixConnectionsAndDragging() {
    console.log('Installing direct connection fix');
    
    // 1. Add necessary CSS to make connections visible
    addRequiredStyles();
    
    // 2. Override the drag line behavior
    setupDragLineBehavior();
    
    // 3. Add a mutation observer to handle new connections
    setupConnectionsObserver();
    
    // 4. Force redraw existing connections if any
    redrawExistingConnections();
  }
  
  function addRequiredStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* Force connections to be visible */
      .connection {
        position: absolute !important;
        pointer-events: none !important;
        z-index: 95 !important;
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
      }
      
      .connection svg {
        display: block !important;
        overflow: visible !important;
        visibility: visible !important;
        opacity: 1 !important;
      }
      
      .connection path, .connection polygon {
        stroke-width: 2px !important;
        visibility: visible !important;
        opacity: 1 !important;
      }
      
      /* Drag line styles */
      .direct-drag-line {
        position: absolute;
        pointer-events: none;
        z-index: 1000;
        display: block !important;
      }
      
      /* Override any problematic styles */
      .canvas {
        overflow: visible !important;
      }
    `;
    
    document.head.appendChild(style);
  }
  
  function setupDragLineBehavior() {
    // Store original mouse position
    let startX, startY, startNodeId, startConnectorIndex;
    let currentDragLine = null;
    
    // Listen for mousedown on connectors
    document.addEventListener('mousedown', function(e) {
      const connector = e.target.closest('.connector');
      if (!connector) return;
      
      const node = connector.closest('.node');
      if (!node) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      // Get start position
      const canvas = document.querySelector('.canvas');
      if (!canvas) return;
      
      const canvasRect = canvas.getBoundingClientRect();
      const connectorRect = connector.getBoundingClientRect();
      
      startX = connectorRect.left + connectorRect.width/2 - canvasRect.left + canvas.scrollLeft;
      startY = connectorRect.top + connectorRect.height/2 - canvasRect.top + canvas.scrollTop;
      startNodeId = node.id;
      startConnectorIndex = parseInt(connector.getAttribute('data-index') || 0);
      
      // Create drag line
      createDragLine(canvas, startX, startY, startX, startY);
      
      // Add mousemove and mouseup listeners
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      // Change cursor
      document.body.style.cursor = 'crosshair';
    }, true);
    
    function handleMouseMove(e) {
      if (!currentDragLine) return;
      
      const canvas = document.querySelector('.canvas');
      if (!canvas) return;
      
      const canvasRect = canvas.getBoundingClientRect();
      const currentX = e.clientX - canvasRect.left + canvas.scrollLeft;
      const currentY = e.clientY - canvasRect.top + canvas.scrollTop;
      
      // Update drag line
      updateDragLine(startX, startY, currentX, currentY);
      
      // Highlight nearest connector
      highlightNearestConnector(e);
    }
    
    function handleMouseUp(e) {
      // Reset cursor
      document.body.style.cursor = 'default';
      
      // Remove event listeners
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // Find target connector
      const targetConnector = findNearestConnector(e);
      if (targetConnector) {
        const targetNode = targetConnector.closest('.node');
        if (targetNode && targetNode.id !== startNodeId) {
          // Create connection in React
          console.log('Creating direct connection from', startNodeId, 'to', targetNode.id);
          
          // Trigger connection in React state by simulating clicks
          dispatchCustomEvent('createConnection', {
            source: startNodeId,
            target: targetNode.id,
            sourceIndex: startConnectorIndex
          });
          
          // Create visual connection immediately
          createVisualConnection(startNodeId, targetNode.id, startConnectorIndex);
        }
      }
      
      // Remove highlights
      document.querySelectorAll('.connector-hover').forEach(c => {
        c.classList.remove('connector-hover');
      });
      
      // Remove drag line
      if (currentDragLine) {
        currentDragLine.remove();
        currentDragLine = null;
      }
    }
    
    function createDragLine(canvas, x1, y1, x2, y2) {
      // Remove existing drag line
      if (currentDragLine) {
        currentDragLine.remove();
      }
      
      // Create new drag line
      currentDragLine = document.createElement('div');
      currentDragLine.className = 'direct-drag-line';
      document.body.appendChild(currentDragLine);
      
      // Create SVG
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      currentDragLine.appendChild(svg);
      
      // Update it
      updateDragLine(x1, y1, x2, y2);
    }
    
    function updateDragLine(x1, y1, x2, y2) {
      if (!currentDragLine) return;
      
      const svg = currentDragLine.querySelector('svg');
      if (!svg) return;
      
      // Clear existing content
      while (svg.firstChild) {
        svg.removeChild(svg.firstChild);
      }
      
      // Calculate bounds
      const minX = Math.min(x1, x2) - 10;
      const minY = Math.min(y1, y2) - 10;
      const width = Math.abs(x2 - x1) + 20;
      const height = Math.abs(y2 - y1) + 20;
      
      // Set SVG attributes
      svg.setAttribute("width", width);
      svg.setAttribute("height", height);
      svg.style.position = "absolute";
      svg.style.left = minX + "px";
      svg.style.top = minY + "px";
      svg.style.overflow = "visible";
      
      // Create path
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      
      // Relative coordinates
      const localX1 = x1 - minX;
      const localY1 = y1 - minY;
      const localX2 = x2 - minX;
      const localY2 = y2 - minY;
      
      // Curve parameters
      const curvature = 0.5;
      const cpX1 = localX1;
      const cpY1 = localY1 + (localY2 - localY1) * curvature;
      const cpX2 = localX2;
      const cpY2 = localY2 - (localY2 - localY1) * curvature;
      
      // Define path
      const d = `M ${localX1} ${localY1} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${localX2} ${localY2}`;
      path.setAttribute("d", d);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", "#25D366");
      path.setAttribute("stroke-width", "3");
      path.setAttribute("stroke-dasharray", "5,5");
      
      // Add to SVG
      svg.appendChild(path);
      
      // Add arrow
      const arrow = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      
      // Arrow angle
      const angle = Math.atan2(localY2 - cpY2, localX2 - cpX2);
      const size = 8;
      
      // Arrow points
      const arrowPoints = [
        localX2, localY2,
        localX2 - size * Math.cos(angle - Math.PI / 6), localY2 - size * Math.sin(angle - Math.PI / 6),
        localX2 - size * Math.cos(angle + Math.PI / 6), localY2 - size * Math.sin(angle + Math.PI / 6)
      ];
      
      arrow.setAttribute("points", arrowPoints.join(","));
      arrow.setAttribute("fill", "#25D366");
      
      // Add to SVG
      svg.appendChild(arrow);
    }
    
    function highlightNearestConnector(e) {
      // Remove previous highlights
      document.querySelectorAll('.connector-hover').forEach(c => {
        c.classList.remove('connector-hover');
      });
      
      // Find nearest connector
      const nearest = findNearestConnector(e);
      
      // Highlight it
      if (nearest) {
        nearest.classList.add('connector-hover');
      }
    }
    
    function findNearestConnector(e) {
      let closest = null;
      let minDistance = 50; // max distance in pixels
      
      document.querySelectorAll('.connector').forEach(connector => {
        // Don't check the source node
        if (connector.closest('.node').id === startNodeId) {
          return;
        }
        
        const rect = connector.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Calculate distance
        const distance = Math.sqrt(
          Math.pow(e.clientX - centerX, 2) + 
          Math.pow(e.clientY - centerY, 2)
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          closest = connector;
        }
      });
      
      return closest;
    }
  }
  
  function setupConnectionsObserver() {
    // Watch for changes in localStorage
    let lastNodesJson = localStorage.getItem('flowbuilder_nodes');
    
    setInterval(() => {
      const currentNodesJson = localStorage.getItem('flowbuilder_nodes');
      if (currentNodesJson && currentNodesJson !== lastNodesJson) {
        lastNodesJson = currentNodesJson;
        redrawExistingConnections();
      }
    }, 1000);
  }
  
  function redrawExistingConnections() {
    try {
      const nodesJson = localStorage.getItem('flowbuilder_nodes');
      if (!nodesJson) return;
      
      const nodes = JSON.parse(nodesJson);
      
      // Remove existing visual connections
      document.querySelectorAll('.visual-connection').forEach(conn => {
        conn.remove();
      });
      
      // Draw connections
      for (const nodeId in nodes) {
        const node = nodes[nodeId];
        if (node.connections && node.connections.length > 0) {
          node.connections.forEach(conn => {
            createVisualConnection(conn.source, conn.target, conn.sourceIndex);
          });
        }
      }
    } catch (error) {
      console.error('Error redrawing connections:', error);
    }
  }
  
  function createVisualConnection(sourceId, targetId, sourceIndex) {
    // Find DOM elements
    const sourceNode = document.getElementById(sourceId);
    const targetNode = document.getElementById(targetId);
    
    if (!sourceNode || !targetNode) {
      console.error('Cannot find nodes:', sourceId, targetId);
      return;
    }
    
    // Find connectors
    const sourceConnectors = sourceNode.querySelectorAll('.connector');
    if (sourceIndex >= sourceConnectors.length) {
      console.error('Invalid connector index:', sourceIndex);
      return;
    }
    
    const sourceConnector = sourceConnectors[sourceIndex];
    const targetConnector = targetNode.querySelector('.connector') || targetNode;
    
    // Get canvas
    const canvas = document.querySelector('.canvas');
    if (!canvas) {
      console.error('Canvas not found');
      return;
    }
    
    // Calculate positions
    const canvasRect = canvas.getBoundingClientRect();
    const sourceRect = sourceConnector.getBoundingClientRect();
    const targetRect = targetConnector.getBoundingClientRect();
    
    const x1 = sourceRect.left + sourceRect.width/2 - canvasRect.left + canvas.scrollLeft;
    const y1 = sourceRect.top + sourceRect.height/2 - canvasRect.top + canvas.scrollTop;
    const x2 = targetRect.left + targetRect.width/2 - canvasRect.left + canvas.scrollLeft;
    const y2 = targetRect.top + targetRect.height/2 - canvasRect.top + canvas.scrollTop;
    
    // Create connection element
    const connection = document.createElement('div');
    connection.className = 'connection visual-connection';
    
    // Create SVG
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    
    // Calculate bounds
    const minX = Math.min(x1, x2) - 10;
    const minY = Math.min(y1, y2) - 10;
    const width = Math.abs(x2 - x1) + 20;
    const height = Math.abs(y2 - y1) + 20;
    
    // Set SVG attributes
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
    svg.style.position = "absolute";
    svg.style.left = minX + "px";
    svg.style.top = minY + "px";
    svg.style.overflow = "visible";
    
    // Create path
    const path = document.createElementNS(svgNS, "path");
    
    // Calculate curve
    const curvature = 0.5;
    const cpX1 = x1;
    const cpY1 = y1 + (y2 - y1) * curvature;
    const cpX2 = x2;
    const cpY2 = y2 - (y2 - y1) * curvature;
    
    // Calculate relative coordinates
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
    path.setAttribute("stroke", getConnectionColor(sourceId));
    path.setAttribute("stroke-width", "2");
    
    // Create arrow
    const arrow = document.createElementNS(svgNS, "polygon");
    
    // Calculate arrow angle
    const angle = Math.atan2(localY2 - localCpY2, localX2 - localCpX2);
    const size = 8;
    
    // Arrow points
    const arrowPoints = [
      localX2, localY2,
      localX2 - size * Math.cos(angle - Math.PI / 6), localY2 - size * Math.sin(angle - Math.PI / 6),
      localX2 - size * Math.cos(angle + Math.PI / 6), localY2 - size * Math.sin(angle + Math.PI / 6)
    ];
    
    arrow.setAttribute("points", arrowPoints.join(","));
    arrow.setAttribute("fill", getConnectionColor(sourceId));
    
    // Add to SVG
    svg.appendChild(path);
    svg.appendChild(arrow);
    connection.appendChild(svg);
    
    // Add to canvas
    canvas.appendChild(connection);
  }
  
  function getConnectionColor(nodeId) {
    try {
      const nodesJson = localStorage.getItem('flowbuilder_nodes');
      if (!nodesJson) return '#25D366';
      
      const nodes = JSON.parse(nodesJson);
      if (!nodes[nodeId]) return '#25D366';
      
      switch (nodes[nodeId].type) {
        case 'welcome': return '#4CAF50';
        case 'text': return '#34B7F1';
        case 'options': return '#25D366';
        case 'delay': return '#FF9800';
        default: return '#25D366';
      }
    } catch (error) {
      console.error('Error getting color:', error);
      return '#25D366';
    }
  }
  
  function dispatchCustomEvent(eventName, detail) {
    const event = new CustomEvent(eventName, { detail });
    window.dispatchEvent(event);
  }