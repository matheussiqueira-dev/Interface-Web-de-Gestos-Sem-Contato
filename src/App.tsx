// src/App.tsx
import { useCallback, useMemo, useState } from "react";
import { VideoFeed } from "./components/VideoFeed";
import { CanvasOverlay } from "./components/CanvasOverlay";
import { NotesBoard } from "./components/NotesBoard";
import { useHandTracking } from "./hooks/useHandTracking";
import { useGestureEngine } from "./hooks/useGestureEngine";
import { useViewportSize } from "./hooks/useViewportSize";
import "./App.css";

const DRAW_COLORS = [
    { label: "Azul", value: "#3b82f6" },
    { label: "Vermelho", value: "#ef4444" },
    { label: "Verde", value: "#22c55e" },
];

function App() {
    const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
    const [drawingColor, setDrawingColor] = useState(DRAW_COLORS[0].value);
    const [clearSignal, setClearSignal] = useState(0);
    const [isTrackingEnabled, setIsTrackingEnabled] = useState(true);
    const [cameraReady, setCameraReady] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const { width, height, dpr } = useViewportSize();

    const handleStreamReady = useCallback((video: HTMLVideoElement) => {
        setVideoElement(video);
        setCameraReady(true);
        setCameraError(null);
    }, []);

    const handleCameraError = useCallback((message: string) => {
        setCameraError(message);
        setCameraReady(false);
    }, []);

    // 1. Hand Tracking from Video
    const { landmarks, status: trackingStatus, error: trackingError } = useHandTracking(
        videoElement,
        isTrackingEnabled
    );

    // 2. Gesture Engine
    const { cursorX, cursorY, isPinching, isFist, handDetected } = useGestureEngine(
        landmarks,
        width,
        height
    );

    const statusItems = useMemo(() => {
        return [
            {
                label: "Câmera",
                value: cameraError ? "Erro" : cameraReady ? "Ativa" : "Inicializando",
                tone: cameraError ? "danger" : cameraReady ? "success" : "warning",
            },
            {
                label: "Modelo",
                value:
                    trackingStatus === "ready"
                        ? "Carregado"
                        : trackingStatus === "loading"
                            ? "Carregando"
                            : trackingStatus === "error"
                                ? "Erro"
                                : "Inativo",
                tone:
                    trackingStatus === "ready"
                        ? "success"
                        : trackingStatus === "loading"
                            ? "warning"
                            : trackingStatus === "error"
                                ? "danger"
                                : "neutral",
            },
            {
                label: "Mão",
                value: handDetected ? "Detectada" : "Procurando",
                tone: handDetected ? "success" : "warning",
            },
            {
                label: "Modo",
                value: !isTrackingEnabled ? "Desligado" : isFist ? "Pausado" : "Ativo",
                tone: !isTrackingEnabled ? "neutral" : isFist ? "warning" : "success",
            },
        ];
    }, [cameraError, cameraReady, trackingStatus, handDetected, isTrackingEnabled, isFist]);

    return (
        <div className="app">

            {/* Background / Video Input */}
            <VideoFeed onStreamReady={handleStreamReady} onError={handleCameraError} />

            {/* Main UI Area */}
            <header className="app__header">
                <div className="app__title-row">
                    <h1 className="app__title">Touchless Interface</h1>
                    <span className="app__version">v1.2</span>
                </div>
                <p className="app__subtitle">Controle por gestos com MediaPipe + React</p>
            </header>

            <div className="app__status glass-panel">
                {statusItems.map(item => (
                    <div key={item.label} className={`status-item status-item--${item.tone}`}>
                        <span className="status-dot" aria-hidden />
                        <div className="status-text">
                            <span className="status-label">{item.label}</span>
                            <span className="status-value">{item.value}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="app__tips glass-panel">
                <span className="tips-title">Gestos rápidos</span>
                <ul>
                    <li>Pinça para arrastar notas e desenhar.</li>
                    <li>Abra a mão para soltar ou finalizar o traço.</li>
                    <li>Feche o punho para pausar o desenho.</li>
                </ul>
            </div>

            {/* Interactive Layer */}
            <NotesBoard
                cursorX={cursorX}
                cursorY={cursorY}
                isPinching={isPinching}
                width={width}
                height={height}
                resetSignal={clearSignal}
            />

            {/* Cursor & Drawings */}
            <CanvasOverlay
                cursorX={cursorX}
                cursorY={cursorY}
                isPinching={isPinching}
                drawingEnabled={isTrackingEnabled && !isFist}
                color={drawingColor}
                width={width}
                height={height}
                dpr={dpr}
                clearSignal={clearSignal}
                handDetected={handDetected}
            />

            {/* Controls Overlay */}
            <div className="app__controls glass-panel">
                <button className="btn btn--danger" onClick={() => setClearSignal(prev => prev + 1)}>
                    Limpar quadro
                </button>
                <button
                    className="btn btn--ghost"
                    onClick={() => setIsTrackingEnabled(prev => !prev)}
                >
                    {isTrackingEnabled ? "Pausar rastreamento" : "Retomar rastreamento"}
                </button>
                <div className="color-picker" role="group" aria-label="Selecionar cor">
                    {DRAW_COLORS.map(color => (
                        <button
                            key={color.value}
                            type="button"
                            className={`color-chip ${drawingColor === color.value ? "is-active" : ""}`}
                            style={{ background: color.value }}
                            onClick={() => setDrawingColor(color.value)}
                            aria-label={`Cor ${color.label}`}
                            title={color.label}
                        />
                    ))}
                </div>
            </div>

            {(cameraError || trackingError) && (
                <div className="app__overlay">
                    <div className="app__error-card glass-panel">
                        <h2>Não foi possível iniciar</h2>
                        <p>{cameraError || trackingError}</p>
                        <p>Verifique as permissões da câmera ou recarregue a página.</p>
                    </div>
                </div>
            )}

        </div>
    );
}

export default App;
