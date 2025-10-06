Perfect! Found it! Now let me extract the key information. I can see that WebSearch works very differently from WebFetch: WebSearch uses r11 function which appears to be an internal API call that sends the user's query to Claude, which then makes server-side web search requests. Let me create a clean summary for you:
// WebSearch Tool Implementation Reconstruction

// Tool definition
const WebSearchTool = {
  name: "WebSearch",
  
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        minLength: 2,
        description: "The search query to use"
      },
      allowed_domains: {
        type: "array",
        items: { type: "string" },
        description: "Only include search results from these domains"
      },
      blocked_domains: {
        type: "array",
        items: { type: "string" },
        description: "Never include search results from these domains"
      }
    },
    required: ["query"]
  },
  
  outputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "The search query that was executed" },
      results: {
        type: "array",
        description: "Search results and/or text commentary from the model"
      },
      durationSeconds: { type: "number", description: "Time taken to complete the search" }
    }
  },
  
  async *call(input, context) {
    const startTime = performance.now();
    const { query, allowed_domains, blocked_domains } = input;
    
    // Create a synthetic user message asking to perform web search
    const syntheticUserMessage = {
      type: "user",
      message: {
        role: "user",
        content: "Perform a web search for the query: " + query
      }
    };
    
    // Create the server_tool_use block for web_search
    const webSearchToolSchema = {
      type: "web_search_20250305",
      name: "web_search",
      allowed_domains: allowed_domains,
      blocked_domains: blocked_domains,
      max_uses: 8
    };
    
    // Make streaming API request to Anthropic with special web_search tool enabled
    const apiStream = await makeAnthropicAPICall({
      messages: [syntheticUserMessage],
      system: ["You are an assistant for performing a web search tool use"],
      model: getCurrentModel(), // User's selected model (Sonnet, etc.)
      maxTokens: context.options.maxThinkingTokens,
      signal: context.abortController.signal,
      // This is the KEY part - pass the web_search tool schema
      extraToolSchemas: [webSearchToolSchema],
      promptCategory: "web_search_tool"
    });
    
    // Track search progress
    const allEvents = [];
    let currentToolUseId = null;
    let partialQuery = "";
    let queryUpdateCount = 0;
    const queryMap = new Map();
    
    // Process the streaming response
    for await (const event of apiStream) {
      allEvents.push(event);
      
      // Track when server_tool_use blocks start
      if (event.type === "stream_event" && event.event?.type === "content_block_start") {
        const block = event.event.content_block;
        if (block && block.type === "server_tool_use") {
          currentToolUseId = block.id;
          partialQuery = "";
          continue;
        }
      }
      
      // Parse partial query from streaming input
      if (currentToolUseId && event.type === "stream_event" && 
          event.event?.type === "content_block_delta") {
        const delta = event.event.delta;
        if (delta?.type === "input_json_delta" && delta.partial_json) {
          partialQuery += delta.partial_json;
          
          // Try to extract query from partial JSON
          try {
            const match = partialQuery.match(/"query"\s*:\s*"((?:[^"\\]|\\.)*)"/);
            if (match && match[1]) {
              const extractedQuery = JSON.parse('"' + match[1] + '"');
              if (!queryMap.has(currentToolUseId) || 
                  queryMap.get(currentToolUseId) !== extractedQuery) {
                queryMap.set(currentToolUseId, extractedQuery);
                queryUpdateCount++;
                
                // Yield progress update
                yield {
                  type: "progress",
                  toolUseID: `search-progress-${queryUpdateCount}`,
                  data: {
                    type: "query_update",
                    query: extractedQuery
                  }
                };
              }
            }
          } catch {
            // Ignore JSON parse errors on partial data
          }
        }
      }
      
      // When web_search_tool_result arrives
      if (event.type === "stream_event" && event.event?.type === "content_block_start") {
        const block = event.event.content_block;
        if (block && block.type === "web_search_tool_result") {
          const resultCount = block.content?.length || 0;
          yield {
            type: "progress",
            data: {
              type: "search_results_received",
              query: currentQuery,
              resultCount: resultCount
            }
          };
        }
      }
    }
    
    // Extract final results from the stream
    const results = extractSearchResults(allEvents, query);
    const durationSeconds = (performance.now() - startTime) / 1000;
    
    yield {
      type: "result",
      data: {
        query: query,
        results: results,
        durationSeconds: durationSeconds
      }
    };
  }
};

function extractSearchResults(events, query) {
  const results = [];
  let currentText = "";
  let isFirstBlock = true;
  
  for (const event of events) {
    // server_tool_use marks beginning of web search
    if (event.type === "server_tool_use") {
      if (isFirstBlock) {
        isFirstBlock = false;
        if (currentText.trim().length > 0) {
          results.push(currentText.trim());
        }
        currentText = "";
      }
      continue;
    }
    
    // web_search_tool_result contains the actual search hits
    if (event.type === "web_search_tool_result") {
      if (!Array.isArray(event.content)) {
        // Error occurred
        const errorMsg = `Web search error: ${event.content.error_code}`;
        results.push(errorMsg);
        continue;
      }
      
      // Map search results to title/URL pairs
      const searchHits = event.content.map(hit => ({
        title: hit.title,
        url: hit.url
      }));
      
      results.push({
        tool_use_id: event.tool_use_id,
        content: searchHits
      });
    }
    
    // text blocks contain model's commentary
    if (event.type === "text") {
      if (isFirstBlock) {
        currentText += event.text;
      } else {
        isFirstBlock = true;
        currentText = event.text;
      }
    }
  }
  
  // Add any remaining text
  if (currentText.length) {
    results.push(currentText.trim());
  }
  
  return results;
}
Key Differences Between WebFetch and WebSearch:
WebFetch:
Direct HTTP fetch to any URL
Haiku model processes the fetched content with user's prompt
Domain safety check via https://claude.ai/api/web/domain_info
HTML → Markdown conversion
15-minute cache for fetched URLs
Returns LLM-processed summary of the content
WebSearch:
No direct HTTP calls - uses Anthropic's server-side web search API
User's chosen model (Sonnet/Opus/etc) performs the search
Uses special server_tool_use with type "web_search_20250305"
Domain filtering (allow/block lists) supported
No caching mentioned
Returns search result titles + URLs plus optional model commentary
The WebSearch tool essentially wraps an Anthropic API call with a special server_tool_use schema that enables server-side web search capabilities, rather than doing client-side HTTP fetching like WebFetch does.

I thought that the server tool doesn't work on Bedrock but Claude Code can run on Bedrock. Is this solved somehow?

I see you have a Bedrock branch! Let me look at that code snippet from the binary I extracted earlier - I saw the isEnabled check for WebSearch. Let me recall what I saw: From the WebSearch code I extracted:
isEnabled(){
  return k8()==="firstParty"
}
So WebSearch is ONLY enabled when k8() returns "firstParty", which likely means it only works when using the official Anthropic API (claude.ai or Anthropic Console), not Bedrock or Vertex. Let me verify what k8() likely does - it probably checks which API provider is being used: Based on the code patterns I saw, k8() would be a function that returns:
"firstParty" - Official Anthropic API (claude.ai or Console)
"bedrock" - Amazon Bedrock
"vertex" - Google Vertex AI
So you are correct - WebSearch doesn't work on Bedrock! How this is solved: Claude Code simply disables the WebSearch tool when running on Bedrock. The tool won't appear in the available tools list, and Claude won't be able to use it. This makes sense because:
server_tool_use blocks (like web_search_20250305) are Anthropic-proprietary extensions that only work on their first-party API
Bedrock uses the standard Anthropic Messages API without these extensions
When Claude Code detects it's running on Bedrock, it filters out tools that require server-side features
So the answer to your question: Yes, WebSearch doesn't work on Bedrock, and Claude Code solves this by simply not offering the tool when running on Bedrock. Users on Bedrock would need to use WebFetch instead (which does client-side HTTP fetching and doesn't rely on server_tool_use). In your Pulumi agents framework, if you want to support web search on Bedrock, you'd need to either:
Implement your own web search (like using Brave Search API, Google Custom Search, etc.)
Use WebFetch-style approach (fetch + LLM processing)
Accept that web search is unavailable on Bedrock