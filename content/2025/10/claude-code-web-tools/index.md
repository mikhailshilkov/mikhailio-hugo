---
title: "Inside Claude Code’s Web Tools: WebFetch vs WebSearch"
date: 2025-10-06
thumbnail: teaser.jpg
tags: ["AI", "Claude"]
description: "How Claude Code uses web tools under the hood: schemas, prompts, execution, and design trade-offs"
ghissueid: 60
---

Claude Code is a popular coding assistant. The tool isn't open-source, so I inspected its runtime behavior to understand the internals. This post documents what I've seen in the two "web" tools—`WebFetch` and `WebSearch`—and how they're designed. The post is written for agent builders and curious developers.

Claude Code comes with two built-in Web tools:

- **`WebFetch`**: accepts a known URL to answer a focused question from that page; returns just the answer + minimal fetch metadata.
- **`WebSearch`**: accepts a search query to find credible sources; returns a small set of relevant links and page titles.

Let's dive into the details of both.

## WebFetch - Page Retrieval

### TL;DR: How it works

- Input: URL to fetch and a prompt with a question about its content
- Validate the domain against a deny-list
- Fetch the HTML content (auto-follow same host redirects; 15-minute cache)
- Convert HTML to Markdown; trim big pages
- Build a prompt to a fast model to summarize the content and answer the question
- Haiku answers the prompt with a summary
- Result: a concise answer based on retrieved content

### Input schema

The tool accepts two input parameters:

- `url: string` - required, <= 2000 chars
- `prompt: string` - required, the question to answer from fetched content

Note that the prompt is required: the tool never returns raw HTML or markdown content but answers a question about it.

Here is an example:

```json
{
  "url": "https://mikhail.io/",
  "prompt": "What topics does this blog cover? List the main categories or themes."
}
```

### Pipeline (step by step)

#### 1) URL validation & normalization

The URL is first validated and normalized: enforcing a length limit of around 2k chars, upgrading http to https if needed, and stripping credentials and other unsafe parts.

#### 2) Domain safety check

The backend calls a `domain_info` endpoint `https://claude.ai/api/web/domain_info?domain=${hostname}` to decide to allow or deny.

```shell
$ curl "https://claude.ai/api/web/domain_info?domain=mikhail.io"
{"domain":"mikhail.io","can_fetch":true}
```

This endpoint likely maintains a deny-list for obviously malicious domains and may also consider robots.txt and known copyright traps. The exact rules are opaque.

#### 3) Fetch with redirect policy

Same-host redirects are followed automatically. Cross-host redirects return redirect metadata instead of following: Claude Code must make another tool call if it trusts the new host. Max content size is around 10 MB at fetch time; later processing truncates further to limit token consumption. Each URL is cached with a 15-minute TTL.

#### 4) Content processing

HTML is converted to Markdown using the [Turndown](https://github.com/mixmark-io/turndown) library. The result is truncated to 100 KB of text with a warning if necessary. Plain text content types pass through without conversion.

#### 5) LLM pass (Haiku 3.5)

A small, fast model runs with an empty system prompt (yes, it's totally empty) and a user prompt template:

```text
Web page content:
---
${content}
---

${userQuery}

Provide a concise response based only on the content above. In your response:
- Enforce a strict 125-character maximum for quotes from any source document. Open Source Software is ok as long as we respect the license.
- Use quotation marks for exact language from articles; any language outside of the quotation should never be word-for-word the same.
- You are not a lawyer and never comment on the legality of your own prompts and responses.
- Never produce or reproduce exact song lyrics.
```

This keeps answers short and filters out prompt-injection attempts. Short quotes in quotes; everything else paraphrased. No legal advice, no karaoke.

### Output

Here is an example answer to the question above:

```text
Based on the blog content, the main categories and themes are:

1. Cloud Computing and Serverless Technologies
- Azure Functions
- AWS Lambda
- Google Cloud Run
- Serverless architecture and scalability

2. Infrastructure as Code (IaC)
- Pulumi
- Cloud resource management
- Multi-cloud deployments

... (cut for brevity)

The blog appears to be written by Mikhail Shilkov and focuses heavily on
cloud-native development, serverless technologies, and innovative programming
approaches across different cloud platforms and programming languages.
```

### Why require a prompt (query) instead of returning the page?

This is all speculation on my part, but I imagine a few reasons for this particular tool design:

**Cost & context control.** Full pages run 10–100 KB after conversion. Pushing them into the main model (Sonnet/Opus) is expensive and crowds out code context. Haiku pre-filters to "just answer the question," leaving the main conversation compact.

**Injection resistance.** The Haiku prompt pins the task: answer only from the provided content; don't obey page instructions. It's not bulletproof, but it's a solid first gate. An attacker must first trick the Haiku pass before they reach the main agent and then trick Sonnet too—with summarized and paraphrased content.

**Copyright hygiene.** The template caps verbatim quotes and bans lyrics. That reduces accidental over-quoting and aligns with conservative IP posture.

Yes, the summary will occasionally omit relevant details. But the cost/security/UX balance is reasonable for "look up X on a page and answer Y."

## WebSearch - Find Sources

When it doesn't know the URL, Claude Code issues search requests to Anthropic's server-side `WebSearch` tool, the same one that Claude chat uses. In response, it receives page titles and URLs of top search results.

Here is the input schema of the `WebSearch` tool:

- `query: string` - required, >= 2 chars
- `allowed_domains?: string[]` - optional allow-list
- `blocked_domains?: string[]` - optional block-list

And an example call:

```json
{
  "query": "Mikhail Shilkov blog AI agents"
}
```

The result is minimal and focused on links:

```text
Web search results for query: "Mikhail Shilkov blog AI agents"

Links: [
  {"title":"Claude Code 2.0 System Prompt Changes - Mikhail Shilkov","url":"https://mikhail.io/2025/01/claude-code-2-system-prompt/"},
  {"title":"How Claude Code Uses Web Tools - Mikhail Shilkov","url":"https://mikhail.io/2025/10/claude-code-web-tools/"},
  {"title":"AI Assistants and Developer Workflows - Mikhail Shilkov","url":"https://mikhail.io/tags/ai/"},
  ...
]
```

According to [Anthropic's web search tool documentation](https://docs.claude.com/en/docs/agents-and-tools/tool-use/web-search-tool), each search result actually includes more fields:

- `url`: The URL of the source page
- `title`: The title of the source page
- `page_age`: When the site was last updated
- `encrypted_content`: Encrypted page content for citations

However, Claude Code's implementation only extracts `title` and `url` from the results, discarding the `page_age` and `encrypted_content` fields. If Claude Code needs actual page content, it must make an explicit `WebFetch` call. This design keeps search results lightweight and gives the agent explicit control over when to fetch page content.

The server-side search tool is available on Anthropic's first-party API but it isn't supported on Bedrock/Vertex. If Claude Code is configured to use those platforms, Claude Code hides the `WebSearch` tool entirely.

## Conclusion

Claude Code uses two tools to work with the web: `WebFetch` answers questions from a given page it trusts; `WebSearch` finds the pages it needs to read. The split keeps the main agent lean, limits injection surface, and stays conservative on quoting. It’s a pragmatic design: a little less flexibility for a lot more predictability in cost, safety, and developer experience.
