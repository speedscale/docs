---
title: Chat with Your Traffic
description: "Ask questions about recorded traffic and drive replays, blueprints and snapshots in plain language from the assistant built into proxymock web, using Speedscale's managed model or your own OpenAI or Anthropic key."
sidebar_position: 16
---

# Chat with Your Traffic

`proxymock web` has an assistant built in. Ask it what a recording contains, why a request failed or which blueprint would fix a mock miss, and it reads the RRPair files in your workspace to answer. It can also act for you: configure and start a replay, step through a replay debug session, create and apply blueprints, and push or pull cloud snapshots. Anything that sends traffic or changes your files waits for you to approve it.

Chat needs a Speedscale [enterprise account](./initialize.md#enterprise-account) on the machine running `proxymock web`. Without one you can open the assistant, but sending a message shows where to get a pro account.

## Open the assistant

Start `proxymock web`:

```shell
proxymock web
```

On an empty workspace, click **Ask the assistant to record traffic for your service**. The floating **Chat** button in the bottom-right corner is hidden by default. To show it in a workspace that already has traffic, run `localStorage.setItem('pmShowChatButton', '1')` in the browser console and reload the page.

The assistant opens with suggestions such as **Summarize this traffic**, **Explain this request** and **Find similar RRPairs**. Press Enter to send, and Shift+Enter for a new line. While it answers, **Send** turns into **Stop**.

The assistant knows which view you are on and what you have selected, so "explain this request" means the RRPair open in front of you. To point it at something else, type `@` and pick a file or directory from the workspace. Mentioning a directory such as a recording or a replay results run lets it work across every RRPair inside.

The header has **Copy** to copy the conversation, **Clear** to start over, and **Reset** to put the panel back where it started. The conversation lives in the browser tab. It survives switching views but not a page reload, and each tab has its own.

## What it can do

Without asking first, the assistant can:

- List, search and read the RRPairs, runs, blueprints, transforms and dataframes in the workspace.
- Read a replay's status, report and logs.
- Run the analysis and list recommendations, including a dry run of what applying them would change.
- Read your Speedscale cloud data: clusters, workloads, snapshots, reports and their recommendations.
- Open an RRPair, the Blueprints view or the Requests view for you.
- Fill in the Replay form, finish an open replay debug session, or set a variable in it.

These actions show an **Approve** card first, and nothing happens until you click it:

- Start a replay, or start a [replay debug session](./replay-debugger.md), step it, run it to a breakpoint, or resend the last request.
- Create, activate, apply or import a blueprint, overwrite one from the cloud, or sync the workspace's blueprints with Speedscale cloud, which pushes local-only blueprints up.
- Apply recommendations to RRPair files. proxymock backs up the files it changes under `.proxymock/backups/` in the workspace.
- Update or delete a dataframe.
- Delete a run.
- Push the workspace to Speedscale cloud as a snapshot, or pull a cloud snapshot into the workspace, which overwrites it.

While an approval is open, the assistant waits and you cannot send another message. **Cancel** tells it you declined.

## Choose the model

By default the assistant uses Speedscale's managed model. Requests go through your Speedscale login, Speedscale chooses the model, and you need no other key.

To use your own OpenAI or Anthropic account instead, pass the provider, a key and a model id:

```shell
proxymock web --chat-provider anthropic --chat-api-key "$ANTHROPIC_API_KEY" --chat-model <model-id>
```

```shell
proxymock web --chat-provider openai --chat-api-key "$OPENAI_KEY" --chat-model <model-id>
```

`--chat-model` is required, since there is no default model for your own provider. When `--chat-api-key` is left out, proxymock reads `SPEEDSCALE_CHAT_API_KEY`, and for Anthropic then `ANTHROPIC_API_KEY`. An Anthropic key that starts with `sk-ant-oat`, such as one from `claude setup-token`, is sent as an OAuth token. Requests go to the provider's public API; a custom endpoint, such as a local model server, cannot be configured.

## Where your data goes

To answer, the assistant reads RRPairs, including headers and bodies, and sends what it reads to the model, along with a short description of the current view. Tool results are capped at 25 KB each. Nothing is redacted on the way to the model, so if a recording holds secrets or personal data, redact it first with [DLP rules](./local-rules.md#dlp) and chat over the redacted copy.

| | Managed model | Your own provider |
|---|---|---|
| Model requests go to | Speedscale, which passes them to its model provider | Your OpenAI or Anthropic account, directly |
| Conversation stored by Speedscale | Yes | No |
| Key | Your Speedscale login | Yours, sent only to the provider |

With your own provider, the panel shows a **Private** badge. Questions about your cloud data still call the Speedscale API with your login in both modes.

## Turn it off

Start `proxymock web --chat=false` to hide the assistant entirely. The chat flags are then rejected, so a script cannot turn it on by accident.

## Related

- [Initialize proxymock](./initialize.md) to connect an enterprise account
- [Author DLP and filter rules locally](./local-rules.md)
- [Step through a replay](./replay-debugger.md)
- [AI Chat Assistant](/guides/ai-assistant.md), the assistant in the Speedscale dashboard
