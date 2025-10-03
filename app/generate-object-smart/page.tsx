'use client';

import { useState } from 'react';

export default function GenerateObjectSmart() {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const examplePrompts = [
    'Generate a chocolate cake recipe',
    'Tell me about Sachin Tendulkar',
    'What is the capital of France?',
    'Create a smartphone product description',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/generate-object-smart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to generate response' });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-5xl py-12 mx-auto px-4">
      <h1 className="text-3xl font-bold mb-4">Smart Object Generation</h1>
      <p className="text-zinc-600 dark:text-zinc-400 mb-8">
        This version <strong>detects your intent first</strong>, then uses the appropriate schema.
        Try asking about anything - recipes, people, general questions!
      </p>

      {/* Example Prompts */}
      <div className="mb-6">
        <p className="font-semibold mb-2">Try these examples:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {examplePrompts.map((example, i) => (
            <button
              key={i}
              onClick={() => setPrompt(example)}
              className="text-left p-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-sm transition-colors"
            >
              "{example}"
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
            placeholder="Ask anything - recipe, person, product, question..."
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-8 rounded-lg transition-colors whitespace-nowrap"
          >
            {isLoading ? 'Thinking...' : 'Generate'}
          </button>
        </div>
      </form>

      {/* Result Display */}
      {result && (
        <div className="space-y-4">
          {result.error ? (
            <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-700 rounded-lg">
              <p className="text-red-800 dark:text-red-200">{result.error}</p>
            </div>
          ) : (
            <>
              {/* Intent Badge */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  Detected Intent:
                </span>
                <span className="px-3 py-1 bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100 rounded-full text-sm font-semibold">
                  {result.type}
                </span>
              </div>

              {/* Recipe Display */}
              {result.type === 'recipe' && result.data.recipe && (
                <div className="p-6 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg">
                  <h2 className="text-2xl font-bold mb-4">{result.data.recipe.name}</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                    <div>
                      <span className="font-semibold">Cuisine:</span> {result.data.recipe.cuisine}
                    </div>
                    <div>
                      <span className="font-semibold">Difficulty:</span> {result.data.recipe.difficulty}
                    </div>
                    <div>
                      <span className="font-semibold">Prep:</span> {result.data.recipe.prepTime}
                    </div>
                    <div>
                      <span className="font-semibold">Cook:</span> {result.data.recipe.cookTime}
                    </div>
                  </div>
                  <div className="mb-4">
                    <h3 className="font-semibold mb-2">Ingredients:</h3>
                    <ul className="list-disc list-inside">
                      {result.data.recipe.ingredients.map((ing: any, i: number) => (
                        <li key={i}>
                          {ing.amount} {ing.unit} {ing.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Steps:</h3>
                    <ol className="list-decimal list-inside space-y-2">
                      {result.data.recipe.steps.map((step: string, i: number) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}

              {/* Person Display */}
              {result.type === 'person' && result.data.person && (
                <div className="p-6 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg">
                  <h2 className="text-2xl font-bold mb-4">{result.data.person.name}</h2>
                  <div className="space-y-3">
                    <div>
                      <span className="font-semibold">Profession:</span> {result.data.person.profession}
                    </div>
                    <div>
                      <span className="font-semibold">Nationality:</span> {result.data.person.nationality}
                    </div>
                    {result.data.person.birthYear && (
                      <div>
                        <span className="font-semibold">Birth Year:</span> {result.data.person.birthYear}
                      </div>
                    )}
                    <div>
                      <span className="font-semibold">Biography:</span>
                      <p className="mt-1 text-zinc-700 dark:text-zinc-300">
                        {result.data.person.biography}
                      </p>
                    </div>
                    <div>
                      <span className="font-semibold">Known For:</span>
                      <ul className="list-disc list-inside mt-1">
                        {result.data.person.knownFor.map((item: string, i: number) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="font-semibold">Achievements:</span>
                      <ul className="list-disc list-inside mt-1">
                        {result.data.person.achievements.map((item: string, i: number) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="font-semibold">Fun Facts:</span>
                      <ul className="list-disc list-inside mt-1">
                        {result.data.person.funFacts.map((item: string, i: number) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* General Question Display */}
              {result.type === 'general-question' && result.data.answer && (
                <div className="p-6 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg">
                  <p className="text-lg leading-relaxed">{result.data.answer}</p>
                </div>
              )}

              {/* Product Display */}
              {result.type === 'product' && result.data.product && (
                <div className="p-6 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg">
                  <h2 className="text-2xl font-bold mb-2">{result.data.product.name}</h2>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                    {result.data.product.category}
                  </p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-4">
                    ${result.data.product.price.toFixed(2)}
                  </p>
                  <p className="mb-4">{result.data.product.description}</p>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <h3 className="font-semibold mb-2">Features:</h3>
                      <ul className="list-disc list-inside text-sm">
                        {result.data.product.features.map((f: string, i: number) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2 text-green-700 dark:text-green-400">Pros:</h3>
                      <ul className="list-disc list-inside text-sm">
                        {result.data.product.pros.map((p: string, i: number) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2 text-red-700 dark:text-red-400">Cons:</h3>
                      <ul className="list-disc list-inside text-sm">
                        {result.data.product.cons.map((c: string, i: number) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Raw JSON */}
              <details>
                <summary className="cursor-pointer font-semibold">View Raw JSON</summary>
                <pre className="mt-2 p-4 bg-zinc-900 text-zinc-100 rounded-lg overflow-x-auto text-sm">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </details>
            </>
          )}
        </div>
      )}

      {/* Explanation */}
      <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">🧠 How This Works</h3>
        <div className="space-y-2 text-sm">
          <p><strong>Step 1: Detect Intent</strong></p>
          <p className="ml-4 text-zinc-700 dark:text-zinc-300">
            First AI call classifies your prompt into: recipe, person, general-question, or product
          </p>
          
          <p className="mt-3"><strong>Step 2: Use Appropriate Schema</strong></p>
          <p className="ml-4 text-zinc-700 dark:text-zinc-300">
            Based on intent, we use the right schema (or generateText for general questions)
          </p>
          
          <p className="mt-3"><strong>Result:</strong></p>
          <p className="ml-4 text-zinc-700 dark:text-zinc-300">
            You get properly structured data that matches your actual question! ✨
          </p>
        </div>
      </div>
    </div>
  );
}

