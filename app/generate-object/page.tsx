'use client';

import { useState } from 'react';

type ExampleType = 'recipe' | 'person' | 'product-list' | 'classification' | 'no-schema';

const examples = [
  {
    type: 'recipe' as ExampleType,
    title: 'Recipe Generator (Object)',
    description: 'Generates a structured recipe with nested objects and arrays',
    defaultPrompt: 'Generate a vegetarian pasta recipe',
    color: 'blue',
  },
  {
    type: 'person' as ExampleType,
    title: 'Person Profile (Complex Object)',
    description: 'Generates a fictional person with nested address object',
    defaultPrompt: 'Generate a software engineer profile from San Francisco',
    color: 'green',
  },
  {
    type: 'product-list' as ExampleType,
    title: 'Product List (Array)',
    description: 'Generates array of products using array output strategy',
    defaultPrompt: 'Generate 5 tech gadgets for an online store',
    color: 'purple',
  },
  {
    type: 'classification' as ExampleType,
    title: 'Sentiment Analysis (Enum)',
    description: 'Classifies text into predefined categories',
    defaultPrompt: 'Classify: "The service was okay, nothing special."',
    color: 'orange',
  },
  {
    type: 'no-schema' as ExampleType,
    title: 'Dynamic JSON (No Schema)',
    description: 'Generates JSON without predefined schema',
    defaultPrompt: 'Generate information about the Eiffel Tower',
    color: 'pink',
  },
];

export default function GenerateObject() {
  const [selectedType, setSelectedType] = useState<ExampleType>('recipe');
  const [prompt, setPrompt] = useState(examples[0].defaultPrompt);
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const currentExample = examples.find((ex) => ex.type === selectedType)!;

  const handleGenerate = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/generate-object', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: selectedType, prompt }),
      });

      const data = await response.json();

      if (data.error) {
        setResult({ error: data.error, details: data.details });
      } else {
        setResult(data.object);
      }
    } catch (error) {
      setResult({ error: 'Failed to generate object' });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTypeChange = (type: ExampleType) => {
    setSelectedType(type);
    const example = examples.find((ex) => ex.type === type)!;
    setPrompt(example.defaultPrompt);
    setResult(null);
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100',
      green: 'bg-green-100 dark:bg-green-900 border-green-300 dark:border-green-700 text-green-900 dark:text-green-100',
      purple: 'bg-purple-100 dark:bg-purple-900 border-purple-300 dark:border-purple-700 text-purple-900 dark:text-purple-100',
      orange: 'bg-orange-100 dark:bg-orange-900 border-orange-300 dark:border-orange-700 text-orange-900 dark:text-orange-100',
      pink: 'bg-pink-100 dark:bg-pink-900 border-pink-300 dark:border-pink-700 text-pink-900 dark:text-pink-100',
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="flex flex-col w-full max-w-7xl py-12 mx-auto px-4">
      <h1 className="text-3xl font-bold mb-4">Generate Structured Objects</h1>
      <p className="text-zinc-600 dark:text-zinc-400 mb-8">
        Using <code className="bg-zinc-200 dark:bg-zinc-800 px-2 py-1 rounded">generateObject()</code> 
        to get type-safe, validated structured data instead of plain text.
      </p>

      {/* Example Type Selector */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Choose Output Strategy:</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {examples.map((example) => (
            <button
              key={example.type}
              onClick={() => handleTypeChange(example.type)}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                selectedType === example.type
                  ? getColorClasses(example.color)
                  : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600'
              }`}
            >
              <div className="font-semibold mb-1">{example.title}</div>
              <div className="text-sm opacity-80">{example.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Current Selection Info */}
      <div className={`p-4 rounded-lg border-2 mb-6 ${getColorClasses(currentExample.color)}`}>
        <h3 className="font-semibold mb-2">Selected: {currentExample.title}</h3>
        <p className="text-sm">{currentExample.description}</p>
      </div>

      {/* Input Form */}
      <div className="mb-6">
        <label className="font-semibold mb-2 block">Prompt:</label>
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 p-3 border border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 rounded-lg"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt..."
            disabled={isLoading}
          />
          <button
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-8 rounded-lg transition-colors whitespace-nowrap"
          >
            {isLoading ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>

      {/* Result Display */}
      {result && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-3">Generated Object:</h2>
          
          {result.error ? (
            <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-700 rounded-lg">
              <p className="text-red-800 dark:text-red-200 font-semibold">Error:</p>
              <p className="text-red-700 dark:text-red-300">{result.error}</p>
              {result.details && (
                <pre className="mt-2 text-xs bg-red-100 dark:bg-red-900 p-2 rounded overflow-x-auto">
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              )}
            </div>
          ) : (
            <>
              {/* Pretty Display */}
              <div className="p-6 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg mb-4">
                {selectedType === 'recipe' && result.recipe && (
                  <div>
                    <h3 className="text-2xl font-bold mb-4">{result.recipe.name}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                      <div>
                        <span className="font-semibold">Cuisine:</span> {result.recipe.cuisine}
                      </div>
                      <div>
                        <span className="font-semibold">Difficulty:</span> {result.recipe.difficulty}
                      </div>
                      <div>
                        <span className="font-semibold">Prep Time:</span> {result.recipe.prepTime}
                      </div>
                      <div>
                        <span className="font-semibold">Cook Time:</span> {result.recipe.cookTime}
                      </div>
                    </div>
                    <div className="mb-4">
                      <h4 className="font-semibold mb-2">Ingredients:</h4>
                      <ul className="list-disc list-inside">
                        {result.recipe.ingredients.map((ing: any, i: number) => (
                          <li key={i}>
                            {ing.amount} {ing.unit} {ing.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Steps:</h4>
                      <ol className="list-decimal list-inside space-y-2">
                        {result.recipe.steps.map((step: string, i: number) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  </div>
                )}

                {selectedType === 'person' && result.person && (
                  <div>
                    <h3 className="text-2xl font-bold mb-4">
                      {result.person.firstName} {result.person.lastName}
                    </h3>
                    <div className="space-y-2">
                      <p><span className="font-semibold">Age:</span> {result.person.age}</p>
                      <p><span className="font-semibold">Email:</span> {result.person.email}</p>
                      <p><span className="font-semibold">Occupation:</span> {result.person.occupation}</p>
                      <p><span className="font-semibold">Bio:</span> {result.person.bio}</p>
                      <div>
                        <span className="font-semibold">Skills:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {result.person.skills.map((skill: string, i: number) => (
                            <span key={i} className="bg-blue-200 dark:bg-blue-800 px-2 py-1 rounded text-sm">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="font-semibold">Address:</span>
                        <p className="ml-4">
                          {result.person.address.street}<br />
                          {result.person.address.city}, {result.person.address.zipCode}<br />
                          {result.person.address.country}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedType === 'product-list' && Array.isArray(result) && (
                  <div className="space-y-4">
                    {result.map((product: any, i: number) => (
                      <div key={i} className="border border-zinc-300 dark:border-zinc-700 p-4 rounded">
                        <h4 className="font-bold text-lg">{product.name}</h4>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                          {product.category}
                        </p>
                        <p className="mb-2">{product.description}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                            ${product.price.toFixed(2)}
                          </span>
                          <span className={`px-2 py-1 rounded text-sm ${
                            product.inStock
                              ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
                              : 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200'
                          }`}>
                            {product.inStock ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedType === 'classification' && typeof result === 'string' && (
                  <div className="text-center py-8">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                      Sentiment Classification:
                    </p>
                    <div className={`inline-block px-8 py-4 rounded-lg text-2xl font-bold ${
                      result === 'positive'
                        ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
                        : result === 'negative'
                        ? 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200'
                        : 'bg-zinc-300 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200'
                    }`}>
                      {result.toUpperCase()}
                    </div>
                  </div>
                )}

                {selectedType === 'no-schema' && (
                  <div className="space-y-2">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                      Dynamic JSON generated without predefined schema:
                    </p>
                    {typeof result === 'object' && (
                      <div className="space-y-2">
                        {Object.entries(result).map(([key, value]) => (
                          <div key={key}>
                            <span className="font-semibold">{key}:</span>{' '}
                            {typeof value === 'object'
                              ? JSON.stringify(value)
                              : String(value)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Raw JSON Display */}
              <details className="mb-4">
                <summary className="cursor-pointer font-semibold mb-2">
                  View Raw JSON
                </summary>
                <pre className="p-4 bg-zinc-900 text-zinc-100 rounded-lg overflow-x-auto text-sm">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </>
          )}
        </div>
      )}

      {/* Documentation */}
      <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">📚 Understanding generateObject</h3>
        <div className="space-y-2 text-sm">
          <p>
            <strong>generateObject()</strong> returns structured, type-safe data instead of plain text:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>
              <strong>Object Strategy:</strong> Returns a single structured object (recipe, person)
            </li>
            <li>
              <strong>Array Strategy:</strong> Returns an array of objects (product list)
            </li>
            <li>
              <strong>Enum Strategy:</strong> Returns one value from predefined options (classification)
            </li>
            <li>
              <strong>No Schema:</strong> Dynamically generates JSON structure
            </li>
          </ul>
          <p className="mt-3">
            <strong>Benefits:</strong> Type safety, validation, predictable structure, easy to use in your app!
          </p>
        </div>
      </div>
    </div>
  );
}

