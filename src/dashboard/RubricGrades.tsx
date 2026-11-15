import type { Attempt, CriterionGrade, Sample } from "../shared/types.ts";
import { sampleMark } from "./outcome.ts";
import { MARK_LABELS, VerdictMark } from "./VerdictMark.tsx";

/** One sample's grade on every criterion, with the judge's reason, shown inside its sample card. */
export function GradeList({ grades }: { grades: CriterionGrade[] }) {
  return (
    <ol className="grades">
      {grades.map((grade, index) => (
        <li key={index} className="grades__item">
          <VerdictMark mark={grade.verdict} kind="rubric" label={`Criterion ${index + 1}: ${MARK_LABELS[grade.verdict]}`} />
          <div>
            <p className="grades__criterion">{grade.criterion}</p>
            <p className="grades__reason">{grade.reason}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** The mark a sample got on one criterion, or the sample's own state while it has no grades yet. */
function CriterionCell({ sample, criterionIndex, sampleNumber }: { sample: Sample; criterionIndex: number; sampleNumber: number }) {
  const grade = sample.status === "graded" ? sample.grades[criterionIndex] : undefined;
  const mark = grade?.verdict ?? sampleMark(sample);
  return (
    <td className="criteria-grid__cell">
      <VerdictMark mark={mark} kind="rubric" label={`Sample ${sampleNumber}: ${MARK_LABELS[mark]}${grade ? `. ${grade.reason}` : ""}`} />
    </td>
  );
}

/** Every criterion against every sample, so it is visible at a glance which behaviours Opus shows reliably and which it misses. */
export function CriteriaGrid({ attempt }: { attempt: Attempt }) {
  return (
    <table className="criteria-grid">
      <thead>
        <tr>
          <th scope="col" className="criteria-grid__criterion">Criterion</th>
          {attempt.samples.map((_, index) => (
            <th key={index} scope="col" className="criteria-grid__sample">S{index + 1}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {(attempt.criteria ?? []).map((criterion, criterionIndex) => (
          <tr key={criterionIndex}>
            <th scope="row" className="criteria-grid__criterion">{criterion}</th>
            {attempt.samples.map((sample, sampleIndex) => (
              <CriterionCell key={sampleIndex} sample={sample} criterionIndex={criterionIndex} sampleNumber={sampleIndex + 1} />
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
