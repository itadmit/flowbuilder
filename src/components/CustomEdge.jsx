import React, { useCallback } from 'react';
import { getSmoothStepPath, useReactFlow, BaseEdge, EdgeLabelRenderer } from 'reactflow';

const CustomEdge = ({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
  data
}) => {
  const { setEdges } = useReactFlow();
  
  // קבלת פונקציית המחיקה מה-context
  const { deleteEdge } = data?.context || {};

  // יצירת נתיב והמיקום לתווית
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // פונקציית מחיקת קצה עם לוג מפורט
  const onDeleteEdge = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    
    console.log(`ניסיון למחוק קצה ${id} מ-${source} ל-${target}`);
    
    // בדיקה ולוג של הפונקציה מה-context
    if (typeof deleteEdge === 'function') {
      console.log("משתמש בפונקציית deleteEdge מה-context");
      deleteEdge(id);
    } else {
      console.log("deleteEdge אינה פונקציה תקינה, משתמש במחיקה ישירה");
      // מחיקה ישירה דרך ה-state
      setEdges((edges) => {
        const newEdges = edges.filter(edge => edge.id !== id);
        console.log(`קצה נמחק. כמות קודמת: ${edges.length}, כמות חדשה: ${newEdges.length}`);
        return newEdges;
      });
    }
    
    // לוג אחרי הפעולה
    console.log("פעולת המחיקה הושלמה");
  }, [id, setEdges, deleteEdge, source, target]);

  // קביעת סגנון הקצה לפי המצב
  const edgeStyles = {
    ...style,
    stroke: selected ? '#ff6b6b' : '#25D366',
    strokeWidth: selected ? 3 : 2,
  };

  // פונקציה עוטפת לבדיקת אירוע לחיצה
  const handleDeleteClick = (e) => {
    console.log("כפתור הסר נלחץ!");
    onDeleteEdge(e);
  };

  return (
    <>
      {/* הקצה העיקרי */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={edgeStyles}
        className={selected ? 'selected' : ''}
      />
      
      {/* אזור לחיץ שקוף להרחבת אזור הלחיצה */}
      <path
        d={edgePath}
        strokeWidth={10}
        stroke="transparent"
        fill="none"
      />
      
      {/* כפתור מחיקה מוצג רק כשהקצה נבחר */}
      {selected && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
              zIndex: 1000
            }}
          >
            <button
              type="button"
              className="edgebutton-delete"
              onClick={handleDeleteClick}
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              style={{
                backgroundColor: 'white',
                color: '#ff6b6b',
                border: '1.5px solid #ff6b6b',
                borderRadius: '12px',
                padding: '4px 10px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                minWidth: '60px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
              }}
            >
              הסר
            </button>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default CustomEdge;