// App.jsx - Main component
import React, { useState, useEffect, useRef } from 'react';
import './FlowBuilder.css'; // We'll create this CSS file with all the styles from paste-2.txt
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import NodeEditModal from './components/modals/NodeEditModal';
import PreviewModal from './components/modals/PreviewModal';
import ConnectModal from './components/modals/ConnectModal';
import SaveModal from './components/modals/SaveModal';

const App = () => {
  // State variables
  const [nodes, setNodes] = useState({});
  const [nextNodeId, setNextNodeId] = useState(1);
  const [scale, setScale] = useState(1);
  const [activeNode, setActiveNode] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [sourceConnector, setSourceConnector] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [chatbotData, setChatbotData] = useState(null);
  const [chatbotsList, setChatbotsList] = useState([]);
  
  // Modal states
  const [showNodeEditModal, setShowNodeEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  
  // Node edit state
  const [editingNode, setEditingNode] = useState(null);
  
  // Refs
  const canvasRef = useRef(null);
  const dragLineRef = useRef(null);

  // Load chatbot data on initial render
  useEffect(() => {
    // Check if there's a chatbot ID in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const chatbotId = urlParams.get('id');
    
    if (chatbotId) {
      // Fetch chatbot data from the server
      fetch(`api/load_chatbot.php?id=${chatbotId}`)
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            loadChatbotData(data.chatbot);
          } else {
            console.error('Failed to load chatbot:', data.error);
            createWelcomeNode();
          }
        })
        .catch(error => {
          console.error('Error loading chatbot:', error);
          createWelcomeNode();
        });
    } else {
      createWelcomeNode();
    }
    
    // Fetch list of all chatbots
    fetch('api/get_chatbots.php')
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          setChatbotsList(data.chatbots || []);
        }
      })
      .catch(error => {
        console.error('Error loading chatbots list:', error);
      });
      
    // Check WhatsApp connection status
    checkConnectionStatus();
    
    // Set up event listeners
    window.addEventListener('resize', updateConnections);
    
    return () => {
      // Clean up event listeners
      window.removeEventListener('resize', updateConnections);
    };
  }, []);

  // Check WhatsApp connection status
  const checkConnectionStatus = () => {
    fetch('api/check_connection.php')
      .then(response => response.json())
      .then(data => {
        setIsConnected(data.success && data.connected);
      })
      .catch(error => {
        console.error('Error checking connection status:', error);
        setIsConnected(false);
      });
  };

  // Load chatbot data
  const loadChatbotData = (data) => {
    // Reset current data
    setNodes({});
    setNextNodeId(1);
    
    // Load nodes
    if (data.nodes) {
      const nodesData = {...data.nodes};
      setNodes(nodesData);
      
      // Update nextNodeId
      const maxId = Object.keys(nodesData)
        .map(id => parseInt(id.replace('node-', '')))
        .reduce((max, id) => Math.max(max, id), 0);
      
      setNextNodeId(maxId + 1);
      setChatbotData(data);
    }
  };

  // Create welcome node
  const createWelcomeNode = () => {
    const id = `node-${nextNodeId}`;
    
    const newNodes = {
      ...nodes,
      [id]: {
        id: id,
        type: 'welcome',
        name: 'הודעת פתיחה',
        message: 'שלום! ברוך הבא לצ\'אטבוט שלי. במה אוכל לעזור לך?',
        x: 50,
        y: 50,
        options: [],
        connections: []
      }
    };
    
    setNodes(newNodes);
    setNextNodeId(nextNodeId + 1);
  };

  // Create a new node
  const createNode = (type, x, y) => {
    console.log('Creating node:', type, 'at position:', x, y);
    console.log('Current nodes before update:', nodes);
  
    const id = `node-${nextNodeId}`;
    
    // Default node data based on type
    const newNode = {
      id: id,
      type: type,
      name: getDefaultNameByType(type),
      message: getDefaultMessageByType(type),
      x: x,
      y: y,
      options: type === 'options' ? ['אפשרות 1'] : [],
      delay: type === 'delay' ? { type: 'wait', seconds: 5 } : null,
      connections: []
    };
    
    console.log('Creating new node:', newNode);
    
    // Make a completely fresh copy of the existing nodes
    const updatedNodes = JSON.parse(JSON.stringify(nodes));
    
    // Add the new node
    updatedNodes[id] = newNode;
    
    console.log('Updated nodes after:', updatedNodes);
    
    // Update the state with the new nodes
    setNodes(updatedNodes);
    
    setNextNodeId(nextNodeId + 1);
    openNodeEdit(id);
  };
  

  // Open node edit modal
  const openNodeEdit = (nodeId) => {
    const node = nodes[nodeId];
    if (!node) return;
    
    setEditingNode(node);
    setShowNodeEditModal(true);
  };

  // Save node edit
  const saveNodeEdit = (nodeData) => {
    setNodes({
      ...nodes,
      [nodeData.id]: nodeData
    });
    setShowNodeEditModal(false);
  };

  // Delete a node
  const deleteNode = (nodeId) => {
    if (nodes[nodeId].type === 'welcome') {
      alert('לא ניתן למחוק את הודעת הפתיחה');
      return;
    }
    
    if (window.confirm('האם אתה בטוח שברצונך למחוק צומת זה?')) {
      // Remove connections to this node
      const updatedNodes = {...nodes};
      
      Object.keys(updatedNodes).forEach(id => {
        if (id !== nodeId) {
          updatedNodes[id].connections = updatedNodes[id].connections.filter(
            conn => conn.target !== nodeId
          );
        }
      });
      
      // Remove the node
      delete updatedNodes[nodeId];
      
      setNodes(updatedNodes);
    }
  };

  // Start connection drag
// תיקון הפונקציות הקשורות לגרירת חיבורים בקובץ App.jsx

// 1. פונקציית startDragConnection מעודכנת
// App.jsx - פונקציית startDragConnection מתוקנת
const startDragConnection = (e, nodeId, index) => {
  e.preventDefault();
  e.stopPropagation();
  
  console.log('התחלת גרירת חיבור מנוד:', nodeId, 'מחבר:', index);
  
  const connector = e.target;
  const connectorRect = connector.getBoundingClientRect();
  const canvas = canvasRef.current;
  if (!canvas) return;
  
  const canvasRect = canvas.getBoundingClientRect();
  
  // Calculate start position (relative to canvas)
  const startX = connectorRect.left + connectorRect.width/2 - canvasRect.left + canvas.scrollLeft;
  const startY = connectorRect.top + connectorRect.height/2 - canvasRect.top + canvas.scrollTop;
  
  setSourceConnector({
    nodeId,
    index: parseInt(index),
    startX,
    startY
  });
  setConnecting(true);
  
  // יצירת קו גרירה (חשוב!)
  const dragLine = document.createElement('div');
  dragLine.className = 'drag-line';
  dragLine.style.position = 'absolute';
  dragLine.style.zIndex = '1000';
  dragLine.style.pointerEvents = 'none'; 
  canvas.appendChild(dragLine);
  dragLineRef.current = dragLine;
  
  // יצירת SVG ריק לקו
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.style.overflow = 'visible';
  dragLine.appendChild(svg);
  
  // עדכון ראשוני של קו הגרירה
  updateDragLine(startX, startY, startX, startY);
  
  // Add event listeners for drag
  document.addEventListener('mousemove', dragConnection);
  document.addEventListener('mouseup', endDragConnection);
  
  // Change cursor
  document.body.style.cursor = 'crosshair';
};

// 2. פונקציית dragConnection מעודכנת
// App.jsx - פונקציית dragConnection מתוקנת
const dragConnection = (e) => {
  if (!connecting || !sourceConnector || !dragLineRef.current || !canvasRef.current) return;
  
  const canvas = canvasRef.current;
  const canvasRect = canvas.getBoundingClientRect();
  const currentX = e.clientX - canvasRect.left + canvas.scrollLeft;
  const currentY = e.clientY - canvasRect.top + canvas.scrollTop;
  
  // עדכן את קו הגרירה בכל תזוזת עכבר
  updateDragLine(sourceConnector.startX, sourceConnector.startY, currentX, currentY);
  
  // הדגש את המחבר הקרוב ביותר
  highlightNearestConnector(e);
};

// 3. פונקציית updateDragLine מעודכנת
// App.jsx - פונקציית updateDragLine מתוקנת
const updateDragLine = (x1, y1, x2, y2) => {
  if (!dragLineRef.current) return;
  
  const dragLine = dragLineRef.current;
  const svg = dragLine.querySelector('svg');
  if (!svg) return;
  
  // נקה את הSVG
  while (svg.firstChild) {
    svg.removeChild(svg.firstChild);
  }
  
  // חשב גבולות
  const minX = Math.min(x1, x2) - 10;
  const minY = Math.min(y1, y2) - 10;
  const width = Math.abs(x2 - x1) + 20;
  const height = Math.abs(y2 - y1) + 20;
  
  // עדכן את מיקום וגודל הSVG
  svg.setAttribute("width", width);
  svg.setAttribute("height", height);
  svg.style.position = "absolute";
  svg.style.left = minX + "px";
  svg.style.top = minY + "px";
  
  // יצור נתיב
  const svgNS = "http://www.w3.org/2000/svg";
  const path = document.createElementNS(svgNS, "path");
  
  // חשב נקודות יחסיות
  const localX1 = x1 - minX;
  const localY1 = y1 - minY;
  const localX2 = x2 - minX;
  const localY2 = y2 - minY;
  
  // חשב עקומה
  const curvature = 0.5;
  const cpX1 = localX1;
  const cpY1 = localY1 + (localY2 - localY1) * curvature;
  const cpX2 = localX2;
  const cpY2 = localY2 - (localY2 - localY1) * curvature;
  
  // הגדר נתיב
  const d = `M ${localX1} ${localY1} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${localX2} ${localY2}`;
  path.setAttribute("d", d);
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "#25D366");
  path.setAttribute("stroke-width", "3");
  path.setAttribute("stroke-dasharray", "5,5");
  
  // הוסף את הנתיב לSVG
  svg.appendChild(path);
  
  // הוסף חץ בקצה הקו
  const arrow = document.createElementNS(svgNS, "polygon");
  
  // חשב זווית
  const angle = Math.atan2(localY2 - cpY2, localX2 - cpX2);
  const size = 8;
  
  // חשב נקודות חץ
  const arrowPoints = [
    localX2, localY2,
    localX2 - size * Math.cos(angle - Math.PI / 6), localY2 - size * Math.sin(angle - Math.PI / 6),
    localX2 - size * Math.cos(angle + Math.PI / 6), localY2 - size * Math.sin(angle + Math.PI / 6)
  ];
  
  arrow.setAttribute("points", arrowPoints.join(","));
  arrow.setAttribute("fill", "#25D366");
  
  // הוסף את החץ לSVG
  svg.appendChild(arrow);
};

// 4. פונקציית highlightNearestConnector מעודכנת
const highlightNearestConnector = (e) => {
  // Remove previous highlights
  document.querySelectorAll('.connector').forEach(c => {
    c.classList.remove('connector-hover');
  });
  
  // Find the nearest connector
  const nearestConnector = findNearestConnector(e);
  
  // Highlight it
  if (nearestConnector) {
    nearestConnector.classList.add('connector-hover');
  }
};

// 5. פונקציית findNearestConnector מעודכנת
const findNearestConnector = (e) => {
  if (!sourceConnector) return null;
  
  let closestConnector = null;
  let minDistance = 50; // max distance in pixels
  
  document.querySelectorAll('.connector').forEach(connector => {
    // Don't check the source connector
    if (connector.closest('.node').id === sourceConnector.nodeId) {
      return;
    }
    
    const rect = connector.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate Euclidean distance
    const distance = Math.sqrt(
      Math.pow(e.clientX - centerX, 2) + 
      Math.pow(e.clientY - centerY, 2)
    );
    
    // Check if close enough
    if (distance < minDistance) {
      minDistance = distance;
      closestConnector = connector;
    }
  });
  
  return closestConnector;
};

// 6. פונקציית endDragConnection מעודכנת
// App.jsx - פונקציית endDragConnection מתוקנת
const endDragConnection = (e) => {
  if (!connecting || !sourceConnector) return;
  
  // הסר מאזיני אירועים
  document.removeEventListener('mousemove', dragConnection);
  document.removeEventListener('mouseup', endDragConnection);
  
  // החזר את סמן העכבר
  document.body.style.cursor = 'default';
  
  // הסר את קו הגרירה
  if (dragLineRef.current) {
    try {
      dragLineRef.current.remove();
    } catch (error) {
      console.error('שגיאה בהסרת קו גרירה:', error);
    }
    dragLineRef.current = null;
  }
  
  // בדוק אם נמצא מחבר יעד
  const targetConnector = findNearestConnector(e);
  if (targetConnector) {
    const targetNodeId = targetConnector.closest('.node').id;
    
    // אל תיצור חיבור לאותו הנוד
    if (targetNodeId !== sourceConnector.nodeId) {
      console.log('יוצר חיבור בין נוד:', sourceConnector.nodeId, 'לנוד:', targetNodeId);
      
      // צור את החיבור
      createConnection(sourceConnector.nodeId, targetNodeId, sourceConnector.index);
      
      // הדגש את מחבר היעד לזמן קצר
      targetConnector.classList.add('connector-success');
      setTimeout(() => {
        targetConnector.classList.remove('connector-success');
        targetConnector.classList.remove('connector-hover');
      }, 1000);
    }
  }
  
  // הסר הדגשות מכל המחברים
  document.querySelectorAll('.connector').forEach(c => {
    c.classList.remove('connector-hover');
  });
  
  // אפס את מצב החיבור
  setConnecting(false);
  setSourceConnector(null);
};

// 7. פונקציית createConnection מעודכנת
const createConnection = (sourceId, targetId, sourceIndex) => {
  console.log('יצירת חיבור בין', sourceId, 'ל-', targetId, 'מחבר:', sourceIndex);
  
  // Use functional update to ensure we have the latest state
  setNodes(prevNodes => {
    // Check if nodes exist
    if (!prevNodes[sourceId] || !prevNodes[targetId]) {
      console.error('Node not found:', !prevNodes[sourceId] ? sourceId : targetId);
      return prevNodes;
    }
    
    // Create a fresh copy of the nodes
    const updatedNodes = JSON.parse(JSON.stringify(prevNodes));
    
    // Ensure connections array exists
    if (!updatedNodes[sourceId].connections) {
      updatedNodes[sourceId].connections = [];
    }
    
    // Remove any existing connection from the same connector
    updatedNodes[sourceId].connections = updatedNodes[sourceId].connections.filter(
      conn => parseInt(conn.sourceIndex) !== parseInt(sourceIndex)
    );
    
    // Add the new connection
    updatedNodes[sourceId].connections.push({
      source: sourceId,
      target: targetId,
      sourceIndex: parseInt(sourceIndex)
    });
    
    // Log the update
    console.log('עדכון חיבורים:', updatedNodes[sourceId].connections);
    
    // Save to localStorage
    try {
      localStorage.setItem('flowbuilder_nodes', JSON.stringify(updatedNodes));
    } catch (e) {
      console.error('שגיאה בשמירה ב-localStorage:', e);
    }
    
    return updatedNodes;
  });
};

  // Update all visual connections
  const updateConnections = () => {
    // This function will be called from the Canvas component
    // after nodes are rendered to properly draw connections
  };

  // Clear the canvas
  const clearCanvas = () => {
    if (window.confirm('האם אתה בטוח שברצונך לנקות את הקנבס? כל הצמתים והחיבורים יימחקו.')) {
      setNodes({});
      setNextNodeId(1);
      createWelcomeNode();
    }
  };

  // Save chatbot
  const saveChatbot = (name, description) => {
    if (!name) {
      alert('יש להזין שם לצ\'אטבוט');
      return;
    }
    
    if (Object.keys(nodes).length === 0) {
      alert('אין צמתים לשמירה');
      return;
    }
    
    // Create data object
    const data = {
      name: name,
      description: description,
      nodes: nodes
    };
    
    if (chatbotData && chatbotData.id) {
      data.id = chatbotData.id;
    }
    
    // Send to server
    const formData = new FormData();
    formData.append('chatbot_data', JSON.stringify(data));
    
    return fetch('api/save_chatbot.php', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(result => {
      if (result.success) {
        if (result.chatbot_id && (!chatbotData || !chatbotData.id)) {
          setChatbotData({
            ...chatbotData,
            id: result.chatbot_id
          });
          
          // Update URL with new ID
          const url = new URL(window.location);
          url.searchParams.set('id', result.chatbot_id);
          window.history.pushState({}, '', url);
        }
        
        return { success: true };
      } else {
        return { success: false, error: result.error || 'לא ניתן לשמור את הצ\'אטבוט' };
      }
    })
    .catch(error => {
      console.error('Error saving chatbot:', error);
      return { success: false, error: 'שגיאה בשמירת הצ\'אטבוט' };
    });
  };

  // Connect to WhatsApp
  const connectToWhatsapp = (apiKey, phoneNumber) => {
    if (!apiKey) {
      alert('יש להזין מפתח API תקין');
      return Promise.reject('Missing API key');
    }
    
    if (!phoneNumber) {
      alert('יש להזין מספר טלפון תקין');
      return Promise.reject('Missing phone number');
    }
    
    const formData = new FormData();
    formData.append('api_key', apiKey);
    formData.append('phone_number', phoneNumber);
    
    return fetch('api/whatsapp_connect.php', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        if (data.status === 'connected') {
          setIsConnected(true);
        }
        return data;
      } else {
        throw new Error(data.error || 'לא ניתן להתחבר');
      }
    });
  };

  // Load chatbot by ID
  const loadChatbotById = (id) => {
    if (!id) return;
    
    window.location.href = `index.php?id=${id}`;
  };

  // Helper functions for node defaults
  const getDefaultNameByType = (type) => {
    switch (type) {
      case 'welcome': return 'הודעת פתיחה';
      case 'text': return 'הודעת טקסט';
      case 'options': return 'אפשרויות בחירה';
      case 'delay': return 'השהייה';
      default: return 'צומת חדש';
    }
  };

  const getDefaultMessageByType = (type) => {
    switch (type) {
      case 'welcome': return 'שלום! ברוך הבא לצ\'אטבוט שלי. במה אוכל לעזור לך?';
      case 'text': return 'זוהי הודעת טקסט. כתוב כאן את ההודעה שתרצה לשלוח ללקוח.';
      case 'options': return 'בחר אחת מהאפשרויות הבאות:';
      case 'delay': return 'אני ממתין לתגובה שלך...';
      default: return '';
    }
  };

  const getIconByType = (type) => {
    switch (type) {
      case 'welcome': return 'fas fa-comment-dots';
      case 'text': return 'fas fa-comment';
      case 'options': return 'fas fa-list-ol';
      case 'delay': return 'fas fa-clock';
      default: return 'fas fa-comment';
    }
  };

  const getConnectionColor = (nodeId) => {
    if (!nodes[nodeId]) return '#25D366'; // default
    
    switch (nodes[nodeId].type) {
      case 'welcome': return '#4CAF50';
      case 'text': return '#34B7F1';
      case 'options': return '#25D366';
      case 'delay': return '#FF9800';
      default: return '#25D366';
    }
  };

  // Zoom functions
  const zoomIn = () => {
    if (scale < 2) {
      setScale(scale + 0.1);
    }
  };

  const zoomOut = () => {
    if (scale > 0.5) {
      setScale(scale - 0.1);
    }
  };

  const zoomReset = () => {
    setScale(1);
  };

  return (
    <div className="app">
      <Header 
        isConnected={isConnected}
        openPreviewModal={() => setShowPreviewModal(true)}
        openConnectModal={() => setShowConnectModal(true)}
        openSaveModal={() => setShowSaveModal(true)}
        chatbotName={chatbotData ? chatbotData.name : 'זרימת הצ\'אטבוט שלך'}
      />
      
      <div className="container">
        <div className="builder">
          <Sidebar 
            createNode={createNode}
            clearCanvas={clearCanvas}
            chatbotsList={chatbotsList}
            loadChatbotById={loadChatbotById}
          />
          
          <Canvas 
  ref={canvasRef}
  nodes={nodes}
  scale={scale}
  zoomIn={zoomIn}
  zoomOut={zoomOut}
  zoomReset={zoomReset}
  activeNode={activeNode}
  setActiveNode={setActiveNode}
  openNodeEdit={openNodeEdit}
  deleteNode={deleteNode}
  startDragConnection={startDragConnection}
  getIconByType={getIconByType}
  getConnectionColor={getConnectionColor}
  updateConnections={updateConnections}
  chatbotTitle={chatbotData ? chatbotData.name : 'זרימת הצ\'אטבוט שלך'}
  createNode={createNode}  // וודא שזה קיים!
/>
        </div>
      </div>
      
      {showNodeEditModal && (
        <NodeEditModal 
          node={editingNode}
          onSave={saveNodeEdit}
          onClose={() => setShowNodeEditModal(false)}
        />
      )}
      
      {showPreviewModal && (
        <PreviewModal 
          nodes={nodes}
          onClose={() => setShowPreviewModal(false)}
        />
      )}
      
      {showConnectModal && (
        <ConnectModal 
          onConnect={connectToWhatsapp}
          onClose={() => setShowConnectModal(false)}
        />
      )}
      
      {showSaveModal && (
        <SaveModal 
          chatbotData={chatbotData}
          onSave={saveChatbot}
          onClose={() => setShowSaveModal(false)}
        />
      )}
    </div>
  );
};

export default App;