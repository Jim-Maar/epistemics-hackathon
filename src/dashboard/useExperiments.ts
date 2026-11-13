import { useEffect, useState } from "react";
import type { ExperimentWithAttempts } from "../shared/types.ts";

const POLL_INTERVAL_MS = 2000;

export type ExperimentsState =
  | { status: "loading" }
  | { status: "ready"; experiments: ExperimentWithAttempts[]; now: number }
  | { status: "error"; message: string };

/** Asks the server for all data every two seconds. An unchanged response causes no re-render. */
export function useExperiments(): ExperimentsState {
  const [state, setState] = useState<ExperimentsState>({ status: "loading" });

  useEffect(() => {
    let lastBody = "";
    let cancelled = false;

    async function poll() {
      try {
        const response = await fetch("/api/experiments");
        if (!response.ok) throw new Error(`The server answered ${response.status}`);
        const body = await response.text();
        if (cancelled) return;
        if (body !== lastBody) {
          lastBody = body;
          setState({ status: "ready", experiments: JSON.parse(body), now: Date.now() });
        }
      } catch (error) {
        if (!cancelled) setState({ status: "error", message: (error as Error).message });
        lastBody = "";
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return state;
}
