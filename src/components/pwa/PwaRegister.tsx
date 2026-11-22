"use client";

import { useEffect } from "react";

type ParsedSentryDsn = {
  endpoint: string;
  dsn: string;
};

function parseSentryDsn(rawDsn: string): ParsedSentryDsn | null {
  try {
    const parsed = new URL(rawDsn.trim());
    const publicKey = parsed.username;
    const projectId = parsed.pathname.replace(/^\/+|\/+$/g, "");
    if (!publicKey || !projectId) return null;
    const endpoint = `${parsed.protocol}//${parsed.host}/api/${projectId}/envelope/?sentry_key=${encodeURIComponent(publicKey)}&sentry_version=7`;
    return { endpoint, dsn: rawDsn.trim() };
  } catch {
    return null;
  }
}

function makeHexEventId(): string {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function sendSentryEnvelope(
  target: ParsedSentryDsn,
  payload: {
    type: string;
    message: string;
    stack?: string;
    filename?: string;
    lineno?: number;
    colno?: number;
  }
) {
  try {
    const eventId = makeHexEventId();
    const sentAt = new Date().toISOString();
    const header = JSON.stringify({
      event_id: eventId,
      sent_at: sentAt,
      dsn: target.dsn
    });
    const itemHeader = JSON.stringify({ type: "event" });
    const eventBody = JSON.stringify({
      event_id: eventId,
      timestamp: Math.floor(Date.now() / 1000),
      platform: "javascript",
      level: "error",
      environment: process.env.NODE_ENV || "production",
      release: "vicelink-stage15",
      logger: "vicelink.client",
      request: {
        url: typeof window !== "undefined" ? window.location.href : ""
      },
      exception: {
        values: [
          {
            type: payload.type,
            value: payload.message.slice(0, 500)
          }
        ]
      },
      extra: {
        stack: payload.stack ? payload.stack.slice(0, 2000) : undefined,
        filename: payload.filename,
        lineno: payload.lineno,
        colno: payload.colno
      }
    });

    const envelope = `${header}\n${itemHeader}\n${eventBody}`;

    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([envelope], { type: "text/plain;charset=UTF-8" });
      navigator.sendBeacon(target.endpoint, blob);
      return;
    }

    void fetch(target.endpoint, {
      method: "POST",
      mode: "cors",
      keepalive: true,
      body: envelope
    }).catch(() => {});
  } catch {
    // Telemetry must never disrupt gameplay UX.
  }
}

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Register Stage 15 Mobile PWA Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // Ignore registration errors in restricted/private contexts
      });
    }

    // 2. Attach lightweight Sentry envelope reporter when NEXT_PUBLIC_SENTRY_DSN is set
    const rawDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
    if (!rawDsn) return;

    const sentryTarget = parseSentryDsn(rawDsn);
    if (!sentryTarget) return;

    let reportedCount = 0;
    const MAX_REPORTS_PER_SESSION = 10;

    const handleWindowError = (event: ErrorEvent) => {
      if (reportedCount >= MAX_REPORTS_PER_SESSION) return;
      reportedCount += 1;
      const errObj = event.error instanceof Error ? event.error : null;
      sendSentryEnvelope(sentryTarget, {
        type: errObj?.name || "WindowError",
        message: event.message || errObj?.message || "Unhandled client error",
        stack: errObj?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (reportedCount >= MAX_REPORTS_PER_SESSION) return;
      reportedCount += 1;
      const reason = event.reason;
      const isErr = reason instanceof Error;
      sendSentryEnvelope(sentryTarget, {
        type: isErr ? reason.name : "UnhandledRejection",
        message: isErr
          ? reason.message
          : typeof reason === "string"
            ? reason
            : "Unhandled promise rejection",
        stack: isErr ? reason.stack : undefined
      });
    };

    window.addEventListener("error", handleWindowError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleWindowError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return null;
}
