import type { ExperimentKind } from "../shared/types.ts";
import { markRole, type MarkRole, type SampleMark } from "./outcome.ts";
import { AlertIcon, CheckIcon, CrossIcon, HalfIcon } from "./icons.tsx";

export const MARK_LABELS: Record<SampleMark, string> = {
  no: "No",
  somewhat: "Somewhat",
  yes: "Yes",
  error: "Error",
  judging: "Judging",
  waiting: "Waiting for Opus",
  awaiting_follow_up: "No follow-up yet",
};

export const ROLE_LABELS: Record<MarkRole, string> = {
  finding: "Finding",
  partial: "Somewhat",
  clean: "No finding",
  error: "Error",
  judging: "Judging",
  waiting: "Waiting for Opus",
  awaiting_follow_up: "No follow-up yet",
};

const ROLE_ICONS: Partial<Record<MarkRole, React.ReactNode>> = {
  finding: <CrossIcon size={12} />,
  partial: <HalfIcon size={12} />,
  clean: <CheckIcon size={12} />,
  error: <AlertIcon size={12} />,
};

/** A small square that shows one sample's verdict, used in rows where space is tight. Its colour says whether the verdict is a finding. */
export function VerdictMark({ mark, kind, sampleNumber }: { mark: SampleMark; kind: ExperimentKind; sampleNumber: number }) {
  const role = markRole(mark, kind);
  const label = `Sample ${sampleNumber}: ${MARK_LABELS[mark]}${role === "finding" ? " (finding)" : ""}`;
  return (
    <span className={`mark mark--${role}`} title={label} aria-label={label} role="img">
      {ROLE_ICONS[role]}
    </span>
  );
}

/** The verdict with its word, used where the reader is looking at one sample. */
export function VerdictBadge({ mark, kind }: { mark: SampleMark; kind: ExperimentKind }) {
  const role = markRole(mark, kind);
  return (
    <span className={`badge badge--${role}`}>
      {ROLE_ICONS[role]}
      {MARK_LABELS[mark]}
    </span>
  );
}
