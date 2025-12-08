import { useState } from 'react';
import { useHandTracking } from './hooks/useHandTracking';
import { useGestureEngine } from './hooks/useGestureEngine';
import { VirtualCursor } from './components/VirtualCursor';
import { NotesBoard } from './components/NotesBoard';
import { DrawingCanvas } from './components/DrawingCanvas';
import './App.css';

type AppMode = 'notes' | 'drawing';

function App() {
  const [mode, setMode] = useState<AppMode>('notes');
  const [isTracking, setIsTracking] = useState(false);
  const [showHelp, setShowHelp] = useState(true);

  const { isReady, error, handData, startTracking, stopTracking } = useHandTracking();
  const { gestureState, cursorPosition } = useGestureEngine(handData);

  const handleStartStop = async () => {
    if (isTracking) {
      stopTracking();
      setIsTracking(false);
    } else {
      await startTracking();
      setIsTracking(true);
    }
  };

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      overflow: 'hidden',
      backgroundColor: mode === 'notes' ? '#f3f4f6' : '#1f2937',
      position: 'relative'
    }}>
      {/* Header Controls */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        display: 'flex',
        gap: '10px',
        zIndex: 1000
      }}>
        <button
          onClick={handleStartStop}
          style={{
            padding: '10px 20px',
            backgroundColor: isTracking ? '#ef4444' : '#22c55e',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          {isTracking ? 'Stop Tracking' : 'Start Tracking'}
        </button>

        <button
          onClick={() => setMode(mode === 'notes' ? 'drawing' : 'notes')}
          disabled={!isTracking}
          style={{
            padding: '10px 20px',
            backgroundColor: isTracking ? '#3b82f6' : '#9ca3af',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: isTracking ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          Switch to {mode === 'notes' ? 'Drawing' : 'Notes'}
        </button>

        <button
          onClick={() => setShowHelp(!showHelp)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          {showHelp ? 'Hide' : 'Show'} Help
        </button>
      </div>

      {/* Status Display */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        backgroundColor: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '15px',
        borderRadius: '8px',
        fontSize: '14px',
        zIndex: 1000,
        maxWidth: '300px'
      }}>
        <div><strong>Status:</strong> {isTracking ? '🟢 Tracking' : '🔴 Stopped'}</div>
        <div><strong>Mode:</strong> {mode.charAt(0).toUpperCase() + mode.slice(1)}</div>
        <div><strong>Hand:</strong> {handData ? '✋ Detected' : '❌ No hand'}</div>
        <div><strong>Gesture:</strong> {gestureState.type} {gestureState.isStable ? '✓' : '...'}</div>
        {error && <div style={{ color: '#ef4444', marginTop: '5px' }}><strong>Error:</strong> {error}</div>}
      </div>

      {/* Help Panel */}
      {showHelp && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          backgroundColor: 'rgba(255,255,255,0.95)',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          fontSize: '14px',
          zIndex: 1000,
          maxWidth: '300px'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '16px' }}>
            Gesture Controls
          </h3>
          
          <div style={{ marginBottom: '15px' }}>
            <strong style={{ color: '#3b82f6' }}>✋ Open Hand:</strong>
            <div style={{ marginLeft: '10px', color: '#6b7280' }}>
              Move cursor around
            </div>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <strong style={{ color: '#22c55e' }}>🤏 Pinch (Thumb + Index):</strong>
            <div style={{ marginLeft: '10px', color: '#6b7280' }}>
              {mode === 'notes' ? 'Quick pinch to create note' : 'Draw on canvas'}
            </div>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <strong style={{ color: '#ef4444' }}>✊ Fist (Closed Hand):</strong>
            <div style={{ marginLeft: '10px', color: '#6b7280' }}>
              {mode === 'notes' ? 'Drag notes around' : 'N/A'}
            </div>
          </div>

          {mode === 'notes' && (
            <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#fef3c7', borderRadius: '6px' }}>
              <small>💡 Double-click notes to edit content</small>
            </div>
          )}
        </div>
      )}

      {/* Main Content Area */}
      {isTracking && (
        <>
          {mode === 'notes' ? (
            <NotesBoard 
              gestureState={gestureState}
              cursorPosition={cursorPosition}
            />
          ) : (
            <DrawingCanvas 
              gestureState={gestureState}
              cursorPosition={cursorPosition}
            />
          )}

          {handData && (
            <VirtualCursor 
              cursorPosition={cursorPosition}
              gestureState={gestureState}
            />
          )}
        </>
      )}

      {/* Welcome Screen */}
      {!isTracking && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          textAlign: 'center',
          padding: '20px'
        }}>
          <h1 style={{ 
            fontSize: '48px', 
            marginBottom: '20px',
            color: '#1f2937'
          }}>
            Touchless Web Gesture Interface
          </h1>
          <p style={{ 
            fontSize: '20px', 
            marginBottom: '40px',
            color: '#6b7280',
            maxWidth: '600px'
          }}>
            Control your browser with hand gestures! Create and manage notes or draw on a canvas without touching your mouse.
          </p>
          <p style={{ 
            fontSize: '16px', 
            marginBottom: '20px',
            color: '#9ca3af'
          }}>
            Click "Start Tracking" to begin and allow camera access when prompted.
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
