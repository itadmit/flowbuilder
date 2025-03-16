// connections-fixer.js
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(setupConnectionsFixer, 1500);
  });
  
  function setupConnectionsFixer() {
    console.log('מתקין פתרון לחיבורים...');
    
    // הוסף סגנונות חשובים
    addCriticalStyles();
    
    // האזן לשינויים בחיבורים
    monitorConnections();
  }
  
  function addCriticalStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* וודא שהחיבורים נראים */
      .connection {
        position: absolute;
        pointer-events: none;
        z-index: 95;
        display: block !important;
      }
      
      .connection svg {
        display: block !important;
        overflow: visible !important;
      }
      
      .connection path {
        stroke-width: 2px;
      }
      
      /* וודא שהקנבס יכול להכיל אותם */
      .canvas {
        position: relative;
        min-height: 400px;
      }
    `;
    
    document.head.appendChild(style);
  }
  
  function monitorConnections() {
    // תקן את החיבורים כל 1000 מילישניות (מנגנון אבטחה)
    setInterval(() => {
      // בדוק אם יש חיבורים שנוצרו אבל אינם נראים
      checkMissingConnections();
    }, 1000);
  }
  
  function checkMissingConnections() {
    // קבל את הנודים הנוכחיים
    const nodesJson = localStorage.getItem('flowbuilder_nodes');
    if (!nodesJson) return;
    
    const nodes = JSON.parse(nodesJson);
    
    // בדוק חיבורים בכל הנודים
    let connectionsCount = 0;
    Object.values(nodes).forEach(node => {
      if (node.connections && node.connections.length) {
        connectionsCount += node.connections.length;
      }
    });
    
    // בדוק כמה חיבורים נראים בDOM
    const visibleConnections = document.querySelectorAll('.connection').length;
    
    // אם יש פער, תקן
    if (connectionsCount > visibleConnections) {
      console.log(`תיקון חיבורים חסרים: ${connectionsCount} צפוי, ${visibleConnections} נראה`);
      forceRedrawConnections(nodes);
    }
  }
  
  function forceRedrawConnections(nodes) {
    // מצא את הקנבס
    const canvas = document.querySelector('.canvas');
    if (!canvas) return;
    
    // הסר את כל החיבורים הקיימים
    document.querySelectorAll('.connection').forEach(conn => conn.remove());
    
    // צייר מחדש את כל החיבורים
    Object.values(nodes).forEach(node => {
      if (node.connections && node.connections.length) {
        node.connections.forEach(connection => {
          createConnectionElement(connection, canvas, nodes);
        });
      }
    });
  }
  
  function createConnectionElement(connection, canvas, nodes) {
    // בדוק שיש נודים מקור ויעד
    const sourceNode = document.getElementById(connection.source);
    const targetNode = document.getElementById(connection.target);
    
    if (!sourceNode || !targetNode) return;
    
    // מצא את המחברים
    const sourceConnectors = sourceNode.querySelectorAll('.connector');
    if (connection.sourceIndex >= sourceConnectors.length) return;
    
    const sourceConnector = sourceConnectors[connection.sourceIndex];
    const targetConnector = targetNode.querySelector('.connector') || targetNode;
    
    // חשב מיקומים
    const canvasRect = canvas.getBoundingClientRect();
    const sourceRect = sourceConnector.getBoundingClientRect();
    const targetRect = targetConnector.getBoundingClientRect();
    
    // חישוב נקודות
    const x1 = sourceRect.left + sourceRect.width/2 - canvasRect.left + canvas.scrollLeft;
    const y1 = sourceRect.top + sourceRect.height/2 - canvasRect.top + canvas.scrollTop;
    const x2 = targetRect.left + targetRect.width/2 - canvasRect.left + canvas.scrollLeft;
    const y2 = targetRect.top + targetRect.height/2 - canvasRect.top + canvas.scrollTop;
    
    // צור אלמנט חיבור
    const connectionEl = document.createElement('div');
    connectionEl.className = 'connection forced-connection';
    
    // יצירת SVG
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    
    // חישוב גבולות
    const minX = Math.min(x1, x2) - 10;
    const minY = Math.min(y1, y2) - 10;
    const width = Math.abs(x2 - x1) + 20;
    const height = Math.abs(y2 - y1) + 20;
    
    // הגדרת תכונות SVG
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
    svg.style.position = "absolute";
    svg.style.left = minX + "px";
    svg.style.top = minY + "px";
    svg.style.overflow = "visible";
    
    // יצירת נתיב
    const path = document.createElementNS(svgNS, "path");
    
    // חישוב נקודות עקומה
    const curvature = 0.5;
    const cpX1 = x1;
    const cpY1 = y1 + (y2 - y1) * curvature;
    const cpX2 = x2;
    const cpY2 = y2 - (y2 - y1) * curvature;
    
    // חישוב נקודות יחסיות
    const localX1 = x1 - minX;
    const localY1 = y1 - minY;
    const localX2 = x2 - minX;
    const localY2 = y2 - minY;
    const localCpX1 = cpX1 - minX;
    const localCpY1 = cpY1 - minY;
    const localCpX2 = cpX2 - minX;
    const localCpY2 = cpY2 - minY;
    
    // הגדרת נתיב
    const d = `M ${localX1} ${localY1} C ${localCpX1} ${localCpY1}, ${localCpX2} ${localCpY2}, ${localX2} ${localY2}`;
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", getConnectionColor(connection.source, nodes));
    path.setAttribute("stroke-width", "2");
    
    // יצירת חץ
    const arrow = document.createElementNS(svgNS, "polygon");
    
    // חישוב זווית חץ
    const angle = Math.atan2(localY2 - localCpY2, localX2 - localCpX2);
    const size = 8;
    
    // חישוב נקודות חץ
    const arrowPoints = [
      localX2, localY2,
      localX2 - size * Math.cos(angle - Math.PI / 6), localY2 - size * Math.sin(angle - Math.PI / 6),
      localX2 - size * Math.cos(angle + Math.PI / 6), localY2 - size * Math.sin(angle + Math.PI / 6)
    ];
    
    arrow.setAttribute("points", arrowPoints.join(","));
    arrow.setAttribute("fill", getConnectionColor(connection.source, nodes));
    
    // הוספת אלמנטים ל-SVG
    svg.appendChild(path);
    svg.appendChild(arrow);
    connectionEl.appendChild(svg);
    
    // הוספת חיבור לקנבס
    canvas.appendChild(connectionEl);
  }
  
  function getConnectionColor(nodeId, nodes) {
    if (!nodes[nodeId]) return '#25D366'; // ברירת מחדל
    
    switch (nodes[nodeId].type) {
      case 'welcome': return '#4CAF50';
      case 'text': return '#34B7F1';
      case 'options': return '#25D366';
      case 'delay': return '#FF9800';
      default: return '#25D366';
    }
  }
  console.log('test');