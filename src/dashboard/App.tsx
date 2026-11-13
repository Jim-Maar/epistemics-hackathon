import { useEffect, useMemo, useRef, useState } from "react";
import type { Attempt, ExperimentWithAttempts } from "../shared/types.ts";
import { AttemptRow } from "./AttemptRow.tsx";
import { AllExperimentsHeader, ExperimentHeader } from "./ExperimentHeader.tsx";
import { SearchIcon } from "./icons.tsx";
import { attemptKey, hasAnyNo, hasMajorityNo } from "./outcome.ts";
import { Sidebar } from "./Sidebar.tsx";
import { useExperiments } from "./useExperiments.ts";

type Filter = "all" | "any_no" | "majority_no";

const FILTERS: { id: Filter; label: string; matches: (attempt: Attempt) => boolean }[] = [
  { id: "all", label: "All", matches: () => true },
  { id: "any_no", label: "At least one No", matches: hasAnyNo },
  { id: "majority_no", label: "Mostly No", matches: hasMajorityNo },
];

const EXPERIMENT_HASH_PREFIX = "#/";

function readSelectedIdFromHash(): string | null {
  const { hash } = window.location;
  return hash.startsWith(EXPERIMENT_HASH_PREFIX) ? decodeURIComponent(hash.slice(EXPERIMENT_HASH_PREFIX.length)) : null;
}

function useSelectedExperimentId(): [string | null, (id: string | null) => void] {
  const [selectedId, setSelectedId] = useState(readSelectedIdFromHash);
  useEffect(() => {
    const onHashChange = () => setSelectedId(readSelectedIdFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);
  const select = (id: string | null) => {
    window.location.hash = id === null ? "" : `${EXPERIMENT_HASH_PREFIX}${encodeURIComponent(id)}`;
  };
  return [selectedId, select];
}

const matchesSearch = (attempt: Attempt, query: string) =>
  [attempt.prompt, attempt.strategy, attempt.wrongAssumption, attempt.truth, attempt.note ?? ""].some((text) => text.toLowerCase().includes(query));

const isTyping = (target: EventTarget | null) => target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;

/** j and k move between rows, e opens or closes every row, and / jumps to the search field. */
function useListShortcuts(searchRef: React.RefObject<HTMLInputElement | null>, toggleAll: () => void) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTyping(event.target)) {
        if (event.key === "Escape") (event.target as HTMLElement).blur();
        return;
      }
      if (event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
      } else if (event.key === "e") {
        toggleAll();
      } else if (event.key === "j" || event.key === "k") {
        const rows = [...document.querySelectorAll<HTMLElement>("[data-attempt-row]")];
        const current = rows.indexOf(document.activeElement as HTMLElement);
        const next = event.key === "j" ? Math.min(current + 1, rows.length - 1) : Math.max(current - 1, 0);
        rows[next]?.focus();
        rows[next]?.scrollIntoView({ block: "nearest" });
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [searchRef, toggleAll]);
}

function EmptyState({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="empty">
      <p className="empty__title">{title}</p>
      <p className="empty__text">{children}</p>
    </div>
  );
}

function Dashboard({ experiments, now }: { experiments: ExperimentWithAttempts[]; now: number }) {
  const [selectedId, select] = useSelectedExperimentId();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = experiments.find((experiment) => experiment.id === selectedId) ?? null;
  const titlesById = new Map(experiments.map((experiment) => [experiment.id, experiment.title]));
  const scopeAttempts = useMemo(
    () => (selected === null ? experiments.flatMap((experiment) => experiment.attempts) : selected.attempts).toSorted((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [experiments, selected],
  );
  const normalizedQuery = query.trim().toLowerCase();
  const visibleAttempts = scopeAttempts.filter((attempt) => FILTERS.find((f) => f.id === filter)!.matches(attempt) && matchesSearch(attempt, normalizedQuery));
  const allVisibleExpanded = visibleAttempts.length > 0 && visibleAttempts.every((attempt) => expandedKeys.has(attemptKey(attempt)));

  const toggleAll = () => setExpandedKeys(allVisibleExpanded ? new Set() : new Set(visibleAttempts.map(attemptKey)));
  const toggleOne = (key: string) =>
    setExpandedKeys((current) => {
      const next = new Set(current);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  useListShortcuts(searchRef, toggleAll);

  return (
    <div className="layout">
      <Sidebar experiments={experiments} selectedId={selected?.id ?? null} onSelect={select} />
      <main className="main">
        {selected === null ? <AllExperimentsHeader experiments={experiments} /> : <ExperimentHeader experiment={selected} />}

        <div className="toolbar">
          <div className="segmented" role="group" aria-label="Show attempts">
            {FILTERS.map((option) => (
              <button key={option.id} type="button" className="segmented__option" aria-pressed={filter === option.id} onClick={() => setFilter(option.id)}>
                {option.label}
                <span className="segmented__count">{scopeAttempts.filter(option.matches).length}</span>
              </button>
            ))}
          </div>
          <label className="search">
            <SearchIcon />
            <input ref={searchRef} type="search" placeholder="Search prompts and notes" value={query} onChange={(event) => setQuery(event.target.value)} />
            <kbd>/</kbd>
          </label>
          <button type="button" className="button" onClick={toggleAll} disabled={visibleAttempts.length === 0}>
            {allVisibleExpanded ? "Collapse all" : "Expand all"}
          </button>
        </div>

        {experiments.length === 0 ? (
          <EmptyState title="No experiments yet">
            A worker registers its experiment with <code>bin/probe experiment</code>. It shows up here within two seconds.
          </EmptyState>
        ) : scopeAttempts.length === 0 ? (
          <EmptyState title="No attempts yet">The first prompt appears here as soon as the worker sends it, before Opus has answered.</EmptyState>
        ) : visibleAttempts.length === 0 ? (
          <EmptyState title="Nothing matches">Try another filter or clear the search.</EmptyState>
        ) : (
          <ul className="rows">
            {visibleAttempts.map((attempt) => (
              <AttemptRow
                key={attemptKey(attempt)}
                attempt={attempt}
                experimentTitle={selected === null ? (titlesById.get(attempt.experimentId) ?? attempt.experimentId) : null}
                now={now}
                expanded={expandedKeys.has(attemptKey(attempt))}
                onToggle={() => toggleOne(attemptKey(attempt))}
              />
            ))}
          </ul>
        )}

        <p className="shortcuts">
          <kbd>j</kbd> <kbd>k</kbd> move between attempts, <kbd>Enter</kbd> opens one, <kbd>e</kbd> opens all, <kbd>/</kbd> searches. The page updates every two seconds.
        </p>
      </main>
    </div>
  );
}

export function App() {
  const state = useExperiments();
  if (state.status === "loading") return <div className="loading">Loading experiments</div>;
  if (state.status === "error") {
    return (
      <EmptyState title="Can't reach the dashboard server">
        {state.message}. The page tries again every two seconds.
      </EmptyState>
    );
  }
  return <Dashboard experiments={state.experiments} now={state.now} />;
}
