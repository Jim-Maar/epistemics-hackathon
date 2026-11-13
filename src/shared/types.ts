export type Verdict = "yes" | "somewhat" | "no";

/** One independent reply of the target model to an attempt's prompt, and its judgement. */
export type Sample =
  | { status: "waiting_for_target" }
  | { status: "judging"; reply: string; targetMs: number }
  | { status: "judged"; reply: string; targetMs: number; verdict: Verdict; reason: string }
  | { status: "error"; stage: "target" | "judge"; error: string; reply: string | null };

export type Attempt = {
  experimentId: string;
  number: number;
  createdAt: string;
  finishedAt: string | null;
  strategy: string;
  prompt: string;
  systemPrompt: string | null;
  wrongAssumption: string;
  truth: string;
  repeatOf: number | null;
  note: string | null;
  targetModel: string;
  judgeModel: string;
  samples: Sample[];
};

export type Experiment = {
  id: string;
  title: string;
  description: string;
  tmuxSession: string | null;
  createdAt: string;
  maxAttempts: number;
  summary: string | null;
  finishedAt: string | null;
};

export type ExperimentWithAttempts = Experiment & { attempts: Attempt[] };
