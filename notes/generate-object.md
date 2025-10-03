# Generating Structured Objects with AI SDK

## 📋 Table of Contents
- [What is `generateObject()`?](#what-is-generateobject)
- [Why Use Structured Data?](#why-use-structured-data)
- [Basic Usage](#basic-usage)
- [Output Strategies](#output-strategies)
- [Schema Definition with Zod](#schema-definition-with-zod)
- [Complete Example](#complete-example)
- [Error Handling](#error-handling)
- [vs generateText](#vs-generatetext)
- [Best Practices](#best-practices)

---

## What is `generateObject()`?

`generateObject()` is a function from the Vercel AI SDK that generates **structured, type-safe data** from an AI model instead of plain text.

### Key Characteristics

- 📦 **Structured Output** - Returns validated objects, not strings
- ✅ **Type Safety** - Schema validation with Zod
- 🎯 **Predictable** - Always returns data in the expected format
- 🔧 **Versatile** - Multiple output strategies (object, array, enum, no-schema)

---

## Why Use Structured Data?

### Problem with Plain Text

```typescript
// Using generateText
const { text } = await generateText({
  model: google('gemini-2.5-flash'),
  prompt: 'Generate a recipe for lasagna',
});

console.log(text);
// Output: "Sure! Here's a lasagna recipe: 
//          Ingredients: pasta, cheese, meat...
//          Steps: First, boil the pasta..."

// 😰 Problems:
// - Unstructured text
// - Hard to parse
// - No type safety
// - Inconsistent format
```

### Solution with Structured Objects

```typescript
// Using generateObject
const { object } = await generateObject({
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
  prompt: 'Generate a recipe for lasagna',
});

console.log(object.recipe.name);          // ✅ "Classic Lasagna"
console.log(object.recipe.ingredients);   // ✅ [{name: "pasta", amount: "1 lb"}, ...]
console.log(object.recipe.steps);         // ✅ ["Boil pasta", "Layer ingredients", ...]

// 😊 Benefits:
// - Structured data
// - Easy to use
// - Type safe
// - Consistent format
```

---

## Basic Usage

### Minimal Example

```typescript
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

const { object } = await generateObject({
  model: google('gemini-2.5-flash'),
  schema: z.object({
    name: z.string(),
    age: z.number(),
    email: z.string().email(),
  }),
  prompt: 'Generate a fictional person profile',
});

// Use the structured data
console.log(object.name);   // Type-safe!
console.log(object.age);    // Type-safe!
console.log(object.email);  // Type-safe!
```

---

## Output Strategies

`generateObject` supports different output strategies for different use cases:

### 1. Object Strategy (Default)

Returns a single structured object.

```typescript
const { object } = await generateObject({
  model: google('gemini-2.5-flash'),
  // No need to specify output: 'object' - it's default
  schema: z.object({
    recipe: z.object({
      name: z.string(),
      ingredients: z.array(z.object({
        name: z.string(),
        amount: z.string(),
        unit: z.string(),
      })),
      steps: z.array(z.string()),
    }),
  }),
  prompt: 'Generate a lasagna recipe',
});

// object = { recipe: { name: "...", ingredients: [...], steps: [...] } }
```

**Use for:**
- Single structured entity
- Complex nested objects
- Forms data
- Profile information

### 2. Array Strategy

Returns an array of objects.

```typescript
const { object } = await generateObject({
  model: google('gemini-2.5-flash'),
  output: 'array',  // ← Specify array strategy
  schema: z.object({
    name: z.string(),
    price: z.number(),
    description: z.string(),
  }),
  prompt: 'Generate 5 products for an online store',
});

// object = [
//   { name: "Product 1", price: 29.99, description: "..." },
//   { name: "Product 2", price: 49.99, description: "..." },
//   ...
// ]
```

**Use for:**
- Lists of items
- Multiple entities
- Batch generation
- Collections

### 3. Enum Strategy

Returns one value from predefined options.

```typescript
const { object } = await generateObject({
  model: google('gemini-2.5-flash'),
  output: 'enum',  // ← Specify enum strategy
  enum: ['positive', 'negative', 'neutral'],  // ← Predefined values
  prompt: 'Classify sentiment: "This product is amazing!"',
});

// object = 'positive'  (one of the enum values)
```

**Use for:**
- Classification tasks
- Sentiment analysis
- Category selection
- Decision making

### 4. No Schema Strategy

Generates JSON without predefined schema (dynamic structure).

```typescript
const { object } = await generateObject({
  model: google('gemini-2.5-flash'),
  output: 'no-schema',  // ← No validation
  prompt: 'Generate information about the Eiffel Tower in JSON format',
});

// object = { height: "330m", location: "Paris", ... }
// Structure is determined by the AI
```

**Use for:**
- Dynamic, unpredictable structures
- User-defined formats
- Exploratory data generation
- Flexible responses

---

## Schema Definition with Zod

Zod is used to define and validate the structure of generated objects.

### Simple Schema

```typescript
const schema = z.object({
  name: z.string(),
  age: z.number(),
  active: z.boolean(),
});

// Generated object will match this structure exactly
```

### Complex Schema

```typescript
const schema = z.object({
  person: z.object({
    // Nested object
    firstName: z.string(),
    lastName: z.string(),
    age: z.number().min(0).max(150),
    email: z.string().email(),
    
    // Optional field
    middleName: z.string().optional(),
    
    // Array
    hobbies: z.array(z.string()),
    
    // Enum
    status: z.enum(['active', 'inactive', 'pending']),
    
    // Nested object
    address: z.object({
      street: z.string(),
      city: z.string(),
      country: z.string(),
      zipCode: z.string(),
    }),
    
    // Array of objects
    skills: z.array(
      z.object({
        name: z.string(),
        level: z.enum(['beginner', 'intermediate', 'expert']),
      })
    ),
  }),
});
```

### With Descriptions (Helps AI understand)

```typescript
const schema = z.object({
  recipe: z.object({
    name: z.string().describe('The name of the recipe'),
    difficulty: z.enum(['easy', 'medium', 'hard'])
      .describe('Cooking difficulty level'),
    prepTime: z.string()
      .describe('Preparation time in minutes'),
    ingredients: z.array(
      z.object({
        name: z.string().describe('Ingredient name'),
        amount: z.string().describe('Quantity needed'),
      })
    ).describe('List of all ingredients'),
  }),
});
```

**Descriptions help the AI generate more accurate data!**

---

## Complete Example

Here's how we use it in our project:

### Backend: `app/api/generate-object/route.ts`

```typescript
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { type, prompt } = await req.json();

    if (type === 'recipe') {
      const { object } = await generateObject({
        model: google('gemini-2.5-flash'),
        schema: z.object({
          recipe: z.object({
            name: z.string(),
            cuisine: z.string(),
            difficulty: z.enum(['easy', 'medium', 'hard']),
            prepTime: z.string(),
            cookTime: z.string(),
            servings: z.number(),
            ingredients: z.array(
              z.object({
                name: z.string(),
                amount: z.string(),
                unit: z.string(),
              })
            ),
            steps: z.array(z.string()),
            tags: z.array(z.string()),
          }),
        }),
        prompt: prompt || 'Generate a lasagna recipe',
      });

      return Response.json({ object });
    }

    if (type === 'product-list') {
      // Array strategy
      const { object } = await generateObject({
        model: google('gemini-2.5-flash'),
        output: 'array',
        schema: z.object({
          name: z.string(),
          price: z.number(),
          category: z.string(),
          description: z.string(),
          inStock: z.boolean(),
        }),
        prompt: prompt || 'Generate 5 products for an online store',
      });

      return Response.json({ object });
    }

    if (type === 'classification') {
      // Enum strategy
      const { object } = await generateObject({
        model: google('gemini-2.5-flash'),
        output: 'enum',
        enum: ['positive', 'negative', 'neutral'],
        prompt: prompt || 'Classify the sentiment',
      });

      return Response.json({ object });
    }

    return Response.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error: any) {
    console.error('Error:', error);
    return Response.json(
      { error: 'Failed to generate object' },
      { status: 500 }
    );
  }
}
```

### Frontend: `app/generate-object/page.tsx`

```typescript
'use client';

import { useState } from 'react';

export default function GenerateObject() {
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    
    const response = await fetch('/api/generate-object', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'recipe',
        prompt: 'Generate a vegetarian pasta recipe',
      }),
    });

    const data = await response.json();
    setResult(data.object);
    setIsLoading(false);
  };

  return (
    <div>
      <button onClick={handleGenerate} disabled={isLoading}>
        {isLoading ? 'Generating...' : 'Generate Recipe'}
      </button>

      {result && (
        <div>
          <h2>{result.recipe.name}</h2>
          <p>Difficulty: {result.recipe.difficulty}</p>
          <p>Prep Time: {result.recipe.prepTime}</p>
          
          <h3>Ingredients:</h3>
          <ul>
            {result.recipe.ingredients.map((ing: any, i: number) => (
              <li key={i}>
                {ing.amount} {ing.unit} {ing.name}
              </li>
            ))}
          </ul>
          
          <h3>Steps:</h3>
          <ol>
            {result.recipe.steps.map((step: string, i: number) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
```

---

## Error Handling

### AI_NoObjectGeneratedError

When the AI fails to generate a valid object, it throws a specific error:

```typescript
import { generateObject, NoObjectGeneratedError } from 'ai';

try {
  const { object } = await generateObject({
    model: google('gemini-2.5-flash'),
    schema: z.object({ name: z.string() }),
    prompt: 'Generate data',
  });
} catch (error) {
  if (NoObjectGeneratedError.isInstance(error)) {
    console.log('Failed to generate object');
    console.log('Text that was generated:', error.text);
    console.log('Cause:', error.cause);
    console.log('Usage:', error.usage);
  }
}
```

### Common Causes

| Cause | Reason | Solution |
|-------|--------|----------|
| **Parse Error** | Invalid JSON generated | Use simpler schema or add descriptions |
| **Validation Error** | Data doesn't match schema | Adjust schema or prompt |
| **Model Limitation** | Model can't handle complex schema | Use simpler model or break into steps |
| **Timeout** | Generation took too long | Increase `maxDuration` |

### In API Routes

```typescript
export async function POST(req: Request) {
  try {
    const { object } = await generateObject({ /* ... */ });
    return Response.json({ object });
  } catch (error: any) {
    console.error('Error generating object:', error);
    
    if (error.name === 'AI_NoObjectGeneratedError') {
      return Response.json(
        {
          error: 'Failed to generate valid object',
          details: {
            text: error.text,
            cause: error.cause?.message,
          },
        },
        { status: 500 }
      );
    }

    return Response.json(
      { error: 'Failed to generate object' },
      { status: 500 }
    );
  }
}
```

---

## vs generateText

### `generateText()` - Plain Text

```typescript
const { text } = await generateText({
  model: google('gemini-2.5-flash'),
  prompt: 'Generate a person profile',
});

console.log(text);
// Output: "John Doe is a 30-year-old software engineer from San Francisco..."

// ❌ Unstructured
// ❌ Need to parse manually
// ❌ No type safety
// ❌ Inconsistent format
```

### `generateObject()` - Structured Data

```typescript
const { object } = await generateObject({
  model: google('gemini-2.5-flash'),
  schema: z.object({
    person: z.object({
      name: z.string(),
      age: z.number(),
      occupation: z.string(),
      city: z.string(),
    }),
  }),
  prompt: 'Generate a person profile',
});

console.log(object.person.name);        // ✅ "John Doe"
console.log(object.person.age);         // ✅ 30
console.log(object.person.occupation);  // ✅ "Software Engineer"

// ✅ Structured
// ✅ Ready to use
// ✅ Type safe
// ✅ Consistent format
```

### Comparison Table

| Feature | `generateText()` | `generateObject()` |
|---------|------------------|-------------------|
| **Output** | Plain string | Structured object |
| **Type Safety** | ❌ None | ✅ Full |
| **Validation** | ❌ None | ✅ Automatic |
| **Parsing** | 😰 Manual | ✅ Automatic |
| **Consistency** | ⚠️ Variable | ✅ Guaranteed |
| **Use in Code** | Need parsing | Direct access |
| **Best For** | Essays, summaries | Data extraction, forms |

---

## Best Practices

### 1. Use Descriptive Schema

```typescript
// ❌ Bad: No descriptions
schema: z.object({
  n: z.string(),
  a: z.number(),
})

// ✅ Good: Clear descriptions
schema: z.object({
  name: z.string().describe('Full name of the person'),
  age: z.number().min(0).max(150).describe('Age in years'),
})
```

### 2. Add Schema Name

```typescript
const { object } = await generateObject({
  model: google('gemini-2.5-flash'),
  schemaName: 'PersonProfile',  // ← Helps AI understand context
  schemaDescription: 'A complete profile of a fictional person',
  schema: z.object({ /* ... */ }),
  prompt: 'Generate a person profile',
});
```

### 3. Validate Inputs

```typescript
export async function POST(req: Request) {
  const { prompt } = await req.json();
  
  // Validate
  if (!prompt || typeof prompt !== 'string') {
    return Response.json(
      { error: 'Invalid prompt' },
      { status: 400 }
    );
  }
  
  const { object } = await generateObject({ /* ... */ });
  return Response.json({ object });
}
```

### 4. Keep Schemas Simple

```typescript
// ❌ Too complex - might fail
schema: z.object({
  level1: z.object({
    level2: z.object({
      level3: z.object({
        level4: z.object({
          level5: z.string(),
        }),
      }),
    }),
  }),
})

// ✅ Better - flatter structure
schema: z.object({
  id: z.string(),
  name: z.string(),
  details: z.object({
    field1: z.string(),
    field2: z.string(),
  }),
})
```

### 5. Use Appropriate Output Strategy

```typescript
// Single entity → object
const recipe = await generateObject({
  schema: z.object({ name: z.string(), steps: z.array(z.string()) }),
  prompt: 'Generate a recipe',
});

// Multiple items → array
const products = await generateObject({
  output: 'array',
  schema: z.object({ name: z.string(), price: z.number() }),
  prompt: 'Generate 5 products',
});

// Classification → enum
const sentiment = await generateObject({
  output: 'enum',
  enum: ['positive', 'negative', 'neutral'],
  prompt: 'Classify this text',
});
```

---

## Real-World Use Cases

### 1. Form Auto-Fill

```typescript
const { object } = await generateObject({
  model: google('gemini-2.5-flash'),
  schema: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    phone: z.string(),
    address: z.object({
      street: z.string(),
      city: z.string(),
      zipCode: z.string(),
    }),
  }),
  prompt: 'Generate realistic test data for a user registration form',
});

// Use object to populate form
form.setValues(object);
```

### 2. Data Extraction

```typescript
const article = "John Doe, 35, software engineer at TechCorp...";

const { object } = await generateObject({
  model: google('gemini-2.5-flash'),
  schema: z.object({
    person: z.object({
      name: z.string(),
      age: z.number(),
      occupation: z.string(),
      company: z.string(),
    }),
  }),
  prompt: `Extract person information from: ${article}`,
});

// object.person = { name: "John Doe", age: 35, ... }
```

### 3. Content Generation

```typescript
const { object } = await generateObject({
  model: google('gemini-2.5-flash'),
  output: 'array',
  schema: z.object({
    title: z.string(),
    body: z.string(),
    tags: z.array(z.string()),
  }),
  prompt: 'Generate 10 blog post ideas about AI',
});

// Save to database
for (const post of object) {
  await db.post.create({ data: post });
}
```

### 4. Classification System

```typescript
const { object } = await generateObject({
  model: google('gemini-2.5-flash'),
  output: 'enum',
  enum: ['urgent', 'normal', 'low'],
  prompt: `Classify priority of this support ticket: ${ticketText}`,
});

// object = 'urgent' | 'normal' | 'low'
await updateTicket(ticketId, { priority: object });
```

---

## Summary

### Key Concepts

1. **`generateObject()`** - Generates structured, type-safe data
2. **Zod Schemas** - Define and validate structure
3. **Output Strategies** - Object, array, enum, or no-schema
4. **Type Safety** - Full TypeScript support
5. **Validation** - Automatic schema validation

### When to Use

| Use Case | Strategy |
|----------|----------|
| Single structured entity | `output: 'object'` (default) |
| List of items | `output: 'array'` |
| Classification | `output: 'enum'` |
| Dynamic structure | `output: 'no-schema'` |

### Benefits

- ✅ **Type Safety** - Know exactly what you're getting
- ✅ **Validation** - Automatic schema validation
- ✅ **Predictable** - Consistent format every time
- ✅ **Easy to Use** - Direct access to properties
- ✅ **No Parsing** - Ready to use immediately

**Remember:** Use `generateObject()` when you need structured data, not plain text. It's perfect for forms, data extraction, classification, and any scenario where you need predictable, type-safe output! 🎯

