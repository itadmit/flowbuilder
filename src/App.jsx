import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  addEdge, 
  useNodesState, 
  useEdgesState 
} from 'reactflow';
import 'reactflow/dist/style.css';

import TextNodeComponent from './components/nodes/TextNode';
import OptionsNodeComponent from './components/nodes/OptionsNode';
import WelcomeNodeComponent from './components/nodes/WelcomeNode';
import DelayNodeComponent from './components/nodes/DelayNode';
import CustomEdge from './components/CustomEdge';

import Sidebar from './components/Sidebar';
import NodeEditModal from './components/modals/NodeEditModal';
import PreviewModal from './components/modals/PreviewModal';
import SaveModal from './components/modals/SaveModal';
import ConnectModal from './components/modals/ConnectModal';
import Header from './components/Header';

import './FlowBuilder.css';

// Register custom node types
const nodeTypes = {
  textNode: TextNodeComponent,
  optionsNode: OptionsNodeComponent,
  welcomeNode: WelcomeNodeComponent,
  delayNode: DelayNodeComponent,
};

// Register custom edge types
const edgeTypes = {
  custom: CustomEdge,
};

const FlowBuilder = () => {
  // Flow states
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  
  // Modal states
  const [showNodeEdit, setShowNodeEdit] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [showConnect, setShowConnect] = useState(false);
  
  // Currently selected node
  const [selectedNode, setSelectedNode] = useState(null);
  // Currently selected edge
  const [selectedEdge, setSelectedEdge] = useState(null);
  
  // Flow container ref
  const reactFlowWrapper = useRef(null);
  
  // Whatsapp connection state
  const [isConnected, setIsConnected] = useState(false);
  
  // Chatbot data
  const [chatbotData, setChatbotData] = useState(null);
  const [chatbotsList, setChatbotsList] = useState([]);

  // Handle connections between nodes
  const onConnect = useCallback((params) => {
    console.log('Connecting nodes with params:', params);
    
    // Create a unique key for this connection
    const connectionKey = `${params.source}:${params.sourceHandle || 'default'}->${params.target}:${params.targetHandle || 'default'}`;
    
    // Check if a connection already exists
    setEdges((eds) => {
      // First remove any duplicate connections that might exist
      const existingEdges = eds.filter(
        edge => 
          !(edge.source === params.source && 
            edge.target === params.target &&
            edge.sourceHandle === params.sourceHandle &&
            edge.targetHandle === params.targetHandle)
      );
      
      // Now add the new edge
      const newEdge = {
        ...params,
        id: `edge-${connectionKey}-${Date.now()}`,
        animated: true,
        style: { stroke: '#25D366' },
        type: 'custom', // Use our custom edge type
        data: { connectionKey } // Store the connection key for reference
      };
      
      return addEdge(newEdge, existingEdges);
    });
  }, [setEdges]);

  // Handle edge click
  const onEdgeClick = (event, edge) => {
    console.log('Edge clicked:', edge);
    
    // Set this edge as selected and deselect any nodes
    setSelectedEdge(edge.id);
    setSelectedNode(null);
    
    // Prevent node selection if we're clicking on an edge
    event.stopPropagation();
  };

  // Handle click on the canvas (deselect elements)
  const onPaneClick = useCallback((event) => {
    // Only deselect if clicking directly on the pane (not a node or edge)
    if (event.target.classList.contains('react-flow__pane')) {
      setSelectedEdge(null);
      setSelectedNode(null);
    }
  }, []);
  
  // Function to check if an edge is selected
  const isEdgeSelected = useCallback((edge) => {
    return selectedEdge === edge.id;
  }, [selectedEdge]);

  // Handle drop from sidebar to create a new node
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Create a new node when dropped
  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');
      
      // Check if the dropped element is valid
      if (typeof type === 'undefined' || !type) {
        return;
      }

      // Prevent adding more than one welcome node
      if (type === 'welcomeNode' && nodes.some(node => node.type === 'welcomeNode')) {
        alert('יכולה להיות רק הודעת פתיחה אחת');
        return;
      }

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      // Create the new node with default values
      const newNode = {
        id: `node-${Date.now()}`,
        type,
        position,
        data: getDefaultDataByType(type),
        style: {
          border: type === 'welcomeNode' ? '2px solid #4CAF50' : '1px solid #ddd',
          borderRadius: '8px',
          padding: '10px',
          width: 280,
        }
      };

      setNodes((nds) => nds.concat(newNode));
      
      // Open edit modal for the new node
      setSelectedNode(newNode);
      setShowNodeEdit(true);
    },
    [reactFlowInstance, nodes, setNodes]
  );

  // Get default data based on node type
  const getDefaultDataByType = (type) => {
    switch (type) {
      case 'welcomeNode':
        return {
          name: 'הודעת פתיחה',
          message: 'שלום! ברוך הבא לצאטבוט שלי. במה אוכל לעזור לך?',
          nodeType: 'welcome'
        };
      case 'textNode':
        return {
          name: 'הודעת טקסט',
          message: 'זוהי הודעת טקסט. כתוב כאן את ההודעה שתרצה לשלוח ללקוח.',
          nodeType: 'text'
        };
      case 'optionsNode':
        return {
          name: 'אפשרויות בחירה',
          message: 'בחר אחת מהאפשרויות הבאות:',
          options: ['אפשרות 1'],
          nodeType: 'options'
        };
      case 'delayNode':
        return {
          name: 'השהייה',
          message: 'אני ממתין לתגובה שלך...',
          delay: { type: 'wait', seconds: 5 },
          nodeType: 'delay'
        };
      default:
        return { name: 'צומת חדש', message: '', nodeType: 'text' };
    }
  };

  // Handle node selection
  const onNodeClick = (event, node) => {
    setSelectedNode(node);
    // Deselect any selected edge when a node is clicked
    setSelectedEdge(null);
  };

  // Handle double-click to edit a node
  const onNodeDoubleClick = (event, node) => {
    setSelectedNode(node);
    setShowNodeEdit(true);
    // Deselect any selected edge when a node is double-clicked
    setSelectedEdge(null);
  };

  // Save node edit
  const saveNodeEdit = (nodeData) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          return {
            ...node,
            data: nodeData
          };
        }
        return node;
      })
    );
    setShowNodeEdit(false);
  };

  // Delete a node
  const deleteNode = (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    
    if (node?.type === 'welcomeNode') {
      alert('לא ניתן למחוק את הודעת הפתיחה');
      return;
    }
    
    if (window.confirm('האם אתה בטוח שברצונך למחוק צומת זה?')) {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      ));
      
      // Close the edit modal after deletion
      setShowNodeEdit(false);
    }
  };
  
  // Delete an edge - add as a direct function to pass to the custom edge
  const deleteEdge = useCallback((edgeId) => {
    console.log(`מוחק קצה עם מזהה: ${edgeId}`);
    setEdges((edges) => edges.filter(edge => edge.id !== edgeId));
    setSelectedEdge(null);
  }, [setEdges]);
  
  // Create a context for the custom edge
  const edgeContext = useMemo(() => ({
    deleteEdge
  }), [deleteEdge]);

  // Helper function to check and fix edges after node changes
  const checkAndFixEdges = useCallback(() => {
    // Create a Map to store unique connections
    const uniqueConnections = new Map();
    const edgesToKeep = [];
    const duplicateEdges = [];
    
    // Process all edges
    edges.forEach(edge => {
      // Create a unique identifier for this connection
      const connectionKey = `${edge.source}:${edge.sourceHandle || 'default'}->${edge.target}:${edge.targetHandle || 'default'}`;
      
      if (!uniqueConnections.has(connectionKey)) {
        // This is the first occurrence of this connection
        uniqueConnections.set(connectionKey, edge.id);
        edgesToKeep.push(edge);
      } else {
        // This is a duplicate connection
        duplicateEdges.push(edge);
      }
    });
    
    // If duplicates found, update the edges state
    if (duplicateEdges.length > 0) {
      console.log(`Found ${duplicateEdges.length} duplicate edges. Removing:`, duplicateEdges);
      setEdges(edgesToKeep);
    }
  }, [edges, setEdges]);
  
  // Run edge check whenever edges change
  useEffect(() => {
    checkAndFixEdges();
  }, [edges, checkAndFixEdges]);
  
  // Handle keyboard events for deleting nodes and edges
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Delete') {
        if (selectedEdge) {
          deleteEdge(selectedEdge);
        } else if (selectedNode && selectedNode.type !== 'welcomeNode') {
          deleteNode(selectedNode.id);
        }
      }
    };
  
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedNode, selectedEdge, deleteEdge, deleteNode]);
  // Make sure to add selectedNode to your state variables
  
  // Run edge check whenever edges change
  useEffect(() => {
    checkAndFixEdges();
  }, [edges, checkAndFixEdges]);

  // Clear the canvas
  const clearCanvas = () => {
    if (window.confirm('האם אתה בטוח שברצונך לנקות את הקנבס? כל הצמתים והחיבורים יימחקו.')) {
      setNodes([]);
      setEdges([]);
      
      // Create a new welcome node
      const welcomeNode = {
        id: `node-${Date.now()}`,
        type: 'welcomeNode',
        position: { x: 50, y: 50 },
        data: getDefaultDataByType('welcomeNode'),
        style: {
          border: '2px solid #4CAF50',
          borderRadius: '8px',
          padding: '10px',
          width: 280,
        }
      };
      
      setNodes([welcomeNode]);
    }
  };

  // Save chatbot
  const saveChatbot = async (name, description) => {
    if (!name) {
      alert('יש להזין שם לצאטבוט');
      return { success: false, error: 'Missing name' };
    }
    
    // בדיקה שמערך הצמתים לא ריק
    console.log("Nodes to save:", nodes); // לדיבאג
    
    if (!nodes || nodes.length === 0) {
      alert('אין צמתים לשמירה. אנא הוסף לפחות צומת אחד.');
      return { success: false, error: 'No nodes to save' };
    }
    
    
    // Create data object
    const data = {
      name: name,
      description: description,
      flow: {
        nodes: nodes,
        edges: edges
      }
    };
    
    if (chatbotData && chatbotData.id) {
      data.id = chatbotData.id;
    }
    
    // Send to server
    const formData = new FormData();
    formData.append('chatbot_data', JSON.stringify(data));
    
    try {
      const response = await fetch('api/save_chatbot.php', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        if (result.chatbot_id && (!chatbotData || !chatbotData.id)) {
          setChatbotData({
            ...data,
            id: result.chatbot_id
          });
          
          // Update URL with new ID
          const url = new URL(window.location);
          url.searchParams.set('id', result.chatbot_id);
          window.history.pushState({}, '', url);
        }
        
        return { success: true };
      } else {
        return { success: false, error: result.error || 'לא ניתן לשמור את הצאטבוט' };
      }
    } catch (error) {
      console.error('Error saving chatbot:', error);
      return { success: false, error: 'שגיאה בשמירת הצאטבוט' };
    }
  };

  // Connect to WhatsApp
  const connectToWhatsapp = async (apiKey, phoneNumber) => {
    if (!apiKey) {
      alert('יש להזין מפתח API תקין');
      return { success: false, error: 'Missing API key' };
    }
    
    if (!phoneNumber) {
      alert('יש להזין מספר טלפון תקין');
      return { success: false, error: 'Missing phone number' };
    }
    
    const formData = new FormData();
    formData.append('api_key', apiKey);
    formData.append('phone_number', phoneNumber);
    
    try {
      const response = await fetch('api/whatsapp_connect.php', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (data.status === 'connected') {
          setIsConnected(true);
        }
        return data;
      } else {
        return { success: false, error: data.error || 'לא ניתן להתחבר' };
      }
    } catch (error) {
      console.error('Error connecting to WhatsApp:', error);
      return { success: false, error: 'שגיאה בחיבור לוואטסאפ' };
    }
  };

  // Load chatbot by ID
  const loadChatbotById = (id) => {
    if (!id) return;
    
    window.location.href = `index.php?id=${id}`;
  };

  // Load chatbot data from server
  const loadChatbotData = (data) => {
    if (data.flow) {
      // Update edge types to use custom edge type
      const updatedEdges = data.flow.edges.map(edge => ({
        ...edge,
        type: 'custom',
        animated: true,
        style: { stroke: '#25D366' }
      }));
      
      setNodes(data.flow.nodes || []);
      setEdges(updatedEdges || []);
      setChatbotData(data);
    }
  };

  // Initialize component
  React.useEffect(() => {
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
            
            // Create a welcome node
            const welcomeNode = {
              id: `node-${Date.now()}`,
              type: 'welcomeNode',
              position: { x: 50, y: 50 },
              data: getDefaultDataByType('welcomeNode'),
              style: {
                border: '2px solid #4CAF50',
                borderRadius: '8px',
                padding: '10px',
                width: 280,
              }
            };
            
            setNodes([welcomeNode]);
          }
        })
        .catch(error => {
          console.error('Error loading chatbot:', error);
          
          // Create a welcome node
          const welcomeNode = {
            id: `node-${Date.now()}`,
            type: 'welcomeNode',
            position: { x: 50, y: 50 },
            data: getDefaultDataByType('welcomeNode'),
            style: {
              border: '2px solid #4CAF50',
              borderRadius: '8px',
              padding: '10px',
              width: 280,
            }
          };
          
          setNodes([welcomeNode]);
        });
    } else {
      // Create a welcome node
      const welcomeNode = {
        id: `node-${Date.now()}`,
        type: 'welcomeNode',
        position: { x: 50, y: 50 },
        data: getDefaultDataByType('welcomeNode'),
        style: {
          border: '2px solid #4CAF50',
          borderRadius: '8px',
          padding: '10px',
          width: 280,
        }
      };
      
      setNodes([welcomeNode]);
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
    fetch('api/check_connection.php')
      .then(response => response.json())
      .then(data => {
        setIsConnected(data.success && data.connected);
      })
      .catch(error => {
        console.error('Error checking connection status:', error);
        setIsConnected(false);
      });
  }, []);

  return (
    <div className="app">
      <Header 
        isConnected={isConnected}
        openPreviewModal={() => setShowPreview(true)}
        openConnectModal={() => setShowConnect(true)}
        openSaveModal={() => setShowSave(true)}
        chatbotName={chatbotData ? chatbotData.name : 'זרימת הצאטבוט שלך'}
      />
      
      <div className="container">
        <div className="builder">
          <Sidebar 
            clearCanvas={clearCanvas}
            chatbotsList={chatbotsList}
            loadChatbotById={loadChatbotById}
          />
          
          <div className="canvas-container" ref={reactFlowWrapper}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onNodeClick={onNodeClick}
              onNodeDoubleClick={onNodeDoubleClick}
              onEdgeClick={onEdgeClick}
              onPaneClick={onPaneClick}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView={{ padding: 0.3 }}
              snapToGrid
              snapGrid={[15, 15]}
              defaultViewport={{ x: 0, y: 0, zoom: 0.6 }}
              attributionPosition="bottom-left"
              edgesUpdatable={true}
              edgesFocusable={true}
              elementsSelectable={true}
              isEdgeSelected={isEdgeSelected}
              deleteKeyCode="Delete"
              multiSelectionKeyCode="Control"
              defaultEdgeOptions={{
                type: 'custom',
                animated: true,
                data: { context: edgeContext }
              }}
            >
              <Background color="#f5f5f5" gap={16} size={1} />
              <Controls />
              <MiniMap
                nodeStrokeColor={(n) => {
                  if (n.type === 'welcomeNode') return '#4CAF50';
                  if (n.type === 'textNode') return '#34B7F1';
                  if (n.type === 'optionsNode') return '#25D366';
                  if (n.type === 'delayNode') return '#FF9800';
                  return '#ddd';
                }}
                nodeColor={(n) => {
                  if (n.type === 'welcomeNode') return '#e6f7e6';
                  if (n.type === 'textNode') return '#e6f7fc';
                  if (n.type === 'optionsNode') return '#e6faea';
                  if (n.type === 'delayNode') return '#fff6e8';
                  return '#ffffff';
                }}
                style={{ background: 'white' }}
              />
            </ReactFlow>
          </div>
        </div>
      </div>
      
      {showNodeEdit && selectedNode && (
        <NodeEditModal 
          node={selectedNode}
          onSave={saveNodeEdit}
          onClose={() => setShowNodeEdit(false)}
          onDelete={() => deleteNode(selectedNode.id)}
        />
      )}
      
      {showPreview && (
        <PreviewModal 
          nodes={nodes}
          edges={edges}
          onClose={() => setShowPreview(false)}
        />
      )}
      
      {showConnect && (
        <ConnectModal 
          onConnect={connectToWhatsapp}
          onClose={() => setShowConnect(false)}
        />
      )}
      
      {showSave && (
        <SaveModal 
          chatbotData={chatbotData}
          onSave={saveChatbot}
          onClose={() => setShowSave(false)}
        />
      )}
    </div>
  );
};

export default FlowBuilder;