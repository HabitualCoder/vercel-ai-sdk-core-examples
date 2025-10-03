import { google } from '@ai-sdk/google';
import { generateObject, streamObject } from 'ai';
import { z } from 'zod';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    // Step 1: Detect intent (using generateObject for quick classification)
    const intentDetection = await generateObject({
      model: google('gemini-2.5-flash'),
      output: 'enum',
      enum: ['recipe', 'person', 'product', 'story'],
      prompt: `Classify what the user is asking for: "${prompt}"
      
      - recipe: User wants a recipe or cooking instructions
      - person: User is asking about a person
      - product: User wants product information
      - story: User wants a creative story`,
    });

    const intent = intentDetection.object;
    console.log('Detected intent:', intent);

    // Step 2: Stream appropriate schema based on intent
    let result;

    switch (intent) {
      case 'recipe': {
        result = streamObject({
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
        break;
      }

      case 'person': {
        result = streamObject({
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
          prompt: `Provide detailed information about: ${prompt}`,
        });
        break;
      }

      case 'product': {
        result = streamObject({
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
              rating: z.number().min(1).max(5),
            }),
          }),
          prompt: `Generate detailed product information for: ${prompt}`,
        });
        break;
      }

      case 'story': {
        result = streamObject({
          model: google('gemini-2.5-flash'),
          schema: z.object({
            story: z.object({
              title: z.string(),
              genre: z.string(),
              setting: z.string(),
              characters: z.array(
                z.object({
                  name: z.string(),
                  role: z.string(),
                  description: z.string(),
                })
              ),
              plot: z.string(),
              twist: z.string(),
              moralLesson: z.string().optional(),
            }),
          }),
          prompt: `Write a creative story about: ${prompt}`,
        });
        break;
      }

      default:
        return Response.json({ error: 'Unknown intent' }, { status: 400 });
    }

    // Stream the partial objects to the client
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send the detected intent first
          controller.enqueue(
            encoder.encode(
              JSON.stringify({ type: 'intent', intent }) + '\n'
            )
          );

          // Stream partial objects
          for await (const partialObject of result.partialObjectStream) {
            const data = JSON.stringify({
              type: 'partial',
              data: partialObject,
            });
            controller.enqueue(encoder.encode(data + '\n'));
          }

          // Send completion signal
          controller.enqueue(
            encoder.encode(JSON.stringify({ type: 'complete' }) + '\n')
          );

          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
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
  } catch (error: any) {
    console.error('Error:', error);
    return Response.json(
      { error: 'Failed to stream object' },
      { status: 500 }
    );
  }
}

