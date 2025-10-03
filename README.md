# Vercel AI SDK Core - Learning Examples

A comprehensive collection of practical examples demonstrating the core features of the Vercel AI SDK. Built with Next.js 15, this repository serves as both a learning resource and reference implementation for AI-powered applications.

## 🎯 What's Inside

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

## 🚀 Getting Started

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
app/
   api/
      chat/route.ts              # Chat API endpoint
      generating-text/route.ts   # Text generation API
      stream-text/route.ts       # Streaming + tools API
      generate-object/route.ts   # Structured data API
      generate-object-smart/route.ts  # Intent detection API
      stream-object/route.ts     # Streaming objects API
      mcp-demo/route.ts          # MCP demo API
   generating-text/page.tsx       # Text generation UI
   stream-text/page.tsx           # Streaming demo UI
   generate-object/page.tsx       # Object generation UI
   generate-object-smart/page.tsx # Smart intent UI
   stream-object/page.tsx         # Streaming objects UI
   mcp-demo/page.tsx              # MCP demo UI
   page.tsx                       # Chat UI (home)
notes/
   README.md                      # Notes index
   nextjs-routes.md               # Next.js API routes explained
   generating-text.md             # generateText() guide
   streaming-text.md              # streamText() guide
   generate-object.md             # generateObject() guide
   generate-object-advanced.md    # Intent detection guide
   stream-object.md               # streamObject() guide
   tools.md                       # Basic tool calling
   tool-calling.md                # Advanced tool calling
   mcp-tools.md                   # MCP explained
   prompt-engineering.md          # Prompt engineering guide
   react-vs-nextjs.md             # React vs Next.js for AI
└── .env.local                         # Environment variables
```

## 📚 Learning Path

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

## 🔧 Technologies Used

- **Framework**: Next.js 15 (App Router)
- **AI SDK**: Vercel AI SDK 5.x
- **AI Model**: Google Gemini 2.5 Flash
- **Validation**: Zod
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Package Manager**: pnpm

## 🎓 Key Concepts Covered

### AI SDK Features
- ✅ `streamText()` - Streaming text generation
- ✅ `generateText()` - Non-streaming generation
- ✅ `generateObject()` - Structured data generation
- ✅ `streamObject()` - Streaming structured data
- ✅ `fullStream` - Complete event stream access
- ✅ `partialObjectStream` - Real-time object construction
- ✅ `tool()` - Function/tool calling
- ✅ `stopWhen()` - Multi-step AI control
- ✅ Model Context Protocol (MCP) integration

### Next.js Patterns
- ✅ App Router API routes (`route.ts`)
- ✅ Server-side AI processing
- ✅ Client-side streaming consumption
- ✅ Environment variable management
- ✅ TypeScript integration

### Best Practices
- ✅ Temperature = 0 for structured outputs
- ✅ `.nullable()` over `.optional()` for tool parameters
- ✅ Semantic tool naming
- ✅ Schema property descriptions
- ✅ Error handling and loading states
- ✅ Multi-step AI reasoning
- ✅ Intent detection for flexible schemas

## 🎯 Use Cases Demonstrated

1. **Chatbots**: Real-time conversational AI
2. **Content Generation**: Article summarization, content writing
3. **Data Extraction**: Structured information from text
4. **Function Calling**: AI triggering external tools/APIs
5. **Smart Routing**: Intent-based response generation
6. **External Integration**: GitHub MCP for live data

## Contributing

Feel free to:
- Add new examples
- Improve documentation
- Fix bugs
- Suggest features

## License

MIT License - See LICENSE file

## Acknowledgments

- [Vercel AI SDK Documentation](https://ai-sdk.dev)
- [Next.js Documentation](https://nextjs.org/docs)
- [Google AI Studio](https://aistudio.google.com)
- [Model Context Protocol](https://modelcontextprotocol.io)

## 🔗 Useful Links

- [Vercel AI SDK Docs](https://ai-sdk.dev/docs)
- [AI SDK GitHub](https://github.com/vercel/ai)
- [MCP Servers Registry](https://mcpservers.org)
- [Gemini API](https://ai.google.dev)

---

**Built for learning, designed for reference.** 🚀

Each example is fully functional and documented. Use this as a starting point for your own AI-powered applications!
