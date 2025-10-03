# Vercel AI SDK - Learning Notes

Welcome to my learning notes on the Vercel AI SDK! This repository contains practical examples and detailed explanations of core AI SDK concepts.

## 📚 Table of Contents

1. [Next.js Route Handlers](./nextjs-routes.md) - Understanding how API routes work in Next.js vs Express
2. [Generating Text](./generating-text.md) - Using `generateText()` for one-off text generation
3. [Streaming Text](./streaming-text.md) - Using `streamText()` and `fullStream` for real-time responses
4. [AI Tools (Function Calling)](./tools.md) - Teaching AI to use functions and interact with external systems
5. [React vs Next.js for AI Apps](./react-vs-nextjs.md) - Why Next.js is ideal for AI applications

## 🚀 Live Examples

This repository includes working examples:

- **`/chat`** - Interactive chatbot using `useChat()` hook
- **`/generating-text`** - Article summarizer using `generateText()`
- **`/stream-text`** - Real-time streaming with tool calling and `fullStream`

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
4. Master [AI Tools](./tools.md) to build intelligent agents
5. Review [React vs Next.js](./react-vs-nextjs.md) for architectural decisions

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

