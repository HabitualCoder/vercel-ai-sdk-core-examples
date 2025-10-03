# Vercel AI SDK Core - Learning Examples

A comprehensive collection of practical examples demonstrating the core features of the Vercel AI SDK. Built with Next.js 15, this repository serves as both a learning resource and reference implementation for AI-powered applications.

## ðŸŽ¯ What's Inside

This project contains **working examples** of every major Vercel AI SDK Core feature:

### 1. **Chat Interface** (`/`)
- Real-time chat using `useChat()` hook
- Streaming responses with `streamText()`
- Message history management
- Built-in UI components from `@ai-sdk/react`

### 2. **Text Generation** (`/generating-text`)
- Non-streaming text generation with `generateText()`
- Article summarization example
- System prompts for role definition
- Error handling and loading states

### 3. **Streaming Text with Tools** (`/stream-text`)
- Real-time text streaming with `fullStream`
- Tool calling (function calling) implementation
- Multiple tools: `getWeather`, `getCityInfo`
- Event stream visualization (text-delta, tool-call, tool-result, etc.)

### 4. **Structured Object Generation** (`/generate-object`)
- Generate JSON objects matching Zod schemas
- Multiple output strategies:
  - **Object mode**: Generate single objects
  - **Array mode**: Generate collections
  - **Enum mode**: Classification tasks
  - **No-schema mode**: Flexible JSON generation
- Type-safe outputs with TypeScript

### 5. **Smart Intent Detection** (`/generate-object-smart`)
- Advanced `generateObject` with intent classification
- Two-step AI reasoning:
  1. Classify user intent (recipe, person, product, general)
  2. Apply appropriate schema or fallback to text
- Prevents forcing wrong schemas on prompts
- Demonstrates multi-step AI workflows

### 6. **Streaming Objects** (`/stream-object`)
- Real-time structured data generation
- Watch objects build field-by-field
- Combines streaming UX with structured data
- Smart intent detection + streaming

### 7. **Model Context Protocol (MCP)** (`/mcp-demo`)
- GitHub repository information fetching
- MCP-style tool implementation
- Multi-step AI reasoning with `stopWhen`
- Environment variable configuration

## ðŸš€ Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Google AI API key (for Gemini models)
- GitHub Personal Access Token (for MCP demo)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd vercel-ai-sdk-core-examples

# Install dependencies
pnpm install
# or
npm install
# or
bun install
```

### Environment Setup

Create a `.env.local` file in the root directory:

```env
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_api_key
GITHUB_TOKEN=your_github_personal_access_token
```

**Getting API Keys:**

1. **Google AI (Gemini)**: 
   - Visit https://aistudio.google.com/apikey
   - Create a new API key
   - Copy to `.env.local`

2. **GitHub Token** (for MCP demo):
   - Go to https://github.com/settings/tokens
   - Generate new token (classic)
   - Select scopes: `repo`, `read:org`, `read:user`
   - Copy to `.env.local`

### Run the Development Server

```bash
pnpm dev
# or
npm run dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## ðŸ“ Project Structure

```
vercel-ai-sdk-core-examples/
â”œâ”€â”€ app/
â”‚   â”œâ”€â”€ api/
â”‚   â”‚   â”œâ”€â”€ chat/route.ts              # Chat API endpoint
â”‚   â”‚   â”œâ”€â”€ generating-text/route.ts   # Text generation API
â”‚   â”‚   â”œâ”€â”€ stream-text/route.ts       # Streaming + tools API
â”‚   â”‚   â”œâ”€â”€ generate-object/route.ts   # Structured data API
â”‚   â”‚   â”œâ”€â”€ generate-object-smart/route.ts  # Intent detection API
â”‚   â”‚   â”œâ”€â”€ stream-object/route.ts     # Streaming objects API
â”‚   â”‚   â””â”€â”€ mcp-demo/route.ts          # MCP demo API
â”‚   â”œâ”€â”€ generating-text/page.tsx       # Text generation UI
â”‚   â”œâ”€â”€ stream-text/page.tsx           # Streaming demo UI
â”‚   â”œâ”€â”€ generate-object/page.tsx       # Object generation UI
â”‚   â”œâ”€â”€ generate-object-smart/page.tsx # Smart intent UI
â”‚   â”œâ”€â”€ stream-object/page.tsx         # Streaming objects UI
â”‚   â”œâ”€â”€ mcp-demo/page.tsx              # MCP demo UI
â”‚   â””â”€â”€ page.tsx                       # Chat UI (home)
â”œâ”€â”€ notes/
â”‚   â”œâ”€â”€ README.md                      # Notes index
â”‚   â”œâ”€â”€ nextjs-routes.md               # Next.js API routes explained
â”‚   â”œâ”€â”€ generating-text.md             # generateText() guide
â”‚   â”œâ”€â”€ streaming-text.md              # streamText() guide
â”‚   â”œâ”€â”€ generate-object.md             # generateObject() guide
â”‚   â”œâ”€â”€ generate-object-advanced.md    # Intent detection guide
â”‚   â”œâ”€â”€ stream-object.md               # streamObject() guide
â”‚   â”œâ”€â”€ tools.md                       # Basic tool calling
â”‚   â”œâ”€â”€ tool-calling.md                # Advanced tool calling
â”‚   â”œâ”€â”€ mcp-tools.md                   # MCP explained
â”‚   â”œâ”€â”€ prompt-engineering.md          # Prompt engineering guide
â”‚   â””â”€â”€ react-vs-nextjs.md             # React vs Next.js for AI
â””â”€â”€ .env.local                         # Environment variables
```

## ðŸ“š Learning Path

Start with the `/notes` folder for comprehensive guides:

1. **Start Here**: `notes/README.md` - Overview and index
2. **Basics**: 
   - `nextjs-routes.md` - Understanding Next.js API routes
   - `react-vs-nextjs.md` - Why Next.js for AI apps
3. **Core Features**:
   - `generating-text.md` - Text generation basics
   - `streaming-text.md` - Real-time streaming
   - `generate-object.md` - Structured data
4. **Advanced**:
   - `generate-object-advanced.md` - Intent detection
   - `stream-object.md` - Streaming structured data
   - `tool-calling.md` - Function calling deep dive
   - `mcp-tools.md` - Model Context Protocol
   - `prompt-engineering.md` - Crafting effective prompts

## ðŸ”§ Technologies Used

- **Framework**: Next.js 15 (App Router)
- **AI SDK**: Vercel AI SDK 5.x
- **AI Model**: Google Gemini 2.5 Flash
- **Validation**: Zod
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Package Manager**: pnpm

## ðŸŽ“ Key Concepts Covered

### AI SDK Features
- âœ… `streamText()` - Streaming text generation
- âœ… `generateText()` - Non-streaming generation
- âœ… `generateObject()` - Structured data generation
- âœ… `streamObject()` - Streaming structured data
- âœ… `fullStream` - Complete event stream access
- âœ… `partialObjectStream` - Real-time object construction
- âœ… `tool()` - Function/tool calling
- âœ… `stopWhen()` - Multi-step AI control
- âœ… Model Context Protocol (MCP) integration

### Next.js Patterns
- âœ… App Router API routes (`route.ts`)
- âœ… Server-side AI processing
- âœ… Client-side streaming consumption
- âœ… Environment variable management
- âœ… TypeScript integration

### Best Practices
- âœ… Temperature = 0 for structured outputs
- âœ… `.nullable()` over `.optional()` for tool parameters
- âœ… Semantic tool naming
- âœ… Schema property descriptions
- âœ… Error handling and loading states
- âœ… Multi-step AI reasoning
- âœ… Intent detection for flexible schemas

## ðŸŽ¯ Use Cases Demonstrated

1. **Chatbots**: Real-time conversational AI
2. **Content Generation**: Article summarization, content writing
3. **Data Extraction**: Structured information from text
4. **Function Calling**: AI triggering external tools/APIs
5. **Smart Routing**: Intent-based response generation
6. **External Integration**: GitHub MCP for live data

## ðŸ¤ Contributing

Feel free to:
- Add new examples
- Improve documentation
- Fix bugs
- Suggest features

## ðŸ“„ License

MIT License - See LICENSE file

## ðŸ™ Acknowledgments

- [Vercel AI SDK Documentation](https://ai-sdk.dev)
- [Next.js Documentation](https://nextjs.org/docs)
- [Google AI Studio](https://aistudio.google.com)
- [Model Context Protocol](https://modelcontextprotocol.io)

## ðŸ”— Useful Links

- [Vercel AI SDK Docs](https://ai-sdk.dev/docs)
- [AI SDK GitHub](https://github.com/vercel/ai)
- [MCP Servers Registry](https://mcpservers.org)
- [Gemini API](https://ai.google.dev)

---

**Built for learning, designed for reference.** ðŸš€

Each example is fully functional and documented. Use this as a starting point for your own AI-powered applications!
