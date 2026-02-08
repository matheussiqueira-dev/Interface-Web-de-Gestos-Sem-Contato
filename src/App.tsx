import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Camera,
  Cloud,
  Cpu,
  Gauge,
  Hand,
  Paintbrush,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";

import { CanvasOverlay } from "./components/CanvasOverlay";
import { NotesBoard } from "./components/NotesBoard";
import { ParticleSystem } from "./components/ParticleSystem";
import { VideoFeed } from "./components/VideoFeed";
import { IconButton } from "./components/ui/IconButton";
import { StatusPill } from "./components/ui/StatusPill";
import {
  DRAW_COLORS,
  NOTE_COLORS,
  type WorkspaceNote,
} from "./domain/workspace";
import { useSessionMetrics } from "./features/metrics/useSessionMetrics";
import {
  createInitialWorkspaceState,
  workspaceReducer,
} from "./features/workspace/workspaceReducer";
import { useGestureEngine } from "./hooks/useGestureEngine";
import { useHandTracking } from "./hooks/useHandTracking";
import { useViewportSize } from "./hooks/useViewportSize";
import {
  loadWorkspaceSnapshot,
  saveWorkspaceSnapshot,
  trackWorkspaceEvent,
} from "./services/workspacePersistence";
import { createId } from "./shared/utils/id";
import { clamp } from "./utils/geometry";

import "./App.css";

type SaveStatus = "idle" | "saving" | "saved";
type PersistenceMode = "api" | "local";

function getSaveBadge(saveStatus: SaveStatus, mode: PersistenceMode): string {
  if (saveStatus === "saving") return "Salvando";
  if (saveStatus === "saved") return mode === "api" ? "Sincronizado via API" : "Salvo local";
  return mode === "api" ? "API ativa" : "Sem API";
}

function App() {
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [persistenceMode, setPersistenceMode] = useState<PersistenceMode>("local");
  const [hydrated, setHydrated] = useState(false);
  const [loadingWorkspace, setLoadingWorkspace] = useState(true);
  const idleSaveTimeoutRef = useRef<number | null>(null);
  const [state, dispatch] = useReducer(
    workspaceReducer,
    undefined,
    createInitialWorkspaceState,
  );
  const { width, height, dpr } = useViewportSize();

  const workspaceSnapshot = state.snapshot;
  const settings = workspaceSnapshot.settings;
  const notes = workspaceSnapshot.notes;

  const handleStreamReady = useCallback((video: HTMLVideoElement) => {
    setVideoElement(video);
    setCameraReady(true);
    setCameraError(null);
  }, []);

  const handleCameraError = useCallback((message: string) => {
    setCameraError(message);
    setCameraReady(false);
    void trackWorkspaceEvent("camera_error", { message });
  }, []);

  const { landmarks, status: trackingStatus, error: trackingError } = useHandTracking(
    videoElement,
    state.trackingEnabled,
  );

  const { cursorX, cursorY, handDetected, isFist, isPinching } = useGestureEngine(
    landmarks,
    width,
    height,
    {
      pinchSensitivity: settings.pinchSensitivity,
      cursorResponsiveness: settings.cursorResponsiveness,
    },
  );

  const metrics = useSessionMetrics({
    handDetected,
    isFist,
    isPinching,
    trackingEnabled: state.trackingEnabled,
  });

  useEffect(() => {
    let mounted = true;

    async function hydrateWorkspace() {
      setLoadingWorkspace(true);
      const { snapshot, mode } = await loadWorkspaceSnapshot();
      if (!mounted) return;

      dispatch({ type: "hydrate", payload: snapshot });
      setPersistenceMode(mode);
      setHydrated(true);
      setLoadingWorkspace(false);
      void trackWorkspaceEvent("workspace_loaded", {
        mode,
        notes: snapshot.notes.length,
      });
    }

    void hydrateWorkspace();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    if (idleSaveTimeoutRef.current) {
      window.clearTimeout(idleSaveTimeoutRef.current);
      idleSaveTimeoutRef.current = null;
    }

    setSaveStatus("saving");

    const timeoutId = window.setTimeout(async () => {
      const mode = await saveWorkspaceSnapshot(workspaceSnapshot);
      setPersistenceMode(mode);
      setSaveStatus("saved");
      void trackWorkspaceEvent("workspace_saved", {
        mode,
        notes: workspaceSnapshot.notes.length,
      });

      idleSaveTimeoutRef.current = window.setTimeout(() => {
        setSaveStatus("idle");
      }, 1200);
    }, 800);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [hydrated, workspaceSnapshot]);

  useEffect(
    () => () => {
      if (idleSaveTimeoutRef.current) {
        window.clearTimeout(idleSaveTimeoutRef.current);
      }
    },
    [],
  );

  const statusItems = useMemo(
    () => [
      {
        label: "Camera",
        value: cameraError ? "Erro" : cameraReady ? "Ativa" : "Iniciando",
        tone: cameraError ? "danger" : cameraReady ? "success" : "warning",
        icon: <Camera size={14} />,
      },
      {
        label: "Modelo",
        value:
          trackingStatus === "ready"
            ? "Pronto"
            : trackingStatus === "loading"
              ? "Carregando"
              : "Indisponivel",
        tone:
          trackingStatus === "ready"
            ? "success"
            : trackingStatus === "loading"
              ? "warning"
              : "danger",
        icon: <Cpu size={14} />,
      },
      {
        label: "Mao",
        value: handDetected ? "Detectada" : "Buscando",
        tone: handDetected ? "success" : "neutral",
        icon: <Hand size={14} />,
      },
      {
        label: "Persistencia",
        value: getSaveBadge(saveStatus, persistenceMode),
        tone: persistenceMode === "api" ? "success" : "warning",
        icon: <Cloud size={14} />,
      },
    ],
    [
      cameraError,
      cameraReady,
      handDetected,
      persistenceMode,
      saveStatus,
      trackingStatus,
    ],
  );

  const metricsCards = useMemo(
    () => [
      {
        label: "Sessao",
        value: `${Math.floor(metrics.elapsedSeconds / 60)
          .toString()
          .padStart(2, "0")}:${(metrics.elapsedSeconds % 60)
          .toString()
          .padStart(2, "0")}`,
      },
      {
        label: "Pinças",
        value: `${metrics.pinchCount}`,
      },
      {
        label: "Punhos",
        value: `${metrics.fistCount}`,
      },
      {
        label: "Presenca de mao",
        value: `${metrics.handPresence.toFixed(0)}%`,
      },
      {
        label: "Interacoes/s",
        value: metrics.interactionRate.toFixed(2),
      },
      {
        label: "Notas",
        value: `${notes.length}`,
      },
    ],
    [metrics.elapsedSeconds, metrics.fistCount, metrics.handPresence, metrics.interactionRate, metrics.pinchCount, notes.length],
  );

  const saveTone = saveStatus === "saving" ? "warning" : "success";

  function handleToggleTracking() {
    const nextEnabled = !state.trackingEnabled;
    dispatch({ type: "toggleTracking" });
    void trackWorkspaceEvent(nextEnabled ? "tracking_resumed" : "tracking_paused");
  }

  function handleClearDrawing() {
    dispatch({ type: "clearDrawing" });
  }

  function handleResetWorkspace() {
    dispatch({ type: "resetWorkspace" });
    setSelectedNoteId(null);
  }

  function handlePatchSettings(
    patch: Partial<{
      drawingColor: string;
      pinchSensitivity: number;
      cursorResponsiveness: number;
      particlesEnabled: boolean;
    }>,
  ) {
    dispatch({ type: "patchSettings", payload: patch });
  }

  function handleAddNote() {
    const now = new Date().toISOString();
    const note: WorkspaceNote = {
      id: createId("note"),
      x: clamp(cursorX || width / 2, 24, Math.max(24, width - 272)),
      y: clamp(cursorY || height / 2, 24, Math.max(24, height - 214)),
      color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)],
      text: "Nova nota. Clique para editar o texto.",
      createdAt: now,
      updatedAt: now,
    };

    dispatch({ type: "addNote", payload: note });
    setSelectedNoteId(note.id);
  }

  function handleNotesChange(nextNotes: WorkspaceNote[]) {
    dispatch({ type: "setNotes", payload: nextNotes });
  }

  function handleDeleteNote(noteId: string) {
    dispatch({ type: "removeNote", payload: noteId });
    if (selectedNoteId === noteId) {
      setSelectedNoteId(null);
    }
  }

  return (
    <div className="app-container">
      <div className="app-background" aria-hidden="true" />
      <VideoFeed onStreamReady={handleStreamReady} onError={handleCameraError} />

      <NotesBoard
        notes={notes}
        cursorX={cursorX}
        cursorY={cursorY}
        isPinching={isPinching}
        trackingEnabled={state.trackingEnabled}
        width={width}
        height={height}
        onChange={handleNotesChange}
        onDeleteNote={handleDeleteNote}
        selectedNoteId={selectedNoteId}
        onSelectNote={setSelectedNoteId}
      />

      <ParticleSystem
        x={cursorX}
        y={cursorY}
        isPinching={isPinching}
        color={settings.drawingColor}
        width={width}
        height={height}
        enabled={settings.particlesEnabled && state.trackingEnabled}
      />

      <CanvasOverlay
        cursorX={cursorX}
        cursorY={cursorY}
        isPinching={isPinching}
        drawingEnabled={state.trackingEnabled && !isFist}
        color={settings.drawingColor}
        width={width}
        height={height}
        dpr={dpr}
        clearSignal={state.clearSignal}
        handDetected={handDetected}
      />

      <main className="main-overlay">
        <header className="top-bar">
          <motion.div
            className="brand-block"
            initial={{ y: -14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <p className="brand-kicker">Touchless Workspace</p>
            <h1>Interface de gestos sem contato para quadro colaborativo</h1>
            <p className="brand-subtitle">
              Arquitetura desacoplada, persistencia API/local, calibracao em tempo real e
              feedback visual de baixa latencia.
            </p>
          </motion.div>

          <div className="status-deck">
            {statusItems.map((item) => (
              <StatusPill
                key={item.label}
                label={item.label}
                value={item.value}
                tone={item.tone as "success" | "warning" | "danger" | "neutral"}
                icon={item.icon}
              />
            ))}
          </div>
        </header>

        <section className="content-grid">
          <motion.section
            className="control-panel glass"
            initial={{ x: -18, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          >
            <div className="panel-title-row">
              <h2>
                <Gauge size={17} />
                Controle operacional
              </h2>
              <span className={`save-chip ${saveTone}`}>
                <Cloud size={14} />
                {getSaveBadge(saveStatus, persistenceMode)}
              </span>
            </div>

            <div className="control-row">
              <IconButton
                icon={state.trackingEnabled ? <Pause size={18} /> : <Play size={18} />}
                label={state.trackingEnabled ? "Pausar tracking" : "Retomar tracking"}
                onClick={handleToggleTracking}
                active={!state.trackingEnabled}
              />
              <IconButton
                icon={<Trash2 size={18} />}
                label="Limpar desenho"
                onClick={handleClearDrawing}
                danger
              />
              <IconButton
                icon={<RotateCcw size={18} />}
                label="Resetar workspace"
                onClick={handleResetWorkspace}
              />
              <IconButton
                icon={<Plus size={18} />}
                label="Adicionar nota"
                onClick={handleAddNote}
              />
            </div>

            <div className="control-stack">
              <div className="control-group">
                <label htmlFor="pinch-sensitivity">
                  Sensibilidade de pinça
                  <output>{settings.pinchSensitivity.toFixed(2)}x</output>
                </label>
                <input
                  id="pinch-sensitivity"
                  type="range"
                  min={0.6}
                  max={1.7}
                  step={0.05}
                  value={settings.pinchSensitivity}
                  onChange={(event) =>
                    handlePatchSettings({
                      pinchSensitivity: Number.parseFloat(event.target.value),
                    })
                  }
                />
              </div>

              <div className="control-group">
                <label htmlFor="cursor-responsiveness">
                  Responsividade do cursor
                  <output>{settings.cursorResponsiveness.toFixed(2)}x</output>
                </label>
                <input
                  id="cursor-responsiveness"
                  type="range"
                  min={0.6}
                  max={1.7}
                  step={0.05}
                  value={settings.cursorResponsiveness}
                  onChange={(event) =>
                    handlePatchSettings({
                      cursorResponsiveness: Number.parseFloat(event.target.value),
                    })
                  }
                />
              </div>

              <div className="control-group">
                <span className="label-inline">
                  <Paintbrush size={15} />
                  Cor de desenho
                </span>
                <div className="palette-row">
                  {DRAW_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`color-dot clickable ${
                        settings.drawingColor === color.value ? "active" : ""
                      }`}
                      style={{ backgroundColor: color.value }}
                      aria-label={`Selecionar ${color.label}`}
                      title={`Selecionar ${color.label}`}
                      onClick={() => handlePatchSettings({ drawingColor: color.value })}
                    />
                  ))}
                </div>
              </div>

              <label className="switch-field">
                <input
                  type="checkbox"
                  checked={settings.particlesEnabled}
                  onChange={(event) =>
                    handlePatchSettings({ particlesEnabled: event.target.checked })
                  }
                />
                <span>
                  <Sparkles size={14} />
                  Particulas de feedback
                </span>
              </label>
            </div>
          </motion.section>

          <motion.aside
            className="metrics-panel glass"
            initial={{ x: 18, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          >
            <h2>
              <Gauge size={17} />
              Metricas da sessao
            </h2>
            <ul>
              {metricsCards.map((item) => (
                <li key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </li>
              ))}
            </ul>
            <p className="metrics-footnote">
              O tracking e pausado automaticamente quando o punho fechado e detectado.
            </p>
          </motion.aside>
        </section>

        <footer className="bottom-hint glass">
          <p>
            <strong>Fluxo recomendado:</strong> abra a mao para navegar, pinça para mover/desenhar
            e punho para interromper interacao sem perder contexto.
          </p>
          {loadingWorkspace ? <span className="loader-chip">Carregando workspace...</span> : null}
        </footer>
      </main>

      <AnimatePresence>
        {(cameraError || trackingError) && (
          <motion.div
            className="error-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="error-card glass">
              <AlertCircle size={40} />
              <h2>Falha na inicializacao</h2>
              <p>{cameraError || trackingError}</p>
              <button type="button" className="error-btn" onClick={() => window.location.reload()}>
                Recarregar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
