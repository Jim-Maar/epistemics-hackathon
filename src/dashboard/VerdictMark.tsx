import type { SampleMark } from "./outcome.ts";
import { AlertIcon, CheckIcon, CrossIcon, HalfIcon } from "./icons.tsx";

export const MARK_LABELS: Record<SampleMark, string> = {
  no: "No",
  somewhat: "Somewhat",
  yes: "Yes",
  error: "Error",
  judging: "Judging",
  waiting: "Waiting for Opus",
};

const MARK_ICONS: Partial<Record<SampleMark, React.ReactNode>> = {
  no: <CrossIcon size={12} />,
  somewhat: <HalfIcon size={12} />,
  yes: <CheckIcon size={12} />,
  error: <AlertIcon size={12} />,
};

/** A small square that shows one sample's verdict, used in rows where space is tight. */
export function VerdictMark({ mark, sampleNumber }: { mark: SampleMark; sampleNumber: number }) {
  const label = `Sample ${sampleNumber}: ${MARK_LABELS[mark]}`;
  return (
    <span className={`mark mark--${mark}`} title={label} aria-label={label} role="img">
      {MARK_ICONS[mark]}
    </span>
  );
}

/** The verdict with its word, used where the reader is looking at one sample. */
export function VerdictBadge({ mark }: { mark: SampleMark }) {
  return (
    <span className={`badge badge--${mark}`}>
      {MARK_ICONS[mark]}
      {MARK_LABELS[mark]}
    </span>
  );
}
