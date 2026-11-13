import { experimentKind, type ExperimentWithAttempts } from "../shared/types.ts";
import { tallyRoles, type MarkRole } from "./outcome.ts";
import { ROLE_LABELS } from "./VerdictMark.tsx";

const TALLY_ORDER: MarkRole[] = ["finding", "partial", "clean", "error"];

/** Pairs every attempt with its experiment's kind, because the kind decides which verdict is a finding. */
export const attemptsWithKind = (experiments: ExperimentWithAttempts[]) =>
  experiments.flatMap((experiment) => experiment.attempts.map((attempt) => ({ attempt, kind: experimentKind(experiment) })));

type KindedAttempts = ReturnType<typeof attemptsWithKind>;

/** One thin bar split by verdict, so experiments can be compared at a glance. */
function TallyBar({ attempts }: { attempts: KindedAttempts }) {
  const tally = tallyRoles(attempts);
  const total = TALLY_ORDER.reduce((sum, role) => sum + tally[role], 0);
  if (total === 0) return <div className="tally tally--empty" />;
  const description = TALLY_ORDER.filter((role) => tally[role] > 0).map((role) => `${tally[role]} ${ROLE_LABELS[role]}`).join(", ");
  return (
    <div className="tally" role="img" aria-label={`Samples: ${description}`} title={`Samples: ${description}`}>
      {TALLY_ORDER.map((role) => tally[role] > 0 && <span key={role} className={`tally__part tally__part--${role}`} style={{ flexGrow: tally[role] }} />)}
    </div>
  );
}

function FindingCount({ attempts }: { attempts: KindedAttempts }) {
  const findings = tallyRoles(attempts).finding;
  if (findings === 0) return <span className="nav-item__quiet">No findings</span>;
  return <span className="nav-item__findings">{findings} {findings === 1 ? "finding" : "findings"}</span>;
}

type SidebarProps = { experiments: ExperimentWithAttempts[]; selectedId: string | null; onSelect: (id: string | null) => void };

export function Sidebar({ experiments, selectedId, onSelect }: SidebarProps) {
  const allAttempts = attemptsWithKind(experiments);
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
          <FindingCount attempts={allAttempts} />
        </span>
        <TallyBar attempts={allAttempts} />
      </button>

      <h2 className="sidebar__heading">Experiments</h2>
      <ul className="sidebar__list">
        {experiments.map((experiment) => {
          const isSelected = experiment.id === selectedId;
          const isRunning = experiment.finishedAt === null;
          const attempts = attemptsWithKind([experiment]);
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
                  <FindingCount attempts={attempts} />
                </span>
                <TallyBar attempts={attempts} />
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
