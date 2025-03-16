// drag-fix.js - פתרון לבעיית הגרירה בלי כפתורים מיותרים
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(installDragFix, 1500);
  });
  
  function installDragFix() {
    console.log('מתקין פתרון גרירה חדש...');
    
    // בדיקה אם יש נודים שמורים
    const loadSavedNodes = () => {
      const savedNodes = localStorage.getItem('flowbuilder_nodes');
      if (savedNodes) {
        return JSON.parse(savedNodes);
      }
      return null;
    };
    
    // שמירת הנודים הנוכחיים
    const saveCurrentNodes = () => {
      // איסוף כל הנודים הקיימים ב-DOM
      const nodeElements = document.querySelectorAll('.node');
      if (nodeElements.length === 0) return;
      
      const nodesData = {};
      
      nodeElements.forEach(nodeEl => {
        const id = nodeEl.id;
        const type = Array.from(nodeEl.classList).find(cls => 
          ['welcome', 'text', 'options', 'delay'].includes(cls)
        );
        
        if (!id || !type) return;
        
        const x = parseFloat(nodeEl.style.left) || 0;
        const y = parseFloat(nodeEl.style.top) || 0;
        
        const messageEl = nodeEl.querySelector('.node-message');
        const message = messageEl ? messageEl.textContent.trim() : '';
        
        const titleEl = nodeEl.querySelector('.node-title');
        const name = titleEl ? 
          titleEl.textContent.replace(/^\s*[\r\n]+|\s+$/gm, '') : 
          getDefaultNameByType(type);
        
        // איסוף אפשרויות לצומת אפשרויות
        let options = [];
        if (type === 'options') {
          const optionItems = nodeEl.querySelectorAll('.option-item');
          options = Array.from(optionItems).map(item => 
            item.textContent.replace(/^\d+\.\s*/, '').trim()
          );
        }
        
        // בניית אובייקט נוד
        nodesData[id] = {
          id,
          type,
          name,
          message,
          x,
          y,
          options: options.length > 0 ? options : [],
          connections: [], // אין לנו דרך לדעת את החיבורים מה-DOM
          delay: type === 'delay' ? { type: 'wait', seconds: 5 } : null
        };
      });
      
      console.log('שומר נודים:', nodesData);
      localStorage.setItem('flowbuilder_nodes', JSON.stringify(nodesData));
      return nodesData;
    };
    
    // חיפוש נודים קיימים ושמירתם
    const existingNodes = document.querySelectorAll('.node');
    if (existingNodes.length > 0) {
      console.log('נמצאו נודים קיימים, שומר אותם...');
      saveCurrentNodes();
    }
    
    // האזנה לגרירת אלמנטים מהסיידבר
    const canvas = document.querySelector('.canvas');
    if (!canvas) {
      console.error('לא נמצא קנבס!');
      return;
    }
    
    // לכידת אירועי drop על הקנבס
    canvas.addEventListener('drop', function(e) {
      // תן לאירוע הרגיל להתרחש קודם
      setTimeout(() => {
        console.log('בדיקת מצב נודים אחרי drop...');
        
        // בדוק אם נוספו נודים חדשים ושמור אותם
        saveCurrentNodes();
        
        // בדוק אם יש רק נוד אחד (נוד חדש) ונודים קיימים אבדו
        const currentNodes = document.querySelectorAll('.node');
        if (currentNodes.length <= 1 && existingNodes.length > 1) {
          console.log('זוהתה בעיה: נודים נעלמו, משחזר נודים שמורים...');
          
          // שחזר נודים שמורים
          const savedNodes = loadSavedNodes();
          if (savedNodes) {
            restoreSavedNodes(savedNodes, canvas);
          }
        }
      }, 100);
    });
    
    // פונקציה לשחזור נודים שמורים
    function restoreSavedNodes(savedNodes, canvas) {
      // מחק נודים נוכחיים חוץ מהנוד החדש
      const newNode = document.querySelector('.node');
      const newNodeId = newNode ? newNode.id : null;
      
      // יצירה מחדש של כל הנודים שנשמרו
      Object.values(savedNodes).forEach(nodeData => {
        // דלג על הנוד החדש אם הוא כבר קיים
        if (nodeData.id === newNodeId) return;
        
        // יצור נוד חדש
        createNodeElement(nodeData, canvas);
      });
    }
    
    // פונקציה ליצירת אלמנט נוד
    function createNodeElement(nodeData, canvas) {
      const { id, type, name, message, x, y, options } = nodeData;
      
      // בדיקה אם הנוד כבר קיים
      if (document.getElementById(id)) return;
      
      // יצירת אלמנט חדש
      const node = document.createElement('div');
      node.id = id;
      node.className = `node ${type}`;
      node.style.position = 'absolute';
      node.style.left = `${x}px`;
      node.style.top = `${y}px`;
      node.style.transform = 'scale(1)';
      
      // תוכן הנוד
      let contentHTML = '';
      if (type === 'options' && options && options.length > 0) {
        contentHTML = `
          <div class="node-message">${message}</div>
          <div class="options-list">
            ${options.map((option, i) => `
              <div class="option-item">
                <div class="option-number">${i + 1}</div>
                ${option}
              </div>
            `).join('')}
          </div>
        `;
      } else {
        contentHTML = `<div class="node-message">${message}</div>`;
      }
      
      node.innerHTML = `
        <div class="node-header">
          <div class="node-title">
            <i class="${getIconByType(type)}"></i>
            ${name}
          </div>
          <div class="node-actions">
            <button class="node-btn edit-node" title="ערוך">
              <i class="fas fa-edit"></i>
            </button>
            <button class="node-btn delete-node" title="מחק" ${type === 'welcome' ? 'disabled' : ''}>
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <div class="node-content">
          ${contentHTML}
        </div>
        <div class="node-footer">
          ${renderConnectors(type, options)}
        </div>
      `;
      
      // הוספה לקנבס
      canvas.appendChild(node);
      
      // הוספת האזנות להעברת עכבר
      addDragHandlersToNode(node);
      
      return node;
    }
    
    // הוסף האזנות גרירה לנוד
    function addDragHandlersToNode(node) {
      const header = node.querySelector('.node-header');
      if (!header) return;
      
      header.addEventListener('mousedown', function(e) {
        // דלג אם לחיצה על כפתור
        if (e.target.closest('.node-btn') || e.target.closest('.connector')) {
          return;
        }
        
        const startX = e.clientX;
        const startY = e.clientY;
        const nodeX = parseFloat(node.style.left) || 0;
        const nodeY = parseFloat(node.style.top) || 0;
        
        function handleMouseMove(e) {
          const dx = e.clientX - startX;
          const dy = e.clientY - startY;
          
          node.style.left = `${nodeX + dx}px`;
          node.style.top = `${nodeY + dy}px`;
        }
        
        function handleMouseUp() {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
          
          // שמירת המצב החדש
          saveCurrentNodes();
        }
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      });
    }
    
    // רנדור מחברים
    function renderConnectors(type, options) {
      if (type === 'options' && options && options.length > 0) {
        return options.map((_, index) => `
          <span 
            class="connector" 
            data-index="${index}" 
            title="חיבור לאפשרות ${index + 1}"
          ></span>
        `).join('');
      } else if (type !== 'delay' || type === 'delay') {
        return `
          <span 
            class="connector" 
            data-index="0" 
            title="חיבור להמשך"
          ></span>
        `;
      }
      return '';
    }
    
    // פונקציות עזר
    function getIconByType(type) {
      switch (type) {
        case 'welcome': return 'fas fa-comment-dots';
        case 'text': return 'fas fa-comment';
        case 'options': return 'fas fa-list-ol';
        case 'delay': return 'fas fa-clock';
        default: return 'fas fa-comment';
      }
    }
    
    function getDefaultNameByType(type) {
      switch (type) {
        case 'welcome': return 'הודעת פתיחה';
        case 'text': return 'הודעת טקסט';
        case 'options': return 'אפשרויות בחירה';
        case 'delay': return 'השהייה';
        default: return 'צומת חדש';
      }
    }
  }