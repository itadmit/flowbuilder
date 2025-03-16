// עדכון לdebug.js - נשנה את לוגיקת האזנה לאירועי גרירה

window.flowBuilderDebug = {
    // כל הקוד הקיים נשאר, נוסיף רק את הפונקציה הבאה:
    
    installHybridDragAndDrop: function() {
        const self = this;
        console.log('מתקין מערכת גרירה היברידית');
        
        const originalDragStartHandlers = {};
        const draggableElements = document.querySelectorAll('.element-item');
        const canvas = document.querySelector('.canvas');
        
        if (!canvas || draggableElements.length === 0) {
            console.error('לא נמצאו אלמנטים דרושים');
            return;
        }
        
        // יוצר מאזינים חדשים לאלמנטים
        draggableElements.forEach((element, index) => {
            // שומר את המאזין המקורי אם קיים
            const originalListeners = getEventListeners(element);
            if (originalListeners && originalListeners.dragstart) {
                originalDragStartHandlers[index] = originalListeners.dragstart;
            }
            
            // מוסיף מאזין חדש שיעטוף את המקורי
            element.addEventListener('dragstart', function(e) {
                const type = element.getAttribute('data-type');
                console.log('מערכת היברידית: התחילה גרירה של:', type);
                e.dataTransfer.setData('text/plain', type);
            });
        });
        
        // מאזין לשחרור על הקנבס
        canvas.addEventListener('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const nodeType = e.dataTransfer.getData('text/plain');
            console.log('מערכת היברידית: שוחרר נוד מסוג:', nodeType);
            
            // מניעת יצירת יותר מצומת פתיחה אחת
            if (nodeType === 'welcome' && document.querySelector('.node.welcome')) {
                alert('יכולה להיות רק הודעת פתיחה אחת');
                return;
            }
            
            // חישוב מיקום
            const rect = canvas.getBoundingClientRect();
            const scale = window.appScale || 1;
            const x = (e.clientX - rect.left + canvas.scrollLeft) / scale;
            const y = (e.clientY - rect.top + canvas.scrollTop) / scale;
            
            // יצירת הנוד
            self.createNodeFromOutside(nodeType, x, y);
        });
        
        // וידוא שהגרירה מעל הקנבס תיתמך
        canvas.addEventListener('dragover', function(e) {
            e.preventDefault();
        });
        
        // פונקציית עזר לגישה למאזינים (אם קיימת)
        function getEventListeners(element) {
            if (element && element.__events) {
                return element.__events;
            }
            return null;
        }
    }
};

// הוספת פקודה שתופעל אוטומטית בטעינת הדף
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        console.log('מתחיל התקנת דיבוג מורחב...');
        window.flowBuilderDebug.setupDragAndDrop();
        window.flowBuilderDebug.installHybridDragAndDrop();
        window.flowBuilderDebug.inspectPage();
    }, 1500);
});