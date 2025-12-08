import React from 'react';
import type { CursorPosition, GestureState } from '../types';

interface VirtualCursorProps {
  cursorPosition: CursorPosition;
  gestureState: GestureState;
}

export const VirtualCursor: React.FC<VirtualCursorProps> = ({ cursorPosition, gestureState }) => {
  const getCursorColor = () => {
    switch (gestureState.type) {
      case 'pinch':
        return '#22c55e'; // green for click
      case 'fist':
        return '#ef4444'; // red for drag
      case 'open':
        return '#3b82f6'; // blue for normal
      default:
        return '#6b7280'; // gray for none
    }
  };

  const getCursorSize = () => {
    if (gestureState.type === 'pinch') return 25;
    if (gestureState.type === 'fist') return 30;
    return 20;
  };

  // Convert normalized coordinates (0-1) to screen coordinates
  const screenX = cursorPosition.smoothX * window.innerWidth;
  const screenY = cursorPosition.smoothY * window.innerHeight;

  return (
    <>
      <div
        style={{
          position: 'fixed',
          left: `${screenX}px`,
          top: `${screenY}px`,
          width: `${getCursorSize()}px`,
          height: `${getCursorSize()}px`,
          borderRadius: '50%',
          backgroundColor: getCursorColor(),
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 10000,
          transition: 'all 0.1s ease-out',
          boxShadow: `0 0 20px ${getCursorColor()}`,
          opacity: gestureState.isStable ? 1 : 0.7
        }}
      />
      
      {/* Outer ring for emphasis */}
      <div
        style={{
          position: 'fixed',
          left: `${screenX}px`,
          top: `${screenY}px`,
          width: `${getCursorSize() + 10}px`,
          height: `${getCursorSize() + 10}px`,
          borderRadius: '50%',
          border: `2px solid ${getCursorColor()}`,
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 9999,
          opacity: 0.5,
          animation: gestureState.type === 'pinch' ? 'pulse 0.5s ease-in-out infinite' : 'none'
        }}
      />
      
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
          50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.3; }
        }
      `}</style>
    </>
  );
};
