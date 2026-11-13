import type { ExperimentKind, MotteAndBaileyJudgement, FollowUp, Sample } from "../shared/types.ts";
import { formatDuration } from "./format.ts";
import { markRole, sampleMark } from "./outcome.ts";
import { Reply } from "./Reply.tsx";
import { VerdictBadge } from "./VerdictMark.tsx";

type SampleCardProps = { sample: Sample; kind: ExperimentKind; number: number; repliesExpanded: boolean; onToggleReplies: () => void };

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

function ErrorMessage({ stage, error }: { stage: "target" | "judge"; error: string }) {
  return (
    <p className="sample__error">
      The {stage === "target" ? "Opus" : "judge"} call failed: {error}
    </p>
  );
}

/** The claim a reader takes from the first reply next to the claim defended later, so a retreat is visible at a glance. */
function ClaimComparison({ judgement }: { judgement: MotteAndBaileyJudgement }) {
  return (
    <div className="claims">
      <div className="claims__item">
        <span className="claims__label">First reply implied</span>
        <p>{judgement.strongClaim}</p>
      </div>
      <div className="claims__item">
        <span className="claims__label">Defended later</span>
        <p>{judgement.weakClaim}</p>
      </div>
      <p className="sample__reason">{judgement.reason}</p>
    </div>
  );
}

function FollowUpTurn({ followUp, number, expanded, onToggle }: { followUp: FollowUp; number: number; expanded: boolean; onToggle: () => void }) {
  return (
    <section className="turn">
      <h5 className="turn__label">Follow-up {number}</h5>
      <p className="turn__user">{followUp.message}</p>
      {followUp.status === "waiting_for_target" && <WaitingForReply />}
      {followUp.status === "error" && <ErrorMessage stage={followUp.stage} error={followUp.error} />}
      {followUp.status !== "waiting_for_target" && followUp.reply !== null && <Reply text={followUp.reply} expanded={expanded} onToggle={onToggle} />}
      {"targetMs" in followUp && <footer className="sample__footer">Opus answered in {formatDuration(followUp.targetMs)}</footer>}
    </section>
  );
}

function latestJudgement(sample: Sample): MotteAndBaileyJudgement | null {
  if (sample.status !== "replied") return null;
  const latest = sample.followUps.at(-1);
  return latest?.status === "judged" ? latest.judgement : null;
}

export function SampleCard({ sample, kind, number, repliesExpanded, onToggleReplies }: SampleCardProps) {
  const mark = sampleMark(sample);
  const reply = sample.status === "waiting_for_target" ? null : sample.reply;
  const judgement = latestJudgement(sample);
  const hasFollowUps = sample.status === "replied" && sample.followUps.length > 0;

  return (
    <article className={`sample sample--${markRole(mark, kind)}`}>
      <header className="sample__header">
        <h4 className="sample__title">Sample {number}</h4>
        <VerdictBadge mark={mark} kind={kind} />
      </header>

      {sample.status === "judged" && <p className="sample__reason sample__reason--ruled">{sample.reason}</p>}
      {judgement !== null && <ClaimComparison judgement={judgement} />}
      {sample.status === "error" && <ErrorMessage stage={sample.stage} error={sample.error} />}

      <section className="turn">
        {hasFollowUps && <h5 className="turn__label">First reply</h5>}
        {reply === null ? (
          sample.status === "waiting_for_target" && <WaitingForReply />
        ) : (
          <Reply text={reply} expanded={repliesExpanded} onToggle={onToggleReplies} />
        )}
        {"targetMs" in sample && <footer className="sample__footer">Opus answered in {formatDuration(sample.targetMs)}</footer>}
      </section>

      {sample.status === "replied" &&
        sample.followUps.map((followUp, index) => (
          <FollowUpTurn key={followUp.createdAt} followUp={followUp} number={index + 1} expanded={repliesExpanded} onToggle={onToggleReplies} />
        ))}
    </article>
  );
}
