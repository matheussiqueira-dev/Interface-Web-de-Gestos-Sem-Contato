import React, { useRef, useEffect, useState } from 'react';
import type { GestureState, CursorPosition, DrawingStroke } from '../types';

interface DrawingCanvasProps {
  gestureState: GestureState;
  cursorPosition: CursorPosition;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ gestureState, cursorPosition }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<DrawingStroke | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const previousGestureRef = useRef<string>('none');

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      redrawCanvas();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle drawing with pinch gesture
  useEffect(() => {
    const screenX = cursorPosition.smoothX * window.innerWidth;
    const screenY = cursorPosition.smoothY * window.innerHeight;

    // Start drawing on pinch
    if (gestureState.type === 'pinch' && gestureState.isStable) {
      if (!isDrawing) {
        setIsDrawing(true);
        setCurrentStroke({
          points: [{ x: screenX, y: screenY, timestamp: Date.now() }],
          color: '#3b82f6',
          width: 3
        });
      } else if (currentStroke) {
        // Continue drawing
        setCurrentStroke({
          ...currentStroke,
          points: [...currentStroke.points, { x: screenX, y: screenY, timestamp: Date.now() }]
        });
      }
    } else if (isDrawing && gestureState.type !== 'pinch') {
      // End drawing
      if (currentStroke && currentStroke.points.length > 1) {
        setStrokes(prev => [...prev, currentStroke]);
      }
      setCurrentStroke(null);
      setIsDrawing(false);
    }

    previousGestureRef.current = gestureState.type;
  }, [gestureState, cursorPosition, isDrawing, currentStroke]);

  // Redraw canvas
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all completed strokes
    strokes.forEach(stroke => {
      drawStroke(ctx, stroke);
    });

    // Draw current stroke
    if (currentStroke) {
      drawStroke(ctx, currentStroke);
    }
  };

  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: DrawingStroke) => {
    if (stroke.points.length < 2) return;

    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }

    ctx.stroke();
  };

  // Redraw on strokes or currentStroke change
  useEffect(() => {
    redrawCanvas();
  }, [strokes, currentStroke]);

  const clearCanvas = () => {
    setStrokes([]);
    setCurrentStroke(null);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          cursor: 'crosshair'
        }}
      />
      
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        display: 'flex',
        gap: '10px',
        zIndex: 100
      }}>
        <button
          onClick={clearCanvas}
          style={{
            padding: '10px 20px',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          Clear Canvas
        </button>
      </div>

      {strokes.length === 0 && !currentStroke && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          color: '#6b7280',
          fontSize: '18px',
          pointerEvents: 'none'
        }}>
          <p>Pinch to draw on the canvas</p>
          <p style={{ fontSize: '14px', marginTop: '10px' }}>Release to stop drawing</p>
        </div>
      )}
    </div>
  );
};
