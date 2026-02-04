import { useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Camera,
    Cpu,
    Hand,
    Trash2,
    Pause,
    Play,
    Info,
    AlertCircle
} from "lucide-react";

import { VideoFeed } from "./components/VideoFeed";
import { CanvasOverlay } from "./components/CanvasOverlay";
import { NotesBoard } from "./components/NotesBoard";
import { ParticleSystem } from "./components/ParticleSystem";
import { StatusPill } from "./components/ui/StatusPill";
import { IconButton } from "./components/ui/IconButton";

import { useHandTracking } from "./hooks/useHandTracking";
import { useGestureEngine } from "./hooks/useGestureEngine";
import { useViewportSize } from "./hooks/useViewportSize";

import "./App.css";

const DRAW_COLORS = [
    { label: "Azul", value: "#3b82f6" },
    { label: "Vermelho", value: "#ef4444" },
    { label: "Verde", value: "#10b981" },
    { label: "Amarelo", value: "#f59e0b" },
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

    const { landmarks, status: trackingStatus, error: trackingError } = useHandTracking(
        videoElement,
        isTrackingEnabled
    );

    const { cursorX, cursorY, isPinching, isFist, handDetected } = useGestureEngine(
        landmarks,
        width,
        height
    );

    const statusItems = useMemo(() => [
        {
            label: "Câmera",
            value: cameraError ? "Erro" : cameraReady ? "Ativa" : "Iniciando",
            tone: cameraError ? "danger" : cameraReady ? "success" : "warning",
            icon: <Camera size={14} />,
        },
        {
            label: "IA Model",
            value: trackingStatus === "ready" ? "Pronto" : trackingStatus === "loading" ? "Carregando" : "Erro",
            tone: trackingStatus === "ready" ? "success" : trackingStatus === "loading" ? "warning" : "danger",
            icon: <Cpu size={14} />,
        },
        {
            label: "Input",
            value: handDetected ? "Detectado" : "Buscando",
            tone: handDetected ? "success" : "warning",
            icon: <Hand size={14} />,
        }
    ], [cameraError, cameraReady, trackingStatus, handDetected]);

    return (
        <div className="app-container">
            {/* Background Feed */}
            <VideoFeed onStreamReady={handleStreamReady} onError={handleCameraError} />

            {/* Content Layer */}
            <NotesBoard
                cursorX={cursorX}
                cursorY={cursorY}
                isPinching={isPinching}
                width={width}
                height={height}
                resetSignal={clearSignal}
            />

            <ParticleSystem
                x={cursorX}
                y={cursorY}
                isPinching={isPinching}
                color={drawingColor}
                width={width}
                height={height}
            />

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

            {/* UI Overlay */}
            <main className="main-overlay">
                <header className="top-bar">
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="brand"
                    >
                        <h1>Touchless Interface</h1>
                        <p>Controle imersivo via visão computacional</p>
                    </motion.div>

                    <div className="status-deck">
                        {statusItems.map(item => (
                            <StatusPill
                                key={item.label}
                                label={item.label}
                                value={item.value}
                                tone={item.tone as any}
                            />
                        ))}
                    </div>
                </header>

                <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="tips-card glass"
                >
                    <h3><Info size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} /> Guia de Gestos</h3>
                    <ul>
                        <li><span>Pinça (Polegar + Indicador)</span> para <strong>desenhar</strong> e <strong>arrastar</strong></li>
                        <li><span>Abra a mão</span> para <strong>liberar</strong> o elemento</li>
                        <li><span>Feche o punho</span> para <strong>pausar</strong> temporariamente</li>
                    </ul>
                </motion.div>

                <footer className="bottom-shelf">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="action-bar glass"
                    >
                        <div className="control-group">
                            <IconButton
                                icon={isTrackingEnabled ? <Pause size={20} /> : <Play size={20} />}
                                onClick={() => setIsTrackingEnabled(!isTrackingEnabled)}
                                active={!isTrackingEnabled}
                                title={isTrackingEnabled ? "Pausar rastreamento" : "Retomar rastreamento"}
                            />
                            <IconButton
                                icon={<Trash2 size={20} />}
                                onClick={() => setClearSignal(s => s + 1)}
                                danger
                                title="Limpar quadro"
                            />
                        </div>

                        <div className="divider" />

                        <div className="control-group">
                            {DRAW_COLORS.map(color => (
                                <button
                                    key={color.value}
                                    className={`color-dot clickable ${drawingColor === color.value ? 'active' : ''}`}
                                    style={{ backgroundColor: color.value }}
                                    onClick={() => setDrawingColor(color.value)}
                                    title={color.label}
                                />
                            ))}
                        </div>
                    </motion.div>
                </footer>
            </main>

            {/* Error Overlay */}
            <AnimatePresence>
                {(cameraError || trackingError) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="error-overlay"
                    >
                        <div className="error-card glass">
                            <AlertCircle size={48} color="var(--danger)" />
                            <h2>Ops! Algo deu errado</h2>
                            <p>{cameraError || trackingError}</p>
                            <button className="icon-btn" onClick={() => window.location.reload()} style={{ width: 'auto', padding: '0 20px', marginTop: 10 }}>
                                Recarregar Página
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default App;
