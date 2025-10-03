# Streaming Structured Objects with AI SDK

## 📋 Table of Contents
- [What is `streamObject()`?](#what-is-streamobject)
- [Why Stream Objects?](#why-stream-objects)
- [Basic Usage](#basic-usage)
- [vs generateObject](#vs-generateobject)
- [Partial Object Stream](#partial-object-stream)
- [Complete Example](#complete-example)
- [Real-Time UI Updates](#real-time-ui-updates)
- [Best Practices](#best-practices)

---

## What is `streamObject()`?

`streamObject()` is like `generateObject()`, but instead of waiting for the complete object, it **streams partial objects** in real-time as the AI generates them.

### Key Characteristics

- ⚡ **Real-time** - See object fields appear as they're generated
- 📺 **Streaming** - Progressive updates, not all-at-once
- 🎯 **Type-safe** - Same schema validation as `generateObject()`
- 🎬 **Engaging UX** - Users see immediate progress

---

## Why Stream Objects?

### Without Streaming (`generateObject`)

```typescript
const { object } = await generateObject({
  schema: recipeSchema,
  prompt: 'Generate a complex recipe',
});

// ⏳ Waits 5-10 seconds...
// ✅ Complete object appears at once

console.log(object);
// { recipe: { name: "...", ingredients: [...], steps: [...] } }
```

**User sees:** Loading spinner for 10 seconds 😴

### With Streaming (`streamObject`)

```typescript
const result = streamObject({
  schema: recipeSchema,
  prompt: 'Generate a complex recipe',
});

for await (const partial of result.partialObjectStream) {
  console.log(partial);
}

// t=0.5s: { recipe: { name: "Chocolate Cake" } }
// t=1.0s: { recipe: { name: "Chocolate Cake", cuisine: "Dessert" } }
// t=1.5s: { recipe: { ..., ingredients: [{ name: "flour", ... }] } }
// t=2.0s: { recipe: { ..., ingredients: [{...}, {...}] } }
// t=3.0s: { recipe: { ..., steps: ["Preheat oven", ...] } }
```

**User sees:** Fields appearing one by one in real-time! 🚀

---

## Basic Usage

### Minimal Example

```typescript
import { streamObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

const result = streamObject({
  model: google('gemini-2.5-flash'),
  schema: z.object({
    person: z.object({
      name: z.string(),
      age: z.number(),
      bio: z.string(),
    }),
  }),
  prompt: 'Generate a person profile',
});

// Iterate through partial objects
for await (const partialObject of result.partialObjectStream) {
  console.log(partialObject);
  // Updates progressively:
  // { person: { name: "John" } }
  // { person: { name: "John", age: 30 } }
  // { person: { name: "John", age: 30, bio: "Software engineer..." } }
}
```

### In a Next.js API Route

```typescript
// app/api/stream-object-example/route.ts
import { streamObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

export async function POST(req: Request) {
  const { prompt } = await req.json();

  const result = streamObject({
    model: google('gemini-2.5-flash'),
    schema: z.object({
      recipe: z.object({
        name: z.string(),
        ingredients: z.array(z.string()),
        steps: z.array(z.string()),
      }),
    }),
    prompt,
  });

  // Stream partial objects to client
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for await (const partialObject of result.partialObjectStream) {
        const data = JSON.stringify(partialObject);
        controller.enqueue(encoder.encode(data + '\n'));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
}
```

---

## vs generateObject

### Side-by-Side Comparison

#### `generateObject` - Wait for Complete

```typescript
const { object } = await generateObject({
  model: google('gemini-2.5-flash'),
  schema: recipeSchema,
  prompt: 'Generate a recipe',
});

// Waits for complete object
console.log(object.recipe.name);        // "Chocolate Cake"
console.log(object.recipe.ingredients); // [...]
console.log(object.recipe.steps);       // [...]
```

**Timeline:**
```
t=0s:  ⏳ Generating...
t=8s:  ✅ Complete object ready
       Display everything at once
```

#### `streamObject` - Real-Time Updates

```typescript
const result = streamObject({
  model: google('gemini-2.5-flash'),
  schema: recipeSchema,
  prompt: 'Generate a recipe',
});

for await (const partial of result.partialObjectStream) {
  console.log(partial.recipe?.name);        // Appears first
  console.log(partial.recipe?.ingredients); // Builds up gradually
  console.log(partial.recipe?.steps);       // Appears last
}
```

**Timeline:**
```
t=0.5s: { recipe: { name: "Chocolate Cake" } }
t=1.0s: { recipe: { name: "...", cuisine: "Dessert" } }
t=2.0s: { recipe: { ..., ingredients: [{...}] } }
t=3.0s: { recipe: { ..., ingredients: [{...}, {...}] } }
t=5.0s: { recipe: { ..., steps: ["Step 1"] } }
t=8.0s: ✅ Complete!
```

### When to Use What?

| Use Case | Use `generateObject` | Use `streamObject` |
|----------|---------------------|-------------------|
| **Chat interfaces** | ❌ | ✅ |
| **Live dashboards** | ❌ | ✅ |
| **Form generation** | ❌ | ✅ |
| **Background jobs** | ✅ | ❌ |
| **Batch processing** | ✅ | ❌ |
| **Simple data fetch** | ✅ | Either |
| **User needs feedback** | ❌ | ✅ |

---

## Partial Object Stream

The key feature of `streamObject()` is `partialObjectStream`:

### Understanding Partial Objects

```typescript
const result = streamObject({
  schema: z.object({
    person: z.object({
      name: z.string(),
      age: z.number(),
      skills: z.array(z.string()),
      address: z.object({
        city: z.string(),
        country: z.string(),
      }),
    }),
  }),
  prompt: 'Generate a person',
});

for await (const partial of result.partialObjectStream) {
  console.log(partial);
}
```

**Streaming sequence:**

```javascript
// Iteration 1
{ person: { name: "Alice" } }

// Iteration 2
{ person: { name: "Alice", age: 28 } }

// Iteration 3
{ person: { name: "Alice", age: 28, skills: [] } }

// Iteration 4
{ person: { name: "Alice", age: 28, skills: ["JavaScript"] } }

// Iteration 5
{ person: { name: "Alice", age: 28, skills: ["JavaScript", "Python"] } }

// Iteration 6
{ person: { ..., address: { city: "Paris" } } }

// Iteration 7 (final)
{ person: { ..., address: { city: "Paris", country: "France" } } }
```

### Fields Appear Gradually

- ✅ Simple fields (strings, numbers) appear first
- ✅ Arrays build up element by element
- ✅ Nested objects build from outside in
- ✅ Each update contains ALL previous data + new data

---

## Complete Example

Here's our full implementation with smart intent detection:

### Backend: `app/api/stream-object/route.ts`

```typescript
import { google } from '@ai-sdk/google';
import { generateObject, streamObject } from 'ai';
import { z } from 'zod';

export async function POST(req: Request) {
  const { prompt } = await req.json();

  // Step 1: Detect intent
  const intentDetection = await generateObject({
    model: google('gemini-2.5-flash'),
    output: 'enum',
    enum: ['recipe', 'person', 'product', 'story'],
    prompt: `Classify: "${prompt}"`,
  });

  const intent = intentDetection.object;

  // Step 2: Stream with appropriate schema
  let result;

  switch (intent) {
    case 'recipe':
      result = streamObject({
        model: google('gemini-2.5-flash'),
        schema: z.object({
          recipe: z.object({
            name: z.string(),
            ingredients: z.array(z.object({
              name: z.string(),
              amount: z.string(),
            })),
            steps: z.array(z.string()),
          }),
        }),
        prompt,
      });
      break;

    case 'person':
      result = streamObject({
        model: google('gemini-2.5-flash'),
        schema: z.object({
          person: z.object({
            name: z.string(),
            profession: z.string(),
            achievements: z.array(z.string()),
            biography: z.string(),
          }),
        }),
        prompt: `Provide information about: ${prompt}`,
      });
      break;

    // ... other cases
  }

  // Stream to client
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Send intent first
      controller.enqueue(
        encoder.encode(JSON.stringify({ type: 'intent', intent }) + '\n')
      );

      // Stream partial objects
      for await (const partial of result.partialObjectStream) {
        const data = JSON.stringify({ type: 'partial', data: partial });
        controller.enqueue(encoder.encode(data + '\n'));
      }

      // Send completion
      controller.enqueue(
        encoder.encode(JSON.stringify({ type: 'complete' }) + '\n')
      );

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
}
```

### Frontend: `app/stream-object/page.tsx`

```typescript
'use client';

import { useState } from 'react';

export default function StreamObject() {
  const [partialObject, setPartialObject] = useState(null);

  const handleStream = async () => {
    const response = await fetch('/api/stream-object', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'Generate a recipe' }),
    });

    const reader = response.body.getReader();
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

          if (event.type === 'partial') {
            // Update UI in real-time!
            setPartialObject(event.data);
          }
        }
      }
    }
  };

  return (
    <div>
      <button onClick={handleStream}>Stream Object</button>

      {partialObject?.recipe && (
        <div>
          <h2>{partialObject.recipe.name || '...'}</h2>

          {/* Ingredients appear one by one */}
          {partialObject.recipe.ingredients?.map((ing, i) => (
            <li key={i} className="animate-fadeIn">
              {ing.name}: {ing.amount}
            </li>
          ))}

          {/* Steps appear one by one */}
          {partialObject.recipe.steps?.map((step, i) => (
            <li key={i} className="animate-fadeIn">
              {step}
            </li>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Real-Time UI Updates

The magic of `streamObject()` is seeing the UI update in real-time:

### CSS Animation for New Items

```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out;
}
```

### Progressive Display Pattern

```typescript
// Each new field/item gets animated in
{partialObject.recipe?.ingredients?.map((ing, i) => (
  <li key={i} className="animate-fadeIn">
    {ing.name}: {ing.amount}
  </li>
))}
```

### Loading States

```typescript
// Show loading indicator while streaming
{isStreaming && (
  <div className="flex items-center gap-2">
    <div className="animate-spin h-4 w-4 border-2 border-blue-600 rounded-full" />
    Building object...
  </div>
)}

// Show completion indicator
{isComplete && (
  <div className="text-green-600">
    ✓ Complete!
  </div>
)}
```

---

## Best Practices

### 1. Handle Incomplete Data

```typescript
// Always use optional chaining for partial objects
const name = partialObject.recipe?.name || '...';
const ingredients = partialObject.recipe?.ingredients || [];

// Check if fields exist before rendering
{partialObject.recipe?.steps && (
  <div>
    {partialObject.recipe.steps.map(step => <li>{step}</li>)}
  </div>
)}
```

### 2. Show Progressive Loading

```typescript
// Count what's been received
const ingredientCount = partialObject.recipe?.ingredients?.length || 0;

<h3>Ingredients ({ingredientCount}){isStreaming ? '...' : ''}</h3>
```

### 3. Use Animations

Make new items visually appear:

```typescript
{items.map((item, i) => (
  <div key={i} className="animate-fadeIn">
    {item}
  </div>
))}
```

### 4. Error Handling

```typescript
const stream = new ReadableStream({
  async start(controller) {
    try {
      for await (const partial of result.partialObjectStream) {
        controller.enqueue(/* ... */);
      }
    } catch (error) {
      console.error('Stream error:', error);
      controller.enqueue(
        encoder.encode(JSON.stringify({ type: 'error', error }) + '\n')
      );
    } finally {
      controller.close();
    }
  },
});
```

### 5. Provide Visual Feedback

```typescript
// Status indicators
<div className="flex items-center gap-4">
  {/* Intent badge */}
  <span className="badge">Intent: {detectedIntent}</span>

  {/* Streaming indicator */}
  {isStreaming && <Spinner />}

  {/* Completion indicator */}
  {isComplete && <CheckIcon />}
</div>
```

---

## Element Stream (for Arrays)

When using `output: 'array'`, you can use `elementStream` to get complete elements:

```typescript
const result = streamObject({
  model: google('gemini-2.5-flash'),
  output: 'array',
  schema: z.object({
    name: z.string(),
    price: z.number(),
  }),
  prompt: 'Generate 5 products',
});

// Get complete elements as they finish
for await (const element of result.elementStream) {
  console.log(element);
  // { name: "Product 1", price: 29.99 }  ← Complete element
  // { name: "Product 2", price: 49.99 }  ← Complete element
  // ...
}
```

**Difference:**
- `partialObjectStream` - Shows partial progress of current item
- `elementStream` - Only emits when an item is complete

---

## Real-World Use Cases

### 1. Live Recipe Builder

```typescript
// User sees recipe build up in real-time
// - Name appears first
// - Ingredients populate one by one
// - Steps appear as they're generated
// - User can start reading while it's still generating
```

### 2. Profile Generator

```typescript
// Generate employee profiles
// - Basic info appears first
// - Biography fills in
// - Skills list builds up
// - Achievements populate
// - User engagement stays high with visual feedback
```

### 3. Product Catalog

```typescript
// Generate product listings
// - Each product appears when complete
// - User can browse while more load
// - Feels faster than waiting for all products
```

### 4. Story Writer

```typescript
// Generate creative stories
// - Title and genre appear first
// - Characters are introduced one by one
// - Plot develops progressively
// - Creates anticipation and engagement
```

---

## Summary

### Key Concepts

1. **`streamObject()`** - Streams partial objects in real-time
2. **`partialObjectStream`** - Iterate through progressive updates
3. **`elementStream`** - Get complete array elements (array output strategy)
4. **Progressive UX** - Users see immediate feedback
5. **Same validation** - Schema enforcement just like `generateObject()`

### Benefits

| Benefit | Impact |
|---------|--------|
| **Immediate feedback** | Users see progress instantly |
| **Better engagement** | No staring at loading spinners |
| **Feels faster** | Time to first content is immediate |
| **Graceful degradation** | Can use partial data even if stream fails |
| **Anticipation** | Creates excitement as data appears |

### When to Use

- ✅ **Always** for user-facing interfaces
- ✅ When generating complex objects (many fields/arrays)
- ✅ When user needs to see progress
- ✅ For engaging, modern UX
- ❌ For background processing (use `generateObject`)
- ❌ When you need complete data before proceeding

**Remember:** `streamObject()` provides the same type safety and validation as `generateObject()`, but with a dramatically better user experience! 🎬

---

## Try It Out!

Navigate to: **http://localhost:3000/stream-object**

Examples to try:
1. "Generate a spicy Thai curry recipe" - Watch ingredients appear!
2. "Tell me about Marie Curie" - See biography build up!
3. "Create details for a gaming laptop" - Features populate live!
4. "Write a story about a time-traveling cat" - Characters and plot appear!

The object builds in front of your eyes! ✨

