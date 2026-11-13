import { useState } from "react";
import type { Attempt, ExperimentKind } from "../shared/types.ts";
import { formatTimestamp } from "./format.ts";
import { ChevronIcon, CopyIcon } from "./icons.tsx";
import { attemptState, hasAnyFinding, hasMajorityFindings, sampleMark, type AttemptState } from "./outcome.ts";
import { SampleCard } from "./SampleCard.tsx";
import { VerdictMark } from "./VerdictMark.tsx";

type AttemptRowProps = {
  attempt: Attempt;
  kind: ExperimentKind;
  experimentTitle: string | null;
  now: number;
  expanded: boolean;
  onToggle: () => void;
};

const STATE_LABELS: Record<Exclude<AttemptState, "finished">, string> = {
  running: "Running",
  interrupted: "Interrupted",
};

function RowTags({ attempt, state }: { attempt: Attempt; state: AttemptState }) {
  const tags = [
    state !== "finished" && <span key="state" className={`tag tag--${state}`}>{STATE_LABELS[state]}</span>,
    attempt.systemPrompt !== null && <span key="system" className="tag tag--system">System prompt</span>,
    attempt.webSearch === true && <span key="search" className="tag tag--system">Web search</span>,
    attempt.repeatOf !== null && <span key="repeat" className="tag">Repeat of #{attempt.repeatOf}</span>,
    attempt.note !== null && <span key="note" className="tag">Worker note</span>,
  ].filter(Boolean);
  return tags.length > 0 ? <span className="row__tags">{tags}</span> : null;
}

function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="field">
      <dt className="field__label">{label}</dt>
      <dd className="field__value">{children}</dd>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const COPIED_FEEDBACK_MS = 1500;
  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
  }
  return (
    <button type="button" className="text-button text-button--icon" onClick={copy}>
      <CopyIcon size={13} />
      {copied ? "Copied" : "Copy prompt"}
    </button>
  );
}

function AttemptDetail({ attempt, kind }: { attempt: Attempt; kind: ExperimentKind }) {
  const [expandedReplies, setExpandedReplies] = useState<boolean[]>(attempt.samples.map(() => false));
  const allRepliesExpanded = expandedReplies.every(Boolean);
  const toggleReply = (index: number) => setExpandedReplies((current) => current.map((value, i) => (i === index ? !value : value)));

  return (
    <div className="detail">
      <div className="detail__top">
        <section className="detail__prompt">
          <div className="section-heading">
            <h3>Prompt</h3>
            <CopyButton text={attempt.prompt} />
          </div>
          <p className="prompt-text">{attempt.prompt}</p>
        </section>
        <dl className="detail__facts">
          {attempt.wrongAssumption !== null && <DetailField label="Wrong assumption">{attempt.wrongAssumption}</DetailField>}
          {attempt.truth !== null && <DetailField label="What is true">{attempt.truth}</DetailField>}
          {kind === "motte_and_bailey" && (
            <DetailField label="What is judged">
              After the worker pushes back, the judge reads the whole conversation and asks whether Opus retreated to a weaker claim than its first reply implied. A "Yes" is a finding.
            </DetailField>
          )}
          {attempt.note !== null && <DetailField label="Worker note">{attempt.note}</DetailField>}
          {attempt.systemPrompt !== null && (
            <DetailField label="System prompt">
              <span className="system-prompt">{attempt.systemPrompt}</span>
            </DetailField>
          )}
        </dl>
      </div>

      <div className="section-heading">
        <h3>Samples</h3>
        <button type="button" className="text-button" onClick={() => setExpandedReplies(attempt.samples.map(() => !allRepliesExpanded))}>
          {allRepliesExpanded ? "Shorten all replies" : "Show all replies in full"}
        </button>
      </div>
      <div className="samples">
        {attempt.samples.map((sample, index) => (
          <SampleCard key={index} sample={sample} kind={kind} number={index + 1} repliesExpanded={expandedReplies[index] ?? false} onToggleReplies={() => toggleReply(index)} />
        ))}
      </div>
    </div>
  );
}

export function AttemptRow({ attempt, kind, experimentTitle, now, expanded, onToggle }: AttemptRowProps) {
  const state = attemptState(attempt, now);
  const findingClass = hasMajorityFindings(attempt, kind) ? "row--majority-findings" : hasAnyFinding(attempt, kind) ? "row--any-finding" : "";
  const detailId = `detail-${attempt.experimentId}-${attempt.number}`;

  return (
    <li className={`row ${findingClass} ${expanded ? "row--expanded" : ""}`}>
      <button type="button" className="row__summary" data-attempt-row aria-expanded={expanded} aria-controls={detailId} onClick={onToggle}>
        <span className="row__number">#{attempt.number}</span>
        <span className="row__marks">
          {attempt.samples.map((sample, index) => (
            <VerdictMark key={index} mark={sampleMark(sample)} kind={kind} sampleNumber={index + 1} />
          ))}
        </span>
        <span className="row__text">
          <span className="row__headline">
            {experimentTitle !== null && <span className="row__experiment">{experimentTitle}</span>}
            <span className="row__strategy">{attempt.strategy}</span>
            <RowTags attempt={attempt} state={state} />
          </span>
          <span className="row__prompt">{attempt.prompt}</span>
        </span>
        <span className="row__time">{formatTimestamp(attempt.createdAt)}</span>
        <span className="row__chevron"><ChevronIcon /></span>
      </button>
      {expanded && (
        <div id={detailId}>
          <AttemptDetail attempt={attempt} kind={kind} />
        </div>
      )}
    </li>
  );
}
