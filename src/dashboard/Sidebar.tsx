import type { Attempt, ExperimentWithAttempts } from "../shared/types.ts";
import { hasAnyNo, tallyMarks, type SampleMark } from "./outcome.ts";
import { MARK_LABELS } from "./VerdictMark.tsx";

const TALLY_ORDER: SampleMark[] = ["no", "somewhat", "yes", "error"];

/** One thin bar split by verdict, so experiments can be compared at a glance. */
function TallyBar({ attempts }: { attempts: Attempt[] }) {
  const tally = tallyMarks(attempts);
  const total = TALLY_ORDER.reduce((sum, mark) => sum + tally[mark], 0);
  if (total === 0) return <div className="tally tally--empty" />;
  const description = TALLY_ORDER.filter((mark) => tally[mark] > 0).map((mark) => `${tally[mark]} ${MARK_LABELS[mark]}`).join(", ");
  return (
    <div className="tally" role="img" aria-label={`Samples: ${description}`} title={`Samples: ${description}`}>
      {TALLY_ORDER.map((mark) => tally[mark] > 0 && <span key={mark} className={`tally__part tally__part--${mark}`} style={{ flexGrow: tally[mark] }} />)}
    </div>
  );
}

function FailureCount({ attempts }: { attempts: Attempt[] }) {
  const failed = attempts.filter(hasAnyNo).length;
  if (failed === 0) return <span className="nav-item__quiet">No failures</span>;
  return <span className="nav-item__failures">{failed} with a No</span>;
}

type SidebarProps = { experiments: ExperimentWithAttempts[]; selectedId: string | null; onSelect: (id: string | null) => void };

export function Sidebar({ experiments, selectedId, onSelect }: SidebarProps) {
  const allAttempts = experiments.flatMap((experiment) => experiment.attempts);
  return (
    <nav className="sidebar" aria-label="Experiments">
      <div className="sidebar__brand">
        <span className="sidebar__name">Opus probes</span>
        <span className="sidebar__target">Target: Opus 5.5, effort high</span>
      </div>

      <button type="button" className={`nav-item ${selectedId === null ? "nav-item--selected" : ""}`} aria-current={selectedId === null ? "page" : undefined} onClick={() => onSelect(null)}>
        <span className="nav-item__title">All experiments</span>
        <span className="nav-item__meta">
          <span>{allAttempts.length} attempts</span>
          <FailureCount attempts={allAttempts} />
        </span>
        <TallyBar attempts={allAttempts} />
      </button>

      <h2 className="sidebar__heading">Experiments</h2>
      <ul className="sidebar__list">
        {experiments.map((experiment) => {
          const isSelected = experiment.id === selectedId;
          const isRunning = experiment.finishedAt === null;
          return (
            <li key={experiment.id}>
              <button type="button" className={`nav-item ${isSelected ? "nav-item--selected" : ""}`} aria-current={isSelected ? "page" : undefined} onClick={() => onSelect(experiment.id)}>
                <span className="nav-item__title">{experiment.title}</span>
                <span className="nav-item__meta">
                  <span className="nav-item__status">
                    <span className={`status-dot ${isRunning ? "status-dot--running" : ""}`} aria-hidden="true" />
                    {isRunning ? "Running" : "Finished"}
                  </span>
                  <span>{experiment.attempts.length} of {experiment.maxAttempts}</span>
                  <FailureCount attempts={experiment.attempts} />
                </span>
                <TallyBar attempts={experiment.attempts} />
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
