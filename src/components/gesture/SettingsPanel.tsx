"use client";

import { BOARD_COLORS } from "@/lib/workspace/defaults";
import type { WorkspaceSettings } from "@/types/workspace";

interface SettingsPanelProps {
  settings: WorkspaceSettings;
  handControls: boolean;
  onChange: (patch: Partial<WorkspaceSettings>) => void;
}

const formatScale = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function SettingsPanel({ settings, handControls, onChange }: SettingsPanelProps) {
  return (
    <div className="side-panel__body">
      {handControls ? (
        <>
          <div className="field">
            <label className="field__label" htmlFor="pinch-sensitivity">
              Sensibilidade da pinça
              <output htmlFor="pinch-sensitivity">{formatScale.format(settings.pinchSensitivity)}×</output>
            </label>
            <input
              id="pinch-sensitivity"
              className="field__range"
              type="range"
              min={0.6}
              max={1.7}
              step={0.05}
              value={settings.pinchSensitivity}
              aria-describedby="pinch-sensitivity-help"
              onChange={(event) => onChange({ pinchSensitivity: Number(event.target.value) })}
            />
            <p id="pinch-sensitivity-help" className="field__help">
              Mais alto reconhece a pinça com os dedos mais afastados.
            </p>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="cursor-responsiveness">
              Resposta do cursor
              <output htmlFor="cursor-responsiveness">{formatScale.format(settings.cursorResponsiveness)}×</output>
            </label>
            <input
              id="cursor-responsiveness"
              className="field__range"
              type="range"
              min={0.6}
              max={1.7}
              step={0.05}
              value={settings.cursorResponsiveness}
              aria-describedby="cursor-responsiveness-help"
              onChange={(event) => onChange({ cursorResponsiveness: Number(event.target.value) })}
            />
            <p id="cursor-responsiveness-help" className="field__help">
              Mais alto acompanha a mão mais rápido; mais baixo suaviza tremores.
            </p>
          </div>
        </>
      ) : null}

      <fieldset className="field swatches">
        <legend className="field__label">Cor do traço</legend>
        <div className="swatches__row">
          {BOARD_COLORS.map((color) => (
            <label key={color.value} className="swatch">
              <input
                type="radio"
                name="drawing-color"
                value={color.value}
                checked={settings.drawingColor === color.value}
                onChange={() => onChange({ drawingColor: color.value })}
              />
              <span className="swatch__chip" style={{ backgroundColor: `var(${color.token})` }} aria-hidden="true" />
              <span className="ms-sr-only">{color.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
