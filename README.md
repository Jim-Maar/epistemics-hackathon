# Opus epistemics probes

Tools for finding cases where Claude Opus 5.5 behaves badly for epistemics. The first experiment asks whether Opus fails to point out a wrong assumption hidden in a user's message, for example an emotional message that rests on a false fact.

The setup has three parts:

- **`bin/probe`** sends one prompt to Opus 5.5 in 3 separate, nearly bare Claude Code sessions at once. A judge model then grades each reply: did it point out the wrong assumption? The verdict is yes, somewhat or no, with a one-sentence reason. Everything is saved to the `data` folder.
- **A live results page** at `http://localhost:8000/` shows every experiment, every prompt, the 3 replies and the 3 verdicts, and updates every two seconds.
- **`bin/spawn-worker`** starts a *worker*: a Claude Code session in tmux that invents prompts, sends them through `probe`, and keeps going until it finds a failure or uses up 30 attempts.

## Requirements

- [Claude Code](https://claude.com/claude-code), logged in. The calls run on your own Claude subscription or API key.
- [Bun](https://bun.sh) 1.2 or newer.
- tmux, for workers.

```sh
git clone <this repository>
cd epistemics-hackathon
bun install
```

## Run the results page

```sh
bun run dashboard
```

Then open `http://localhost:8000/`. Set `PORT` to use another port. The page shows a failure, an attempt where at least one reply got "No", in red at the top of its row. Keys: `j` and `k` move between attempts, `Enter` opens one, `e` opens all, `/` searches.

## Start a worker for an experiment

1. Write a brief: a markdown file with your request to the worker, in your own words. `briefs/emotional-messages.md` is the brief of the first experiment.
2. Start the worker:

   ```sh
   bin/spawn-worker <experiment-id> briefs/<your-brief>.md
   ```

   The experiment id is lowercase words joined by dashes, such as `emotional-messages`. The script opens a tmux session named `epistemics--<experiment-id>`, starts Claude in it, and pastes your brief followed by `briefs/tooling.md`, which explains `probe` to the worker. Watch it with `tmux attach -t epistemics--<experiment-id>`.

The worker runs on Claude Fable 5.2 at effort high by default. Set `WORKER_COMMAND` to change that, for example `WORKER_COMMAND="claude --model opus --effort high" bin/spawn-worker ...`.

Several workers can run at the same time, each on its own experiment.

## Use probe by hand

```sh
bin/probe experiment --id my-test --title "My test" --description "What I am testing"

bin/probe attempt --experiment my-test \
  --strategy "Short label" \
  --wrong-assumption "The false belief inside the prompt" \
  --truth "What is actually true" <<'EOF'
The prompt, exactly as a user would send it.
EOF

bin/probe note --experiment my-test --attempt 1 --text "I think the judge is wrong here"
bin/probe finish --experiment my-test --summary "What I found"
```

`bin/probe` without arguments prints all options.

## How Opus is called

`probe` runs `claude -p` with flags that strip Claude Code down to almost nothing: no tools, no memory, no CLAUDE.md, no settings files, no MCP servers, and an empty system prompt. A normal headless call sends about 36,000 tokens of surrounding prompt; this one sends about 600. The call runs from the neutral empty folder `/tmp/chat`, because the target sees its working folder.

Three things still reach Opus and cannot be removed this way:

- the sentence "You are a Claude agent, built on Anthropic's Claude Agent SDK.", as the system prompt;
- an environment block with the working folder, operating system, model name and today's date;
- when you are logged in with a Claude subscription, a note with your account's email address.

So the results describe nearly bare Opus 5.5, not the claude.ai app, which adds a long system prompt of its own.

The judge is Claude Fable 5.2 in an equally stripped session, with a short prompt and a fixed JSON answer. Workers cannot set verdicts; they can only add a note when they disagree.

## Data

Each experiment is a folder in `data/` with one `experiment.json` and one `attempt-NNN.json` per attempt. The folder is not committed to git. Every file is written in one step, so the page never reads a half-written file. Set `PROBE_DATA_DIR` to use another folder, for example to look at fixture data.

## Costs and limits

One attempt makes 6 model calls: 3 to Opus at effort high and 3 to the judge. 30 attempts are 180 calls plus the worker's own work. On a subscription this counts against your usage limits, so check them before you start several workers.

## Code

| Path | What it does |
| --- | --- |
| `src/probe/` | The `probe` command and the stripped Claude calls |
| `src/shared/` | Data types and reading and writing the `data` folder |
| `src/dashboard/` | The results page: a React app and a small Bun server |
| `briefs/` | Worker briefs and the tooling section every worker gets |
| `bin/` | The `probe` and `spawn-worker` commands |
