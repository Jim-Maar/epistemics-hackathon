import { useEffect, useState } from "react";
import type { ExperimentWithAttempts } from "../shared/types.ts";

const POLL_INTERVAL_MS = 2000;

/** A published copy of the page names its data file in this meta tag. The local server's page has no such tag. */
const SNAPSHOT_META_NAME = "snapshot-url";

export type Snapshot = { exportedAt: string; experiments: ExperimentWithAttempts[] };

export type ExperimentsState =
  | { status: "loading" }
  /** snapshotAt is set when the page shows a published snapshot instead of live data. */
  | { status: "ready"; experiments: ExperimentWithAttempts[]; now: number; snapshotAt: string | null }
  | { status: "error"; message: string };

async function fetchText(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`The server answered ${response.status}`);
  return response.text();
}

/** Reads a published snapshot once. Its export time stands in for "now", so attempts that were running then still read as running. */
async function loadSnapshot(url: string): Promise<ExperimentsState> {
  const snapshot = JSON.parse(await fetchText(url)) as Snapshot;
  return { status: "ready", experiments: snapshot.experiments, now: Date.parse(snapshot.exportedAt), snapshotAt: snapshot.exportedAt };
}

/**
 * On the local server, asks for all data every two seconds, and an unchanged response causes no re-render.
 * On a published copy, reads the snapshot once.
 */
export function useExperiments(): ExperimentsState {
  const [state, setState] = useState<ExperimentsState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    const showError = (error: unknown) => !cancelled && setState({ status: "error", message: (error as Error).message });

    const snapshotUrl = document.querySelector(`meta[name="${SNAPSHOT_META_NAME}"]`)?.getAttribute("content");
    if (snapshotUrl) {
      loadSnapshot(snapshotUrl).then((loaded) => !cancelled && setState(loaded), showError);
      return () => {
        cancelled = true;
      };
    }

    let lastBody = "";
    async function poll() {
      try {
        const body = await fetchText("/api/experiments");
        if (cancelled || body === lastBody) return;
        lastBody = body;
        setState({ status: "ready", experiments: JSON.parse(body), now: Date.now(), snapshotAt: null });
      } catch (error) {
        showError(error);
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
