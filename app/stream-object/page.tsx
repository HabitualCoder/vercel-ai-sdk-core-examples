'use client';

import { useState } from 'react';

type Intent = 'recipe' | 'person' | 'product' | 'story';

export default function StreamObject() {
  const [prompt, setPrompt] = useState('');
  const [detectedIntent, setDetectedIntent] = useState<Intent | null>(null);
  const [partialObject, setPartialObject] = useState<any>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const examplePrompts = [
    { text: 'Generate a spicy Thai curry recipe', intent: 'recipe' },
    { text: 'Tell me about Marie Curie', intent: 'person' },
    { text: 'Create details for a gaming laptop', intent: 'product' },
    { text: 'Write a story about a time-traveling cat', intent: 'story' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isStreaming) return;

    // Reset state
    setDetectedIntent(null);
    setPartialObject(null);
    setIsStreaming(true);
    setIsComplete(false);

    try {
      const response = await fetch('/api/stream-object', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const event = JSON.parse(line);

              if (event.type === 'intent') {
                setDetectedIntent(event.intent);
              } else if (event.type === 'partial') {
                setPartialObject(event.data);
              } else if (event.type === 'complete') {
                setIsComplete(true);
              }
            } catch (error) {
              console.error('Failed to parse event:', error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
      setPartialObject({ error: 'Failed to stream object' });
    } finally {
      setIsStreaming(false);
    }
  };

  const getIntentColor = (intent: Intent) => {
    const colors = {
      recipe: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200',
      person: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
      product: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
      story: 'bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200',
    };
    return colors[intent] || '';
  };

  return (
    <div className="flex flex-col w-full max-w-7xl py-12 mx-auto px-4">
      <h1 className="text-3xl font-bold mb-4">Stream Structured Objects</h1>
      <p className="text-zinc-600 dark:text-zinc-400 mb-8">
        Watch objects being built in <strong>real-time</strong> as the AI generates data!
        Uses smart intent detection to choose the right schema.
      </p>

      {/* Example Prompts */}
      <div className="mb-6">
        <p className="font-semibold mb-2">Try these examples:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {examplePrompts.map((example, i) => (
            <button
              key={i}
              onClick={() => setPrompt(example.text)}
              disabled={isStreaming}
              className={`text-left p-3 rounded-lg text-sm transition-colors ${
                isStreaming
                  ? 'bg-zinc-200 dark:bg-zinc-800 cursor-not-allowed'
                  : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              <span className="font-semibold">
                [{example.intent}]
              </span>{' '}
              {example.text}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 p-3 border border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 rounded-lg"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask for a recipe, person info, product details, or a story..."
            disabled={isStreaming}
          />
          <button
            type="submit"
            disabled={isStreaming || !prompt.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-8 rounded-lg transition-colors whitespace-nowrap"
          >
            {isStreaming ? 'Streaming...' : 'Stream'}
          </button>
        </div>
      </form>

      {/* Status Indicators */}
      {(isStreaming || detectedIntent) && (
        <div className="flex items-center gap-4 mb-6">
          {detectedIntent && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Intent:
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getIntentColor(detectedIntent)}`}>
                {detectedIntent}
              </span>
            </div>
          )}
          {isStreaming && (
            <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              Streaming data...
            </div>
          )}
          {isComplete && (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Complete!
            </div>
          )}
        </div>
      )}

      {/* Streaming Object Display */}
      {partialObject && (
        <div className="space-y-4">
          {partialObject.error ? (
            <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-700 rounded-lg">
              <p className="text-red-800 dark:text-red-200">{partialObject.error}</p>
            </div>
          ) : (
            <>
              {/* Recipe Display */}
              {detectedIntent === 'recipe' && partialObject.recipe && (
                <div className="p-6 bg-orange-50 dark:bg-orange-950 border-2 border-orange-300 dark:border-orange-800 rounded-lg">
                  <h2 className="text-2xl font-bold mb-4">
                    {partialObject.recipe.name || '...'}
                  </h2>
                  {partialObject.recipe.cuisine && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                      <div>
                        <span className="font-semibold">Cuisine:</span>{' '}
                        {partialObject.recipe.cuisine}
                      </div>
                      <div>
                        <span className="font-semibold">Difficulty:</span>{' '}
                        {partialObject.recipe.difficulty || '...'}
                      </div>
                      <div>
                        <span className="font-semibold">Prep:</span>{' '}
                        {partialObject.recipe.prepTime || '...'}
                      </div>
                      <div>
                        <span className="font-semibold">Cook:</span>{' '}
                        {partialObject.recipe.cookTime || '...'}
                      </div>
                    </div>
                  )}
                  {partialObject.recipe.ingredients && partialObject.recipe.ingredients.length > 0 && (
                    <div className="mb-4">
                      <h3 className="font-semibold mb-2">
                        Ingredients ({partialObject.recipe.ingredients.length}):
                      </h3>
                      <ul className="list-disc list-inside">
                        {partialObject.recipe.ingredients.map((ing: any, i: number) => (
                          <li key={i} className="animate-fadeIn">
                            {ing.amount} {ing.unit} {ing.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {partialObject.recipe.steps && partialObject.recipe.steps.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">
                        Steps ({partialObject.recipe.steps.length}):
                      </h3>
                      <ol className="list-decimal list-inside space-y-2">
                        {partialObject.recipe.steps.map((step: string, i: number) => (
                          <li key={i} className="animate-fadeIn">
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              )}

              {/* Person Display */}
              {detectedIntent === 'person' && partialObject.person && (
                <div className="p-6 bg-blue-50 dark:bg-blue-950 border-2 border-blue-300 dark:border-blue-800 rounded-lg">
                  <h2 className="text-2xl font-bold mb-4">
                    {partialObject.person.name || '...'}
                  </h2>
                  <div className="space-y-3">
                    {partialObject.person.profession && (
                      <div className="animate-fadeIn">
                        <span className="font-semibold">Profession:</span>{' '}
                        {partialObject.person.profession}
                      </div>
                    )}
                    {partialObject.person.nationality && (
                      <div className="animate-fadeIn">
                        <span className="font-semibold">Nationality:</span>{' '}
                        {partialObject.person.nationality}
                      </div>
                    )}
                    {partialObject.person.biography && (
                      <div className="animate-fadeIn">
                        <span className="font-semibold">Biography:</span>
                        <p className="mt-1">{partialObject.person.biography}</p>
                      </div>
                    )}
                    {partialObject.person.knownFor && partialObject.person.knownFor.length > 0 && (
                      <div className="animate-fadeIn">
                        <span className="font-semibold">Known For:</span>
                        <ul className="list-disc list-inside mt-1">
                          {partialObject.person.knownFor.map((item: string, i: number) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {partialObject.person.achievements && partialObject.person.achievements.length > 0 && (
                      <div className="animate-fadeIn">
                        <span className="font-semibold">Achievements:</span>
                        <ul className="list-disc list-inside mt-1">
                          {partialObject.person.achievements.map((item: string, i: number) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {partialObject.person.funFacts && partialObject.person.funFacts.length > 0 && (
                      <div className="animate-fadeIn">
                        <span className="font-semibold">Fun Facts:</span>
                        <ul className="list-disc list-inside mt-1">
                          {partialObject.person.funFacts.map((item: string, i: number) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Product Display */}
              {detectedIntent === 'product' && partialObject.product && (
                <div className="p-6 bg-purple-50 dark:bg-purple-950 border-2 border-purple-300 dark:border-purple-800 rounded-lg">
                  <h2 className="text-2xl font-bold mb-2">
                    {partialObject.product.name || '...'}
                  </h2>
                  {partialObject.product.category && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                      {partialObject.product.category}
                    </p>
                  )}
                  {partialObject.product.price !== undefined && (
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-4">
                      ${partialObject.product.price.toFixed(2)}
                    </p>
                  )}
                  {partialObject.product.description && (
                    <p className="mb-4 animate-fadeIn">{partialObject.product.description}</p>
                  )}
                  <div className="grid md:grid-cols-3 gap-4">
                    {partialObject.product.features && partialObject.product.features.length > 0 && (
                      <div className="animate-fadeIn">
                        <h3 className="font-semibold mb-2">Features:</h3>
                        <ul className="list-disc list-inside text-sm">
                          {partialObject.product.features.map((f: string, i: number) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {partialObject.product.pros && partialObject.product.pros.length > 0 && (
                      <div className="animate-fadeIn">
                        <h3 className="font-semibold mb-2 text-green-700 dark:text-green-400">
                          Pros:
                        </h3>
                        <ul className="list-disc list-inside text-sm">
                          {partialObject.product.pros.map((p: string, i: number) => (
                            <li key={i}>{p}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {partialObject.product.cons && partialObject.product.cons.length > 0 && (
                      <div className="animate-fadeIn">
                        <h3 className="font-semibold mb-2 text-red-700 dark:text-red-400">
                          Cons:
                        </h3>
                        <ul className="list-disc list-inside text-sm">
                          {partialObject.product.cons.map((c: string, i: number) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Story Display */}
              {detectedIntent === 'story' && partialObject.story && (
                <div className="p-6 bg-pink-50 dark:bg-pink-950 border-2 border-pink-300 dark:border-pink-800 rounded-lg">
                  <h2 className="text-2xl font-bold mb-2">
                    {partialObject.story.title || '...'}
                  </h2>
                  {partialObject.story.genre && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                      Genre: {partialObject.story.genre}
                    </p>
                  )}
                  {partialObject.story.setting && (
                    <div className="mb-4 animate-fadeIn">
                      <span className="font-semibold">Setting:</span> {partialObject.story.setting}
                    </div>
                  )}
                  {partialObject.story.characters && partialObject.story.characters.length > 0 && (
                    <div className="mb-4 animate-fadeIn">
                      <h3 className="font-semibold mb-2">Characters:</h3>
                      <div className="space-y-2">
                        {partialObject.story.characters.map((char: any, i: number) => (
                          <div key={i} className="pl-4 border-l-2 border-pink-300 dark:border-pink-700">
                            <strong>{char.name}</strong> - {char.role}
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                              {char.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {partialObject.story.plot && (
                    <div className="mb-4 animate-fadeIn">
                      <h3 className="font-semibold mb-2">Plot:</h3>
                      <p>{partialObject.story.plot}</p>
                    </div>
                  )}
                  {partialObject.story.twist && (
                    <div className="mb-4 animate-fadeIn">
                      <h3 className="font-semibold mb-2">Twist:</h3>
                      <p>{partialObject.story.twist}</p>
                    </div>
                  )}
                  {partialObject.story.moralLesson && (
                    <div className="animate-fadeIn">
                      <h3 className="font-semibold mb-2">Moral Lesson:</h3>
                      <p>{partialObject.story.moralLesson}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Raw JSON */}
              <details>
                <summary className="cursor-pointer font-semibold">View Raw JSON (Live)</summary>
                <pre className="mt-2 p-4 bg-zinc-900 text-zinc-100 rounded-lg overflow-x-auto text-sm">
                  {JSON.stringify(partialObject, null, 2)}
                </pre>
              </details>
            </>
          )}
        </div>
      )}

      {/* Documentation */}
      <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">🎬 How streamObject Works</h3>
        <div className="space-y-2 text-sm">
          <p>
            <strong>streamObject()</strong> builds the object in real-time as the AI generates it:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>
              <strong>Step 1:</strong> Detects your intent (recipe, person, product, story)
            </li>
            <li>
              <strong>Step 2:</strong> Uses appropriate schema for that type
            </li>
            <li>
              <strong>Step 3:</strong> Streams partial objects as they're built
            </li>
            <li>
              <strong>Result:</strong> You see fields appear one by one in real-time! ✨
            </li>
          </ul>
          <p className="mt-3">
            <strong>vs generateObject:</strong> generateObject waits for complete object, 
            streamObject shows progressive updates!
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

