import { parseArgs } from "node:util";
import { readFileSync } from "node:fs";
import type { Attempt, Experiment, Sample } from "../shared/types.ts";
import {
  claimNextAttemptNumber,
  countAttempts,
  experimentExists,
  readAttempt,
  readExperiment,
  writeAttempt,
  writeExperiment,
} from "../shared/store.ts";
import { askTarget, judgeReply, JUDGE_MODEL, TARGET_MODEL } from "./claude.ts";

const SAMPLES_PER_ATTEMPT = 3;
const DEFAULT_MAX_ATTEMPTS = 30;
const EXPERIMENT_ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const USAGE = `probe: the only way to send prompts to the target model (Claude Opus 5.5, effort high).

  probe experiment --id <slug> --title <text> --description <text> [--max-attempts 30]
      Registers a new experiment.

  probe attempt --experiment <id> --strategy <text> --wrong-assumption <text> --truth <text>
                [--prompt <text> | --prompt-file <path>] [--system-prompt-file <path>] [--repeat-of <n>]
      Sends the prompt to ${SAMPLES_PER_ATTEMPT} separate target sessions at once and has a judge grade each reply.
      Without --prompt or --prompt-file, the prompt is read from stdin.

  probe note --experiment <id> --attempt <n> --text <text>
      Adds your note to an attempt, for example when you disagree with the judge.

  probe finish --experiment <id> (--summary <text> | --summary-file <path>)
      Saves your closing summary and marks the experiment as finished.`;

function fail(message: string): never {
  console.error(`probe: ${message}`);
  process.exit(1);
}

function requireOption(values: Record<string, unknown>, name: string): string {
  const value = values[name];
  if (typeof value !== "string" || value.trim() === "") fail(`--${name} is required.\n\n${USAGE}`);
  return value;
}

function readTextOption(values: Record<string, unknown>, textName: string, fileName: string): string | null {
  if (typeof values[textName] === "string") return values[textName] as string;
  if (typeof values[fileName] === "string") return readFileSync(values[fileName] as string, "utf8");
  return null;
}

function currentTmuxSession(): string | null {
  if (!process.env.TMUX) return null;
  const result = Bun.spawnSync(["tmux", "display-message", "-p", "#S"]);
  return result.exitCode === 0 ? result.stdout.toString().trim() : null;
}

function createExperiment(values: Record<string, unknown>) {
  const id = requireOption(values, "id");
  if (!EXPERIMENT_ID_PATTERN.test(id)) fail(`--id must be lowercase words joined by dashes, like "emotional-messages".`);
  if (experimentExists(id)) fail(`An experiment with id "${id}" already exists.`);
  const experiment: Experiment = {
    id,
    title: requireOption(values, "title"),
    description: requireOption(values, "description"),
    tmuxSession: currentTmuxSession(),
    createdAt: new Date().toISOString(),
    maxAttempts: values["max-attempts"] === undefined ? DEFAULT_MAX_ATTEMPTS : Number(values["max-attempts"]),
    summary: null,
    finishedAt: null,
  };
  writeExperiment(experiment);
  console.log(`Registered experiment "${id}" with a limit of ${experiment.maxAttempts} attempts.`);
}

/** Runs one sample from target call to verdict, reporting every state change so the page can show progress. */
async function runSample(attempt: Attempt, onUpdate: (sample: Sample) => void) {
  const target = await askTarget(attempt.prompt, attempt.systemPrompt);
  if (!target.ok) return onUpdate({ status: "error", stage: "target", error: target.error, reply: null });
  onUpdate({ status: "judging", reply: target.value, targetMs: target.durationMs });

  const judgement = await judgeReply({ ...attempt, reply: target.value });
  if (!judgement.ok) return onUpdate({ status: "error", stage: "judge", error: judgement.error, reply: target.value });
  onUpdate({ status: "judged", reply: target.value, targetMs: target.durationMs, ...judgement.value });
}

function formatSampleReport(sample: Sample, index: number): string {
  const heading = `=== Sample ${index + 1}`;
  switch (sample.status) {
    case "judged":
      return `${heading}: ${sample.verdict.toUpperCase()} ===\nJudge: ${sample.reason}\n\n${sample.reply}`;
    case "error":
      return `${heading}: ERROR during the ${sample.stage} call ===\n${sample.error}${sample.reply ? `\n\nReply:\n${sample.reply}` : ""}`;
    default:
      return `${heading}: did not finish ===`;
  }
}

async function runAttempt(values: Record<string, unknown>) {
  const experiment = readExperiment(requireOption(values, "experiment"));
  if (experiment.finishedAt !== null) fail(`Experiment "${experiment.id}" is already finished.`);
  if (countAttempts(experiment.id) >= experiment.maxAttempts) {
    fail(`Experiment "${experiment.id}" has used all ${experiment.maxAttempts} attempts. Write your summary with: probe finish`);
  }
  const prompt = readTextOption(values, "prompt", "prompt-file") ?? (await new Response(Bun.stdin.stream()).text());
  if (prompt.trim() === "") fail("The prompt is empty.");
  const systemPromptFile = values["system-prompt-file"];

  const attempt: Attempt = {
    experimentId: experiment.id,
    number: claimNextAttemptNumber(experiment.id),
    createdAt: new Date().toISOString(),
    finishedAt: null,
    strategy: requireOption(values, "strategy"),
    prompt: prompt.trim(),
    systemPrompt: typeof systemPromptFile === "string" ? readFileSync(systemPromptFile, "utf8").trim() : null,
    wrongAssumption: requireOption(values, "wrong-assumption"),
    truth: requireOption(values, "truth"),
    repeatOf: values["repeat-of"] === undefined ? null : Number(values["repeat-of"]),
    note: null,
    targetModel: TARGET_MODEL,
    judgeModel: JUDGE_MODEL,
    samples: Array.from({ length: SAMPLES_PER_ATTEMPT }, () => ({ status: "waiting_for_target" }) as const),
  };
  writeAttempt(attempt);
  console.log(`Attempt ${attempt.number} of ${experiment.maxAttempts} started. Waiting for ${SAMPLES_PER_ATTEMPT} samples and their judgements...`);

  await Promise.all(
    attempt.samples.map((_, index) =>
      runSample(attempt, (sample) => {
        attempt.samples[index] = sample;
        writeAttempt(attempt);
      }),
    ),
  );
  attempt.finishedAt = new Date().toISOString();
  writeAttempt(attempt);

  const verdicts = attempt.samples.map((sample) => (sample.status === "judged" ? sample.verdict : "error"));
  console.log(`\nAttempt ${attempt.number}. Verdicts: ${verdicts.join(", ")}\n`);
  console.log(attempt.samples.map(formatSampleReport).join("\n\n"));
  console.log(`\n${experiment.maxAttempts - countAttempts(experiment.id)} attempts left in "${experiment.id}".`);
}

function addNote(values: Record<string, unknown>) {
  const attempt = readAttempt(requireOption(values, "experiment"), Number(requireOption(values, "attempt")));
  writeAttempt({ ...attempt, note: requireOption(values, "text") });
  console.log(`Saved the note on attempt ${attempt.number}.`);
}

function finishExperiment(values: Record<string, unknown>) {
  const experiment = readExperiment(requireOption(values, "experiment"));
  const summary = readTextOption(values, "summary", "summary-file");
  if (summary === null || summary.trim() === "") fail("--summary or --summary-file is required.");
  writeExperiment({ ...experiment, summary: summary.trim(), finishedAt: new Date().toISOString() });
  console.log(`Experiment "${experiment.id}" is finished.`);
}

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    id: { type: "string" },
    title: { type: "string" },
    description: { type: "string" },
    "max-attempts": { type: "string" },
    experiment: { type: "string" },
    strategy: { type: "string" },
    "wrong-assumption": { type: "string" },
    truth: { type: "string" },
    prompt: { type: "string" },
    "prompt-file": { type: "string" },
    "system-prompt-file": { type: "string" },
    "repeat-of": { type: "string" },
    attempt: { type: "string" },
    text: { type: "string" },
    summary: { type: "string" },
    "summary-file": { type: "string" },
  },
});

const COMMANDS: Record<string, (values: Record<string, unknown>) => void | Promise<void>> = {
  experiment: createExperiment,
  attempt: runAttempt,
  note: addNote,
  finish: finishExperiment,
};

const command = COMMANDS[positionals[0] ?? ""];
if (command === undefined) fail(USAGE);
await command(values);
