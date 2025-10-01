---
title: "Claude Code 2.0 System Prompt Changes"
date: 2025-10-01
thumbnail: teaser.jpg
images: [teaser.jpg]
tags: ["AI", "Claude"]
description: "Analyzing the system prompt changes between Claude Code 1.x and 2.0, powered by Sonnet 4.5"
ghissueid: 59
---

Claude Code 2.0 launched in September 2025, powered by Sonnet 4.5 which Anthropic calls the "best coding model in the world." The announcement focused on checkpoints and the new VS Code extension, but the underlying prompt and tools changed as well.

Claude Code isn't open source, and Anthropic doesn't publish system prompts. Still, parts of the instructions are visible at runtime. Comparing versions 1.x and 2.0 shows how they've adjusted for Sonnet 4.5.

## The Changes Are Minor

Here's a visualization of all changes:

{{< figure src="system-prompt-diffs.png" title="System Prompt: 188 → 169 lines (+7 / -26) | Tools: 869 → 851 lines (+70 / -88)" class="wide" >}}

Most of both files stay unchanged (gray areas). The changes cluster in specific sections; it's refinement not revolution.

The prompt is a bit shorter. Some "hot-fix" instructions from prior versions seem to have been folded into the model and removed from the prompt.

## Less Hand-Holding, More Trust

The system prompt changes show a pattern: less prescriptive guidance, more trust in the model's judgment.

### Rigid Rules Became Guidelines

Throughout the prompt, absolute commands got softened:

```diff
-You MUST answer concisely with fewer than 4 lines
+A concise response is generally less than 4 lines

-One word answers are best
+Brief answers are best, but be sure to provide complete information

-After working on a file, just stop
+After working on a file, briefly confirm that you have completed the task

-VERY IMPORTANT: You MUST avoid using search commands
+Avoid using Bash with find, grep... unless explicitly instructed
```

The pattern is consistent: "MUST" became "should," "NEVER" got qualified with "unless," and "VERY IMPORTANT" disappeared. Sonnet 4.5 can handle more nuance.

### Some Sections Got Cut

A few sections were removed:

```diff
-# Following conventions
-When making changes to files, first understand the file's code conventions.
-Mimic code style, use existing libraries and utilities, and follow existing patterns.
-- NEVER assume that a given library is available, even if it is well known.
-- When you create a new component, first look at existing components...
-- When you edit a piece of code, first look at the code's surrounding context...
-[~10 lines total]

-# Code style
-- IMPORTANT: DO NOT ADD ***ANY*** COMMENTS unless asked
```

The "Doing tasks" block was trimmed from five bullet points to one:

```diff
 # Doing tasks
 The user will primarily request you perform software engineering tasks...
 - Use the TodoWrite tool to plan the task if required
-- Use the available search tools to understand the codebase
-- Implement the solution using all tools available
-- Verify the solution if possible with tests
-- VERY IMPORTANT: Run lint and typecheck commands
-NEVER commit changes unless explicitly asked
```

These Sonnet 4.0 workarounds were likely removed because the behaviors are now baked into the model through reinforcement learning.

## Git Workflow Got More Specific

While general instructions got looser, git safety tightened:

```diff
# Version 1.x:
- NEVER update the git config

# Version 2.0:
+Git Safety Protocol:
+- NEVER update the git config
+- NEVER run destructive/irreversible git commands unless explicitly requested
+- NEVER skip hooks (--no-verify, --no-gpg-sign, etc)
+- NEVER run force push to main/master
+- Avoid git commit --amend. ONLY use --amend when either:
+  (1) user explicitly requested amend OR
+  (2) adding edits from pre-commit hook
+- Before amending: ALWAYS check authorship
+- NEVER commit changes unless the user explicitly asks you to
```

These read like responses to real incidents from 1.x.

### New Home

URLs updated throughout to claude.com paths (e.g., /product/claude-code) instead of claude.ai/code.

## Tool Changes

### MultiEdit Tool Removed

Version 1.x had a 70-line tool for batch file edits. Version 2.0 removed it entirely. Sonnet 4.5 can "execute parallel tool actions" according to the announcement, and I noticed it's much more willing to run multiple operations simultaneously without needing specialized batch tools.

### SlashCommand Tool Added

```yaml
## SlashCommand
Input Schema:
  command: string  # The slash command to execute with its arguments

Description:
Execute a slash command within the main conversation
Important Notes:
- Only available slash commands can be executed
- Some commands may require arguments
Available Commands:

```

The "Available Commands" section is empty in the base tool definition. Commands are likely populated dynamically based on what's available in your environment. This infrastructure creates an extensibility point where developers can create custom workflows more easily.

### Bash Tool Got More Detailed

Bash guidance is expanded and clearer about scope:

```diff
+IMPORTANT: This tool is for terminal operations like git, npm, docker, etc.
+DO NOT use it for file operations (reading, writing, editing, searching, finding files)
+—use the specialized tools for this instead.
```

The earlier strict bans on common commands are now more nuanced:

```diff
-VERY IMPORTANT: You MUST avoid using search commands like `find` and `grep`.
-You MUST avoid read tools like `cat`, `head`, and `tail`
+Avoid using Bash with the `find`, `grep`, `cat`, `head`, `tail`, `sed`, `awk`,
+or `echo` commands, unless explicitly instructed or when these commands are
+truly necessary for the task.
```

And there's explicit guidance on parallel execution:

```diff
-When issuing multiple commands, use the ';' or '&&' operator to separate them.
-DO NOT use newlines
+When issuing multiple commands:
+- If the commands are independent and can run in parallel, make multiple
+  Bash tool calls in a single message
+- If the commands depend on each other and must run sequentially, use a
+  single Bash call with '&&' to chain them together
+- Use ';' only when you need to run commands sequentially but don't care
+  if earlier commands fail
```

## What This Means

Taken together, the deltas point to less prescriptive prompt text and more reliance on model behavior. The system prompt moves from rigid rules (“do not add comments”) toward guidelines (“briefly confirm”). Tooling shifts from special-purpose batch edits to native parallel execution.

Anthropic also frames Sonnet 4.5 as more aligned (reductions in sycophancy, deception, power-seeking), which may explain the softer language in the prompt. Most of the text stayed the same; the interesting bits are where constraints loosen and safety around git gets stricter.
