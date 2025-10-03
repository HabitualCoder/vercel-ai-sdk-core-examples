# Generating Text with AI SDK

## 📋 Table of Contents
- [What is `generateText()`?](#what-is-generatetext)
- [When to Use](#when-to-use)
- [Basic Usage](#basic-usage)
- [Complete Example](#complete-example)
- [Result Object](#result-object)
- [vs Streaming](#vs-streaming)
- [Best Practices](#best-practices)

---

## What is `generateText()`?

`generateText()` is a function from the Vercel AI SDK that generates text from an AI model and **waits for the complete response** before returning.

### Key Characteristics

- ⏸️ **Blocking** - Waits for the entire response
- 📦 **Complete Response** - Returns full text at once
- 🎯 **Simple** - One function call, one result
- 🔧 **Ideal For** - Non-interactive use cases

---

## When to Use

### ✅ Perfect For

| Use Case | Example |
|----------|---------|
| **Batch Processing** | Summarizing 100 articles overnight |
| **Background Jobs** | Generating descriptions for products |
| **Email Generation** | Creating personalized emails |
| **One-off Tasks** | Generating a meta description |
| **Server-side Only** | No UI to show progress |
| **Agent Workflows** | Tools that need complete responses |

### ❌ Not Ideal For

| Scenario | Use Instead |
|----------|-------------|
| Chat interfaces | `streamText()` |
| Real-time feedback needed | `streamText()` |
| Long responses (>30 seconds) | `streamText()` |
| Need to show progress | `streamText()` |

---

## Basic Usage

### Minimal Example

```typescript
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

const result = await generateText({
  model: google('gemini-2.5-flash'),
  prompt: 'Write a haiku about coding',
});

console.log(result.text);
// Output:
// "Code flows like water
//  Bugs emerge in the silence
//  Debug, find the peace"
```

### With System Prompt

```typescript
const result = await generateText({
  model: google('gemini-2.5-flash'),
  system: 'You are a professional writer. Write simple, clear, and concise content.',
  prompt: 'Explain what TypeScript is',
});

console.log(result.text);
```

### With Dynamic Content

```typescript
const article = `
  Artificial intelligence is transforming industries...
  [long article text]
`;

const result = await generateText({
  model: google('gemini-2.5-flash'),
  system: 'You are a professional writer. You write simple, clear, and concise content.',
  prompt: `Summarize the following article in 3-5 sentences: ${article}`,
});

console.log(result.text);
```

---

## Complete Example

Here's how we use it in our project:

### Backend: `app/api/generating-text/route.ts`

```typescript
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { article } = await req.json();

    // Generate complete text (waits for full response)
    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      system:
        'You are a professional writer. ' +
        'You write simple, clear, and concise content.',
      prompt: `Summarize the following article in 3-5 sentences: ${article}`,
    });

    return Response.json({ text });
  } catch (error) {
    console.error('Error generating text:', error);
    return Response.json(
      { error: 'Failed to generate text' },
      { status: 500 }
    );
  }
}
```

### Frontend: `app/generating-text/page.tsx`

```typescript
'use client';

import { useState } from 'react';

export default function GeneratingText() {
  const [article, setArticle] = useState('');
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!article.trim()) return;

    setIsLoading(true);
    setSummary('');

    try {
      // Call backend API
      const response = await fetch('/api/generating-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article }),
      });

      const data = await response.json();
      
      if (data.error) {
        setSummary('Error: ' + data.error);
      } else {
        setSummary(data.text);
      }
    } catch (error) {
      setSummary('Error: Failed to generate summary');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <textarea
          value={article}
          onChange={(e) => setArticle(e.target.value)}
          placeholder="Paste your article here..."
          disabled={isLoading}
        />
        
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Generating Summary...' : 'Generate Summary'}
        </button>
      </form>

      {summary && (
        <div>
          <h2>Summary:</h2>
          <p>{summary}</p>
        </div>
      )}
    </div>
  );
}
```

---

## Result Object

`generateText()` returns an object with many useful properties:

```typescript
const result = await generateText({
  model: google('gemini-2.5-flash'),
  prompt: 'Hello!',
});

// Main properties
result.text              // The generated text (most commonly used)
result.content           // The full content object
result.finishReason      // 'stop' | 'length' | 'content-filter' | 'tool-calls'
result.usage             // Token usage information
result.toolCalls         // If tools were called
result.toolResults       // Results from tool calls
result.warnings          // Provider warnings (e.g., unsupported settings)
result.response          // Raw response metadata
result.steps             // All generation steps (for multi-step)
```

### Usage Information

```typescript
console.log(result.usage);
// Output:
// {
//   promptTokens: 12,
//   completionTokens: 89,
//   totalTokens: 101
// }

// Calculate cost (example for GPT-4)
const cost = (result.usage.promptTokens * 0.03 / 1000) +
             (result.usage.completionTokens * 0.06 / 1000);
```

### Finish Reason

```typescript
console.log(result.finishReason);
// Possible values:
// - 'stop': Natural completion
// - 'length': Hit token limit
// - 'content-filter': Blocked by safety filters
// - 'tool-calls': Stopped to call tools
```

---

## vs Streaming

### `generateText()` - Wait for Complete Response

```typescript
const { text } = await generateText({
  model: google('gemini-2.5-flash'),
  prompt: 'Write a long essay',
});

// ⏳ Waits 5-10 seconds...
// ✅ Gets complete text at once
console.log(text); // Full essay appears
```

**Timeline:**
```
t=0s:  Request sent
       ⏳ Loading...
t=8s:  Complete response received
       ✅ "Here is a complete essay about..."
```

### `streamText()` - Real-time Streaming

```typescript
const result = streamText({
  model: google('gemini-2.5-flash'),
  prompt: 'Write a long essay',
});

// ✅ Text appears immediately, word by word
for await (const chunk of result.textStream) {
  console.log(chunk); // "Here", " is", " a", " complete"...
}
```

**Timeline:**
```
t=0s:  Request sent
t=0.5s: "Here"
t=0.7s: " is"
t=0.9s: " a"
t=1.1s: " complete"
...
t=8s:  Stream complete
```

### Which to Choose?

| Requirement | Use |
|-------------|-----|
| Need immediate feedback | `streamText()` |
| Building a chat UI | `streamText()` |
| Background processing | `generateText()` |
| Batch operations | `generateText()` |
| Want simpler code | `generateText()` |
| Long responses (>30s) | `streamText()` |

---

## Best Practices

### 1. Error Handling

```typescript
export async function POST(req: Request) {
  try {
    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      prompt: 'Hello',
    });
    
    return Response.json({ text });
  } catch (error) {
    console.error('Generation failed:', error);
    
    // Return user-friendly error
    return Response.json(
      { error: 'Failed to generate text. Please try again.' },
      { status: 500 }
    );
  }
}
```

### 2. Timeout Protection

```typescript
// Set max duration for the API route
export const maxDuration = 30;

export async function POST(req: Request) {
  // If generation takes > 30s, Next.js will timeout
  const { text } = await generateText({
    model: google('gemini-2.5-flash'),
    prompt: req.body.prompt,
  });
  
  return Response.json({ text });
}
```

### 3. Input Validation

```typescript
export async function POST(req: Request) {
  const { prompt } = await req.json();
  
  // Validate input
  if (!prompt || typeof prompt !== 'string') {
    return Response.json(
      { error: 'Invalid prompt' },
      { status: 400 }
    );
  }
  
  if (prompt.length > 10000) {
    return Response.json(
      { error: 'Prompt too long (max 10,000 characters)' },
      { status: 400 }
    );
  }
  
  const { text } = await generateText({
    model: google('gemini-2.5-flash'),
    prompt,
  });
  
  return Response.json({ text });
}
```

### 4. Usage Tracking

```typescript
export async function POST(req: Request) {
  const result = await generateText({
    model: google('gemini-2.5-flash'),
    prompt: req.body.prompt,
  });
  
  // Log usage for monitoring/billing
  console.log('Tokens used:', result.usage.totalTokens);
  console.log('Cost estimate:', calculateCost(result.usage));
  
  // Could save to database for analytics
  await db.usage.create({
    data: {
      userId: req.user.id,
      tokens: result.usage.totalTokens,
      cost: calculateCost(result.usage),
    },
  });
  
  return Response.json({ text: result.text });
}
```

### 5. System Prompts for Consistency

```typescript
const SYSTEM_PROMPTS = {
  summarizer: 'You are a professional summarizer. Create concise, accurate summaries.',
  translator: 'You are a professional translator. Maintain tone and context.',
  coder: 'You are an expert programmer. Write clean, efficient code with comments.',
};

const { text } = await generateText({
  model: google('gemini-2.5-flash'),
  system: SYSTEM_PROMPTS.summarizer,
  prompt: userInput,
});
```

---

## Real-World Examples

### 1. Batch Email Generation

```typescript
const users = await db.user.findMany();

for (const user of users) {
  const { text } = await generateText({
    model: google('gemini-2.5-flash'),
    system: 'You are a marketing email writer.',
    prompt: `Write a personalized email for ${user.name} about our new product.`,
  });
  
  await sendEmail(user.email, text);
}
```

### 2. Product Description Generator

```typescript
export async function POST(req: Request) {
  const { productName, features } = await req.json();
  
  const { text } = await generateText({
    model: google('gemini-2.5-flash'),
    system: 'You are an e-commerce copywriter.',
    prompt: `Write a compelling product description for ${productName}. 
             Features: ${features.join(', ')}`,
  });
  
  return Response.json({ description: text });
}
```

### 3. Content Moderation

```typescript
export async function POST(req: Request) {
  const { userComment } = await req.json();
  
  const { text } = await generateText({
    model: google('gemini-2.5-flash'),
    system: 'Analyze if this content violates community guidelines. Respond with YES or NO and explain why.',
    prompt: userComment,
  });
  
  const isViolation = text.toLowerCase().includes('yes');
  
  return Response.json({ isViolation, reason: text });
}
```

---

## Summary

✅ **Use `generateText()` when:**
- You don't need real-time feedback
- Processing in the background
- Simpler code is preferred
- Response time < 30 seconds

❌ **Don't use `generateText()` when:**
- Building chat interfaces
- User needs to see progress
- Response might take > 30 seconds

**Remember:** `generateText()` is perfect for "fire and wait" scenarios where you need a complete response before proceeding! 🎯

