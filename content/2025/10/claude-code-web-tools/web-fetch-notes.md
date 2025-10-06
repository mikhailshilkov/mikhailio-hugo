'll provide you with a clean, readable reconstruction of the WebFetch implementation based on what we've analyzed. This is a functional reconstruction for educational purposes:
// WebFetch Tool Implementation

// Constants
const WEB_FETCH_TOOL_NAME = "WebFetch";
const CACHE_TTL_MS = 900000; // 15 minutes
const MAX_URL_LENGTH = 2000;
const MAX_CONTENT_LENGTH = 10485760; // 10MB
const MAX_PROCESSED_CONTENT = 100000; // 100KB

// Cache for fetched URLs
const urlCache = new Map();

// Domain validation
function isValidUrl(url) {
  if (url.length > MAX_URL_LENGTH) return false;
  
  try {
    const parsed = new URL(url);
    if (parsed.username || parsed.password) return false;
    if (parsed.hostname.split(".").length < 2) return false;
    return true;
  } catch {
    return false;
  }
}

// Check domain safety via Anthropic API
async function checkDomainSafety(hostname) {
  try {
    const response = await axios.get(
      `https://claude.ai/api/web/domain_info?domain=${encodeURIComponent(hostname)}`
    );
    
    if (response.status === 200) {
      return response.data.can_fetch === true 
        ? { status: "allowed" } 
        : { status: "blocked" };
    }
    
    return { 
      status: "check_failed", 
      error: new Error(`Domain check returned status ${response.status}`)
    };
  } catch (error) {
    console.error(error);
    return { status: "check_failed", error };
  }
}

// Check if redirect is to same host
function isSameHostRedirect(originalUrl, redirectUrl) {
  try {
    const original = new URL(originalUrl);
    const redirect = new URL(redirectUrl);
    
    if (redirect.protocol !== original.protocol) return false;
    if (redirect.port !== original.port) return false;
    if (redirect.username || redirect.password) return false;
    
    const normalize = (host) => host.replace(/^www\./, "");
    return normalize(original.hostname) === normalize(redirect.hostname);
  } catch {
    return false;
  }
}

// Fetch with redirect handling
async function fetchWithRedirects(url, signal, checkRedirect) {
  try {
    return await axios.get(url, {
      signal,
      maxRedirects: 0,
      responseType: "arraybuffer",
      maxContentLength: MAX_CONTENT_LENGTH
    });
  } catch (error) {
    if (
      axios.isAxiosError(error) && 
      error.response && 
      [301, 302, 307, 308].includes(error.response.status)
    ) {
      const location = error.response.headers.location;
      if (!location) throw new Error("Redirect missing Location header");
      
      const redirectUrl = new URL(location, url).toString();
      
      if (checkRedirect(url, redirectUrl)) {
        return fetchWithRedirects(redirectUrl, signal, checkRedirect);
      } else {
        return {
          type: "redirect",
          originalUrl: url,
          redirectUrl: redirectUrl,
          statusCode: error.response.status
        };
      }
    }
    throw error;
  }
}

// Main fetch function
async function fetchUrl(url, abortController) {
  if (!isValidUrl(url)) {
    throw new Error("Invalid URL");
  }
  
  // Clean up old cache entries
  const now = Date.now();
  for (const [cachedUrl, entry] of urlCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      urlCache.delete(cachedUrl);
    }
  }
  
  // Check cache
  const cached = urlCache.get(url);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return {
      bytes: cached.bytes,
      code: cached.code,
      codeText: cached.codeText,
      content: cached.content
    };
  }
  
  let parsedUrl;
  let finalUrl = url;
  
  try {
    parsedUrl = new URL(url);
    
    // Upgrade HTTP to HTTPS
    if (parsedUrl.protocol === "http:") {
      parsedUrl.protocol = "https:";
      finalUrl = parsedUrl.toString();
    }
    
    const hostname = parsedUrl.hostname;
    
    // Check domain safety (unless skipWebFetchPreflight is set)
    if (!config.skipWebFetchPreflight) {
      const safetyCheck = await checkDomainSafety(hostname);
      
      switch (safetyCheck.status) {
        case "allowed":
          break;
        case "blocked":
          throw new DomainBlockedError(hostname);
        case "check_failed":
          throw new DomainCheckFailedError(hostname);
      }
    }
  } catch (error) {
    console.error(error);
    if (error instanceof DomainBlockedError || error instanceof DomainCheckFailedError) {
      throw error;
    }
  }
  
  // Perform actual fetch
  const response = await fetchWithRedirects(
    finalUrl, 
    abortController.signal, 
    isSameHostRedirect
  );
  
  // Handle cross-host redirect
  if (response.type === "redirect") {
    return response;
  }
  
  // Process response
  const textContent = Buffer.from(response.data).toString("utf-8");
  const contentType = response.headers["content-type"] ?? "";
  const bytes = Buffer.byteLength(textContent);
  
  let processedContent;
  
  // Convert HTML to markdown
  if (contentType.includes("text/html")) {
    const TurndownService = require("turndown");
    const turndown = new TurndownService();
    processedContent = turndown.turndown(textContent);
  } else {
    processedContent = textContent;
  }
  
  // Truncate if too large
  if (processedContent.length > MAX_PROCESSED_CONTENT) {
    processedContent = processedContent.substring(0, MAX_PROCESSED_CONTENT) + 
      "...[content truncated]";
  }
  
  // Cache result
  urlCache.set(url, {
    bytes,
    code: response.status,
    codeText: response.statusText,
    content: processedContent,
    timestamp: now
  });
  
  return {
    code: response.status,
    codeText: response.statusText,
    content: processedContent,
    bytes
  };
}

// Create prompt template
function createWebFetchPrompt(content, userQuery) {
  return `
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
`;
}

// Apply user query to fetched content using Haiku
async function applyPromptToContent(userQuery, content, signal) {
  const prompt = createWebFetchPrompt(content, userQuery);
  
  const response = await callAnthropicAPI({
    systemPrompt: [],
    userPrompt: prompt,
    signal: signal,
    promptCategory: "web_fetch_apply",
    model: "claude-3-5-haiku-20241022" // Small, fast model
  });
  
  if (signal.aborted) {
    throw new Error("Aborted");
  }
  
  const messageContent = response.message.content;
  
  if (messageContent.length > 0) {
    const firstBlock = messageContent[0];
    if ("text" in firstBlock) {
      return firstBlock.text;
    }
  }
  
  return "No response from model";
}

// Main WebFetch tool implementation
const WebFetchTool = {
  name: "WebFetch",
  
  inputSchema: {
    type: "object",
    properties: {
      url: {
        type: "string",
        format: "uri",
        description: "The URL to fetch content from"
      },
      prompt: {
        type: "string",
        description: "The prompt to run on the fetched content"
      }
    },
    required: ["url", "prompt"]
  },
  
  outputSchema: {
    type: "object",
    properties: {
      bytes: { type: "number", description: "Size of fetched content in bytes" },
      code: { type: "number", description: "HTTP response code" },
      codeText: { type: "string", description: "HTTP response code text" },
      result: { type: "string", description: "Processed result" },
      durationMs: { type: "number", description: "Time taken" },
      url: { type: "string", description: "The URL that was fetched" }
    }
  },
  
  async *call({ url, prompt }, { abortController }) {
    const startTime = Date.now();
    
    // Fetch the URL
    const fetchResult = await fetchUrl(url, abortController);
    
    // Handle cross-host redirect
    if (fetchResult.type === "redirect") {
      const statusName = 
        fetchResult.statusCode === 301 ? "Moved Permanently" :
        fetchResult.statusCode === 308 ? "Permanent Redirect" :
        fetchResult.statusCode === 307 ? "Temporary Redirect" : "Found";
      
      const redirectMessage = 
        `REDIRECT DETECTED: The URL redirects to a different host.

Original URL: ${fetchResult.originalUrl}
Redirect URL: ${fetchResult.redirectUrl}
Status: ${fetchResult.statusCode} ${statusName}

To complete your request, I need to fetch content from the redirected URL. Please use WebFetch again with these parameters:
- url: "${fetchResult.redirectUrl}"
- prompt: "${prompt}"`;
      
      yield {
        type: "result",
        data: {
          bytes: Buffer.byteLength(redirectMessage),
          code: fetchResult.statusCode,
          codeText: statusName,
          result: redirectMessage,
          durationMs: Date.now() - startTime,
          url: url
        }
      };
      return;
    }
    
    const { content, bytes, code, codeText } = fetchResult;
    
    // Apply user query to content using Haiku
    const processedResult = await applyPromptToContent(
      prompt, 
      content, 
      abortController.signal
    );
    
    yield {
      type: "result",
      data: {
        bytes,
        code,
        codeText,
        result: processedResult,
        durationMs: Date.now() - startTime,
        url
      }
    };
  }
};

// Custom error classes
class DomainBlockedError extends Error {
  constructor(domain) {
    super(`Claude Code is unable to fetch from ${domain}`);
    this.name = "DomainBlockedError";
  }
}

class DomainCheckFailedError extends Error {
  constructor(domain) {
    super(
      `Unable to verify if domain ${domain} is safe to fetch. ` +
      `This may be due to network restrictions or enterprise security policies blocking claude.ai.`
    );
    this.name = "DomainCheckFailedError";
  }
}

// Example usage:
async function exampleUsage() {
  const abortController = new AbortController();
  
  const generator = WebFetchTool.call(
    {
      url: "https://example.com",
      prompt: "What is this page about? Summarize in 2-3 sentences."
    },
    { abortController }
  );
  
  for await (const event of generator) {
    if (event.type === "result") {
      console.log("Result:", event.data.result);
      console.log("HTTP Status:", event.data.code, event.data.codeText);
      console.log("Size:", event.data.bytes, "bytes");
      console.log("Duration:", event.data.durationMs, "ms");
    }
  }
}
Key points for reproduction:
Model: Use claude-3-5-haiku-20241022 (or latest Haiku)
System prompt: Leave empty []
User prompt: Use the template format shown in createWebFetchPrompt
Domain check: Optional - calls https://claude.ai/api/web/domain_info?domain=<hostname>
HTML conversion: Uses Turndown library to convert HTML → Markdown
Caching: 15-minute TTL on fetched URLs
Content limits: Max 100KB processed content, truncated with warning
The implementation is relatively straightforward - fetch URL, convert to markdown if HTML, send to Haiku with the user's query embedded in a specific prompt template.