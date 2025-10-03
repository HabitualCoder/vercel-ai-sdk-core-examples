# Prompt Engineering with Vercel AI SDK

## ðŸ“‹ Overview

Prompt engineering is the art and science of crafting effective prompts to get the best results from AI models. When working with the Vercel AI SDK, especially with **tools** and **structured data generation**, good prompts become even more critical.

This guide covers best practices and debugging techniques for prompt engineering.

---

## ðŸŽ¯ Tips for Effective Prompts

### General Prompt Guidelines

1. **Be specific and clear** - The more context you provide, the better
2. **Use examples** - Show the model what you want
3. **Iterate** - Test and refine your prompts
4. **Consider the model** - Different models have different strengths

---

## ðŸ”§ Prompts for Tools

When creating prompts that include tools, getting good results can be tricky as the number and complexity of your tools increases.

### 7 Golden Rules for Tool Prompts

#### 1. Use Strong Models

**Use models that excel at tool calling:**
- âœ… `gpt-4` or `gpt-4.1` (OpenAI)
- âœ… `gemini-2.5-flash` (Google)
- âŒ Weaker/smaller models often struggle with tools

**Example:**
```typescript
const result = await generateText({
  model: google('gemini-2.5-flash'), // âœ… Strong model
  tools: { /* your tools */ },
  prompt: 'What is the weather in Paris?',
});
```

#### 2. Keep Tool Count Low (â‰¤5)

**Why:** More tools = more confusion for the model

```typescript
// âŒ BAD - Too many tools
const tools = {
  getWeather: { /* ... */ },
  getCityInfo: { /* ... */ },
  getRestaurants: { /* ... */ },
  getHotels: { /* ... */ },
  getFlights: { /* ... */ },
  getAttractions: { /* ... */ },
  getEvents: { /* ... */ },
  getNews: { /* ... */ }, // Model gets confused!
};

// âœ… GOOD - Focused set of tools
const tools = {
  getWeather: { /* ... */ },
  getCityInfo: { /* ... */ },
  getAttractions: { /* ... */ },
};
```

#### 3. Keep Parameters Simple

**Why:** Complex schemas are hard for models to understand

```typescript
// âŒ BAD - Too complex
const complexTool = tool({
  description: 'Search products',
  parameters: z.object({
    query: z.string(),
    filters: z.object({
      category: z.union([
        z.literal('electronics'),
        z.literal('clothing'),
        z.literal('food'),
      ]).optional(),
      priceRange: z.object({
        min: z.number().optional(),
        max: z.number().optional(),
      }).optional(),
      brands: z.array(z.string()).optional(),
      ratings: z.array(z.number()).optional(),
    }).optional(),
    sort: z.enum(['price', 'rating', 'popularity']).optional(),
  }),
});

// âœ… GOOD - Simple and clear
const simpleTool = tool({
  description: 'Search products by name',
  parameters: z.object({
    query: z.string(),
    category: z.string(),
  }),
});
```

#### 4. Use Meaningful Names

**Why:** Names convey intent to the model

```typescript
// âŒ BAD - Unclear names
const tools = {
  fn1: tool({
    description: 'Gets data',
    parameters: z.object({
      x: z.string(),
      y: z.number(),
    }),
  }),
};

// âœ… GOOD - Semantic names
const tools = {
  getUserProfile: tool({
    description: 'Retrieves user profile information',
    parameters: z.object({
      userId: z.string(),
      includeActivity: z.boolean(),
    }),
  }),
};
```

#### 5. Add Descriptions to Schema Properties

**Why:** Helps the model understand what each parameter does

```typescript
// âŒ BAD - No descriptions
const tool1 = tool({
  description: 'Get weather',
  parameters: z.object({
    city: z.string(),
    units: z.string(),
  }),
});

// âœ… GOOD - With descriptions
const tool2 = tool({
  description: 'Get current weather for a location',
  parameters: z.object({
    city: z.string().describe('The city name (e.g., "Paris", "New York")'),
    units: z.string().describe('Temperature units: "celsius" or "fahrenheit"'),
  }),
});
```

**Real example from our code:**
```typescript
getWeather: {
  description: 'Get the weather for a location',
  parameters: z.object({
    city: z.string().describe('The city to get weather for'),
  }),
}
```

#### 6. Describe Tool Outputs

**Why:** When tools have dependencies, the model needs to understand what data flows between them

```typescript
const tools = {
  getUserId: tool({
    description: 'Gets user ID from email. Returns an object with userId field.',
    // â†‘ Tells model what to expect in the output
    parameters: z.object({
      email: z.string(),
    }),
    execute: async ({ email }) => ({ userId: '123' }),
  }),
  
  getUserOrders: tool({
    description: 'Gets orders for a user. Requires userId from getUserId tool.',
    // â†‘ Shows dependency
    parameters: z.object({
      userId: z.string(),
    }),
    execute: async ({ userId }) => (/* orders */),
  }),
};
```

#### 7. Include Examples in Prompts

**Why:** Shows the model exactly how to use tools

```typescript
const result = await generateText({
  model: google('gemini-2.5-flash'),
  tools: { searchProducts },
  prompt: `
    Search for products based on the user's query.
    
    Example tool calls:
    - searchProducts({ query: "laptop", category: "electronics" })
    - searchProducts({ query: "red dress", category: "clothing" })
    
    User query: Find me a blue backpack
  `,
});
```

---

## ðŸ“Š Tool & Structured Data Schemas

### Zod Schema Best Practices

The mapping from Zod schemas to model inputs (JSON schema) is not always straightforward.

### 1. Working with Dates

**Problem:** Zod expects JavaScript Date objects, but models return strings.

**Solution:** Use string validation + transformer

```typescript
// âŒ BAD - Model can't return Date objects
const badSchema = z.object({
  events: z.array(
    z.object({
      event: z.string(),
      date: z.date(), // Model returns string, not Date!
    })
  ),
});

// âœ… GOOD - Validate as string, transform to Date
const goodSchema = z.object({
  events: z.array(
    z.object({
      event: z.string(),
      date: z
        .string()
        .date() // Validates YYYY-MM-DD format
        .transform(value => new Date(value)), // Convert to Date
    })
  ),
});

// Usage
const result = await generateObject({
  model: google('gemini-2.5-flash'),
  schema: goodSchema,
  prompt: 'List 5 important events from the year 2000.',
});

// result.object.events[0].date is now a Date object! âœ…
```

**Other date formats:**
```typescript
// ISO 8601 datetime
z.string().datetime() // "2024-01-01T12:00:00Z"

// Date only
z.string().date() // "2024-01-01"

// Custom format with regex
z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/) // "01/01/2024"
```

### 2. Optional Parameters

**Problem:** Some providers (OpenAI strict mode) don't work well with `.optional()`

**Solution:** Use `.nullable()` instead

```typescript
// âŒ May fail with strict schema validation (OpenAI)
const failingTool = tool({
  description: 'Execute a command',
  parameters: z.object({
    command: z.string(),
    workdir: z.string().optional(), // Can cause errors
    timeout: z.number().optional(),
  }),
});

// âœ… Works with strict schema validation
const workingTool = tool({
  description: 'Execute a command',
  parameters: z.object({
    command: z.string(),
    workdir: z.string().nullable(), // Use nullable
    timeout: z.number().nullable(),
  }),
});
```

**What's the difference?**

| `.optional()` | `.nullable()` |
|---------------|---------------|
| Field may be missing | Field must be present but can be `null` |
| `{ command: "ls" }` | `{ command: "ls", workdir: null }` |
| Not always compatible | More compatible |

**Best practice:** Use `.nullable()` for tool parameters

### 3. Temperature Settings

**Rule:** For tools and structured data, use `temperature: 0`

**Why:**
- Tools need precise, deterministic outputs
- Structured data must match exact schemas
- No need for creativity in tool calls

```typescript
// âœ… GOOD - Deterministic tool calls
const result = await generateText({
  model: google('gemini-2.5-flash'),
  temperature: 0, // No randomness
  tools: {
    getWeather: { /* ... */ },
  },
  prompt: 'What is the weather in Tokyo?',
});

// âœ… GOOD - Consistent structured output
const structured = await generateObject({
  model: google('gemini-2.5-flash'),
  temperature: 0, // Consistent format
  schema: z.object({
    name: z.string(),
    age: z.number(),
  }),
  prompt: 'Extract: John is 30 years old',
});
```

**When to use temperature > 0:**
- Creative writing
- Generating variations
- Brainstorming ideas
- Chat conversations

**When to use temperature = 0:**
- Tool calling âœ…
- Structured data generation âœ…
- Data extraction âœ…
- Precise answers âœ…

---

## ðŸ› Debugging Prompts

### 1. Inspecting Warnings

Not all providers support all features. Check for warnings to see if your setup is compatible.

```typescript
const result = await generateText({
  model: google('gemini-2.5-flash'),
  prompt: 'Hello, world!',
  // Some feature the provider might not support
});

// Check warnings
console.log(result.warnings);

// Example output:
// [
//   {
//     type: 'unsupported-setting',
//     setting: 'logprobs',
//     message: 'Provider does not support logprobs'
//   }
// ]
```

**What to do with warnings:**
1. Check if the feature is critical
2. Use a different provider if needed
3. Adjust your prompt/settings

### 2. Inspecting HTTP Request Bodies

For debugging provider-specific issues, inspect the raw request.

```typescript
const result = await generateText({
  model: google('gemini-2.5-flash'),
  tools: {
    getWeather: {
      description: 'Get weather',
      parameters: z.object({
        city: z.string(),
      }),
    },
  },
  prompt: 'What is the weather in Paris?',
});

// See the exact payload sent to the provider
console.log(result.request.body);

// Example output for Google:
// {
//   generationConfig: {},
//   contents: [
//     {
//       role: 'user',
//       parts: [{ text: 'What is the weather in Paris?' }]
//     }
//   ],
//   tools: {
//     functionDeclarations: [
//       {
//         name: 'getWeather',
//         description: 'Get weather',
//         parameters: { /* ... */ }
//       }
//     ]
//   }
// }
```

**Use cases:**
- Debugging tool call issues
- Verifying prompt formatting
- Checking parameter serialization
- Understanding provider differences

---

## ðŸ“ Practical Examples from Our Code

### Example 1: Simple Tool Prompt

From our `stream-text` demo:

```typescript
const result = streamText({
  model: google('gemini-2.5-flash'),
  tools: {
    getWeather: {
      description: 'Get the weather for a location',
      parameters: z.object({
        city: z.string().describe('The city to get weather for'),
      }),
    },
  },
  prompt: 'What is the weather like in San Francisco?',
});
```

**Why this works:**
- âœ… Clear, direct prompt
- âœ… Tool has semantic name
- âœ… Parameter has description
- âœ… Strong model (gemini-2.5-flash)

### Example 2: Explicit Tool Usage

From our `mcp-demo`:

```typescript
const result = await generateText({
  model: google('gemini-2.5-flash'),
  tools: githubTools,
  stopWhen: ({ stepNumber }) => stepNumber >= 3,
  prompt: `Use the get_repository tool to fetch information about ${owner}/${repo}. 
           Provide a summary with stars, description, language, and other details.`,
});
```

**Why this works:**
- âœ… Explicitly tells model to use the tool
- âœ… Specifies what data to extract
- âœ… Clear output expectations
- âœ… Uses `stopWhen` for multi-step

### Example 3: Structured Data with Intent Detection

From our `generate-object-smart`:

```typescript
// Step 1: Classify intent
const intentResult = await generateObject({
  model: google('gemini-2.5-flash'),
  schema: z.object({
    intent: z.enum(['recipe', 'person', 'general-question', 'product']),
    confidence: z.number(),
  }),
  prompt: `Classify the user's intent: "${prompt}"`,
});

// Step 2: Use appropriate schema based on intent
if (intentResult.object.intent === 'recipe') {
  return await generateObject({
    model: google('gemini-2.5-flash'),
    schema: recipeSchema,
    prompt,
  });
}
```

**Why this works:**
- âœ… Two-step approach for accuracy
- âœ… Clear classification prompt
- âœ… Schema matches intent
- âœ… Avoids forcing wrong schema

---

## ðŸŽ“ Best Practices Summary

### DO âœ…

1. **Use temperature: 0** for tools and structured data
2. **Keep tool count low** (â‰¤5 tools)
3. **Use .nullable()** instead of .optional() for compatibility
4. **Add .describe()** to all schema properties
5. **Use semantic names** for tools and parameters
6. **Transform dates** using z.string().date().transform()
7. **Check warnings** to verify provider compatibility
8. **Be explicit** in prompts about tool usage
9. **Include examples** when needed
10. **Test and iterate** your prompts

### DON'T âŒ

1. **Don't use z.date()** - models return strings
2. **Don't create complex nested schemas** - keep it simple
3. **Don't use too many tools** - confuses the model
4. **Don't use vague names** - be semantic
5. **Don't skip descriptions** - every parameter should have one
6. **Don't ignore warnings** - they indicate issues
7. **Don't assume the model knows** - be explicit
8. **Don't use high temperature** for structured output

---

## ðŸ” Quick Reference

### Temperature Guide

| Use Case | Temperature |
|----------|-------------|
| Tool calling | 0 |
| Structured data | 0 |
| Data extraction | 0 |
| Precise answers | 0 |
| Creative writing | 0.7-1.0 |
| Chat conversations | 0.5-0.7 |
| Brainstorming | 0.8-1.0 |

### Zod Schema Cheatsheet

```typescript
// Strings
z.string()
z.string().describe('User name')
z.string().email()
z.string().url()
z.string().min(5).max(100)

// Numbers
z.number()
z.number().int()
z.number().min(0).max(100)

// Dates (for AI models)
z.string().date() // "2024-01-01"
z.string().datetime() // "2024-01-01T12:00:00Z"
z.string().date().transform(v => new Date(v))

// Optionality
z.string().nullable() // Preferred for tools
z.string().optional() // May cause issues

// Arrays
z.array(z.string())
z.array(z.object({ name: z.string() }))

// Enums
z.enum(['option1', 'option2', 'option3'])

// Objects
z.object({
  name: z.string().describe('Person name'),
  age: z.number().describe('Age in years'),
})
```

### Debugging Checklist

- [ ] Check `result.warnings` for compatibility issues
- [ ] Inspect `result.request.body` for payload verification
- [ ] Verify tool descriptions are clear
- [ ] Ensure all parameters have `.describe()`
- [ ] Use `temperature: 0` for tools
- [ ] Keep tool count â‰¤ 5
- [ ] Test with strong model (gpt-4, gemini-2.5-flash)
- [ ] Add examples to prompt if model struggles

---

## ðŸš€ Advanced: Multi-Step Tool Reasoning

When tools depend on each other, guide the model:

```typescript
const result = await generateText({
  model: google('gemini-2.5-flash'),
  tools: {
    searchUser: {
      description: 'Search for user by email. Returns userId.',
      parameters: z.object({
        email: z.string(),
      }),
      execute: async ({ email }) => ({ userId: 'user_123' }),
    },
    getOrders: {
      description: 'Get orders for a user. Requires userId from searchUser.',
      parameters: z.object({
        userId: z.string(),
      }),
      execute: async ({ userId }) => (/* orders */),
    },
  },
  stopWhen: ({ stepNumber }) => stepNumber >= 5,
  prompt: `
    Find all orders for user john@example.com.
    
    Steps:
    1. First, use searchUser to get the userId
    2. Then, use getOrders with that userId
  `,
});
```

**Key points:**
- Explain the workflow in the prompt
- Mention tool dependencies
- Use `stopWhen` to allow multi-step execution
- Describe what each tool returns

---

## ðŸ“š Additional Resources

- [AI SDK Tool Calling Docs](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling)
- [AI SDK Structured Data](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data)
- [Zod Documentation](https://zod.dev/)
- Our examples: `/app/generate-object-smart`, `/app/stream-text`

---

**Remember:** Great prompts = Clear + Specific + Semantic + Simple! ðŸŽ¯
