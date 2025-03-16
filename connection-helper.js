// connection-helper.js - עוזר לחיבורים בין נודים
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(enhanceConnections, 1500);
  });
  
  function enhanceConnections() {
    console.log('מתקין תוספות לחיבורים...');
    
    // הוספת תמיכה בגרירה מהמחברים
    enhanceConnectorDragging();
    
    // הוספת סגנונות נוספים
    addExtraStyles();
    
    // הוסף האזנה לשינויים ב-DOM כדי לחזק מחברים חדשים
    setupMutationObserver();
  }
  
  function enhanceConnectorDragging() {
    // הוסף מאזינים לכל המחברים הקיימים
    document.querySelectorAll('.connector').forEach(connector => {
      enhanceSingleConnector(connector);
    });
  }
  
  function enhanceSingleConnector(connector) {
    // הוסף אפקט hover מוגבר
    connector.addEventListener('mouseenter', function() {
      this.style.transform = 'scale(1.4)';
      this.style.boxShadow = '0 0 10px rgba(37, 211, 102, 0.8)';
    });
    
    connector.addEventListener('mouseleave', function() {
      this.style.transform = '';
      this.style.boxShadow = '';
    });
  }
  
  function addExtraStyles() {
    // בדוק אם הסגנונות כבר קיימים
    if (document.getElementById('extra-connector-styles')) return;
    
    // צור אלמנט style חדש
    const style = document.createElement('style');
    style.id = 'extra-connector-styles';
    style.textContent = `
      /* הגדל את אזור הלחיצה של המחברים */
      .connector {
        cursor: crosshair !important;
        position: relative;
      }
      
      .connector::after {
        content: '';
        position: absolute;
        top: -10px;
        left: -10px;
        right: -10px;
        bottom: -10px;
        z-index: -1;
      }
      
      /* שפר את נראות הקווים בין הנודים */
      .connection path {
        stroke-width: 2.5 !important;
      }
      
      /* נראות קווי גרירה */
      .drag-line {
        z-index: 1000 !important;
      }
    `;
    
    document.head.appendChild(style);
  }
  
  function setupMutationObserver() {
    // צור צופה על שינויים ב-DOM
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.addedNodes.length) {
          // בדוק אם נוספו מחברים חדשים
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) { // אלמנט
              const connectors = node.classList && node.classList.contains('connector') ? 
                [node] : node.querySelectorAll('.connector');
              
              if (connectors.length) {
                connectors.forEach(enhanceSingleConnector);
              }
            }
          });
        }
      });
    });
    
    // התחל לצפות בשינויים
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }