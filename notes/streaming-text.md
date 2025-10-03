# Streaming Text with AI SDK

## 📋 Table of Contents
- [What is `streamText()`?](#what-is-streamtext)
- [Why Streaming Matters](#why-streaming-matters)
- [Basic Usage](#basic-usage)
- [Understanding `fullStream`](#understanding-fullstream)
- [Event Types](#event-types)
- [Complete Example](#complete-example)
- [Stream Lifecycle](#stream-lifecycle)
- [Best Practices](#best-practices)

---

## What is `streamText()`?

`streamText()` is a function from the Vercel AI SDK that generates text from an AI model and **streams the response in real-time** as tokens are generated.

### Key Characteristics

- ⚡ **Real-time** - Text appears immediately as it's generated
- 📺 **Streaming** - Sends tokens as they arrive, not all at once
- 🎭 **Interactive** - Perfect for chat and real-time UIs
- 🔍 **Observable** - See every step of generation via `fullStream`

---

## Why Streaming Matters

### Without Streaming (`generateText`)

```
User: "Write a long essay"
       
⏳ Loading... (10 seconds of waiting)
       
✅ Complete essay appears at once
```

**User Experience:** Staring at a loading spinner for 10 seconds 😴

### With Streaming (`streamText`)

```
User: "Write a long essay"
       
t=0.5s: "Artificial"
t=0.7s: " intelligence"
t=0.9s: " is"
t=1.1s: " transforming"
...
t=10s: Stream complete
```

**User Experience:** Feels instant and engaging! 🚀

### The Impact

| Aspect | Without Streaming | With Streaming |
|--------|-------------------|----------------|
| **Perceived Speed** | Feels slow | Feels instant |
| **Engagement** | User waits | User reads along |
| **First Token** | 10 seconds | 0.5 seconds |
| **UX** | Loading spinner | Live typing effect |
| **Anxiety** | "Is it working?" | "It's working!" |

---

## Basic Usage

### Simple Text Streaming

```typescript
import { streamText } from 'ai';
import { google } from '@ai-sdk/google';

const result = streamText({
  model: google('gemini-2.5-flash'),
  prompt: 'Write a short story about a robot',
});

// Method 1: Use textStream as async iterable
for await (const textChunk of result.textStream) {
  process.stdout.write(textChunk);
}

// Method 2: Use textStream as ReadableStream
const stream = result.textStream;
const reader = stream.getReader();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  process.stdout.write(value);
}
```

### In a Next.js API Route

```typescript
// app/api/stream/route.ts
import { streamText } from 'ai';
import { google } from '@ai-sdk/google';

export async function POST(req: Request) {
  const { prompt } = await req.json();
  
  const result = streamText({
    model: google('gemini-2.5-flash'),
    prompt,
  });
  
  // Return as HTTP response
  return result.toTextStreamResponse();
}
```

---

## Understanding `fullStream`

`fullStream` is the most powerful feature of `streamText()`. It gives you **every single event** that happens during generation.

### `textStream` vs `fullStream`

| Property | What You Get |
|----------|-------------|
| `textStream` | Just the text chunks: `"Hello"`, `" world"`, `"!"` |
| `fullStream` | Every event: text, tools, metadata, finish reason, etc. |

Think of it like:
- **`textStream`** = Watching the movie
- **`fullStream`** = Watching the movie + director's commentary + behind the scenes

### Example: The Difference

```typescript
// Using textStream - simple text only
for await (const chunk of result.textStream) {
  console.log(chunk);
}
// Output: "Hello", " ", "world"

// Using fullStream - everything
for await (const part of result.fullStream) {
  console.log(part.type, part);
}
// Output:
// start {}
// start-step {}
// text-delta { textDelta: "Hello" }
// text-delta { textDelta: " " }
// text-delta { textDelta: "world" }
// finish-step { finishReason: "stop" }
// finish { usage: { totalTokens: 42 } }
```

---

## Event Types

When using `fullStream`, you'll receive different event types representing stages of generation:

### Lifecycle Events

```typescript
{
  type: 'start'
  // 🚀 Stream is starting
}

{
  type: 'start-step'
  // 📍 Beginning a generation step
}

{
  type: 'finish-step',
  finishReason: 'stop',
  usage: { completionTokens: 50, promptTokens: 10, totalTokens: 60 }
  // ✅ Step completed
}

{
  type: 'finish',
  finishReason: 'stop',
  usage: { completionTokens: 50, promptTokens: 10, totalTokens: 60 }
  // 🏁 Entire stream finished
}
```

### Content Events

```typescript
{
  type: 'text-delta',
  textDelta: 'Hello'
  // 📝 A piece of generated text
}

{
  type: 'reasoning-start'
  // 🤔 Model is starting to show reasoning
}

{
  type: 'reasoning-delta',
  reasoningDelta: 'Let me think about this...'
  // 💭 Part of the model's reasoning process
}
```

### Tool Events (Function Calling)

```typescript
{
  type: 'tool-call',
  toolName: 'getWeather',
  args: { city: 'San Francisco' }
  // 🔧 AI decided to call a tool
}

{
  type: 'tool-result',
  toolName: 'getWeather',
  result: { temperature: 68, condition: 'Sunny' }
  // 📦 Tool execution completed
}

{
  type: 'tool-error',
  toolName: 'getWeather',
  error: 'API timeout'
  // ⚠️ Tool execution failed
}
```

### Other Events

```typescript
{
  type: 'source',
  sourceType: 'url',
  url: 'https://example.com',
  title: 'Example Source'
  // 📚 Source/citation from model
}

{
  type: 'error',
  error: { message: 'Rate limit exceeded' }
  // ❌ Error occurred
}
```

---

## Complete Example

Here's our full implementation from the project:

### Backend: `app/api/stream-text/route.ts`

```typescript
import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { z } from 'zod';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    const result = streamText({
      model: google('gemini-2.5-flash'),
      tools: {
        getWeather: {
          description: 'Get the weather for a location',
          parameters: z.object({
            city: z.string().describe('The city to get weather for'),
          }),
          execute: async ({ city }) => {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return {
              city,
              temperature: Math.floor(Math.random() * 30) + 10,
              condition: ['Sunny', 'Cloudy', 'Rainy'][
                Math.floor(Math.random() * 3)
              ],
            };
          },
        },
        getCityInfo: {
          description: 'Get information about a city',
          parameters: z.object({
            city: z.string().describe('The city to get info about'),
          }),
          execute: async ({ city }) => {
            await new Promise((resolve) => setTimeout(resolve, 800));
            return {
              city,
              population: `${Math.floor(Math.random() * 5)}M`,
              country: 'Various',
              famousFor: 'Tourism and culture',
            };
          },
        },
      },
      prompt,
    });

    // Stream all events to frontend
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const part of result.fullStream) {
            const eventData = JSON.stringify({
              type: part.type,
              data: part,
            });
            controller.enqueue(encoder.encode(`${eventData}\n`));
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in stream-text route:', error);
    return Response.json(
      { error: 'Failed to stream text' },
      { status: 500 }
    );
  }
}
```

### Frontend: `app/stream-text/page.tsx` (simplified)

```typescript
'use client';

import { useState } from 'react';

export default function StreamText() {
  const [events, setEvents] = useState([]);
  const [generatedText, setGeneratedText] = useState('');

  const handleSubmit = async (prompt: string) => {
    const response = await fetch('/api/stream-text', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          const event = JSON.parse(line);
          
          // Log all events
          setEvents((prev) => [...prev, event]);

          // Handle text specifically
          if (event.type === 'text-delta') {
            setGeneratedText((prev) => prev + event.data.textDelta);
          }
        }
      }
    }
  };

  return (
    <div>
      <button onClick={() => handleSubmit('What is the weather in Tokyo?')}>
        Ask About Weather
      </button>
      
      <div>Generated Text: {generatedText}</div>
      
      <div>
        Events:
        {events.map((event, i) => (
          <div key={i}>{event.type}</div>
        ))}
      </div>
    </div>
  );
}
```

---

## Stream Lifecycle

Let's trace what happens when you ask: *"What's the weather in San Francisco?"*

### The Complete Flow

```typescript
for await (const part of result.fullStream) {
  console.log(`${part.type}:`, part);
}
```

### Console Output

```
1. start: {}
   // 🚀 Stream initialized

2. start-step: {}
   // 📍 Step 1 begins

3. tool-call: { toolName: 'getWeather', args: { city: 'San Francisco' } }
   // 🤔 AI: "I need to call getWeather to answer this"

4. tool-result: { toolName: 'getWeather', result: { temperature: 68, condition: 'Sunny' } }
   // 📦 Tool returned data

5. finish-step: { finishReason: 'tool-calls', usage: {...} }
   // ✅ Step 1 complete (called tools)

6. start-step: {}
   // 📍 Step 2 begins (generate response with tool data)

7. text-delta: { textDelta: 'The' }
   // 📝 First word appears

8. text-delta: { textDelta: ' weather' }
   // 📝 More text

9. text-delta: { textDelta: ' in' }
10. text-delta: { textDelta: ' San' }
11. text-delta: { textDelta: ' Francisco' }
12. text-delta: { textDelta: ' is' }
13. text-delta: { textDelta: ' 68°F' }
14. text-delta: { textDelta: ' and' }
15. text-delta: { textDelta: ' sunny' }
16. text-delta: { textDelta: '.' }

17. finish-step: { finishReason: 'stop', usage: {...} }
    // ✅ Step 2 complete

18. finish: { finishReason: 'stop', usage: { totalTokens: 150 } }
    // 🏁 All done!
```

### Visual Timeline

```
t=0.0s  [start]
t=0.1s  [start-step] Step 1
t=0.2s  [tool-call] getWeather({ city: "San Francisco" })
t=1.2s  [tool-result] { temperature: 68, condition: "Sunny" }
t=1.3s  [finish-step] Step 1 done
t=1.4s  [start-step] Step 2
t=1.5s  [text-delta] "The"
t=1.6s  [text-delta] " weather"
t=1.7s  [text-delta] " in"
t=1.8s  [text-delta] " San"
t=1.9s  [text-delta] " Francisco"
t=2.0s  [text-delta] " is"
t=2.1s  [text-delta] " 68°F"
t=2.2s  [text-delta] " and"
t=2.3s  [text-delta] " sunny"
t=2.4s  [text-delta] "."
t=2.5s  [finish-step] Step 2 done
t=2.6s  [finish] Complete!
```

---

## Best Practices

### 1. Error Handling with `onError`

```typescript
const result = streamText({
  model: google('gemini-2.5-flash'),
  prompt: 'Hello',
  onError({ error }) {
    console.error('Stream error:', error);
    // Log to monitoring service
    logToSentry(error);
  },
});
```

### 2. Chunk-Level Processing with `onChunk`

```typescript
const result = streamText({
  model: google('gemini-2.5-flash'),
  prompt: 'Hello',
  onChunk({ chunk }) {
    if (chunk.type === 'text') {
      // Process each text chunk
      console.log('Text chunk:', chunk.text);
    }
    if (chunk.type === 'tool-call') {
      // Log tool usage
      console.log('Tool called:', chunk.toolName);
    }
  },
});
```

### 3. Finish Callback

```typescript
const result = streamText({
  model: google('gemini-2.5-flash'),
  prompt: 'Hello',
  onFinish({ text, usage, finishReason }) {
    console.log('Final text:', text);
    console.log('Tokens used:', usage.totalTokens);
    console.log('Finish reason:', finishReason);
    
    // Save to database
    await db.completion.create({
      data: { text, tokens: usage.totalTokens },
    });
  },
});
```

### 4. Handle Backpressure

```typescript
// ⚠️ Important: Consume the stream!
// If you don't read from the stream, it won't generate tokens

// Good ✅
for await (const chunk of result.textStream) {
  process.stdout.write(chunk);
}

// Bad ❌ (stream never consumed)
const result = streamText({ ... });
// Stream created but never read - generation won't progress
```

### 5. Integration with AI SDK UI

```typescript
// In Next.js API route
export async function POST(req: Request) {
  const result = streamText({
    model: google('gemini-2.5-flash'),
    prompt: 'Hello',
  });
  
  // Built-in helper for UI integration
  return result.toUIMessageStreamResponse();
}

// In React component
const { messages, sendMessage } = useChat({
  api: '/api/chat',
});
// Automatically handles streaming!
```

---

## When to Use What?

| Use Case | Use This |
|----------|----------|
| Chat interface | `streamText()` with `textStream` |
| Debug/logging | `streamText()` with `fullStream` |
| Show tool calls in UI | `streamText()` with `fullStream` |
| Background processing | `generateText()` |
| Need immediate feedback | `streamText()` |
| Batch operations | `generateText()` |

---

## Summary

### Key Concepts

1. **`streamText()`** - Generates text in real-time as tokens arrive
2. **`textStream`** - Simple stream of text chunks
3. **`fullStream`** - Complete stream with all events (text, tools, metadata)
4. **Events** - Different types representing stages: start, text-delta, tool-call, finish, etc.
5. **Backpressure** - Must consume the stream for generation to progress

### Why `fullStream` is Powerful

- ✅ See every step of generation
- ✅ Show tool calls in UI
- ✅ Track token usage in real-time
- ✅ Debug complex AI workflows
- ✅ Build transparent, observable AI systems

**Remember:** Streaming makes AI feel instant and keeps users engaged! The difference between a 10-second wait and seeing text appear immediately is huge for UX. 🚀

