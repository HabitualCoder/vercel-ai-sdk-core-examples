import { google } from '@ai-sdk/google';
import { generateText, tool } from 'ai';
import { z } from 'zod';

export const maxDuration = 60;

export async function POST(req: Request) {
  const { repo } = await req.json();
  
  try {
    // Simulated GitHub tools (like MCP would provide)
    const githubTools = {
      get_repository: tool({
        description: 'Get repository information',
        parameters: z.object({
          owner: z.string(),
          repo: z.string(),
        }),
        execute: async ({ owner, repo }) => {
          const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}`,
            {
              headers: {
                Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
                'User-Agent': 'MCP-Demo',
              },
            }
          );
          return await response.json();
        },
      }),
    };

    const [owner, repoName] = repo.split('/');

    const result = await generateText({
        model: google('gemini-2.5-flash'),
        tools: githubTools,
        stopWhen: ({ stepNumber }) => stepNumber >= 3,
        prompt: `Use the get_repository tool to fetch information about the repository with owner "${owner}" and repo "${repoName}". After getting the data, provide a summary with stars, description, main language, and other interesting details.`,
    });

    return Response.json({ 
      text: result.text, 
      toolCalls: result.steps.flatMap(s => s.toolCalls) 
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}