import { mkdirSync, openSync, closeSync, readdirSync, readFileSync, renameSync, rmdirSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import type { Attempt, Experiment, ExperimentWithAttempts } from "./types.ts";

/** PROBE_DATA_DIR lets the page run against fixture data for screenshots, away from the real results. */
export const DATA_DIR = process.env.PROBE_DATA_DIR ?? path.join(import.meta.dir, "../../data");
const EXPERIMENT_FILE = "experiment.json";
const ATTEMPT_FILE_PATTERN = /^attempt-(\d+)\.json$/;
const ATTEMPT_NUMBER_DIGITS = 3;

const experimentDir = (experimentId: string) => path.join(DATA_DIR, experimentId);

const attemptPath = (experimentId: string, number: number) =>
  path.join(experimentDir(experimentId), `attempt-${String(number).padStart(ATTEMPT_NUMBER_DIGITS, "0")}.json`);

/** Writes to a temporary file first, so a reader never sees a half-written file. */
function writeJsonAtomically(filePath: string, value: unknown) {
  const temporaryPath = `${filePath}.${process.pid}.tmp`;
  writeFileSync(temporaryPath, JSON.stringify(value, null, 2));
  renameSync(temporaryPath, filePath);
}

/** Returns null for a file that is still empty because its attempt number was just claimed. */
function readJson<T>(filePath: string): T | null {
  const text = readFileSync(filePath, "utf8");
  return text.trim() === "" ? null : (JSON.parse(text) as T);
}

export function readExperiment(experimentId: string): Experiment {
  const filePath = path.join(experimentDir(experimentId), EXPERIMENT_FILE);
  if (!existsSync(filePath)) throw new Error(`No experiment with id "${experimentId}". Create it with: probe experiment`);
  return readJson<Experiment>(filePath)!;
}

export function writeExperiment(experiment: Experiment) {
  mkdirSync(experimentDir(experiment.id), { recursive: true });
  writeJsonAtomically(path.join(experimentDir(experiment.id), EXPERIMENT_FILE), experiment);
}

export function experimentExists(experimentId: string) {
  return existsSync(path.join(experimentDir(experimentId), EXPERIMENT_FILE));
}

function attemptNumbers(experimentId: string): number[] {
  return readdirSync(experimentDir(experimentId))
    .map((name) => ATTEMPT_FILE_PATTERN.exec(name)?.[1])
    .filter((digits): digits is string => digits !== undefined)
    .map(Number);
}

export function countAttempts(experimentId: string) {
  return attemptNumbers(experimentId).length;
}

/** Creates the attempt's file exclusively, so two probe runs can never get the same number. */
export function claimNextAttemptNumber(experimentId: string): number {
  let number = Math.max(0, ...attemptNumbers(experimentId)) + 1;
  for (;;) {
    try {
      closeSync(openSync(attemptPath(experimentId, number), "wx"));
      return number;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      number += 1;
    }
  }
}

export function readAttempt(experimentId: string, number: number): Attempt {
  const attempt = readJson<Attempt>(attemptPath(experimentId, number));
  if (attempt === null) throw new Error(`Attempt ${number} of "${experimentId}" has no content yet`);
  return attempt;
}

export function writeAttempt(attempt: Attempt) {
  writeJsonAtomically(attemptPath(attempt.experimentId, attempt.number), attempt);
}

const LOCK_RETRY_MS = 20;
const LOCK_TIMEOUT_MS = 10_000;

/** Holds a lock directory for the attempt while it runs, because creating a directory either succeeds or fails as one step. */
function withAttemptLock<T>(experimentId: string, number: number, action: () => T): T {
  const lockPath = `${attemptPath(experimentId, number)}.lock`;
  const deadline = Date.now() + LOCK_TIMEOUT_MS;
  for (;;) {
    try {
      mkdirSync(lockPath);
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      if (Date.now() > deadline) throw new Error(`Timed out waiting for the lock ${lockPath}. Delete it if no probe is running.`);
      Bun.sleepSync(LOCK_RETRY_MS);
    }
  }
  try {
    return action();
  } finally {
    rmdirSync(lockPath);
  }
}

/**
 * Reads the attempt fresh from disk, applies the change and writes it back, all under a lock.
 * Several probe runs can then change different samples of one attempt at the same time without losing each other's work.
 */
export function updateAttempt(experimentId: string, number: number, change: (attempt: Attempt) => void) {
  withAttemptLock(experimentId, number, () => {
    const attempt = readAttempt(experimentId, number);
    change(attempt);
    writeAttempt(attempt);
  });
}

export function readAllExperiments(): ExperimentWithAttempts[] {
  if (!existsSync(DATA_DIR)) return [];
  return readdirSync(DATA_DIR)
    .filter((experimentId) => experimentExists(experimentId))
    .map((experimentId) => ({
      ...readExperiment(experimentId),
      attempts: attemptNumbers(experimentId)
        .map((number) => readJson<Attempt>(attemptPath(experimentId, number)))
        .filter((attempt): attempt is Attempt => attempt !== null)
        .sort((a, b) => a.number - b.number),
    }))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
