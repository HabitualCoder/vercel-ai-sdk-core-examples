'use client';

import { useState } from 'react';

export default function MCPDemo() {
  const [repo, setRepo] = useState('vercel/ai');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/mcp-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to fetch repo info' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">GitHub MCP Demo</h1>
      <p className="mb-8 text-zinc-600">Using Real MCP Server: api.githubcopilot.com</p>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            placeholder="owner/repo (e.g., vercel/ai)"
            className="flex-1 p-3 border rounded"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded disabled:bg-gray-400"
          >
            {loading ? 'Loading...' : 'Get Repo Info'}
          </button>
        </div>
      </form>

      {result && (
        <div className="bg-gray-50 p-6 rounded">
          {result.error ? (
            <p className="text-red-600">{result.error}</p>
          ) : (
            <>
              <h2 className="text-xl font-bold mb-4">Result:</h2>
              <p className="whitespace-pre-wrap mb-4">{result.text}</p>
              {result.toolCalls?.length > 0 && (
                <details className="mt-4">
                  <summary className="cursor-pointer font-semibold">MCP Tools Used</summary>
                  <pre className="mt-2 bg-gray-900 text-white p-4 rounded overflow-x-auto">
                    {JSON.stringify(result.toolCalls, null, 2)}
                  </pre>
                </details>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}