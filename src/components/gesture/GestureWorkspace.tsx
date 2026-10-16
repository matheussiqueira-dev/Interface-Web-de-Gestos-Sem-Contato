"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Eraser,
  MousePointer2,
  XOctagon,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Undo2,
} from "lucide-react";
import { type ReactNode, useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";

import { CameraPreview } from "@/components/gesture/CameraPreview";
import { DrawingCanvas } from "@/components/gesture/DrawingCanvas";
import { NotesBoard } from "@/components/gesture/NotesBoard";
import { PinchCursor } from "@/components/gesture/PinchCursor";
import { SessionPanel } from "@/components/gesture/SessionPanel";
import { SettingsPanel } from "@/components/gesture/SettingsPanel";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useElementSize } from "@/hooks/useElementSize";
import { useGestureEngine } from "@/hooks/useGestureEngine";
import { useHandTracking } from "@/hooks/useHandTracking";
import { useNoteDrag } from "@/hooks/useNoteDrag";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import { usePointerGesture } from "@/hooks/usePointerGesture";
import { useSessionMetrics } from "@/hooks/useSessionMetrics";
import { useSimulatedHand } from "@/hooks/useSimulatedHand";
import type { DemoScene } from "@/lib/demo/simulatedHand";
import { describeGesture } from "@/lib/workspace/describeGesture";
import { BOARD_COLORS, createDefaultWorkspaceSnapshot } from "@/lib/workspace/defaults";
import { clampNotePosition, getNoteSize } from "@/lib/workspace/layout";
import { canUndo, createInitialWorkspaceState, workspaceReducer } from "@/lib/workspace/reducer";
import { sanitizeNoteText } from "@/lib/workspace/schema";
import { loadWorkspaceSnapshot, saveWorkspaceSnapshot } from "@/services/workspacePersistence";
import type { CameraError } from "@/types/camera";
import type { InputMode } from "@/types/input";
import type { WorkspaceNote, WorkspaceSettings } from "@/types/workspace";
import { createId } from "@/utils/id";

const SAVE_DELAY_MS = 500;

const MODE_LABEL: Record<InputMode, string> = {
  camera: "Câmera",
  pointer: "Mouse ou toque",
  demo: "Mão simulada",
};

interface GestureWorkspaceProps {
  mode: InputMode;
  onSwitchMode: (mode: InputMode) => void;
  onExit: () => void;
}

type CameraState = { status: "requesting" } | { status: "active" } | { status: "error"; error: CameraError };

export default function GestureWorkspace({ mode, onSwitchMode, onExit }: GestureWorkspaceProps) {
  const isDemo = mode === "demo";
  const [initialLoad] = useState(() => (isDemo ? null : loadWorkspaceSnapshot()));
  const [state, dispatch] = useReducer(workspaceReducer, undefined, () => ({
    ...createInitialWorkspaceState(),
    snapshot: initialLoad?.snapshot ?? { ...createDefaultWorkspaceSnapshot(), notes: [] },
  }));
  const { snapshot, trackingEnabled } = state;
  const { notes, settings } = snapshot;

  const headingRef = useRef<HTMLHeadingElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const board = useElementSize(boardRef);

  const [saveFailed, setSaveFailed] = useState(false);
  const [textNotice, setTextNotice] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [focusNoteId, setFocusNoteId] = useState<string | null>(null);
  const [camera, setCamera] = useState<CameraState>({ status: "requesting" });
  const [cameraAttempt, setCameraAttempt] = useState(0);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  // ---- Input sources -------------------------------------------------------
  const handleCameraReady = useCallback((video: HTMLVideoElement) => {
    setVideoElement(video);
    setCamera({ status: "active" });
  }, []);

  const handleCameraError = useCallback((error: CameraError) => {
    setVideoElement(null);
    setCamera({ status: "error", error });
  }, []);

  const retryCamera = () => {
    setVideoElement(null);
    setCamera({ status: "requesting" });
    setCameraAttempt((attempt) => attempt + 1);
  };

  const tracking = useHandTracking(mode === "camera" ? videoElement : null, mode === "camera" && trackingEnabled, 30);

  const handleDemoCycle = useCallback(
    (scene: DemoScene) => {
      dispatch({
        type: "hydrate",
        payload: { ...createDefaultWorkspaceSnapshot(), notes: scene.notes.map((note) => ({ ...note })) },
      });
      dispatch({ type: "clearDrawing" });
    },
    [],
  );
  const demoLandmarks = useSimulatedHand(isDemo && trackingEnabled, board, handleDemoCycle);

  const handLandmarks = mode === "camera" ? tracking.landmarks : isDemo ? demoLandmarks : null;
  const gestureOptions = useMemo(
    () => ({ pinchSensitivity: settings.pinchSensitivity, cursorResponsiveness: settings.cursorResponsiveness }),
    [settings.cursorResponsiveness, settings.pinchSensitivity],
  );
  const handGesture = useGestureEngine(handLandmarks, Math.max(board.width, 1), Math.max(board.height, 1), gestureOptions);
  const pointerGesture = usePointerGesture(boardRef, mode === "pointer");
  const gesture = mode === "pointer" ? pointerGesture : handGesture;
  const inputActive = mode === "pointer" || trackingEnabled;

  const { draggingId, targetedId } = useNoteDrag(notes, board, gesture, inputActive, dispatch);
  const drawing =
    inputActive && gesture.handDetected && gesture.isPinching && !gesture.isFist && draggingId === null;

  const metrics = useSessionMetrics({
    handDetected: gesture.handDetected,
    isPinching: gesture.isPinching,
    isFist: gesture.isFist,
    trackingEnabled: inputActive,
  });
  const performance = usePerformanceMonitor(true);

  // ---- Persistence ---------------------------------------------------------
  useEffect(() => {
    if (isDemo) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      setSaveFailed(!saveWorkspaceSnapshot(snapshot));
    }, SAVE_DELAY_MS);
    return () => window.clearTimeout(timeoutId);
  }, [isDemo, snapshot]);

  useEffect(() => {
    if (focusNoteId) {
      document.getElementById(`note-text-${focusNoteId}`)?.focus();
    }
  }, [focusNoteId]);

  // ---- Actions -------------------------------------------------------------
  const handleAddNote = () => {
    const size = getNoteSize(board.width);
    const center = { x: board.width / 2 - size.width / 2, y: board.height / 2 - size.height / 2 };
    const position = clampNotePosition(
      gesture.handDetected ? { x: gesture.cursorX - size.width / 2, y: gesture.cursorY - 20 } : center,
      board,
    );
    const now = new Date().toISOString();
    const note: WorkspaceNote = {
      id: createId("note"),
      ...position,
      color: BOARD_COLORS[notes.length % BOARD_COLORS.length].value,
      text: "Nova nota",
      createdAt: now,
      updatedAt: now,
    };
    dispatch({ type: "addNote", payload: note });
    setFocusNoteId(note.id);
  };

  const handleTextChange = (noteId: string, text: string) => {
    const result = sanitizeNoteText(text);
    setTextNotice(result.changed ? "Os caracteres < > \" ' ` \\ ; { } ( ) [ ] não são aceitos nas notas." : null);
    dispatch({ type: "updateNoteText", payload: { id: noteId, text: result.text } });
  };

  const handleNudge = (noteId: string, dx: number, dy: number) => {
    const note = notes.find((item) => item.id === noteId);
    if (!note) {
      return;
    }
    const current = clampNotePosition(note, board);
    const next = clampNotePosition({ x: current.x + dx, y: current.y + dy }, board);
    dispatch({ type: "beginNoteDrag" });
    dispatch({ type: "moveNote", payload: { id: noteId, ...next } });
  };

  const handleSettings = (patch: Partial<WorkspaceSettings>) => dispatch({ type: "patchSettings", payload: patch });

  const handleReset = () => {
    dispatch({ type: "resetWorkspace" });
    setConfirmReset(false);
  };

  // ---- Status --------------------------------------------------------------
  const gestureLabel = describeGesture({ mode, gesture, trackingEnabled, draggingNote: draggingId !== null });

  const statusItems: Array<{ label: string; value: string; tone?: "warning" | "danger" }> = [
    { label: "Entrada", value: MODE_LABEL[mode] },
  ];
  if (mode === "camera") {
    statusItems.push(
      camera.status === "error"
        ? { label: "Câmera", value: "Indisponível", tone: "danger" }
        : { label: "Câmera", value: camera.status === "active" ? "Ativa" : "Aguardando permissão" },
      tracking.status === "error"
        ? { label: "Modelo", value: "Falhou", tone: "danger" }
        : {
            label: "Modelo",
            value: tracking.status === "ready" ? "Pronto" : tracking.status === "loading" ? "Carregando" : "Aguardando câmera",
          },
    );
  }
  statusItems.push(
    isDemo
      ? { label: "Salvamento", value: "Nada é salvo na demonstração" }
      : saveFailed
        ? { label: "Salvamento", value: "Não salvo: armazenamento indisponível", tone: "warning" }
        : { label: "Salvamento", value: "Salvo neste navegador" },
  );

  // ---- Board overlay (camera states) -------------------------------------
  let overlay: ReactNode = null;
  if (mode === "camera" && camera.status === "error") {
    overlay = (
      <div className="ms-alert ms-alert--danger" role="alert">
        <XOctagon size={20} strokeWidth={1.75} aria-hidden="true" className="ms-alert__icon" />
        <div>
          <p className="ms-alert__title">A câmera não iniciou.</p>
          <p className="ms-alert__body">{camera.error.message}</p>
          <div className="ms-alert__actions">
            {camera.error.kind !== "not-found" && camera.error.kind !== "unsupported" ? (
              <button type="button" className="ms-btn ms-btn--secondary" onClick={retryCamera}>
                Tentar novamente
              </button>
            ) : null}
            <button type="button" className="ms-btn ms-btn--secondary" onClick={() => onSwitchMode("pointer")}>
              <MousePointer2 size={20} strokeWidth={1.75} aria-hidden="true" />
              Usar mouse ou toque
            </button>
          </div>
        </div>
      </div>
    );
  } else if (mode === "camera" && tracking.status === "error") {
    overlay = (
      <div className="ms-alert ms-alert--danger" role="alert">
        <XOctagon size={20} strokeWidth={1.75} aria-hidden="true" className="ms-alert__icon" />
        <div>
          <p className="ms-alert__title">Não foi possível iniciar o reconhecimento de mãos.</p>
          <p className="ms-alert__body">Verifique a conexão: o modelo é baixado da internet na primeira vez.</p>
          <div className="ms-alert__actions">
            <button type="button" className="ms-btn ms-btn--secondary" onClick={retryCamera}>
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  } else if (mode === "camera" && (camera.status === "requesting" || tracking.status !== "ready")) {
    overlay = (
      <div className="board__status" role="status" aria-busy="true">
        <span className="ms-spinner" aria-hidden="true" />
        {camera.status === "requesting"
          ? "Aguardando permissão da câmera. Responda ao pedido do navegador."
          : "Carregando o modelo de mãos. Na primeira vez, o download leva alguns segundos."}
      </div>
    );
  }

  const showCursor = mode !== "pointer" && inputActive && gesture.handDetected;

  return (
    <div className="ms-container workspace">
      <div className="workspace__bar">
        <div className="workspace__title">
          <h1 id="workspace-title" ref={headingRef} tabIndex={-1}>
            Quadro
          </h1>
          {isDemo ? (
            <span className="ms-badge">Demonstração</span>
          ) : null}
        </div>

        <dl className="status-list">
          {statusItems.map((item) => (
            <div key={item.label} className="status-list__item" data-tone={item.tone}>
              <dt>{item.label}</dt>
              <dd>
                {item.tone === "danger" ? (
                  <XOctagon size={14} strokeWidth={1.75} aria-hidden="true" />
                ) : item.tone === "warning" ? (
                  <AlertTriangle size={14} strokeWidth={1.75} aria-hidden="true" />
                ) : null}
                {item.value}
              </dd>
            </div>
          ))}
        </dl>

        <p className="workspace__gesture" aria-live="polite">
          {gestureLabel}
        </p>

        <div className="workspace__actions" role="toolbar" aria-label="Ações do quadro">
          <button type="button" className="ms-btn ms-btn--primary" onClick={handleAddNote}>
            <Plus size={20} strokeWidth={1.75} aria-hidden="true" />
            Nova nota
          </button>
          {mode !== "pointer" ? (
            <button
              type="button"
              className="ms-btn ms-btn--secondary"
              aria-pressed={!trackingEnabled}
              onClick={() => dispatch({ type: "toggleTracking" })}
            >
              {trackingEnabled ? (
                <Pause size={20} strokeWidth={1.75} aria-hidden="true" />
              ) : (
                <Play size={20} strokeWidth={1.75} aria-hidden="true" />
              )}
              {trackingEnabled ? "Pausar rastreamento" : "Retomar rastreamento"}
            </button>
          ) : null}
          <button
            type="button"
            className="ms-btn ms-btn--ghost"
            onClick={() => dispatch({ type: "undo" })}
            disabled={!canUndo(state)}
          >
            <Undo2 size={20} strokeWidth={1.75} aria-hidden="true" />
            Desfazer
          </button>
          <button type="button" className="ms-btn ms-btn--ghost" onClick={() => dispatch({ type: "clearDrawing" })}>
            <Eraser size={20} strokeWidth={1.75} aria-hidden="true" />
            Limpar desenho
          </button>
          {!isDemo ? (
            <button type="button" className="ms-btn ms-btn--danger" onClick={() => setConfirmReset(true)}>
              <RotateCcw size={20} strokeWidth={1.75} aria-hidden="true" />
              Restaurar quadro
            </button>
          ) : null}
          <button type="button" className="ms-btn ms-btn--ghost" onClick={onExit}>
            <ArrowLeft size={20} strokeWidth={1.75} aria-hidden="true" />
            Trocar entrada
          </button>
        </div>
      </div>

      {initialLoad?.source === "recovered" ? (
        <div className="ms-alert ms-alert--warning" role="status">
          <AlertTriangle size={20} strokeWidth={1.75} aria-hidden="true" className="ms-alert__icon" />
          <p className="ms-alert__title">Algumas notas salvas estavam danificadas e foram descartadas.</p>
        </div>
      ) : null}
      {textNotice ? (
        <p className="workspace__notice" role="status">
          {textNotice}
        </p>
      ) : null}

      <div className="workspace__body">
        <div
          ref={boardRef}
          className="board"
          data-input={mode}
          aria-label="Quadro de notas e desenho"
          role="region"
        >
          <DrawingCanvas
            width={board.width}
            height={board.height}
            x={gesture.cursorX}
            y={gesture.cursorY}
            drawing={drawing}
            color={settings.drawingColor}
            clearSignal={state.clearSignal}
          />

          {notes.length === 0 && !isDemo ? (
            <div className="board__empty">
              <p className="board__empty-title">Nenhuma nota ainda</p>
              <p className="board__empty-body">
                Faça uma pinça no espaço livre para desenhar ou use Nova nota para criar a primeira.
              </p>
            </div>
          ) : null}

          <NotesBoard
            notes={notes}
            board={board}
            draggingId={draggingId}
            targetedId={targetedId}
            onTextChange={handleTextChange}
            onDelete={(noteId) => dispatch({ type: "removeNote", payload: noteId })}
            onNudge={handleNudge}
          />

          <PinchCursor
            x={gesture.cursorX}
            y={gesture.cursorY}
            visible={showCursor}
            progress={gesture.pinchProgress}
            pinching={gesture.isPinching}
          />

          {mode === "camera" && camera.status !== "error" ? (
            <CameraPreview
              key={cameraAttempt}
              landmarks={tracking.landmarks}
              pinching={gesture.isPinching}
              onReady={handleCameraReady}
              onError={handleCameraError}
            />
          ) : null}

          {overlay ? <div className="board__overlay">{overlay}</div> : null}
        </div>

        <aside className="workspace__side" aria-label="Ajustes e sessão">
          <details className="side-panel" open>
            <summary className="side-panel__summary">Ajustes</summary>
            <SettingsPanel settings={settings} handControls={mode !== "pointer"} onChange={handleSettings} />
          </details>
          <details className="side-panel">
            <summary className="side-panel__summary">Sessão</summary>
            <SessionPanel mode={mode} metrics={metrics} performance={performance} notes={notes.length} />
          </details>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="Restaurar o quadro inicial?"
        description="As notas atuais serão apagadas e as três notas de exemplo voltam ao quadro. Esta ação não pode ser desfeita."
        confirmLabel="Restaurar quadro"
        onConfirm={handleReset}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}
