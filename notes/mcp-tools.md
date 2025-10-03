# MCP (Model Context Protocol) - Complete Guide

## What is MCP?

**MCP (Model Context Protocol)** is an open-source standard for connecting AI applications to external tools and data sources.

Think of MCP as **USB-C for AI**: just like USB-C provides a standard way to connect devices, MCP provides a standard way to connect AI to tools.

## The Key Misconception

### What People Think âŒ
"MCP is uploading images/PDFs to ChatGPT for analysis"

**This is WRONG!** That's multimodal input, not MCP.

### What MCP Actually Is âœ…
MCP enables AI to **connect to tool servers** and **execute actions** on external systems.

**Example:**
```
User: "What are Q4 sales?"
AI â†’ Connects to PostgreSQL MCP Server
AI â†’ Calls query tool
MCP Server â†’ Executes: SELECT SUM(sales) FROM orders WHERE quarter=4
AI â†’ "Your Q4 sales were $500K"
```

## MCP vs File Upload

| File Upload | MCP |
|-------------|-----|
| Upload spreadsheet to AI | AI queries live database |
| AI analyzes static file | AI executes dynamic queries |
| One-way (you â†’ AI) | Two-way (AI â†” external systems) |
| Built into model | Separate protocol |

## How MCP Works

### Architecture
```
Your AI App (Next.js)
        â†“
   MCP Client
        â†“
   MCP Server (GitHub, Database, etc.)
        â†“
   Tools (get_repo, query_db, etc.)
```

### The Flow
1. **Connect** - Initialize MCP client to server
2. **Discover** - Get available tools from server
3. **Execute** - AI calls tools when needed  
4. **Close** - Clean up connection

## Our GitHub MCP Demo

### What We Built

A demo showing AI interacting with GitHub repos using MCP-style tools.

### Files Created
- `app/mcp-demo/page.tsx` - UI with repo input
- `app/api/mcp-demo/route.ts` - API with GitHub tools
- `.env.local` - GitHub token

### How It Works

**Frontend (page.tsx):**
```typescript
const handleSubmit = async () => {
  const response = await fetch('/api/mcp-demo', {
    method: 'POST',
    body: JSON.stringify({ repo: 'vercel/ai' }),
  });
  const data = await response.json();
  setResult(data.text); // Display AI response
};
```

**Backend (route.ts):**
```typescript
export async function POST(req: Request) {
  const { repo } = await req.json();
  
  // GitHub tool (like MCP would provide)
  const githubTools = {
    get_repository: tool({
      description: 'Get repository information from GitHub',
      parameters: z.object({
        owner: z.string(),
        repo: z.string(),
      }),
      execute: async ({ owner, repo }) => {
        const response = await fetch(
          `https://api.github.com/repos/${owner}/${repo}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
            },
          }
        );
        return await response.json();
      },
    }),
  };

  const [owner, repoName] = repo.split('/');

  const result = await generateText({
    model: google('gemini-2.5-flash'),
    tools: githubTools,
    stopWhen: ({ stepNumber }) => stepNumber >= 3,
    prompt: `Use get_repository to fetch info about ${owner}/${repoName}`,
  });

  return Response.json({ text: result.text });
}
```

## Real vs Simulated MCP

### Our Demo: Simulated
We created a tool that calls GitHub API directly.

**Why:**
- Easier to understand
- No server setup needed
- Shows MCP concept
- Works immediately

### Real MCP
Connect to actual MCP servers running separately.

**Example:**
```typescript
const mcpClient = await experimental_createMCPClient({
  transport: new StdioClientTransport({
    command: 'github-mcp-server',
  }),
});

const tools = await mcpClient.tools(); // Gets 50+ GitHub tools!
```

### Comparison

| Aspect | Simulated (Our Demo) | Real MCP |
|--------|---------------------|----------|
| Tools | 1 tool | 50+ tools |
| Setup | Copy code | Run server |
| Maintenance | You | GitHub |
| Deployment | âœ… Easy | âš ï¸ Complex |

## Getting GitHub Token

1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo`, `read:org`, `read:user`
4. Copy token
5. Add to `.env.local`: `GITHUB_TOKEN=your_token`

## Available MCP Servers

From https://mcpservers.org/:

**Official:**
- **GitHub** - Repos, issues, PRs (50+ tools)
- **Supabase** - Database, auth, functions
- **Cloudflare** - Workers, KV, R2
- **Playwright** - Browser automation

**Community:**
- Filesystem - File operations
- PostgreSQL - Database queries
- Notion - Notes management
- Slack - Messaging
- Memory - Persistent context

## MCP vs Custom Tools

### Custom Tools (What We Did Before)
```typescript
// âŒ You write everything
tools: {
  getWeather: {
    execute: async ({ city }) => {
      // 50 lines of code you write
    }
  }
}
// - Only for your app
// - Can't share
// - You maintain
```

### MCP Tools (Standard)
```typescript
// âœ… Connect to existing server
const mcpClient = await experimental_createMCPClient({ ... });
const tools = await mcpClient.tools();

// - Zero code
// - Maintained by others
// - Works everywhere
```

## When to Use MCP

**Use MCP when:**
- âœ… Standard functionality (GitHub, databases)
- âœ… Want to share across apps
- âœ… Community-maintained
- âœ… Complex integrations

**Use Custom Tools when:**
- âœ… Simple, app-specific logic
- âœ… Just 1-2 tools
- âœ… No need to share
- âœ… Quick prototypes

## Transport Types

### stdio (Local Only)
```typescript
transport: new StdioClientTransport({
  command: 'github-mcp-server',
})
```
- âœ… Easy local testing
- âŒ Can't deploy to production

### SSE (Remote)
```typescript
transport: {
  type: 'sse',
  url: 'https://server.com/mcp',
}
```
- âœ… Works remotely
- âœ… Can deploy

### HTTP (Production)
```typescript
transport: new StreamableHTTPClientTransport(url)
```
- âœ… Recommended for production

## Best Practices

### 1. Always Close Clients
```typescript
const mcpClient = await experimental_createMCPClient({ ... });
try {
  const tools = await mcpClient.tools();
  // Use tools
} finally {
  await mcpClient.close(); // âœ… Clean up
}
```

### 2. Handle Errors
```typescript
try {
  const tools = await mcpClient.tools();
} catch (error) {
  if (error.message.includes('405')) {
    console.error('Transport not supported');
  }
}
```

### 3. Use stopWhen for Multi-Step
```typescript
const result = await generateText({
  tools,
  stopWhen: ({ stepNumber }) => stepNumber >= 3, // âœ… Correct
  // Not: maxSteps: 5 // âŒ Wrong
});
```

## Common Issues

### Issue: 405 Method Not Allowed
**Cause:** MCP endpoint doesn't support that transport type

**Fix:** Use correct transport (stdio for local, SSE for remote)

### Issue: AI doesn't use tools
**Cause:** Wrong prompt or missing stopWhen

**Fix:** 
```typescript
stopWhen: ({ stepNumber }) => stepNumber >= 3,
prompt: "Use the get_repository tool to fetch..."
```

## Summary

### Key Points
1. **MCP â‰  File Upload** - It's about tool connectivity
2. **Like npm** - Marketplace of reusable tools
3. **Write once, use everywhere** - Standard protocol
4. **Our demo** - Simulated MCP with GitHub API
5. **Real MCP** - Requires server setup

### The Big Picture
MCP is creating an ecosystem where:
- Companies expose APIs as MCP servers
- Developers use them without custom code
- AI apps become more capable
- Tools work across all platforms

Like npm revolutionized code sharing, MCP is revolutionizing AI tool sharing! ðŸš€
