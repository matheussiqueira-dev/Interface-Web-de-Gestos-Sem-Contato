"use client";

import { Grab, Hand, MousePointer2, Play, Video } from "lucide-react";
import { useEffect, useRef } from "react";

import { PinchRing } from "@/components/gesture/PinchRing";
import type { InputMode } from "@/types/input";

interface IntroViewProps {
  onStart: (mode: InputMode) => void;
  /** Move focus to the heading, used when returning from the board. */
  focusHeading?: boolean;
}

export function IntroView({ onStart, focusHeading = false }: IntroViewProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (focusHeading) {
      headingRef.current?.focus();
    }
  }, [focusHeading]);

  return (
    <div className="ms-container intro">
      <section className="intro__main" aria-labelledby="intro-title">
        <h1 id="intro-title" className="intro__title" ref={headingRef} tabIndex={-1}>
          Quadro sem contato
        </h1>
        <p className="intro__lead">
          Mova notas e desenhe com a mão, pela webcam, sem tocar no mouse nem na tela.
        </p>

        <div className="intro__actions">
          <button type="button" className="ms-btn ms-btn--primary" onClick={() => onStart("camera")}>
            <Video size={20} strokeWidth={1.75} aria-hidden="true" />
            Ativar câmera
          </button>
          <button type="button" className="ms-btn ms-btn--secondary" onClick={() => onStart("pointer")}>
            <MousePointer2 size={20} strokeWidth={1.75} aria-hidden="true" />
            Usar mouse ou toque
          </button>
          <button type="button" className="ms-btn ms-btn--secondary" onClick={() => onStart("demo")}>
            <Play size={20} strokeWidth={1.75} aria-hidden="true" />
            Ver demonstração automática
          </button>
        </div>

        <p className="intro__note">
          O vídeo é processado no seu navegador e não é enviado a nenhum servidor. O motor e o modelo
          de mãos, cerca de 17 MB, só são baixados depois que você ativa a câmera.
        </p>
      </section>

      <section className="intro__guide" aria-labelledby="intro-guide-title">
        <h2 id="intro-guide-title">Como a mão controla o quadro</h2>
        <ul className="gesture-list">
          <li className="gesture-list__item">
            <span className="gesture-list__figure">
              <Hand size={24} strokeWidth={1.75} aria-hidden="true" />
            </span>
            <div>
              <h3>Mão aberta</h3>
              <p>O cursor segue a ponta do indicador.</p>
            </div>
          </li>
          <li className="gesture-list__item">
            <span className="gesture-list__figure">
              <PinchRing progress={0.7} pinching={false} size={40} />
            </span>
            <div>
              <h3>Pinça</h3>
              <p>
                Junte polegar e indicador. Sobre uma nota, você a arrasta; no espaço livre, desenha. O
                anel do cursor fecha conforme os dedos chegam ao ponto em que a pinça é reconhecida.
              </p>
            </div>
          </li>
          <li className="gesture-list__item">
            <span className="gesture-list__figure">
              <Grab size={24} strokeWidth={1.75} aria-hidden="true" />
            </span>
            <div>
              <h3>Punho fechado</h3>
              <p>Pausa o desenho enquanto a mão estiver fechada.</p>
            </div>
          </li>
        </ul>
        <p className="intro__limits">
          Uma mão por vez. Luz fraca e contraluz reduzem a detecção. Se a pinça disparar cedo ou tarde
          demais, mude a sensibilidade em Ajustes, no quadro.
        </p>
      </section>
    </div>
  );
}
