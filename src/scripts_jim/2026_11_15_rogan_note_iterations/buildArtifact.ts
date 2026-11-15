/** Fills artifactTemplate.html with the saved runs and writes rogan-note-loop.html, the page that is published as the artifact. */
const SCRIPT_DIR = import.meta.dir;
const RUN_NAMES = ["monologue", "reaction"];

const runs = await Promise.all(RUN_NAMES.map((name) => Bun.file(`${SCRIPT_DIR}/iterations-${name}.json`).json()));
/** A "</" inside the JSON would close the script tag early, so it is escaped. */
const embeddedJson = JSON.stringify(runs).replaceAll("</", "<\\/");
const template = await Bun.file(`${SCRIPT_DIR}/artifactTemplate.html`).text();
await Bun.write(`${SCRIPT_DIR}/rogan-note-loop.html`, template.replace("__DATA__", () => embeddedJson));
