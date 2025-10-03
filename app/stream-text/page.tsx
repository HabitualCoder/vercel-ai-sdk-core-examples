'use client';

import { useState } from 'react';

type StreamEvent = {
  type: string;
  data: any;
};

export default function StreamText() {
  const [prompt, setPrompt] = useState(
    'What is the weather like in San Francisco? Also tell me about the city.'
  );
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const [generatedText, setGeneratedText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isStreaming) return;

    // Reset state
    setEvents([]);
    setGeneratedText('');
    setIsStreaming(true);

    try {
      const response = await fetch('/api/stream-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) throw new Error('Stream failed');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No reader available');

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode the chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete lines (events)
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.trim()) {
            try {
              const event: StreamEvent = JSON.parse(line);
              
              // Add event to log
              setEvents((prev) => [...prev, event]);

              // Handle specific event types
              switch (event.type) {
                case 'text-delta':
                  setGeneratedText((prev) => prev + event.data.textDelta);
                  break;
              }
            } catch (error) {
              console.error('Failed to parse event:', error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
      setEvents((prev) => [
        ...prev,
        {
          type: 'error',
          data: { message: 'Failed to stream text' },
        },
      ]);
    } finally {
      setIsStreaming(false);
    }
  };

  // Helper to get color for event types
  const getEventColor = (type: string) => {
    const colors: Record<string, string> = {
      start: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
      'start-step': 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
      'text-delta':
        'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
      'tool-call':
        'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200',
      'tool-result':
        'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
      'finish-step':
        'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200',
      finish: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200',
      error: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
    };
    return colors[type] || 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200';
  };

  // Helper to format event data for display
  const formatEventData = (event: StreamEvent) => {
    switch (event.type) {
      case 'text-delta':
        return `Text: "${event.data.textDelta}"`;
      case 'tool-call':
        return `Tool: ${event.data.toolName}\nArgs: ${JSON.stringify(event.data.args, null, 2)}`;
      case 'tool-result':
        return `Tool: ${event.data.toolName}\nResult: ${JSON.stringify(event.data.result, null, 2)}`;
      case 'finish':
        return `Reason: ${event.data.finishReason}\nUsage: ${JSON.stringify(event.data.usage, null, 2)}`;
      default:
        return JSON.stringify(event.data, null, 2);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-7xl py-12 mx-auto px-4">
      <h1 className="text-3xl font-bold mb-4">Stream Text with fullStream</h1>
      <p className="text-zinc-600 dark:text-zinc-400 mb-8">
        This demo shows how <code className="bg-zinc-200 dark:bg-zinc-800 px-2 py-1 rounded">streamText</code> works with{' '}
        <code className="bg-zinc-200 dark:bg-zinc-800 px-2 py-1 rounded">fullStream</code>. 
        Watch the events flow in real-time!
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-8">
        <div className="flex flex-col gap-2">
          <label htmlFor="prompt" className="font-semibold">
            Prompt (try asking about weather or cities):
          </label>
          <input
            id="prompt"
            className="w-full p-3 border border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 rounded-lg"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask something..."
            disabled={isStreaming}
          />
        </div>

        <button
          type="submit"
          disabled={isStreaming || !prompt.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          {isStreaming ? 'Streaming...' : 'Start Stream'}
        </button>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generated Text Output */}
        <div className="flex flex-col">
          <h2 className="text-xl font-semibold mb-3">Generated Text</h2>
          <div className="flex-1 p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg min-h-[400px]">
            {generatedText ? (
              <p className="whitespace-pre-wrap leading-relaxed">{generatedText}</p>
            ) : (
              <p className="text-zinc-400 italic">
                Text will appear here as it streams...
              </p>
            )}
          </div>
        </div>

        {/* Event Stream Log */}
        <div className="flex flex-col">
          <h2 className="text-xl font-semibold mb-3">
            Event Stream Log ({events.length} events)
          </h2>
          <div className="flex-1 overflow-y-auto p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg min-h-[400px] max-h-[600px]">
            {events.length === 0 ? (
              <p className="text-zinc-400 italic">
                Events will appear here as they stream...
              </p>
            ) : (
              <div className="space-y-2">
                {events.map((event, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${getEventColor(event.type)}`}
                  >
                    <div className="font-semibold text-sm mb-1">
                      #{index + 1} {event.type.toUpperCase()}
                    </div>
                    <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                      {formatEventData(event)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Documentation */}
      <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">📚 Understanding fullStream</h3>
        <div className="space-y-2 text-sm">
          <p>
            <strong>fullStream</strong> gives you granular control over every part of the streaming process:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>
              <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">start</code> - Stream begins
            </li>
            <li>
              <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">text-delta</code> - Each text chunk as it arrives
            </li>
            <li>
              <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">tool-call</code> - When AI decides to use a tool
            </li>
            <li>
              <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">tool-result</code> - When tool execution completes
            </li>
            <li>
              <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">finish</code> - Stream completes with usage info
            </li>
          </ul>
          <p className="mt-3">
            <strong>Try it:</strong> Ask about weather in multiple cities to see tool calls in action!
          </p>
        </div>
      </div>
    </div>
  );
}

