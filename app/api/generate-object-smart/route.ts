import { google } from '@ai-sdk/google';
import { generateObject, generateText } from 'ai';
import { z } from 'zod';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    // SOLUTION 1: Detect intent first, then use appropriate schema
    const intentDetection = await generateObject({
      model: google('gemini-2.5-flash'),
      output: 'enum',
      enum: ['recipe', 'person', 'general-question', 'product'],
      prompt: `Classify what the user is asking for: "${prompt}"
      
      - recipe: User wants a recipe or cooking instructions
      - person: User is asking about a person
      - general-question: User is asking a general knowledge question
      - product: User wants product information`,
    });

    const intent = intentDetection.object;
    console.log('Detected intent:', intent);

    // Now use the appropriate schema based on intent
    switch (intent) {
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
          prompt,
        });

        return Response.json({ type: 'recipe', data: object });
      }

      case 'person': {
        const { object } = await generateObject({
          model: google('gemini-2.5-flash'),
          schema: z.object({
            person: z.object({
              name: z.string(),
              profession: z.string(),
              nationality: z.string(),
              birthYear: z.number().optional(),
              knownFor: z.array(z.string()),
              achievements: z.array(z.string()),
              biography: z.string(),
              funFacts: z.array(z.string()),
            }),
          }),
          prompt: `Provide structured information about: ${prompt}`,
        });

        return Response.json({ type: 'person', data: object });
      }

      case 'general-question': {
        // For general questions, use generateText instead
        const { text } = await generateText({
          model: google('gemini-2.5-flash'),
          prompt,
        });

        return Response.json({ type: 'general-question', data: { answer: text } });
      }

      case 'product': {
        const { object } = await generateObject({
          model: google('gemini-2.5-flash'),
          schema: z.object({
            product: z.object({
              name: z.string(),
              category: z.string(),
              price: z.number(),
              description: z.string(),
              features: z.array(z.string()),
              pros: z.array(z.string()),
              cons: z.array(z.string()),
            }),
          }),
          prompt: `Generate product information for: ${prompt}`,
        });

        return Response.json({ type: 'product', data: object });
      }

      default:
        return Response.json(
          { error: 'Could not determine intent' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Error:', error);
    return Response.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}

