"use client";

import { useEffect } from "react";

export type ModifierKey = "ctrl" | "shift" | "alt" | "meta";

export interface KeyBinding {
  key: string;
  modifiers?: ModifierKey[];
  description: string;
  handler: () => void;
}

function matchesBinding(event: KeyboardEvent, binding: KeyBinding): boolean {
  if (event.key.toLowerCase() !== binding.key.toLowerCase()) {
    return false;
  }

  const mods = binding.modifiers ?? [];
  if (mods.includes("ctrl") !== event.ctrlKey) return false;
  if (mods.includes("shift") !== event.shiftKey) return false;
  if (mods.includes("alt") !== event.altKey) return false;
  if (mods.includes("meta") !== event.metaKey) return false;

  return true;
}

/**
 * Registers a set of keyboard shortcut bindings that are active while the
 * component is mounted. Bindings are ignored when the user is typing in an
 * input, textarea or contenteditable element.
 *
 * @param bindings - Array of KeyBinding objects to register
 * @param enabled - When false, no shortcuts are captured (default: true)
 */
export function useKeyboardShortcuts(
  bindings: KeyBinding[],
  enabled = true,
): void {
  useEffect(() => {
    if (!enabled || bindings.length === 0) {
      return;
    }

    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isEditing =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (isEditing) {
        return;
      }

      for (const binding of bindings) {
        if (matchesBinding(event, binding)) {
          event.preventDefault();
          binding.handler();
          return;
        }
      }
    };

    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
    };
  }, [bindings, enabled]);
}

/**
 * Returns a formatted display string for a key binding (e.g. "Ctrl+Z").
 */
export function formatShortcut(binding: KeyBinding): string {
  const parts: string[] = [];
  if (binding.modifiers?.includes("ctrl")) parts.push("Ctrl");
  if (binding.modifiers?.includes("shift")) parts.push("Shift");
  if (binding.modifiers?.includes("alt")) parts.push("Alt");
  if (binding.modifiers?.includes("meta")) parts.push("Meta");
  parts.push(binding.key.toUpperCase());
  return parts.join("+");
}
