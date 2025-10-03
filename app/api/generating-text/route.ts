import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { article } = await req.json();

    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      system:
        'You are a professional writer. ' +
        'You write simple, clear, and concise content.',
      prompt: `Summarize the following article in 3-5 sentences: ${article}`,
    });

    return Response.json({ text });
  } catch (error) {
    console.error('Error generating text:', error);
    return Response.json(
      { error: 'Failed to generate text' },
      { status: 500 }
    );
  }
}

