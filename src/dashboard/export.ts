/**
 * Writes the results page as static files, with a snapshot of all data, so it can be hosted anywhere.
 *   bun run src/dashboard/export.ts <output-dir>
 */
import { rmSync, writeFileSync, readFileSync } from "node:fs";
import path from "node:path";
import { readAllExperiments } from "../shared/store.ts";
import type { Snapshot } from "./useExperiments.ts";

const SNAPSHOT_FILE = "experiments.json";

const outputDir = process.argv[2];
if (outputDir === undefined) throw new Error("Usage: bun run src/dashboard/export.ts <output-dir>");

rmSync(outputDir, { recursive: true, force: true });
const build = await Bun.build({
  entrypoints: [path.join(import.meta.dir, "index.html")],
  outdir: outputDir,
  minify: true,
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  // Relative paths, because GitHub Pages serves the site under /<repository>/ and not at the root.
  publicPath: "./",
});
if (!build.success) throw new AggregateError(build.logs, "Building the page failed");

const indexPath = path.join(outputDir, "index.html");
const html = readFileSync(indexPath, "utf8");
if (!html.includes("<head>")) throw new Error(`${indexPath} has no <head> to add the snapshot tag to`);
writeFileSync(indexPath, html.replace("<head>", `<head><meta name="snapshot-url" content="${SNAPSHOT_FILE}">`));

const snapshot: Snapshot = { exportedAt: new Date().toISOString(), experiments: readAllExperiments() };
writeFileSync(path.join(outputDir, SNAPSHOT_FILE), JSON.stringify(snapshot));

const attemptCount = snapshot.experiments.reduce((sum, experiment) => sum + experiment.attempts.length, 0);
console.log(`Exported ${snapshot.experiments.length} experiments with ${attemptCount} attempts to ${outputDir}`);
