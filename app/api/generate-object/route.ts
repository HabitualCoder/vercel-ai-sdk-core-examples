import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { type, prompt } = await req.json();

    // Different schemas based on output type
    switch (type) {
      case 'recipe': {
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
          prompt: prompt || 'Generate a lasagna recipe.',
        });

        return Response.json({ object, type: 'recipe' });
      }

      case 'person': {
        const { object } = await generateObject({
          model: google('gemini-2.5-flash'),
          schema: z.object({
            person: z.object({
              firstName: z.string(),
              lastName: z.string(),
              age: z.number(),
              email: z.string().email(),
              occupation: z.string(),
              bio: z.string(),
              skills: z.array(z.string()),
              address: z.object({
                street: z.string(),
                city: z.string(),
                country: z.string(),
                zipCode: z.string(),
              }),
            }),
          }),
          prompt: prompt || 'Generate a fictional person profile.',
        });

        return Response.json({ object, type: 'person' });
      }

      case 'product-list': {
        // Array output strategy
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
          prompt:
            prompt || 'Generate 5 fictional products for an online store.',
        });

        return Response.json({ object, type: 'product-list' });
      }

      case 'classification': {
        // Enum output strategy
        const { object } = await generateObject({
          model: google('gemini-2.5-flash'),
          output: 'enum',
          enum: ['positive', 'negative', 'neutral'],
          prompt:
            prompt ||
            'Classify the sentiment: "This product is amazing! I love it!"',
        });

        return Response.json({ object, type: 'classification' });
      }

      case 'no-schema': {
        // No schema - dynamic structure
        const { object } = await generateObject({
          model: google('gemini-2.5-flash'),
          output: 'no-schema',
          prompt: prompt || 'Generate a JSON object with book information.',
        });

        return Response.json({ object, type: 'no-schema' });
      }

      default:
        return Response.json({ error: 'Invalid type' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error generating object:', error);
    
    // Handle specific AI SDK errors
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

