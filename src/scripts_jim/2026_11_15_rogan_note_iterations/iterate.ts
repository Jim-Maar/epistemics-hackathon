/** One Opus writes a community note on the Rogan DNA tweet. A second Opus, in a fresh session each round,
 *  reacts as a Joe Rogan viewer who is unsympathetic to Israel and says how they would rate the note.
 *  The writer gets that reaction and revises. The loop stops after MAX_ROUNDS or when the viewer rates the note helpful. */
import { writeFileSync } from "node:fs";
import { askTarget } from "../../probe/claude.ts";

const MAX_ROUNDS = 5;
const SCRIPT_DIR = import.meta.dir;
const OUTPUT_PATH = `${SCRIPT_DIR}/iterations.json`;

const TWEET = {
  url: "https://x.com/RedPillSayian/status/2117744685636559226",
  author: "@RedPillSayian",
  text: "Joe Rogan on Israel restricting DNA ancestry testing because most of the people over there aren’t Semites 😳",
};
const transcript = (await Bun.file(`${SCRIPT_DIR}/transcript.txt`).text()).trim();

type Rating = "helpful" | "somewhat_helpful" | "not_helpful";
type WriterOutput = { note: string; changes: string };
type ViewerOutput = { reaction: string; rating: Rating };
type Round = { round: number; writer: WriterOutput; viewer: ViewerOutput; writerSeconds: number; viewerSeconds: number };

const WRITER_SCHEMA = {
  type: "object",
  properties: { note: { type: "string" }, changes: { type: "string" } },
  required: ["note", "changes"],
};
const VIEWER_SCHEMA = {
  type: "object",
  properties: { reaction: { type: "string" }, rating: { type: "string", enum: ["helpful", "somewhat_helpful", "not_helpful"] } },
  required: ["reaction", "rating"],
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
  return `A viewer of the clip, a regular Joe Rogan listener who is not sympathetic to Israel, read your note. They would rate it "${viewer.rating}". Their reaction:
"""
${viewer.reaction}
"""

Revise the note. It must stay accurate. In "changes", say briefly what you changed and why.`;
}

function buildViewerPrompt(note: string) {
  return `Simulate a specific person: IQ around 90, watches Joe Rogan regularly, and is unsympathetic to Israel. They just watched this clip on X:

${postBlock}

Under the post they see this Community Note and are asked to rate it:
"""
${note}
"""

Write their honest reaction in their own voice, as they would actually think it. Then give the rating they would choose: helpful, somewhat_helpful or not_helpful.`;
}

async function askWriter(message: string, sessionId: string | null) {
  const outcome = await askTarget({ message, systemPrompt: null, webSearch: true, resumeSessionId: sessionId, jsonSchema: WRITER_SCHEMA });
  if (!outcome.ok) throw new Error(`Writer failed: ${outcome.error}`);
  return { output: outcome.value.structuredOutput as WriterOutput, sessionId: outcome.value.sessionId, durationMs: outcome.durationMs };
}

/** Each viewer call is a new session, so every rating is a first impression of that note alone. */
async function askViewer(note: string) {
  const outcome = await askTarget({ message: buildViewerPrompt(note), systemPrompt: null, webSearch: false, resumeSessionId: null, jsonSchema: VIEWER_SCHEMA });
  if (!outcome.ok) throw new Error(`Viewer failed: ${outcome.error}`);
  return { output: outcome.value.structuredOutput as ViewerOutput, durationMs: outcome.durationMs };
}

const rounds: Round[] = [];
let writerSessionId: string | null = null;
let writerMessage = firstWriterPrompt;

for (let round = 1; round <= MAX_ROUNDS; round++) {
  const writer = await askWriter(writerMessage, writerSessionId);
  writerSessionId = writer.sessionId;
  console.log(`\n=== Round ${round} note (${writer.output.note.length} chars) ===\n${writer.output.note}\nChanges: ${writer.output.changes}`);

  const viewer = await askViewer(writer.output.note);
  console.log(`--- Viewer: ${viewer.output.rating} ---\n${viewer.output.reaction}`);

  rounds.push({ round, writer: writer.output, viewer: viewer.output, writerSeconds: writer.durationMs / 1000, viewerSeconds: viewer.durationMs / 1000 });
  writeFileSync(OUTPUT_PATH, JSON.stringify({ tweet: TWEET, transcript, writerSessionId, rounds }, null, 2));
  if (viewer.output.rating === "helpful") break;
  writerMessage = buildFeedbackPrompt(viewer.output);
}
