export type Verdict = "yes" | "somewhat" | "no";

/**
 * What an experiment looks for. In a "wrong_assumption" experiment the judge asks whether the first reply
 * pointed out a false belief, and "no" is the finding. In a "motte_and_bailey" experiment the first reply is
 * not judged. The worker pushes back, and the judge asks whether the model retreated to a weaker claim than
 * it first implied, so "yes" is the finding.
 * In a "rubric" experiment every attempt brings its own list of criteria, which are behaviours a good reply
 * shows. The judge grades the first reply on each criterion. A reply that misses at least one criterion is a finding.
 */
export type ExperimentKind = "wrong_assumption" | "motte_and_bailey" | "rubric";

/** The judge's grade for one criterion of a rubric experiment. */
export type CriterionGrade = { criterion: string; verdict: Verdict; reason: string };

/** A document sent along with the prompt, the way a chat app sends an attached file. */
export type Attachment = { name: string; content: string };

export type MotteAndBaileyJudgement = {
  verdict: Verdict;
  strongClaim: string;
  weakClaim: string;
  reason: string;
};

/** One more turn in a sample's conversation: the worker's follow-up message and the target's reply to it. */
export type FollowUp = { message: string; createdAt: string } & (
  | { status: "waiting_for_target" }
  | { status: "judging"; reply: string; targetMs: number; sessionId: string }
  | { status: "judged"; reply: string; targetMs: number; sessionId: string; judgement: MotteAndBaileyJudgement }
  | { status: "error"; stage: "target" | "judge"; error: string; reply: string | null }
);

/** One independent conversation of the target model with the attempt's prompt, and its judgement. */
export type Sample =
  | { status: "waiting_for_target" }
  | { status: "judging"; reply: string; targetMs: number }
  | { status: "judged"; reply: string; targetMs: number; verdict: Verdict; reason: string }
  /** A first reply of a rubric experiment, graded on each of the attempt's criteria in order. */
  | { status: "graded"; reply: string; targetMs: number; grades: CriterionGrade[] }
  /** A first reply that is not judged on its own. sessionId lets a follow-up continue the same conversation. */
  | { status: "replied"; reply: string; targetMs: number; sessionId: string; followUps: FollowUp[] }
  | { status: "error"; stage: "target" | "judge"; error: string; reply: string | null };

export type Attempt = {
  experimentId: string;
  number: number;
  createdAt: string;
  finishedAt: string | null;
  strategy: string;
  prompt: string;
  /** Documents the target receives before the prompt. Attempts saved before attachments existed have no value here, which means none. */
  attachments?: Attachment[];
  systemPrompt: string | null;
  /** Whether the target could search the web. Attempts saved before this option existed have no value here, which means no. */
  webSearch?: boolean;
  /** Only "wrong_assumption" experiments have these two. */
  wrongAssumption: string | null;
  truth: string | null;
  /** Only "rubric" experiments have criteria. */
  criteria?: string[];
  repeatOf: number | null;
  note: string | null;
  targetModel: string;
  judgeModel: string;
  samples: Sample[];
};

export type Experiment = {
  id: string;
  /** Experiments saved before kinds existed have no value here, which means "wrong_assumption". */
  kind?: ExperimentKind;
  title: string;
  description: string;
  tmuxSession: string | null;
  createdAt: string;
  maxAttempts: number;
  summary: string | null;
  finishedAt: string | null;
};

export type ExperimentWithAttempts = Experiment & { attempts: Attempt[] };

export const experimentKind = (experiment: Experiment): ExperimentKind => experiment.kind ?? "wrong_assumption";

/** A graded reply met its rubric if it met every criterion, and missed it if it missed any one of them. */
export function rubricVerdict(grades: CriterionGrade[]): Verdict {
  if (grades.some((grade) => grade.verdict === "no")) return "no";
  return grades.every((grade) => grade.verdict === "yes") ? "yes" : "somewhat";
}
