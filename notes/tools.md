# AI Tools (Function Calling) - Complete Guide

## 📋 Table of Contents
- [What Are AI Tools?](#what-are-ai-tools)
- [How Tools Work](#how-tools-work)
- [Anatomy of a Tool](#anatomy-of-a-tool)
- [The AI's Decision Process](#the-ais-decision-process)
- [Complete Example](#complete-example)
- [Real-World Examples](#real-world-examples)
- [Tool Lifecycle](#tool-lifecycle)
- [Multiple Tools](#multiple-tools)
- [Best Practices](#best-practices)

---

## What Are AI Tools?

**Tools** (also called "function calling") are **functions that you give to the AI** that it can autonomously decide to call when it needs information or wants to perform actions.

### The Problem Without Tools

```
User: "What's the weather in Tokyo?"
AI: "I don't have access to real-time weather data. I'm a language model 
     trained on data up to 2023..." ❌
```

**The AI is limited to its training data.**

### The Solution With Tools

```
User: "What's the weather in Tokyo?"
AI: [Sees it has a getWeather tool]
AI: [Calls getWeather({ city: "Tokyo" })]
AI: [Receives { temperature: 72, condition: "Sunny" }]
AI: "The weather in Tokyo is 72°F and sunny!" ✅
```

**The AI can access real-time data and perform actions!**

---

## How Tools Work

### The Magic: AI-Driven Decision Making

The revolutionary part is that **the AI autonomously decides**:

1. ✅ **WHEN** to use a tool (only when needed)
2. ✅ **WHICH** tool to use (from multiple options)
3. ✅ **WHAT** arguments to pass (extracts from context)
4. ✅ **HOW** to use the result (incorporates into response)

**You just define the tools - the AI orchestrates everything!**

### The Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. User asks: "What's the weather in Paris?"           │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│ 2. AI analyzes prompt and available tools              │
│    AI thinks: "I need current weather data.            │
│               I have a getWeather tool. Let me use it." │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│ 3. AI calls: getWeather({ city: "Paris" })             │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Your function executes:                             │
│    - Calls weather API                                  │
│    - Returns { temperature: 18, condition: "Cloudy" }   │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│ 5. AI receives data and generates response:            │
│    "The weather in Paris is 18°C and cloudy."          │
└─────────────────────────────────────────────────────────┘
```

---

## Anatomy of a Tool

Let's break down a tool definition:

```typescript
import { z } from 'zod';

tools: {
  getWeather: {                              // 1️⃣ Tool name
    
    description: 'Get the weather for a location',  // 2️⃣ What it does
    
    parameters: z.object({                   // 3️⃣ Input schema
      city: z.string().describe('The city to get weather for'),
      units: z.enum(['celsius', 'fahrenheit']).optional(),
    }),
    
    execute: async ({ city, units = 'celsius' }) => {  // 4️⃣ Your function
      // Your actual implementation
      const response = await fetch(
        `https://api.weather.com/data?city=${city}&units=${units}`
      );
      const data = await response.json();
      
      return {
        city,
        temperature: data.temp,
        condition: data.condition,
        humidity: data.humidity,
      };
    },
  },
}
```

### The Four Parts

| Part | Purpose | Details |
|------|---------|---------|
| **1️⃣ Name** | Identifies the tool | AI uses this to call the tool |
| **2️⃣ Description** | Tells AI what it does | AI uses this to decide when to call it |
| **3️⃣ Parameters** | Defines inputs | Zod schema for type-safe validation |
| **4️⃣ Execute** | Your actual code | What runs when AI calls the tool |

---

## The AI's Decision Process

### Example Conversation

**User:** "What's the weather in San Francisco?"

### Behind the Scenes

```typescript
// Step 1: AI receives the prompt and sees available tools
{
  userMessage: "What's the weather in San Francisco?",
  availableTools: ['getWeather', 'getCityInfo']
}

// Step 2: AI analyzes
"The user wants weather information. I see a getWeather tool 
 that can help. Let me call it with city='San Francisco'."

// Step 3: AI generates tool call
{
  type: 'tool-call',
  toolName: 'getWeather',
  args: { city: 'San Francisco' }
}

// Step 4: Vercel AI SDK automatically executes your function
const result = await tools.getWeather.execute({ 
  city: 'San Francisco' 
});
// Returns: { city: 'San Francisco', temperature: 68, condition: 'Sunny' }

// Step 5: AI receives the result
{
  type: 'tool-result',
  toolName: 'getWeather',
  result: { city: 'San Francisco', temperature: 68, condition: 'Sunny' }
}

// Step 6: AI generates final response using the data
"The weather in San Francisco is currently 68°F and sunny."
```

---

## Complete Example

Here's a working example from our project:

### Backend: `app/api/stream-text/route.ts`

```typescript
import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { z } from 'zod';

export async function POST(req: Request) {
  const { prompt } = await req.json();

  const result = streamText({
    model: google('gemini-2.5-flash'),
    
    // Define tools the AI can use
    tools: {
      getWeather: {
        description: 'Get the weather for a location',
        parameters: z.object({
          city: z.string().describe('The city to get weather for'),
        }),
        execute: async ({ city }) => {
          // Simulate API call (replace with real API)
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
          // Simulate database query
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

  return result.toTextStreamResponse();
}
```

### Usage in fullStream

```typescript
for await (const part of result.fullStream) {
  switch (part.type) {
    case 'tool-call':
      console.log(`🔧 Calling ${part.toolName}`, part.args);
      break;
      
    case 'tool-result':
      console.log(`📦 Result from ${part.toolName}:`, part.result);
      break;
      
    case 'text-delta':
      console.log(`📝 Text: ${part.textDelta}`);
      break;
  }
}
```

---

## Real-World Examples

### 1. Database Query Tool

```typescript
tools: {
  getUserData: {
    description: 'Get user information from the database by user ID',
    parameters: z.object({
      userId: z.string().describe('The ID of the user'),
    }),
    execute: async ({ userId }) => {
      const user = await db.user.findUnique({
        where: { id: userId },
        include: { orders: true, profile: true },
      });
      
      return {
        name: user.name,
        email: user.email,
        totalOrders: user.orders.length,
        memberSince: user.createdAt,
      };
    },
  },
}

// Usage:
// User: "Show me John's order history"
// AI: [calls getUserData({ userId: "john-123" })]
// AI: "John has placed 15 orders since joining in 2023."
```

### 2. API Integration Tool

```typescript
tools: {
  searchFlights: {
    description: 'Search for available flights between two cities',
    parameters: z.object({
      from: z.string().describe('Departure city'),
      to: z.string().describe('Arrival city'),
      date: z.string().describe('Date in YYYY-MM-DD format'),
    }),
    execute: async ({ from, to, date }) => {
      const response = await fetch(
        `https://api.flights.com/search?from=${from}&to=${to}&date=${date}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.FLIGHT_API_KEY}`,
          },
        }
      );
      
      const flights = await response.json();
      
      return {
        flights: flights.slice(0, 5).map(f => ({
          airline: f.airline,
          price: f.price,
          departure: f.departureTime,
          arrival: f.arrivalTime,
        })),
      };
    },
  },
}

// Usage:
// User: "Find flights from NYC to LA on Dec 25th"
// AI: [calls searchFlights({ from: "NYC", to: "LA", date: "2024-12-25" })]
// AI: "I found 5 flights: American Airlines at $299, Delta at $315..."
```

### 3. Action Tool

```typescript
tools: {
  sendEmail: {
    description: 'Send an email to a user',
    parameters: z.object({
      to: z.string().email().describe('Recipient email address'),
      subject: z.string().describe('Email subject'),
      body: z.string().describe('Email body content'),
    }),
    execute: async ({ to, subject, body }) => {
      await emailService.send({
        to,
        subject,
        body,
        from: 'noreply@example.com',
      });
      
      return {
        success: true,
        sentAt: new Date().toISOString(),
        recipient: to,
      };
    },
  },
}

// Usage:
// User: "Send John a reminder about the meeting"
// AI: [calls sendEmail({
//   to: "john@example.com",
//   subject: "Meeting Reminder",
//   body: "Don't forget about tomorrow's meeting at 2pm!"
// })]
// AI: "I've sent John a reminder about the meeting."
```

### 4. Calculation Tool

```typescript
tools: {
  calculateMortgage: {
    description: 'Calculate monthly mortgage payment',
    parameters: z.object({
      principal: z.number().describe('Loan amount in dollars'),
      interestRate: z.number().describe('Annual interest rate as percentage'),
      years: z.number().describe('Loan term in years'),
    }),
    execute: async ({ principal, interestRate, years }) => {
      const monthlyRate = interestRate / 100 / 12;
      const numberOfPayments = years * 12;
      
      const monthlyPayment = principal * 
        (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
        (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
      
      return {
        monthlyPayment: monthlyPayment.toFixed(2),
        totalPaid: (monthlyPayment * numberOfPayments).toFixed(2),
        totalInterest: (monthlyPayment * numberOfPayments - principal).toFixed(2),
      };
    },
  },
}

// Usage:
// User: "Calculate mortgage for $300k at 6.5% for 30 years"
// AI: [calls calculateMortgage({ principal: 300000, interestRate: 6.5, years: 30 })]
// AI: "Monthly payment would be $1,896.20..."
```

---

## Tool Lifecycle

Let's trace what happens when the AI uses multiple tools:

### User Prompt
```
"What's the weather in Tokyo and how many people live there?"
```

### Full Execution Flow

```typescript
// Event 1: Stream starts
{ type: 'start' }

// Event 2: Step 1 begins
{ type: 'start-step' }

// Event 3: AI decides to call first tool
{
  type: 'tool-call',
  toolName: 'getWeather',
  args: { city: 'Tokyo' }
}

// Event 4: Tool executes and returns result
{
  type: 'tool-result',
  toolName: 'getWeather',
  result: { temperature: 72, condition: 'Sunny' }
}

// Event 5: AI decides to call second tool
{
  type: 'tool-call',
  toolName: 'getCityInfo',
  args: { city: 'Tokyo' }
}

// Event 6: Second tool returns result
{
  type: 'tool-result',
  toolName: 'getCityInfo',
  result: { population: '14M', country: 'Japan' }
}

// Event 7: Step 1 complete (tool calling phase)
{ type: 'finish-step', finishReason: 'tool-calls' }

// Event 8: Step 2 begins (text generation with tool data)
{ type: 'start-step' }

// Event 9-20: Text generation
{ type: 'text-delta', textDelta: 'Tokyo' }
{ type: 'text-delta', textDelta: ' has' }
{ type: 'text-delta', textDelta: ' a' }
{ type: 'text-delta', textDelta: ' population' }
{ type: 'text-delta', textDelta: ' of' }
{ type: 'text-delta', textDelta: ' 14' }
{ type: 'text-delta', textDelta: ' million' }
{ type: 'text-delta', textDelta: '.' }
{ type: 'text-delta', textDelta: ' The' }
{ type: 'text-delta', textDelta: ' weather' }
{ type: 'text-delta', textDelta: ' is' }
{ type: 'text-delta', textDelta: ' 72°F' }
{ type: 'text-delta', textDelta: ' and' }
{ type: 'text-delta', textDelta: ' sunny' }
{ type: 'text-delta', textDelta: '.' }

// Event 21: Step 2 complete
{ type: 'finish-step', finishReason: 'stop' }

// Event 22: Stream complete
{ type: 'finish', usage: { totalTokens: 150 } }
```

---

## Multiple Tools

The AI can intelligently use multiple tools in sequence or parallel:

### Example: Complex Query

```typescript
tools: {
  getWeather: { /* ... */ },
  getCityInfo: { /* ... */ },
  findRestaurants: { /* ... */ },
  bookHotel: { /* ... */ },
}

// User: "I'm visiting Paris next week. What's the weather like? 
//        Recommend a restaurant and book me a hotel."

// AI will:
// 1. Call getWeather({ city: "Paris" })
// 2. Call getCityInfo({ city: "Paris" })
// 3. Call findRestaurants({ city: "Paris", cuisine: "French" })
// 4. Call bookHotel({ city: "Paris", checkIn: "2024-12-01" })
// 5. Generate comprehensive response using all results
```

### The AI Chooses Intelligently

```typescript
// User: "Hello, how are you?"
// AI: "I'm doing well, thank you! How can I help you today?"
// ✅ No tools called - doesn't need them

// User: "What's 2+2?"
// AI: "2+2 equals 4."
// ✅ No tools called - can answer directly

// User: "What's the weather?"
// AI: [calls getWeather tool]
// ✅ Tool called - needs external data
```

---

## Best Practices

### 1. Clear Descriptions

```typescript
// ❌ Bad: Vague description
{
  description: 'Get data',
  // AI won't know when to use this
}

// ✅ Good: Clear, specific description
{
  description: 'Get the current weather conditions for a specific city, including temperature, humidity, and conditions',
  // AI knows exactly when and how to use this
}
```

### 2. Descriptive Parameters

```typescript
// ❌ Bad: No context
parameters: z.object({
  c: z.string(),
  t: z.number(),
})

// ✅ Good: Clear descriptions
parameters: z.object({
  city: z.string().describe('The name of the city to get weather for'),
  units: z.enum(['celsius', 'fahrenheit']).describe('Temperature units'),
})
```

### 3. Error Handling

```typescript
execute: async ({ city }) => {
  try {
    const response = await fetch(`https://api.weather.com/data?city=${city}`);
    
    if (!response.ok) {
      return {
        error: 'Unable to fetch weather data',
        city,
      };
    }
    
    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error('Weather API error:', error);
    return {
      error: 'Weather service temporarily unavailable',
      city,
    };
  }
}
```

### 4. Return Useful Data

```typescript
// ❌ Bad: Returns too much data
return {
  ...entireAPIResponse, // 100+ fields
}

// ✅ Good: Returns only what's needed
return {
  temperature: data.temp,
  condition: data.condition,
  humidity: data.humidity,
  feelsLike: data.feelsLike,
}
```

### 5. Validate Inputs

```typescript
parameters: z.object({
  city: z.string()
    .min(2, 'City name too short')
    .max(100, 'City name too long')
    .describe('The city name'),
    
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
    .describe('Date in YYYY-MM-DD format'),
})
```

### 6. Logging & Monitoring

```typescript
execute: async ({ city }) => {
  console.log(`[Tool] getWeather called for ${city}`);
  
  const startTime = Date.now();
  const result = await fetchWeather(city);
  const duration = Date.now() - startTime;
  
  console.log(`[Tool] getWeather completed in ${duration}ms`);
  
  // Log to analytics
  await analytics.track('tool_used', {
    tool: 'getWeather',
    duration,
    city,
  });
  
  return result;
}
```

---

## Security Considerations

### ⚠️ Important: Tools Run on Your Server

Tools execute YOUR code with YOUR credentials. Be careful!

### 1. Validate Tool Calls

```typescript
execute: async ({ userId }) => {
  // Check if the current user can access this data
  const currentUser = await getCurrentUser();
  
  if (currentUser.id !== userId && !currentUser.isAdmin) {
    throw new Error('Unauthorized access');
  }
  
  return await db.user.findUnique({ where: { id: userId } });
}
```

### 2. Rate Limiting

```typescript
const rateLimiter = new Map();

execute: async ({ city }) => {
  const key = `weather_${city}`;
  const lastCall = rateLimiter.get(key);
  
  if (lastCall && Date.now() - lastCall < 60000) {
    // Return cached result or throw error
    return cachedResults.get(key);
  }
  
  rateLimiter.set(key, Date.now());
  const result = await fetchWeather(city);
  cachedResults.set(key, result);
  
  return result;
}
```

### 3. Cost Control

```typescript
// Add cost tracking
execute: async ({ query }) => {
  const estimatedCost = calculateCost(query);
  
  if (estimatedCost > MAX_COST_PER_CALL) {
    throw new Error('Query too expensive');
  }
  
  // Track costs
  await db.costs.create({
    data: { tool: 'searchDatabase', cost: estimatedCost },
  });
  
  return await performSearch(query);
}
```

---

## Summary

### Key Concepts

1. **Tools** = Functions the AI can autonomously call
2. **AI Decides** = When, which, what arguments, and how to use results
3. **Four Parts** = Name, description, parameters (Zod schema), execute function
4. **Real-time Data** = Tools let AI access current information
5. **Actions** = Tools can perform operations (send emails, book flights, etc.)

### Why Tools are Revolutionary

| Without Tools | With Tools |
|---------------|------------|
| ❌ Limited to training data | ✅ Access real-time data |
| ❌ Can't perform actions | ✅ Can execute functions |
| ❌ Static responses | ✅ Dynamic, contextual responses |
| ❌ "I don't know" | ✅ "Let me check... Here's the answer" |

### The Magic

You define **what** tools do. The AI figures out **when** and **how** to use them. This transforms AI from a text generator into an intelligent agent that can interact with the real world! 🚀

---

**Remember:** Tools are what make AI truly useful - they bridge the gap between the AI's language understanding and real-world actions and data!

