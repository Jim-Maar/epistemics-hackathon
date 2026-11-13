import type { Sample } from "../shared/types.ts";
import { formatDuration } from "./format.ts";
import { sampleMark } from "./outcome.ts";
import { Reply } from "./Reply.tsx";
import { VerdictBadge } from "./VerdictMark.tsx";

type SampleCardProps = { sample: Sample; number: number; replyExpanded: boolean; onToggleReply: () => void };

const SKELETON_LINE_WIDTHS = ["92%", "100%", "78%", "96%", "64%"];

function WaitingForReply() {
  return (
    <div className="skeleton" aria-label="Waiting for the reply">
      {SKELETON_LINE_WIDTHS.map((width) => (
        <span key={width} className="skeleton__line" style={{ width }} />
      ))}
    </div>
  );
}

export function SampleCard({ sample, number, replyExpanded, onToggleReply }: SampleCardProps) {
  const mark = sampleMark(sample);
  const reply = sample.status === "waiting_for_target" ? null : sample.reply;

  return (
    <article className={`sample sample--${mark}`}>
      <header className="sample__header">
        <h4 className="sample__title">Sample {number}</h4>
        <VerdictBadge mark={mark} />
      </header>

      {sample.status === "judged" && <p className="sample__reason">{sample.reason}</p>}
      {sample.status === "error" && (
        <p className="sample__error">
          The {sample.stage === "target" ? "Opus" : "judge"} call failed: {sample.error}
        </p>
      )}

      {reply === null ? (
        sample.status === "waiting_for_target" && <WaitingForReply />
      ) : (
        <Reply text={reply} expanded={replyExpanded} onToggle={onToggleReply} />
      )}

      {"targetMs" in sample && <footer className="sample__footer">Opus answered in {formatDuration(sample.targetMs)}</footer>}
    </article>
  );
}
