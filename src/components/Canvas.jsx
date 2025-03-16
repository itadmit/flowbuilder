// components/Canvas.jsx
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
  createNode  // הפרופ שמקבלים
}, ref) => {
  const canvasRef = useRef(null);
  const connectionsRef = useRef([]);

  // Forward the canvas ref to parent
  useImperativeHandle(ref, () => canvasRef.current);

  // Set up drag and drop handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
  
    const handleDragOver = (e) => {
      e.preventDefault(); // חשוב מאוד!
      e.stopPropagation();
      // הוסף שורת לוג לצורך בדיקה
      console.log('Dragging over canvas');
    };
  
    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      console.log('Drop event fired'); // שורת לוג לצורך בדיקה
      
      const nodeType = e.dataTransfer.getData('text/plain');
      console.log('Node type:', nodeType); // בדוק שהמידע מועבר
      
      // Prevent adding more than one welcome node
      if (nodeType === 'welcome' && document.querySelector('.node.welcome')) {
        alert('יכולה להיות רק הודעת פתיחה אחת');
        return;
      }
      
      // Calculate new node position
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left + canvas.scrollLeft) / scale;
      const y = (e.clientY - rect.top + canvas.scrollTop) / scale;
      
      console.log('Position:', x, y); // בדוק את המיקום
      
      // Call the parent's createNode function
      createNode(nodeType, x, y);
    };
  
    canvas.addEventListener('dragover', handleDragOver);
    canvas.addEventListener('drop', handleDrop);
  
    return () => {
      canvas.removeEventListener('dragover', handleDragOver);
      canvas.removeEventListener('drop', handleDrop);
    };
  }, [scale, createNode]); // הוספת createNode לתלויות
  

  // Update connections whenever nodes change
  useEffect(() => {
    drawConnections();
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

  // Draw all connections between nodes
  // בקובץ Canvas.jsx, שפר את פונקציית drawConnections
const drawConnections = () => {
  console.log('מצייר חיבורים...');
  
  // הסר את כל החיבורים הקיימים
  connectionsRef.current.forEach(conn => {
    if (conn && conn.parentNode) {
      conn.parentNode.removeChild(conn);
    }
  });
  connectionsRef.current = [];

  // קבל את הקנבס
  const canvas = canvasRef.current;
  if (!canvas) return;
  
  // בדוק אם יש נודים וחיבורים
  console.log('נודים לציור חיבורים:', nodes);
  
  // צור חיבורים חדשים
  Object.keys(nodes).forEach(nodeId => {
    const node = nodes[nodeId];
    console.log('בודק חיבורים לנוד:', nodeId, node);
    
    if (node.connections && node.connections.length > 0) {
      node.connections.forEach(connection => {
        console.log('מצייר חיבור:', connection);
        drawConnection(connection);
      });
    }
  });
};

  // Draw a single connection
  // בקובץ Canvas.jsx, שפר את פונקציית drawConnection
const drawConnection = (connection) => {
  console.log('מצייר חיבור בין', connection.source, 'ל-', connection.target);
  
  const sourceNode = document.getElementById(connection.source);
  const targetNode = document.getElementById(connection.target);

  if (!sourceNode || !targetNode) {
    console.error('לא נמצאו נודים:', !sourceNode ? connection.source : connection.target);
    return;
  }

  // מצא את המחבר המתאים בנוד המקור
  const sourceConnectors = sourceNode.querySelectorAll('.connector');
  if (connection.sourceIndex >= sourceConnectors.length) {
    console.error('אינדקס מחבר לא תקין:', connection.sourceIndex, 'מתוך', sourceConnectors.length);
    return;
  }
  
  const sourceConnector = sourceConnectors[connection.sourceIndex];
  
  // מצא את המחבר בנוד היעד (או השתמש במרכז הנוד)
  const targetConnector = targetNode.querySelector('.connector') || targetNode;

  // חשב מיקומים יחסית לקנבס
  const canvas = canvasRef.current;
  const canvasRect = canvas.getBoundingClientRect();

  const sourceRect = sourceConnector.getBoundingClientRect();
  const targetRect = targetConnector.getBoundingClientRect();

  // נקודת התחלה - מרכז המחבר המקורי
  const x1 = sourceRect.left + sourceRect.width/2 - canvasRect.left + canvas.scrollLeft;
  const y1 = sourceRect.top + sourceRect.height/2 - canvasRect.top + canvas.scrollTop;

  // נקודת סיום - מרכז המחבר היעד
  const x2 = targetRect.left + targetRect.width/2 - canvasRect.left + canvas.scrollLeft;
  const y2 = targetRect.top + targetRect.height/2 - canvasRect.top + canvas.scrollTop;

  console.log('מיקומי חיבור:', {x1, y1, x2, y2});

  // צור אלמנט חיבור
  const connectionEl = document.createElement('div');
  connectionEl.className = 'connection';

  // צור SVG
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");

  // חשב גבולות SVG
  const minX = Math.min(x1, x2) - 10;
  const minY = Math.min(y1, y2) - 10;
  const width = Math.abs(x2 - x1) + 20;
  const height = Math.abs(y2 - y1) + 20;

  // הגדר תכונות SVG
  svg.setAttribute("width", width);
  svg.setAttribute("height", height);
  svg.style.position = "absolute";
  svg.style.left = minX + "px";
  svg.style.top = minY + "px";
  svg.style.overflow = "visible";

  // צור נתיב חיבור
  const path = document.createElementNS(svgNS, "path");

  // חשב נקודות בקרה לקו מעוקל
  const curvature = 0.5;
  const cpX1 = x1;
  const cpY1 = y1 + (y2 - y1) * curvature;
  const cpX2 = x2;
  const cpY2 = y2 - (y2 - y1) * curvature;

  // חשב נקודות יחסית למיקום ה-SVG
  const localX1 = x1 - minX;
  const localY1 = y1 - minY;
  const localX2 = x2 - minX;
  const localY2 = y2 - minY;
  const localCpX1 = cpX1 - minX;
  const localCpY1 = cpY1 - minY;
  const localCpX2 = cpX2 - minX;
  const localCpY2 = cpY2 - minY;

  // הגדר נתיב
  const d = `M ${localX1} ${localY1} C ${localCpX1} ${localCpY1}, ${localCpX2} ${localCpY2}, ${localX2} ${localY2}`;
  path.setAttribute("d", d);
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", getConnectionColor(connection.source));
  path.setAttribute("stroke-width", "2");

  // הוסף חץ
  const arrow = document.createElementNS(svgNS, "polygon");

  // חשב זווית החץ
  const angle = Math.atan2(localY2 - localCpY2, localX2 - localCpX2);
  const size = 8;

  // חשב נקודות החץ
  const arrowPoints = [
    localX2, localY2,
    localX2 - size * Math.cos(angle - Math.PI / 6), localY2 - size * Math.sin(angle - Math.PI / 6),
    localX2 - size * Math.cos(angle + Math.PI / 6), localY2 - size * Math.sin(angle + Math.PI / 6)
  ];

  arrow.setAttribute("points", arrowPoints.join(","));
  arrow.setAttribute("fill", getConnectionColor(connection.source));

  // הוסף אלמנטים ל-SVG
  svg.appendChild(path);
  svg.appendChild(arrow);
  connectionEl.appendChild(svg);

  // הוסף חיבור לקנבס
  canvas.appendChild(connectionEl);
  connectionsRef.current.push(connectionEl);
  
  console.log('חיבור נוצר בהצלחה');
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