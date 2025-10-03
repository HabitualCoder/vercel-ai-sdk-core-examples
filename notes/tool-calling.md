# Advanced Tool Calling - Complete Guide

## 📋 Table of Contents
- [What We Already Know](#what-we-already-know)
- [Multi-Step Tool Calling](#multi-step-tool-calling)
- [Step Management](#step-management)
- [Response Messages](#response-messages)
- [Tool Choice](#tool-choice)
- [Tool Call Repair](#tool-call-repair)
- [Active Tools](#active-tools)
- [Dynamic Tools](#dynamic-tools)
- [Multi-modal Tool Results](#multi-modal-tool-results)
- [Tool Extraction](#tool-extraction)
- [Error Handling](#error-handling)
- [Advanced Patterns](#advanced-patterns)
- [Best Practices](#best-practices)

---

## What We Already Know

From our `/stream-text` example, we implemented basic tools:

```typescript
import { streamText } from 'ai';
import { z } from 'zod';

const result = streamText({
  model: google('gemini-2.5-flash'),
  tools: {
    getWeather: {
      description: 'Get the weather for a location',
      parameters: z.object({
        city: z.string().describe('The city to get weather for'),
      }),
      execute: async ({ city }) => {
        const response = await fetch(`https://api.weather.com?city=${city}`);
        return await response.json();
      },
    },
    getCityInfo: {
      description: 'Get information about a city',
      parameters: z.object({
        city: z.string(),
      }),
      execute: async ({ city }) => {
        return { population: '1M', country: 'Various' };
      },
    },
  },
  prompt: 'What is the weather in Tokyo?',
});

// AI calls getWeather, we see it in fullStream
for await (const part of result.fullStream) {
  if (part.type === 'tool-call') {
    console.log('Tool called:', part.toolName);
  }
  if (part.type === 'tool-result') {
    console.log('Tool result:', part.result);
  }
}
```

**What this does:**
1. ✅ AI decides when to use tools
2. ✅ Calls tool with extracted parameters
3. ✅ Returns result
4. ❌ **Stream ends** - No follow-up response!

**The problem:** AI calls the tool but doesn't use the result to generate a final answer.

---

## Multi-Step Tool Calling

This is the **most important** advanced feature. It allows the AI to:
1. Call one or more tools
2. Receive the results
3. Use those results to call more tools OR generate final text

### Without Multi-Step (What We Had)

```typescript
const result = await generateText({
  model: google('gemini-2.5-flash'),
  tools: { getWeather },
  prompt: 'What is the weather in San Francisco?',
});

// Step 1 only:
// - AI calls getWeather({ city: 'San Francisco' })
// - Returns: { temperature: 72, condition: 'Sunny' }
// - Generation STOPS

console.log(result.toolCalls);
// [{ toolName: 'getWeather', args: { city: 'San Francisco' } }]

console.log(result.text);
// "" (empty! No text generated)
```

**Problem:** You get the tool call, but AI doesn't generate a user-friendly response.

### With Multi-Step (stopWhen)

```typescript
import { generateText, tool, stepCountIs } from 'ai';
import { z } from 'zod';

const { text, steps } = await generateText({
  model: google('gemini-2.5-flash'),
  
  tools: {
    getWeather: tool({
      description: 'Get the weather in a location',
      inputSchema: z.object({
        location: z.string().describe('The location to get weather for'),
      }),
      execute: async ({ location }) => ({
        location,
        temperature: 72,
        condition: 'Sunny',
      }),
    }),
  },
  
  // ⭐ NEW! Allow multiple steps
  stopWhen: stepCountIs(5), // Stop after max 5 steps
  
  prompt: 'What is the weather in San Francisco?',
});

// Step 1:
// - AI calls getWeather({ location: 'San Francisco' })
// - Returns: { temperature: 72, condition: 'Sunny' }

// Step 2:
// - AI receives tool result
// - Generates: "The weather in San Francisco is 72°F and sunny!"

console.log(text);
// "The weather in San Francisco is 72°F and sunny!"

console.log(steps.length);
// 2 (two steps were needed)
```

### Stopping Conditions

The Vercel AI SDK provides several `stopWhen` helpers:

```typescript
import { stepCountIs, stepFinishReasonIs } from 'ai';

// Stop after N steps
stopWhen: stepCountIs(5)

// Stop when finish reason matches
stopWhen: stepFinishReasonIs('stop') // AI said it's done

// Custom condition
stopWhen: (step, stepNumber) => {
  // Stop if no more tool calls
  return step.toolCalls.length === 0;
}

// Stop if too many tokens used
stopWhen: (step) => {
  return step.usage.totalTokens > 10000;
}

// Combine conditions
stopWhen: (step, stepNumber) => {
  return stepNumber >= 5 || step.finishReason === 'stop';
}
```

### Complex Multi-Step Example

```typescript
const { text, steps } = await generateText({
  model: google('gemini-2.5-flash'),
  
  tools: {
    getWeather: tool({
      description: 'Get current weather',
      inputSchema: z.object({
        city: z.string(),
      }),
      execute: async ({ city }) => ({
        temperature: 72,
        condition: 'Sunny',
      }),
    }),
    
    getRestaurants: tool({
      description: 'Find restaurants in a city',
      inputSchema: z.object({
        city: z.string(),
        cuisine: z.string().optional(),
      }),
      execute: async ({ city, cuisine }) => ({
        restaurants: [
          { name: 'Restaurant 1', rating: 4.5 },
          { name: 'Restaurant 2', rating: 4.7 },
        ],
      }),
    }),
    
    bookTable: tool({
      description: 'Book a restaurant table',
      inputSchema: z.object({
        restaurant: z.string(),
        time: z.string(),
      }),
      execute: async ({ restaurant, time }) => ({
        confirmed: true,
        confirmationNumber: 'ABC123',
      }),
    }),
  },
  
  stopWhen: stepCountIs(10),
  
  prompt: 'I want to eat Italian food in San Francisco tonight. Can you help?',
});

// Step 1: AI calls getWeather to check conditions
// Step 2: AI calls getRestaurants({ city: 'San Francisco', cuisine: 'Italian' })
// Step 3: AI generates text: "I found 2 great Italian restaurants..."
// Step 4: User says "Book the first one at 7pm" (in conversation)
// Step 5: AI calls bookTable({ restaurant: 'Restaurant 1', time: '7pm' })
// Step 6: AI generates: "Your table is booked! Confirmation: ABC123"

console.log(steps.length); // 6 steps
```

---

## Step Management

When using multi-step calls, you get detailed information about each step:

### Accessing Steps

```typescript
const { steps, text } = await generateText({
  model: google('gemini-2.5-flash'),
  tools: { weather, news, stocks },
  stopWhen: stepCountIs(10),
  prompt: 'Give me weather, news, and stock updates for San Francisco',
});

// Each step contains:
steps.forEach((step, i) => {
  console.log(`\n=== Step ${i + 1} ===`);
  console.log('Text:', step.text);
  console.log('Tool Calls:', step.toolCalls);
  console.log('Tool Results:', step.toolResults);
  console.log('Finish Reason:', step.finishReason);
  console.log('Usage:', step.usage);
});

// Extract all tool calls from all steps
const allToolCalls = steps.flatMap(step => step.toolCalls);
console.log('Total tool calls:', allToolCalls.length);

// Calculate total token usage
const totalTokens = steps.reduce((sum, step) => sum + step.usage.totalTokens, 0);
console.log('Total tokens used:', totalTokens);

// See which tools were used
const toolsUsed = new Set(allToolCalls.map(call => call.toolName));
console.log('Tools used:', Array.from(toolsUsed));
```

### Step Structure

```typescript
// Each step has this structure:
{
  text: string,                    // Generated text in this step
  toolCalls: ToolCall[],           // Tools called in this step
  toolResults: ToolResult[],       // Tool results in this step
  finishReason: 'stop' | 'length' | 'tool-calls' | ...,
  usage: {
    promptTokens: number,
    completionTokens: number,
    totalTokens: number,
  },
  warnings: Warning[],             // Any warnings
  request: { ... },                // Request metadata
  response: { ... },               // Response metadata
}
```

---

## onStepFinish Callback

Get notified when each step completes:

```typescript
const result = await generateText({
  model: google('gemini-2.5-flash'),
  tools: { weather, news },
  stopWhen: stepCountIs(5),
  prompt: 'Get weather and news for Tokyo',
  
  // ⭐ Called after EACH step
  onStepFinish({ text, toolCalls, toolResults, finishReason, usage, stepNumber }) {
    console.log(`\n📍 Step ${stepNumber} finished`);
    console.log('Reason:', finishReason);
    console.log('Tokens:', usage.totalTokens);
    
    // Log tool usage
    if (toolCalls.length > 0) {
      console.log('Tools called:');
      toolCalls.forEach(call => {
        console.log(`  - ${call.toolName}(${JSON.stringify(call.args)})`);
      });
    }
    
    // Log text generation
    if (text) {
      console.log('Generated text:', text);
    }
    
    // Save to database
    await db.chatHistory.create({
      stepNumber,
      text,
      toolCalls,
      toolResults,
      usage,
      timestamp: new Date(),
    });
    
    // Send progress to user
    await sendProgress({
      step: stepNumber,
      status: finishReason,
      text,
    });
  },
});
```

**Use cases:**
- 📊 Analytics and logging
- 💾 Save intermediate results
- 📡 Real-time progress updates
- 🐛 Debugging multi-step flows
- 💰 Cost tracking per step

---

## prepareStep Callback

Modify behavior BEFORE each step executes:

```typescript
const result = await generateText({
  model: google('gemini-2.5-flash'),
  tools: {
    weatherAPI: tool({ /* ... */ }),
    newsAPI: tool({ /* ... */ }),
    stocksAPI: tool({ /* ... */ }),
  },
  stopWhen: stepCountIs(10),
  prompt: 'Complex multi-step task',
  
  // ⭐ Called BEFORE each step
  prepareStep: async ({ model, stepNumber, steps, messages }) => {
    console.log(`\n🔄 Preparing step ${stepNumber}...`);
    
    // Use different model for first step
    if (stepNumber === 0) {
      return {
        model: google('gemini-2.0-flash-exp'), // Faster model for planning
        toolChoice: { type: 'required' }, // Force tool use
        activeTools: ['weatherAPI'], // Only weather on first step
      };
    }
    
    // Use more powerful model for complex steps
    if (stepNumber > 3) {
      return {
        model: google('gemini-2.5-flash'), // More capable
      };
    }
    
    // Compress conversation for long contexts
    if (messages.length > 20) {
      console.log('⚠️ Compressing conversation history');
      return {
        messages: [
          messages[0], // Keep system message
          ...messages.slice(-10), // Keep last 10 only
        ],
      };
    }
    
    // Force specific tool based on previous step
    const previousStep = steps[steps.length - 1];
    if (previousStep?.toolCalls.some(call => call.toolName === 'weatherAPI')) {
      return {
        activeTools: ['newsAPI'], // If we got weather, get news next
      };
    }
    
    // Default: no changes
    return {};
  },
});
```

**Use cases:**
- 🎯 Different models per step
- 🔧 Force or limit tools per step
- 📝 Compress long conversations
- 🧠 Implement custom reasoning patterns
- 💰 Cost optimization (cheaper models for simple steps)

---

## Response Messages

Easily maintain conversation history:

### Without response.messages (Manual)

```typescript
const messages = [
  { role: 'user', content: 'What is the weather in Tokyo?' },
];

const result = await generateText({
  model: google('gemini-2.5-flash'),
  tools: { getWeather },
  messages,
});

// 😰 Manually format tool call message
messages.push({
  role: 'assistant',
  content: [
    {
      type: 'tool-call',
      toolCallId: result.toolCalls[0].toolCallId,
      toolName: result.toolCalls[0].toolName,
      args: result.toolCalls[0].args,
    },
  ],
});

// 😰 Manually format tool result message
messages.push({
  role: 'tool',
  content: [
    {
      type: 'tool-result',
      toolCallId: result.toolCalls[0].toolCallId,
      toolName: result.toolCalls[0].toolName,
      result: result.toolResults[0].result,
    },
  ],
});

// 😰 Manually format assistant response
messages.push({
  role: 'assistant',
  content: result.text,
});
```

### With response.messages (Automatic)

```typescript
const messages = [
  { role: 'user', content: 'What is the weather in Tokyo?' },
];

const result = await generateText({
  model: google('gemini-2.5-flash'),
  tools: { getWeather },
  messages,
  stopWhen: stepCountIs(5),
});

// ✅ Automatically formatted, correct structure!
messages.push(...result.response.messages);

// Now messages contains:
// 1. User message
// 2. Assistant message with tool call
// 3. Tool message with result
// 4. Assistant message with final text

// Ready for next turn!
const nextResult = await generateText({
  model: google('gemini-2.5-flash'),
  tools: { getWeather },
  messages: [
    ...messages,
    { role: 'user', content: 'What about Paris?' },
  ],
});
```

**Benefits:**
- ✅ Correct message format
- ✅ Handles multiple tool calls
- ✅ Handles multi-step flows
- ✅ No manual formatting
- ✅ Works with all models

---

## Tool Choice

Control when and which tools are used:

### 1. Auto (Default) - AI Decides

```typescript
const result = await generateText({
  model: google('gemini-2.5-flash'),
  tools: { weather, news },
  toolChoice: { type: 'auto' }, // Default, can omit
  prompt: 'Hello!',
});

// AI decides:
// - "Hello!" → No tools needed, generates greeting
// - "What's the weather?" → Uses weather tool
```

### 2. Required - Must Use SOME Tool

```typescript
const result = await generateText({
  model: google('gemini-2.5-flash'),
  tools: { weather, news, stocks },
  toolChoice: { type: 'required' }, // MUST use at least one tool
  prompt: 'Tell me something interesting',
});

// AI will use at least one of: weather, news, or stocks
// Even if the prompt doesn't explicitly ask for it
```

**Use case:** Force AI to use external data instead of training knowledge

### 3. Tool - Force Specific Tool

```typescript
const result = await generateText({
  model: google('gemini-2.5-flash'),
  tools: { weather, news, stocks },
  toolChoice: {
    type: 'tool',
    toolName: 'weather', // MUST use weather specifically
  },
  prompt: 'What is happening in the world?',
});

// AI will call weather tool even though prompt asks about news
// Useful for debugging or forcing specific behavior
```

**Use case:** Testing, debugging, or enforcing specific workflow

### 4. None - Prevent Tools

```typescript
const result = await generateText({
  model: google('gemini-2.5-flash'),
  tools: { weather, news },
  toolChoice: { type: 'none' }, // Cannot use any tools
  prompt: 'What is the weather in Tokyo?',
});

// AI will answer from training data only
// "I don't have access to real-time weather data..."
```

**Use case:** Force pure text generation without external calls

### Dynamic Tool Choice

```typescript
async function chat(userMessage: string, conversationHistory: Message[]) {
  // Decide tool choice based on context
  let toolChoice;
  
  if (userMessage.toLowerCase().includes('weather')) {
    toolChoice = { type: 'tool', toolName: 'getWeather' };
  } else if (conversationHistory.length === 0) {
    toolChoice = { type: 'none' }; // No tools for greeting
  } else {
    toolChoice = { type: 'auto' }; // Let AI decide
  }
  
  return await generateText({
    model: google('gemini-2.5-flash'),
    tools: { getWeather, getNews },
    toolChoice,
    prompt: userMessage,
  });
}
```

---

## Tool Call Repair

Automatically fix invalid tool calls:

### The Problem

```typescript
// AI generates invalid tool call
{
  toolName: 'getWeather',
  args: {
    location: 'San Francisco',
    unit: 'celsius',
    // Missing required 'country' field!
    // Extra 'unit' field that doesn't exist in schema!
  }
}

// Your schema expects:
z.object({
  location: z.string(),
  country: z.string(), // Required!
})

// ❌ Validation error: InvalidToolInputError
```

### Solution: Auto-Repair

```typescript
const result = await generateText({
  model: google('gemini-2.5-flash'),
  tools: {
    getWeather: tool({
      inputSchema: z.object({
        location: z.string(),
        country: z.string(),
      }),
      execute: async ({ location, country }) => ({ /* ... */ }),
    }),
  },
  prompt: 'Weather in San Francisco?',
  
  // ⭐ Repair invalid tool calls
  experimental_repairToolCall: async ({
    toolCall,
    tools,
    inputSchema,
    error,
    messages,
  }) => {
    console.log('❌ Invalid tool call:', toolCall);
    console.log('Error:', error.message);
    
    // Strategy 1: Use another AI call to fix inputs
    const { object: repairedArgs } = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: tools[toolCall.toolName].inputSchema,
      prompt: [
        `The AI tried to call "${toolCall.toolName}" with:`,
        JSON.stringify(toolCall.args),
        '',
        `But it failed validation. The tool expects:`,
        JSON.stringify(inputSchema(toolCall), null, 2),
        '',
        `Error: ${error.message}`,
        '',
        'Please provide valid inputs for this tool.',
      ].join('\n'),
    });
    
    console.log('✅ Repaired args:', repairedArgs);
    
    return {
      ...toolCall,
      args: repairedArgs,
    };
  },
});
```

### Repair Strategies

#### Strategy 1: Use AI to Fix

```typescript
experimental_repairToolCall: async ({ toolCall, tools, error }) => {
  const tool = tools[toolCall.toolName];
  
  const { object: fixed } = await generateObject({
    model: google('gemini-2.5-flash'),
    schema: tool.inputSchema,
    prompt: `Fix these inputs: ${JSON.stringify(toolCall.args)}
             Error: ${error.message}`,
  });
  
  return { ...toolCall, args: fixed };
}
```

#### Strategy 2: Re-ask Model

```typescript
experimental_repairToolCall: async ({
  toolCall,
  tools,
  error,
  messages,
  system,
}) => {
  // Send error back to model, ask it to try again
  const result = await generateText({
    model: google('gemini-2.5-flash'),
    system,
    messages: [
      ...messages,
      {
        role: 'assistant',
        content: [{
          type: 'tool-call',
          toolCallId: toolCall.toolCallId,
          toolName: toolCall.toolName,
          args: toolCall.args,
        }],
      },
      {
        role: 'tool',
        content: [{
          type: 'tool-result',
          toolCallId: toolCall.toolCallId,
          toolName: toolCall.toolName,
          result: `Error: ${error.message}. Please try again with valid inputs.`,
          isError: true,
        }],
      },
    ],
    tools,
  });
  
  // Return the new tool call
  return result.toolCalls[0];
}
```

#### Strategy 3: Provide Defaults

```typescript
experimental_repairToolCall: async ({ toolCall, error }) => {
  if (error.message.includes('country')) {
    // Add missing country
    return {
      ...toolCall,
      args: {
        ...toolCall.args,
        country: 'USA', // Default
      },
    };
  }
  
  // Can't fix, return null to fail
  return null;
}
```

---

## Active Tools

Limit which tools are available to the model:

### The Problem

```typescript
// You have many tools
const allTools = {
  weather: tool({ /* ... */ }),
  news: tool({ /* ... */ }),
  stocks: tool({ /* ... */ }),
  calendar: tool({ /* ... */ }),
  email: tool({ /* ... */ }),
  // ... 45 more tools
};

// But models have limits (e.g., 64 tools max)
// Too many tools → poor choices, slower, more expensive
```

### Solution: Dynamic Tool Selection

```typescript
const result = await generateText({
  model: google('gemini-2.5-flash'),
  
  // Define all 50 tools (full type safety)
  tools: allTools,
  
  // But only make 2 available for this call
  activeTools: ['weather', 'news'],
  
  prompt: 'What is the weather and news in Tokyo?',
});

// AI can only use weather and news
// Other 48 tools are not sent to model
// But you still have type safety for all tools!
```

### Dynamic Selection Based on Context

```typescript
async function chat(message: string, context: Context) {
  // Determine which tools are relevant
  let activeTools: string[] = [];
  
  if (message.includes('weather')) {
    activeTools.push('weather');
  }
  
  if (message.includes('news')) {
    activeTools.push('news');
  }
  
  if (context.user.hasCalendarAccess) {
    activeTools.push('calendar');
  }
  
  if (context.timeOfDay === 'morning') {
    activeTools.push('news', 'weather');
  }
  
  // Default: all tools if nothing specific
  if (activeTools.length === 0) {
    activeTools = Object.keys(allTools);
  }
  
  return await generateText({
    model: google('gemini-2.5-flash'),
    tools: allTools,
    activeTools, // Dynamic!
    prompt: message,
  });
}
```

### Benefits

- ✅ Define all tools once (type-safe)
- ✅ Dynamically limit per request
- ✅ Better model performance (fewer choices)
- ✅ Lower costs (less prompt tokens)
- ✅ Context-aware tool selection

---

## Dynamic Tools

Create tools at runtime:

### Use Case: User-Provided Tools

```typescript
import { dynamicTool } from 'ai';

// User uploads a plugin with tool definition
const userPluginDefinition = {
  name: 'customCalculator',
  description: 'Perform custom calculations',
  schema: {
    type: 'object',
    properties: {
      expression: { type: 'string' },
    },
  },
  execute: (input) => eval(input.expression), // User's code
};

const result = await generateText({
  model: google('gemini-2.5-flash'),
  tools: {
    // Static tool
    weather: tool({
      inputSchema: z.object({ city: z.string() }),
      execute: async ({ city }) => ({ /* ... */ }),
    }),
    
    // Dynamic tool from user
    [userPluginDefinition.name]: dynamicTool({
      description: userPluginDefinition.description,
      inputSchema: jsonSchema(userPluginDefinition.schema),
      execute: async (input) => {
        return userPluginDefinition.execute(input);
      },
    }),
  },
  prompt: 'Calculate 5 * 10 and tell me the weather',
});
```

### Use Case: Runtime Tool Generation

```typescript
// Generate tools based on database
const dbTables = await db.listTables();

const dynamicTools = {};

for (const table of dbTables) {
  dynamicTools[`query_${table.name}`] = dynamicTool({
    description: `Query the ${table.name} table`,
    inputSchema: z.object({
      filters: z.record(z.any()),
    }),
    execute: async ({ filters }) => {
      return await db[table.name].find(filters);
    },
  });
}

const result = await generateText({
  model: google('gemini-2.5-flash'),
  tools: dynamicTools,
  prompt: 'Find all users where age > 30',
});
```

---

## Multi-modal Tool Results

Tools can return images, not just text/JSON:

### Text/JSON Results (Normal)

```typescript
tools: {
  getWeather: tool({
    execute: async ({ city }) => {
      return {
        temperature: 72,
        condition: 'Sunny',
      };
    },
  }),
}
```

### Image Results (Advanced)

```typescript
tools: {
  takeScreenshot: tool({
    description: 'Take a screenshot of the screen',
    inputSchema: z.object({
      region: z.enum(['full', 'window', 'selection']),
    }),
    
    // Return image data
    execute: async ({ region }) => {
      const screenshot = await captureScreen(region);
      return {
        type: 'image',
        data: screenshot.toString('base64'),
      };
    },
    
    // ⭐ Convert to model input format
    toModelOutput(result) {
      if (typeof result === 'string') {
        return {
          type: 'content',
          value: [{ type: 'text', text: result }],
        };
      }
      
      return {
        type: 'content',
        value: [{
          type: 'image',
          data: result.data,
          mimeType: 'image/png',
        }],
      };
    },
  }),
}

// AI can now "see" the screenshot and reason about it!
```

**Note:** Only supported by some models (e.g., Anthropic Claude)

---

## Tool Extraction

Organize tools in separate files:

### Without Extraction (Everything in One File)

```typescript
// app/api/chat/route.ts - Getting messy!
const result = await generateText({
  tools: {
    weather: tool({
      description: 'Get weather...',
      inputSchema: z.object({ /* ... */ }),
      execute: async ({ /* ... */ }) => { /* 50 lines */ },
    }),
    news: tool({
      description: 'Get news...',
      inputSchema: z.object({ /* ... */ }),
      execute: async ({ /* ... */ }) => { /* 50 lines */ },
    }),
    // ... 10 more tools, 500+ lines total
  },
});
```

### With Extraction (Clean, Organized)

```typescript
// tools/weather-tool.ts
import { tool } from 'ai';
import { z } from 'zod';

export const weatherTool = tool({
  description: 'Get the weather in a location',
  inputSchema: z.object({
    location: z.string().describe('City or location'),
    units: z.enum(['celsius', 'fahrenheit']).default('celsius'),
  }),
  execute: async ({ location, units }) => {
    const response = await fetch(
      `https://api.weather.com/data?location=${location}&units=${units}`
    );
    return await response.json();
  },
});
```

```typescript
// tools/news-tool.ts
import { tool } from 'ai';
import { z } from 'zod';

export const newsTool = tool({
  description: 'Get latest news for a topic',
  inputSchema: z.object({
    topic: z.string(),
    limit: z.number().max(10).default(5),
  }),
  execute: async ({ topic, limit }) => {
    const articles = await newsAPI.search(topic, limit);
    return articles;
  },
});
```

```typescript
// tools/index.ts - Export all tools
export { weatherTool } from './weather-tool';
export { newsTool } from './news-tool';
export { stocksTool } from './stocks-tool';
export { calendarTool } from './calendar-tool';
// ... more tools
```

```typescript
// app/api/chat/route.ts - Clean and simple!
import { weatherTool, newsTool, stocksTool } from '@/tools';

const result = await generateText({
  model: google('gemini-2.5-flash'),
  tools: {
    weather: weatherTool,
    news: newsTool,
    stocks: stocksTool,
  },
  prompt: userMessage,
});
```

**Benefits:**
- ✅ Clean, organized code
- ✅ Each tool is testable independently
- ✅ Easy to add/remove tools
- ✅ Better type inference
- ✅ Reusable across routes

---

## Error Handling

Specific error types for different failures:

### Tool Call Errors

```typescript
import {
  generateText,
  NoSuchToolError,
  InvalidToolInputError,
} from 'ai';

try {
  const result = await generateText({
    model: google('gemini-2.5-flash'),
    tools: { weather },
    prompt: 'Get weather',
  });
} catch (error) {
  // AI tried to call non-existent tool
  if (NoSuchToolError.isInstance(error)) {
    console.log('Tool does not exist:', error.toolName);
    console.log('Available tools:', error.availableTools);
  }
  
  // Tool input validation failed
  if (InvalidToolInputError.isInstance(error)) {
    console.log('Invalid input:', error.toolInput);
    console.log('Validation errors:', error.cause);
  }
  
  // Generic AI error
  console.error('AI generation failed:', error);
}
```

### Tool Execution Errors

```typescript
tools: {
  getWeather: tool({
    execute: async ({ city }) => {
      try {
        const response = await fetch(`https://api.weather.com?city=${city}`);
        
        if (!response.ok) {
          throw new Error(`Weather API returned ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        // Log error
        console.error('Weather API failed:', error);
        
        // Return error to AI
        return {
          error: 'Failed to fetch weather data',
          message: error.message,
        };
        
        // Or throw to stop generation
        // throw error;
      }
    },
  }),
}
```

### With onStepFinish Error Handling

```typescript
const result = await generateText({
  model: google('gemini-2.5-flash'),
  tools: { weather },
  stopWhen: stepCountIs(5),
  
  onStepFinish({ toolCalls, toolResults, finishReason }) {
    // Check for tool errors
    toolResults.forEach(result => {
      if (result.result?.error) {
        console.error(`Tool ${result.toolName} failed:`, result.result.error);
        
        // Send alert
        await sendAlert({
          type: 'tool-error',
          tool: result.toolName,
          error: result.result.error,
        });
      }
    });
    
    // Check for unexpected finish
    if (finishReason === 'error') {
      console.error('Generation failed mid-step');
    }
  },
});
```

---

## Advanced Patterns

### Pattern 1: Agentic Loop with Progress

```typescript
async function agenticTask(goal: string) {
  const maxSteps = 20;
  let currentStep = 0;
  
  const result = await generateText({
    model: google('gemini-2.5-flash'),
    tools: {
      search: searchTool,
      analyze: analyzeTool,
      summarize: summarizeTool,
    },
    stopWhen: stepCountIs(maxSteps),
    prompt: goal,
    
    onStepFinish({ stepNumber, text, toolCalls }) {
      currentStep = stepNumber;
      const progress = (stepNumber / maxSteps) * 100;
      
      console.log(`📊 Progress: ${progress.toFixed(0)}%`);
      console.log(`Step ${stepNumber}/${maxSteps}`);
      
      if (toolCalls.length > 0) {
        console.log('🔧 Tools:', toolCalls.map(c => c.toolName).join(', '));
      }
      
      if (text) {
        console.log('💭 Thinking:', text.substring(0, 100) + '...');
      }
      
      // Update UI
      updateProgress({ step: stepNumber, max: maxSteps, text });
    },
  });
  
  return result;
}
```

### Pattern 2: Conditional Tool Access

```typescript
async function chat(message: string, user: User) {
  // Determine allowed tools based on user permissions
  const allowedTools = [];
  
  if (user.hasPermission('weather')) {
    allowedTools.push('weather');
  }
  
  if (user.hasPermission('email')) {
    allowedTools.push('sendEmail');
  }
  
  if (user.plan === 'premium') {
    allowedTools.push('aiAnalyze', 'aiSummarize');
  }
  
  const result = await generateText({
    model: google('gemini-2.5-flash'),
    tools: allToolsDefinition,
    activeTools: allowedTools,
    prompt: message,
  });
  
  return result.text;
}
```

### Pattern 3: Tool Result Caching

```typescript
const toolCache = new Map();

tools: {
  getWeather: tool({
    execute: async ({ city }) => {
      const cacheKey = `weather:${city}`;
      
      // Check cache
      if (toolCache.has(cacheKey)) {
        const cached = toolCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 min
          console.log('📦 Cache hit for', city);
          return cached.data;
        }
      }
      
      // Fetch fresh data
      console.log('🌐 Fetching weather for', city);
      const data = await fetchWeather(city);
      
      // Cache it
      toolCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });
      
      return data;
    },
  }),
}
```

### Pattern 4: Tool Chain Validation

```typescript
const result = await generateText({
  model: google('gemini-2.5-flash'),
  tools: { search, analyze, summarize },
  stopWhen: stepCountIs(10),
  
  prepareStep: async ({ stepNumber, steps }) => {
    // Enforce tool order: search → analyze → summarize
    if (stepNumber === 0) {
      return {
        activeTools: ['search'], // Must search first
      };
    }
    
    const previousTools = steps.flatMap(s => 
      s.toolCalls.map(c => c.toolName)
    );
    
    if (previousTools.includes('search') && !previousTools.includes('analyze')) {
      return {
        activeTools: ['analyze'], // Must analyze after search
      };
    }
    
    if (previousTools.includes('analyze')) {
      return {
        activeTools: ['summarize'], // Finally summarize
      };
    }
    
    return {};
  },
});
```

---

## Best Practices

### 1. Always Use Multi-Step for Tool Calls

```typescript
// ❌ Bad: Single step, no final response
const result = await generateText({
  tools: { weather },
  prompt: 'What is the weather?',
});
// AI calls tool, generation stops

// ✅ Good: Multi-step, final response
const result = await generateText({
  tools: { weather },
  stopWhen: stepCountIs(5),
  prompt: 'What is the weather?',
});
// AI calls tool, uses result to generate answer
```

### 2. Use Descriptive Tool Descriptions

```typescript
// ❌ Bad: Vague description
description: 'Get data'

// ✅ Good: Clear, specific description
description: 'Get the current weather conditions including temperature, humidity, and forecast for a specific city'
```

### 3. Add Context to Parameters

```typescript
// ❌ Bad: No descriptions
inputSchema: z.object({
  c: z.string(),
  t: z.number(),
})

// ✅ Good: Descriptive parameters
inputSchema: z.object({
  city: z.string().describe('The city name, e.g., "San Francisco" or "Tokyo"'),
  units: z.enum(['celsius', 'fahrenheit']).describe('Temperature units'),
})
```

### 4. Handle Tool Errors Gracefully

```typescript
execute: async ({ city }) => {
  try {
    return await fetchWeather(city);
  } catch (error) {
    // Return error as data, not throw
    return {
      error: true,
      message: 'Weather service unavailable',
      city,
    };
  }
}
```

### 5. Use activeTools for Large Tool Sets

```typescript
// ❌ Bad: Send all 50 tools every time
const result = await generateText({
  tools: all50Tools,
  prompt: message,
});

// ✅ Good: Only relevant tools
const relevantTools = determineRelevantTools(message);
const result = await generateText({
  tools: all50Tools,
  activeTools: relevantTools,
  prompt: message,
});
```

### 6. Log Tool Usage for Debugging

```typescript
onStepFinish({ toolCalls, toolResults, usage }) {
  toolCalls.forEach((call, i) => {
    console.log(`🔧 ${call.toolName}(${JSON.stringify(call.args)})`);
    console.log(`📦 Result:`, toolResults[i]?.result);
  });
  console.log(`💰 Tokens: ${usage.totalTokens}`);
}
```

### 7. Set Reasonable Step Limits

```typescript
// ❌ Bad: Unlimited steps
stopWhen: stepCountIs(1000) // Could loop forever!

// ✅ Good: Reasonable limit
stopWhen: stepCountIs(10) // Enough for complex tasks, prevents runaway
```

### 8. Use response.messages for Conversation

```typescript
// ✅ Always use response.messages
conversationHistory.push(...result.response.messages);

// Not manual formatting!
```

---

## Summary

### Core Concepts

| Feature | Description | When to Use |
|---------|-------------|-------------|
| **Multi-Step** | AI can call tools → use results → continue | Always with tools |
| **stopWhen** | Control when multi-step ends | Set reasonable limits |
| **steps** | Access all steps and tool calls | Debugging, analytics |
| **onStepFinish** | Hook after each step | Logging, progress |
| **prepareStep** | Modify before each step | Dynamic behavior |
| **response.messages** | Auto-formatted history | Conversation apps |
| **toolChoice** | Force/prevent tools | Testing, control |
| **activeTools** | Limit available tools | Large tool sets |
| **repairToolCall** | Fix invalid calls | Robust apps |

### Quick Reference

```typescript
import { generateText, tool, stepCountIs } from 'ai';
import { z } from 'zod';

const result = await generateText({
  model: google('gemini-2.5-flash'),
  
  // Define tools
  tools: {
    myTool: tool({
      description: 'Clear description',
      inputSchema: z.object({
        param: z.string().describe('Parameter description'),
      }),
      execute: async ({ param }) => {
        return { result: 'data' };
      },
    }),
  },
  
  // Multi-step control
  stopWhen: stepCountIs(10),
  
  // Tool control
  toolChoice: { type: 'auto' },
  activeTools: ['myTool'],
  
  // Callbacks
  onStepFinish({ text, toolCalls, usage }) {
    console.log('Step finished');
  },
  
  prepareStep: async ({ stepNumber }) => {
    return {}; // Modify behavior
  },
  
  // Error handling
  experimental_repairToolCall: async ({ toolCall, error }) => {
    return null; // Fix or return null
  },
  
  prompt: 'User message',
});

// Use results
console.log(result.text);
console.log(result.steps);
conversationHistory.push(...result.response.messages);
```

### Key Takeaways

1. **Always use `stopWhen`** for tool calls to get final responses
2. **Use `response.messages`** for conversation history
3. **Extract tools** to separate files for organization
4. **Limit tools** with `activeTools` for better performance
5. **Log everything** with `onStepFinish` for debugging
6. **Handle errors** gracefully in tool execution
7. **Test tool calls** with `toolChoice` forcing

**Remember:** Multi-step tool calling transforms AI from a one-shot assistant into an intelligent agent that can reason, plan, and execute complex tasks! 🚀

