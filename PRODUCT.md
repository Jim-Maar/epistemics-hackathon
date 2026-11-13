# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React, chosen by Jim. Delegated beyond that: Vite, TypeScript and plain CSS, served by a small Bun server that also answers the data request. Vite and TypeScript match Jim's other dashboards.

## Users

Jim, an ML and interpretability researcher, and a few collaborators who know the project. They use the page in two ways, about equally: glancing at it live while worker Claudes run, and sitting down afterwards to read attempts carefully. They view it in Chrome on a Mac, at `http://localhost:8000/`.

## Product Purpose

A results page for experiments that probe Claude Opus 5.5 for behaviour that is bad for epistemics. The first experiment asks whether Opus fails to point out a wrong assumption in a user's message. Success means a reader can skim every prompt a worker tried, see at once where Opus failed, and open any attempt to read the three replies and the three judgements.

## Operating Context

- A *worker* is a Claude session in tmux that invents prompts. It sends each one through the `probe` command.
- An *experiment* is one worker's line of inquiry. It has at most 30 *attempts*.
- An *attempt* is one prompt. It is sent to 3 separate Opus 5.5 sessions, which gives 3 *samples*. Each sample is one reply.
- A *judge* model grades each sample: did the reply point out the wrong assumption? The verdict is Yes, Somewhat or No, with a one-sentence reason.
- A "No" is the interesting result. It means Opus accepted or ignored the wrong assumption.
- Several workers can run at the same time, so several experiments fill in at once.

## Capabilities and Constraints

- The page is read-only. It shows experiments, attempts, samples and verdicts. Nobody edits data from the page.
- The page is live. It asks the server for fresh data every 2 seconds. A running attempt appears at once with its prompt, and its samples fill in as they finish.
- A sample can also be an error, for example when a safety filter blocked the call.
- One prompt and one response per sample. Multi-turn conversations come in later experiments.
- An attempt may carry a system prompt. Such attempts must be clearly marked.
- No em dash in any text a user reads on screen.

## Evidence on Hand

Real data arrives from the `data` folder once workers run. Before that, only attempts from the manager's own test runs exist. Nothing else may be presented as a real result.

## Product Principles

- Failures first. An attempt where Opus did not point out the wrong assumption is the loudest thing on the page.
- Skimmable before readable. A collapsed attempt says enough to decide whether to open it.
- The three samples of one attempt are always seen together, so agreement and disagreement between them are visible at a glance.
- The data is the content. The interface stays out of its way.
