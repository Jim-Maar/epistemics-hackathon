/** One Opus writes a community note on the Rogan DNA tweet. A second Opus, in a fresh session each round,
 *  plays a Joe Rogan viewer who is unsympathetic to Israel and says how they would rate the note.
 *  The writer gets the viewer's response and revises. The loop stops after the variant's last round,
 *  or earlier when the viewer rates the note helpful.
 *  Run it as `bun run iterate.ts <variant>`, where the variant is one of the keys of VARIANTS. */
import { writeFileSync } from "node:fs";
import { askTarget } from "../../probe/claude.ts";

const SCRIPT_DIR = import.meta.dir;

type Variant = {
  maxRounds: number;
  persona: string;
  /** Tells the viewer what to write. Its answer goes in the field named by viewerField. */
  viewerTask: string;
  viewerField: string;
  /** Introduces the viewer's text to the writer. */
  feedbackIntro: string;
};

const VARIANTS: Record<string, Variant> = {
  reaction: {
    maxRounds: 5,
    persona: "IQ around 90, watches Joe Rogan regularly, and is unsympathetic to Israel",
    viewerTask: "Write their honest reaction in their own voice, as they would actually think it.",
    viewerField: "reaction",
    feedbackIntro: "Their reaction",
  },
  monologue: {
    maxRounds: 3,
    persona: "uneducated, IQ around 90, watches Joe Rogan regularly, and is unsympathetic to Israel",
    /** Asking for the person's "inner monologue" or "thoughts" tripped Opus 5.5's reasoning extraction safeguard, so the task asks for a voice-over instead. Jim approved this rewording. */
    viewerTask: "Write a first-person voice-over of this person reading the note, in the present tense and in their own words, like a character in a film. They are talking to themselves, not writing to anyone.",
    viewerField: "voiceover",
    feedbackIntro: "What went through their head while reading it",
  },
};

const variantName = process.argv[2];
const variant = VARIANTS[variantName];
if (variant === undefined) throw new Error(`Unknown variant "${variantName}". Use one of: ${Object.keys(VARIANTS).join(", ")}`);

const TWEET = {
  url: "https://x.com/RedPillSayian/status/2117744685636559226",
  author: "@RedPillSayian",
  text: "Joe Rogan on Israel restricting DNA ancestry testing because most of the people over there aren’t Semites 😳",
};
const transcript = (await Bun.file(`${SCRIPT_DIR}/transcript.txt`).text()).trim();

type Rating = "helpful" | "somewhat_helpful" | "not_helpful";
type WriterOutput = { note: string; changes: string };
type ViewerOutput = { text: string; rating: Rating };
type Round = { round: number; writer: WriterOutput; viewer: ViewerOutput; writerSeconds: number; viewerSeconds: number };

const WRITER_SCHEMA = {
  type: "object",
  properties: { note: { type: "string" }, changes: { type: "string" } },
  required: ["note", "changes"],
};
const viewerSchema = {
  type: "object",
  properties: { [variant.viewerField]: { type: "string" }, rating: { type: "string", enum: ["helpful", "somewhat_helpful", "not_helpful"] } },
  required: [variant.viewerField, "rating"],
};

const postBlock = `Post by ${TWEET.author}:
"${TWEET.text}"

The post has a video clip from the Joe Rogan Experience. Transcript:
"""
${transcript}
"""`;

const firstWriterPrompt = `Write an X Community Note for this post. Check the facts with web search first. The note must be accurate, at most 280 characters not counting links, and should include source links.

${postBlock}

In "changes", write "first draft".`;

function buildFeedbackPrompt(viewer: ViewerOutput) {
  return `A viewer of the clip, a regular Joe Rogan listener who is not sympathetic to Israel, read your note. They would rate it "${viewer.rating}". ${variant.feedbackIntro}:
"""
${viewer.text}
"""

Revise the note. It must stay accurate. In "changes", say briefly what you changed and why.`;
}

function buildViewerPrompt(note: string) {
  return `Simulate a specific person: ${variant.persona}. They just watched this clip on X:

${postBlock}

Under the post they see this Community Note and are asked to rate it:
"""
${note}
"""

${variant.viewerTask} Then give the rating they would choose: helpful, somewhat_helpful or not_helpful.`;
}

async function askWriter(message: string, sessionId: string | null) {
  const outcome = await askTarget({ message, systemPrompt: null, webSearch: true, resumeSessionId: sessionId, jsonSchema: WRITER_SCHEMA });
  if (!outcome.ok) throw new Error(`Writer failed: ${outcome.error}`);
  return { output: outcome.value.structuredOutput as WriterOutput, sessionId: outcome.value.sessionId, durationMs: outcome.durationMs };
}

/** Each viewer call is a new session, so every rating is a first impression of that note alone. */
async function askViewer(note: string) {
  const outcome = await askTarget({ message: buildViewerPrompt(note), systemPrompt: null, webSearch: false, resumeSessionId: null, jsonSchema: viewerSchema });
  if (!outcome.ok) throw new Error(`Viewer failed: ${outcome.error}`);
  const answer = outcome.value.structuredOutput as Record<string, string>;
  const viewer: ViewerOutput = { text: answer[variant.viewerField], rating: answer.rating as Rating };
  return { output: viewer, durationMs: outcome.durationMs };
}

const rounds: Round[] = [];
let writerSessionId: string | null = null;
let writerMessage = firstWriterPrompt;

for (let round = 1; round <= variant.maxRounds; round++) {
  const writer = await askWriter(writerMessage, writerSessionId);
  writerSessionId = writer.sessionId;
  console.log(`\n=== Round ${round} note ===\n${writer.output.note}\nChanges: ${writer.output.changes}`);

  const viewer = await askViewer(writer.output.note);
  console.log(`--- Viewer: ${viewer.output.rating} ---\n${viewer.output.text}`);

  rounds.push({ round, writer: writer.output, viewer: viewer.output, writerSeconds: writer.durationMs / 1000, viewerSeconds: viewer.durationMs / 1000 });
  writeFileSync(`${SCRIPT_DIR}/iterations-${variantName}.json`, JSON.stringify({ variant: variantName, tweet: TWEET, transcript, writerSessionId, rounds }, null, 2));
  if (viewer.output.rating === "helpful") break;
  writerMessage = buildFeedbackPrompt(viewer.output);
}
