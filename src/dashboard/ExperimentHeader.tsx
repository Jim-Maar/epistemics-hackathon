import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Attempt, ExperimentWithAttempts } from "../shared/types.ts";
import { formatTimestamp } from "./format.ts";
import { tallyMarks, type SampleMark } from "./outcome.ts";
import { MARK_LABELS } from "./VerdictMark.tsx";

const COUNT_ORDER: SampleMark[] = ["no", "somewhat", "yes", "error"];

function SampleCounts({ attempts }: { attempts: Attempt[] }) {
  const tally = tallyMarks(attempts);
  const inProgress = tally.waiting + tally.judging;
  return (
    <div className="counts" aria-label="Sample verdicts">
      {COUNT_ORDER.map((mark) => (
        <span key={mark} className={`count count--${mark}`}>
          <span className="count__dot" aria-hidden="true" />
          <span className="count__value">{tally[mark]}</span> {MARK_LABELS[mark]}
        </span>
      ))}
      {inProgress > 0 && <span className="count count--waiting"><span className="count__value">{inProgress}</span> in progress</span>}
    </div>
  );
}

export function AllExperimentsHeader({ experiments }: { experiments: ExperimentWithAttempts[] }) {
  return (
    <header className="page-header">
      <h1 className="page-header__title">All experiments</h1>
      <p className="page-header__description">Every attempt from every experiment, newest first.</p>
      <SampleCounts attempts={experiments.flatMap((experiment) => experiment.attempts)} />
    </header>
  );
}

export function ExperimentHeader({ experiment }: { experiment: ExperimentWithAttempts }) {
  const isRunning = experiment.finishedAt === null;
  return (
    <header className="page-header">
      <div className="page-header__row">
        <h1 className="page-header__title">{experiment.title}</h1>
        <span className={`tag ${isRunning ? "tag--running" : ""}`}>{isRunning ? "Running" : "Finished"}</span>
      </div>
      <p className="page-header__description">{experiment.description}</p>
      <p className="page-header__meta">
        Started {formatTimestamp(experiment.createdAt)}
        <span aria-hidden="true"> · </span>
        {experiment.attempts.length} of {experiment.maxAttempts} attempts used
        {experiment.tmuxSession !== null && (
          <>
            <span aria-hidden="true"> · </span>
            Worker in tmux session <code>{experiment.tmuxSession}</code>
          </>
        )}
      </p>
      <SampleCounts attempts={experiment.attempts} />
      {experiment.summary !== null && (
        <section className="summary">
          <h2 className="summary__title">Worker's summary</h2>
          <div className="prose">
            <Markdown remarkPlugins={[remarkGfm]}>{experiment.summary}</Markdown>
          </div>
        </section>
      )}
    </header>
  );
}
