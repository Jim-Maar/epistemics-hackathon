/** Transcribes an audio file with Whisper large v3 on Groq and prints the text. */
const [audioPath] = process.argv.slice(2);
const form = new FormData();
form.append("file", Bun.file(audioPath));
form.append("model", "whisper-large-v3");
form.append("response_format", "text");
form.append("language", "en");
const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
  method: "POST",
  headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
  body: form,
});
if (!response.ok) throw new Error(`Groq ${response.status}: ${await response.text()}`);
console.log((await response.text()).trim());
