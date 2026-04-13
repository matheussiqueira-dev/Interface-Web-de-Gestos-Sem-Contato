"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { createInitialGestureState } from "@/lib/gestureEngine";
import type { GestureEngineOptions, GestureState, SwipeDirection } from "@/types/gesture";

interface GestureContextValue {
  gestureState: GestureState;
  options: GestureEngineOptions;
  setOptions: (patch: Partial<GestureEngineOptions>) => void;
  onSwipe: (handler: (direction: SwipeDirection) => void) => () => void;
  _emitSwipe: (direction: SwipeDirection) => void;
  _setGestureState: (state: GestureState) => void;
}

const GestureContext = createContext<GestureContextValue | null>(null);

interface GestureProviderProps {
  children: ReactNode;
  initialOptions?: GestureEngineOptions;
  viewportWidth?: number;
  viewportHeight?: number;
}

/**
 * Provides gesture state and engine options to the component subtree without
 * prop drilling. Consumers use useGestureContext() to access the current state.
 *
 * Swipe event listeners can be registered via onSwipe() and are automatically
 * removed when the returned cleanup function is called.
 */
export function GestureProvider({
  children,
  initialOptions = {},
  viewportWidth = 0,
  viewportHeight = 0,
}: GestureProviderProps) {
  const [gestureState, setGestureState] = useState<GestureState>(() =>
    createInitialGestureState(viewportWidth || 1, viewportHeight || 1),
  );
  const [options, setOptionsState] = useState<GestureEngineOptions>(initialOptions);
  const swipeListenersRef = useRef<Set<(direction: SwipeDirection) => void>>(new Set());

  const setOptions = useCallback((patch: Partial<GestureEngineOptions>) => {
    setOptionsState((prev) => ({ ...prev, ...patch }));
  }, []);

  const onSwipe = useCallback((handler: (direction: SwipeDirection) => void): (() => void) => {
    swipeListenersRef.current.add(handler);
    return () => {
      swipeListenersRef.current.delete(handler);
    };
  }, []);

  const _emitSwipe = useCallback((direction: SwipeDirection) => {
    swipeListenersRef.current.forEach((handler) => handler(direction));
  }, []);

  const _setGestureState = useCallback((state: GestureState) => {
    setGestureState(state);
  }, []);

  const value = useMemo<GestureContextValue>(
    () => ({
      gestureState,
      options,
      setOptions,
      onSwipe,
      _emitSwipe,
      _setGestureState,
    }),
    [gestureState, options, setOptions, onSwipe, _emitSwipe, _setGestureState],
  );

  return <GestureContext.Provider value={value}>{children}</GestureContext.Provider>;
}

/**
 * Returns the gesture context value. Must be used inside a GestureProvider.
 * @throws If called outside a GestureProvider tree.
 */
export function useGestureContext(): GestureContextValue {
  const context = useContext(GestureContext);
  if (!context) {
    throw new Error("useGestureContext deve ser usado dentro de um GestureProvider.");
  }
  return context;
}
