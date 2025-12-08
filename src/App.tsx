// src/App.tsx
import { useState } from "react";
import { VideoFeed } from "./components/VideoFeed";
import { CanvasOverlay } from "./components/CanvasOverlay";
import { NotesBoard } from "./components/NotesBoard";
import { useHandTracking } from "./hooks/useHandTracking";
import { useGestureEngine } from "./hooks/useGestureEngine";

function App() {
    const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
    const [drawingColor, setDrawingColor] = useState("#3b82f6");

    // 1. Hand Tracking from Video
    const landmarks = useHandTracking(videoElement);

    // 2. Gesture Engine
    const { cursorX, cursorY, isPinching, isFist } = useGestureEngine(
        landmarks,
        window.innerWidth,
        window.innerHeight
    );

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>

            {/* Background / Video Input */}
            <VideoFeed onStreamReady={setVideoElement} />

            {/* Main UI Area */}
            <h1 style={{
                position: 'absolute',
                top: 20,
                left: 20,
                zIndex: 10,
                fontSize: '1.5rem',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)'
            }}>
                Touchless Interface <span style={{ fontSize: '0.8em', opacity: 0.7 }}>v1.0</span>
            </h1>

            <div style={{
                position: 'absolute',
                top: 20,
                right: 20,
                zIndex: 10,
                display: 'flex',
                gap: '0.5rem'
            }}>
                <div className="glass-panel" style={{ padding: '0.5rem 1rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span>Status:</span>
                    {landmarks ? (
                        <span style={{ color: '#4ade80' }}>● Detectado</span>
                    ) : (
                        <span style={{ color: '#f87171' }}>● Procurando mão...</span>
                    )}
                </div>
            </div>

            {/* Interactive Layer */}
            <NotesBoard
                cursorX={cursorX}
                cursorY={cursorY}
                isPinching={isPinching}
            />

            {/* Cursor & Drawings */}
            <CanvasOverlay
                cursorX={cursorX}
                cursorY={cursorY}
                isPinching={isPinching}
                drawingEnabled={!isFist} // Example: Fist disables drawing or acts as Eraser? keeping simple
                color={drawingColor}
            />

            {/* Controls Overlay */}
            <div style={{
                position: 'absolute',
                bottom: 40,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 60,
                display: 'flex',
                gap: '1rem'
            }}>
                <div className="glass-panel" style={{ padding: '10px', display: 'flex', gap: '10px' }}>
                    <button
                        className="btn"
                        style={{ background: '#ef4444' }}
                        onClick={() => window.location.reload()} // Quick clear
                    >
                        Limpar Tela
                    </button>
                    <button
                        className="btn"
                        style={{ background: drawingColor === '#3b82f6' ? 'white' : '#3b82f6', color: drawingColor === '#3b82f6' ? '#3b82f6' : 'white' }}
                        onClick={() => setDrawingColor('#3b82f6')}
                    >
                        Azul
                    </button>
                    <button
                        className="btn"
                        style={{ background: drawingColor === '#ef4444' ? 'white' : '#ef4444', color: drawingColor === '#ef4444' ? '#ef4444' : 'white' }}
                        onClick={() => setDrawingColor('#ef4444')} /* Red */
                    >
                        Vermelho
                    </button>
                </div>
            </div>

        </div>
    );
}

export default App;
