# Vercel AI SDK - Learning Notes

Welcome to my learning notes on the Vercel AI SDK! This repository contains practical examples and detailed explanations of core AI SDK concepts.

## 📚 Table of Contents

1. [Next.js Route Handlers](./nextjs-routes.md) - Understanding how API routes work in Next.js vs Express
2. [Generating Text](./generating-text.md) - Using `generateText()` for one-off text generation
3. [Streaming Text](./streaming-text.md) - Using `streamText()` and `fullStream` for real-time responses
4. [Generating Structured Objects](./generate-object.md) - Using `generateObject()` for type-safe structured data
5. [Streaming Structured Objects](./stream-object.md) - Using `streamObject()` for real-time object generation
6. [Advanced: Intent Detection](./generate-object-advanced.md) - Handling multiple schemas with smart intent detection
7. [AI Tools (Function Calling)](./tools.md) - Teaching AI to use functions and interact with external systems
8. [Advanced Tool Calling](./tool-calling.md) - Multi-step calls, tool control, and advanced patterns
9. [Model Context Protocol (MCP)](./mcp-tools.md) - Connecting AI to external tools and services
10. [Prompt Engineering](./prompt-engineering.md) - Crafting effective prompts for tools and structured data
11. [React vs Next.js for AI Apps](./react-vs-nextjs.md) - Why Next.js is ideal for AI applications

## 🚀 Live Examples

This repository includes working examples:

- **`/`** - Interactive chatbot using `useChat()` hook
- **`/generating-text`** - Article summarizer using `generateText()`
- **`/stream-text`** - Real-time streaming with tool calling and `fullStream`
- **`/generate-object`** - Structured data generation with `generateObject()` (recipes, lists, classification)
- **`/generate-object-smart`** - Smart intent detection with multiple schemas
- **`/stream-object`** - Real-time streaming object generation with intent detection
- **`/mcp-demo`** - Model Context Protocol demo with GitHub repository fetching

## 🎯 Key Takeaways

### For Interviews

- **What is the Vercel AI SDK?** A toolkit for building AI-powered applications with streaming, tool calling, and structured data generation
- **Why use Next.js for AI?** Built-in API routes keep API keys secure on the server while providing a seamless full-stack experience
- **What are AI tools?** Functions you provide that AI can autonomously call to access data or perform actions
- **What is streaming?** Sending AI responses token-by-token in real-time instead of waiting for the complete response

### Architecture Pattern

```
Frontend (React/Next.js)
    ↓ (POST request)
Backend API Route (Next.js)
    ↓ (with API key)
AI Provider (OpenAI, Google, etc.)
    ↓ (streaming response)
Frontend (real-time updates)
```

## 🛠 Technologies Used

- **Next.js 15** - Full-stack React framework
- **Vercel AI SDK** - AI integration toolkit
- **Google Gemini 2.5** - AI model
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Zod** - Schema validation

## 📖 How to Use These Notes

1. Start with [Next.js Routes](./nextjs-routes.md) to understand the foundation
2. Learn [Generating Text](./generating-text.md) for basic AI integration
3. Explore [Streaming Text](./streaming-text.md) for real-time responses
4. Discover [Generating Objects](./generate-object.md) for structured data
5. Learn [Streaming Objects](./stream-object.md) for real-time structured data
6. Master [AI Tools](./tools.md) to build intelligent agents
7. Deep dive into [Advanced Tool Calling](./tool-calling.md) for multi-step agentic flows
8. Explore [Model Context Protocol](./mcp-tools.md) to connect to external services
9. Learn [Prompt Engineering](./prompt-engineering.md) for effective AI interactions
10. Understand [Intent Detection](./generate-object-advanced.md) for flexible schemas
11. Review [React vs Next.js](./react-vs-nextjs.md) for architectural decisions

## 🎓 Perfect For

- ✅ Learning Vercel AI SDK
- ✅ Interview preparation
- ✅ Quick reference
- ✅ Building AI applications
- ✅ Understanding streaming and tool calling

## 🤝 Contributing

Feel free to suggest improvements or corrections!

---

Built while learning the Vercel AI SDK | Last Updated: October 2025

