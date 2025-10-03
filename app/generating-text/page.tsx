'use client';

import { useState } from 'react';

export default function GeneratingText() {
  const [article, setArticle] = useState('');
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!article.trim()) return;

    setIsLoading(true);
    setSummary('');

    try {
      const response = await fetch('/api/generating-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ article }),
      });

      const data = await response.json();
      
      if (data.error) {
        setSummary('Error: ' + data.error);
      } else {
        setSummary(data.text);
      }
    } catch (error) {
      setSummary('Error: Failed to generate summary');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-4xl py-24 mx-auto px-4">
      <h1 className="text-3xl font-bold mb-8">Text Generation - Article Summarizer</h1>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="article" className="font-semibold">
            Enter an article to summarize:
          </label>
          <textarea
            id="article"
            className="w-full p-4 border border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 rounded-lg min-h-[300px] resize-y"
            value={article}
            onChange={(e) => setArticle(e.target.value)}
            placeholder="Paste your article here..."
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !article.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          {isLoading ? 'Generating Summary...' : 'Generate Summary'}
        </button>
      </form>

      {summary && (
        <div className="mt-8 p-6 bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Summary:</h2>
          <p className="text-lg leading-relaxed whitespace-pre-wrap">{summary}</p>
        </div>
      )}
    </div>
  );
}

