"use client";

import type { ElementType, ReactNode } from "react";

interface PanelProps {
  as?: ElementType;
  title: ReactNode;
  eyebrow?: string;
  headerAside?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function Panel({
  as: Component = "section",
  title,
  eyebrow,
  headerAside,
  className = "",
  children,
}: PanelProps) {
  return (
    <Component className={`encom-panel ${className}`.trim()}>
      <div className="panel-header">
        <div className="panel-title-block">
          {eyebrow ? <p className="panel-eyebrow">{eyebrow}</p> : null}
          <div className="panel-title-row">
            <h2>{title}</h2>
            {headerAside}
          </div>
        </div>
      </div>
      <div className="panel-body">{children}</div>
    </Component>
  );
}
