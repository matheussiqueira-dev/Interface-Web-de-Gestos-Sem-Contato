"use client";

import { Camera, CameraOff } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";

import type { CameraPermissionState } from "@/types/camera";

interface CameraPermissionGuardProps {
  children: ReactNode;
}

export function CameraPermissionGuard({ children }: CameraPermissionGuardProps) {
  const [permission, setPermission] = useState<CameraPermissionState>("idle");
  const [message, setMessage] = useState<string>("Ative a camera para iniciar o tracking de gestos.");

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.permissions?.query) {
      setPermission("idle");
      return;
    }

    let mounted = true;
    navigator.permissions
      .query({ name: "camera" as PermissionName })
      .then((result) => {
        if (!mounted) {
          return;
        }

        if (result.state === "granted") {
          setPermission("granted");
          return;
        }

        if (result.state === "denied") {
          setPermission("denied");
          setMessage("Permissao da camera negada. Ajuste nas configuracoes do navegador.");
        }
      })
      .catch(() => {
        setPermission("idle");
      });

    return () => {
      mounted = false;
    };
  }, []);

  const requestPermission = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setPermission("unsupported");
      setMessage("Seu navegador nao suporta captura de camera.");
      return;
    }

    setPermission("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      stream.getTracks().forEach((track) => track.stop());
      setPermission("granted");
      setMessage("Permissao concedida.");
    } catch {
      setPermission("denied");
      setMessage("Permissao da camera negada. Ajuste nas configuracoes do navegador.");
    }
  }, []);

  if (permission === "granted") {
    return <>{children}</>;
  }

  const loading = permission === "requesting";

  return (
    <div className="camera-guard glass">
      <div className="camera-guard-header">
        {permission === "denied" || permission === "unsupported" ? <CameraOff size={20} /> : <Camera size={20} />}
        <strong>Permissao de camera</strong>
      </div>
      <p>{message}</p>
      <button type="button" className="error-btn" onClick={requestPermission} disabled={loading}>
        {loading ? "Solicitando..." : "Ativar camera"}
      </button>
    </div>
  );
}
