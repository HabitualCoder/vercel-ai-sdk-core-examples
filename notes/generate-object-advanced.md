# Advanced generateObject - Handling Intent Detection

## The Problem You Discovered

You asked an excellent question that reveals a fundamental characteristic of `generateObject()`:

### What Happened

```typescript
// You used a RECIPE schema
schema: z.object({
  recipe: z.object({
    name: z.string(),
    cuisine: z.string(),
    // ... recipe fields
  })
})

// But asked a NON-RECIPE question
prompt: "Tell me about Sachin Tendulkar"

// AI was forced to return a recipe, so it got creative:
{
  "recipe": {
    "name": "Sorry, I can only provide recipe information...",
    "cuisine": "N/A",
    "difficulty": "easy",
    "servings": 0
  }
}
```

### Why This Happens

**`generateObject()` enforces the schema NO MATTER WHAT.**

The AI **must** return data in the exact structure you defined, even if:
- The question doesn't match the schema
- The data doesn't make sense
- The user is asking something completely different

---

## The Core Tradeoff

| Benefit | Limitation |
|---------|-----------|
| ✅ **Guaranteed structure** | ❌ **Must know what to expect in advance** |
| ✅ **Type-safe** | ❌ **Inflexible to unexpected input** |
| ✅ **Easy to use in code** | ❌ **Wrong prompt = nonsense data** |
| ✅ **Validated automatically** | ❌ **Can't handle mixed intents** |

---

## Solution 1: Intent Detection First (Recommended)

Detect what the user wants, THEN use the appropriate schema:

```typescript
// Step 1: Detect intent
const { object: intent } = await generateObject({
  model: google('gemini-2.5-flash'),
  output: 'enum',
  enum: ['recipe', 'person', 'general-question', 'product'],
  prompt: `Classify what the user is asking for: "${userPrompt}"`,
});

// Step 2: Use appropriate schema based on intent
if (intent === 'recipe') {
  const { object } = await generateObject({
    schema: recipeSchema,
    prompt: userPrompt,
  });
} else if (intent === 'person') {
  const { object } = await generateObject({
    schema: personSchema,
    prompt: userPrompt,
  });
} else if (intent === 'general-question') {
  // Use generateText for open-ended questions
  const { text } = await generateText({
    prompt: userPrompt,
  });
}
```

### Complete Example

```typescript
// app/api/generate-object-smart/route.ts
export async function POST(req: Request) {
  const { prompt } = await req.json();

  // DETECT INTENT FIRST
  const intentDetection = await generateObject({
    model: google('gemini-2.5-flash'),
    output: 'enum',
    enum: ['recipe', 'person', 'general-question', 'product'],
    prompt: `Classify: "${prompt}"
    
    recipe: User wants cooking instructions
    person: User asking about a person
    general-question: General knowledge question
    product: Product information request`,
  });

  const intent = intentDetection.object;

  // USE APPROPRIATE SCHEMA
  switch (intent) {
    case 'recipe':
      return await handleRecipe(prompt);
    case 'person':
      return await handlePerson(prompt);
    case 'general-question':
      return await handleGeneralQuestion(prompt);
    case 'product':
      return await handleProduct(prompt);
  }
}

async function handlePerson(prompt: string) {
  const { object } = await generateObject({
    model: google('gemini-2.5-flash'),
    schema: z.object({
      person: z.object({
        name: z.string(),
        profession: z.string(),
        nationality: z.string(),
        knownFor: z.array(z.string()),
        achievements: z.array(z.string()),
        biography: z.string(),
      }),
    }),
    prompt: `Provide information about: ${prompt}`,
  });

  return Response.json({ type: 'person', data: object });
}
```

**Now asking "Tell me about Sachin Tendulkar" will:**
1. Detect intent = 'person'
2. Use person schema
3. Return properly structured person data! ✅

---

## Solution 2: Frontend Validation

Validate the prompt BEFORE sending to API:

```typescript
// Frontend validation
const validatePrompt = (prompt: string, expectedType: string) => {
  if (expectedType === 'recipe') {
    const recipeKeywords = ['recipe', 'cook', 'bake', 'dish', 'food'];
    const hasKeyword = recipeKeywords.some(kw => 
      prompt.toLowerCase().includes(kw)
    );
    
    if (!hasKeyword) {
      return {
        valid: false,
        message: 'Please ask for a recipe (e.g., "Generate a pasta recipe")',
      };
    }
  }
  
  return { valid: true };
};

// In your component
const handleSubmit = async () => {
  const validation = validatePrompt(prompt, selectedType);
  
  if (!validation.valid) {
    alert(validation.message);
    return;
  }
  
  // Continue with API call...
};
```

---

## Solution 3: Flexible Schema with Optional Fields

Make the schema more flexible:

```typescript
const flexibleRecipeSchema = z.object({
  recipe: z.object({
    // Required fields
    name: z.string(),
    
    // Optional fields
    cuisine: z.string().optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    ingredients: z.array(z.object({
      name: z.string(),
      amount: z.string(),
    })).optional(),
    steps: z.array(z.string()).optional(),
    
    // Error message field
    errorMessage: z.string().optional(),
  }),
});

// If prompt doesn't match, AI can use errorMessage
{
  "recipe": {
    "name": "N/A",
    "errorMessage": "This question is not about recipes. Please ask for a recipe."
  }
}
```

---

## Solution 4: No-Schema for Unknown Intent

When you don't know what to expect, use `no-schema`:

```typescript
const { object } = await generateObject({
  model: google('gemini-2.5-flash'),
  output: 'no-schema',
  prompt: userPrompt, // Any prompt!
});

// AI decides the structure dynamically
```

**Pros:**
- ✅ Flexible - handles any prompt
- ✅ No need to predict structure

**Cons:**
- ❌ No type safety
- ❌ Unpredictable structure
- ❌ Need runtime validation

---

## When to Use Each Approach

### Use Fixed Schema (Original Approach)

```typescript
const { object } = await generateObject({
  schema: recipeSchema,
  prompt: 'Generate a lasagna recipe',
});
```

**When:**
- ✅ You control the prompts (predefined options)
- ✅ Single-purpose API (only recipes, only products, etc.)
- ✅ You validate input on frontend
- ✅ You want maximum type safety

**Example:** Recipe generator app where users can only ask for recipes

---

### Use Intent Detection (Recommended for Multi-Purpose)

```typescript
// Detect first
const intent = await detectIntent(prompt);

// Then use appropriate schema
if (intent === 'recipe') {
  return generateRecipe(prompt);
} else if (intent === 'person') {
  return generatePerson(prompt);
}
```

**When:**
- ✅ Users can ask different types of questions
- ✅ Multi-purpose chatbot/assistant
- ✅ You need structured data for various types
- ✅ You want smart routing

**Example:** General AI assistant that handles multiple question types

---

### Use No-Schema (For Completely Open-Ended)

```typescript
const { object } = await generateObject({
  output: 'no-schema',
  prompt: userPrompt,
});
```

**When:**
- ✅ Completely unpredictable structure
- ✅ User defines what they want
- ✅ Exploratory/research use case
- ✅ You'll validate the result yourself

**Example:** "Generate any JSON data about X"

---

### Use generateText (For Unstructured Answers)

```typescript
const { text } = await generateText({
  prompt: userPrompt,
});
```

**When:**
- ✅ Answer doesn't fit a structure
- ✅ Essay-style responses
- ✅ Explanations, summaries
- ✅ Open-ended conversation

**Example:** "Explain quantum physics" - doesn't need structure

---

## The Smart Pattern

Here's the recommended pattern for a robust app:

```typescript
async function handleUserPrompt(prompt: string) {
  // 1. Detect intent
  const intent = await detectIntent(prompt);
  
  // 2. Route to appropriate handler
  switch (intent) {
    case 'structured-data':
      // Use generateObject with schema
      return generateStructuredData(prompt);
      
    case 'open-ended-question':
      // Use generateText
      return generateTextResponse(prompt);
      
    case 'classification':
      // Use enum strategy
      return classifyContent(prompt);
      
    default:
      return { error: 'Could not understand request' };
  }
}
```

---

## Real-World Example: Smart Assistant

```typescript
// app/api/smart-assistant/route.ts
export async function POST(req: Request) {
  const { prompt } = await req.json();

  // Step 1: Classify the request
  const { object: category } = await generateObject({
    model: google('gemini-2.5-flash'),
    output: 'enum',
    enum: [
      'recipe-request',
      'person-info',
      'product-recommendation',
      'general-knowledge',
      'creative-writing',
      'technical-help',
    ],
    prompt: `Classify this request: "${prompt}"`,
  });

  // Step 2: Handle based on category
  switch (category) {
    case 'recipe-request':
      return generateObject({
        schema: recipeSchema,
        prompt,
      });

    case 'person-info':
      return generateObject({
        schema: personSchema,
        prompt,
      });

    case 'product-recommendation':
      return generateObject({
        output: 'array',
        schema: productSchema,
        prompt,
      });

    case 'general-knowledge':
    case 'creative-writing':
    case 'technical-help':
      // These need unstructured responses
      return generateText({ prompt });

    default:
      return Response.json({ error: 'Unknown request type' });
  }
}
```

---

## Key Insights

### 1. Schema = Contract

Think of the schema as a **contract**:

> "I WILL return data in this exact shape, no matter what."

If the data doesn't fit the contract, you get weird results.

### 2. You Must Know What You Want

`generateObject()` requires you to **know the structure in advance**.

This is:
- **Good** when you control the inputs
- **Bad** when users can ask anything

### 3. Intent Detection is Powerful

Adding a classification step gives you:
- ✅ Flexibility (handle multiple question types)
- ✅ Structure (still use schemas for appropriate data)
- ✅ Smart routing (use right tool for the job)

**Cost:** One extra AI call, but worth it for robust apps

### 4. Mix and Match

You can use different approaches:
- `generateObject` + schema for structured data
- `generateText` for open-ended answers
- Intent detection to route between them

---

## Updated Example: Multi-Intent App

Navigate to: **http://localhost:3000/generate-object-smart**

Try these prompts:
1. "Generate a chocolate cake recipe" → Recipe schema
2. "Tell me about Sachin Tendulkar" → Person schema
3. "What is the capital of France?" → Plain text
4. "Recommend a smartphone" → Product schema

The app will automatically detect intent and use the right approach! ✨

---

## Summary

### The Problem

```
Fixed Schema + Wrong Prompt = Nonsense Data
```

### The Solution

```
Detect Intent → Choose Right Schema → Get Good Data
```

### When to Use What

| Scenario | Approach |
|----------|----------|
| Single-purpose app (only recipes) | Fixed schema |
| Multi-purpose app | Intent detection |
| Unpredictable structure | No-schema |
| Unstructured answer | generateText |
| Classification task | Enum strategy |

**Remember:** `generateObject()` is powerful but opinionated. You must either control the inputs OR detect intent first to use the right schema! 🎯

