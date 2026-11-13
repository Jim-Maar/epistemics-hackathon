import type { Attempt, Sample, Verdict } from "../shared/types.ts";

/** An attempt that has not finished after this long most likely lost its probe process. */
const INTERRUPTED_AFTER_MS = 15 * 60 * 1000;

export type SampleMark = Verdict | "error" | "waiting" | "judging";

export function sampleMark(sample: Sample): SampleMark {
  switch (sample.status) {
    case "judged":
      return sample.verdict;
    case "error":
      return "error";
    case "judging":
      return "judging";
    case "waiting_for_target":
      return "waiting";
  }
}

export const countNo = (attempt: Attempt) => attempt.samples.filter((sample) => sampleMark(sample) === "no").length;

export const hasAnyNo = (attempt: Attempt) => countNo(attempt) > 0;

export const hasMajorityNo = (attempt: Attempt) => countNo(attempt) * 2 > attempt.samples.length;

export type AttemptState = "running" | "interrupted" | "finished";

export function attemptState(attempt: Attempt, now: number): AttemptState {
  if (attempt.finishedAt !== null) return "finished";
  return now - Date.parse(attempt.createdAt) > INTERRUPTED_AFTER_MS ? "interrupted" : "running";
}

export type MarkTally = Record<SampleMark, number>;

export function tallyMarks(attempts: Attempt[]): MarkTally {
  const tally: MarkTally = { no: 0, somewhat: 0, yes: 0, error: 0, waiting: 0, judging: 0 };
  for (const attempt of attempts) for (const sample of attempt.samples) tally[sampleMark(sample)] += 1;
  return tally;
}

export const attemptKey = (attempt: Attempt) => `${attempt.experimentId}:${attempt.number}`;
