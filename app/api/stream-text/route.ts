import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { z } from 'zod';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    const result = streamText({
      model: google('gemini-2.5-flash'),
      tools: {
        getWeather: {
          description: 'Get the weather for a location',
          parameters: z.object({
            city: z.string().describe('The city to get weather for'),
          }),
          execute: async ({ city }) => {
            // Simulate API call delay
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

    // Create a custom stream that sends fullStream events as JSON
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const part of result.fullStream) {
            // Send each event as a JSON string followed by newline
            const eventData = JSON.stringify({
              type: part.type,
              data: part,
            });
            controller.enqueue(encoder.encode(`${eventData}\n`));
          }
          controller.close();
        } catch (error) {
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
  } catch (error) {
    console.error('Error in stream-text route:', error);
    return Response.json(
      { error: 'Failed to stream text' },
      { status: 500 }
    );
  }
}

