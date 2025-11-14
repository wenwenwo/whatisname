// app/page.tsx
'use client';

import { useState } from 'react';
import type { CheckResult } from '@/lib/types';

export default function Home() {
  const [username, setUsername] = useState('');
  const [category, setCategory] = useState('allnoporn');
  const [results, setResults] = useState<CheckResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;

    setIsLoading(true);
    setError(null);
    setResults([]);

    try {
      const response = await fetch(`/api/check?username=${encodeURIComponent(username)}&category=${encodeURIComponent(category)}`);
      if (!response.ok) {
        throw new Error(`服务器错误: ${response.statusText}`);
      }
      const data: CheckResult[] = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生未知错误');
    } finally {
      setIsLoading(false);
    }
  };

  // Mock data for styling purposes, will be replaced by actual results
  const mockResults: CheckResult[] = [
    { siteName: 'character.ai', status: 'Taken', url: 'https://character.ai/profile/vinceyang1994' },
    { siteName: 'DockerHub', status: 'Taken', url: 'https://hub.docker.com/v2/users/vinceyang1994/' },
    { siteName: 'Engadget', status: 'Taken', url: 'https://www.engadget.com/about/editors/vinceyang1994/' },
    { siteName: 'giters', status: 'Taken', url: 'https://giters.com/vinceyang1994' },
    { siteName: 'GitHub', status: 'Taken', url: 'https://github.com/vinceyang1994' },
  ];

  const displayResults = results.length > 0 ? results : (isLoading ? [] : []);


  return (
    <div className="bg-white text-gray-800 min-h-screen">
      <div className="container mx-auto p-4 md:p-8">
        <header className="text-center mb-8">
          <h2 className="text-4xl md:text-5xl font-bold mb-2">Discover Your Username's Availability Across the Internet</h2>
          <p className="text-gray-600">Check instantly if your desired username is available or already taken on popular platforms and social media sites.</p>
        </header>

        <form onSubmit={handleSubmit} className="flex justify-center items-center gap-2 mb-8">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            className="flex-grow max-w-xs p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            <option value="allnoporn">All (exclude NSFW)</option>
            <option value="all">All</option>
            <option value="coding">Coding</option>
            <option value="social">Social</option>
            <option value="video">Video</option>
            {/* Add other categories as needed */}
          </select>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 disabled:bg-gray-400"
            disabled={isLoading || !username}
          >
            {isLoading ? 'Searching...' : 'Submit'}
          </button>
        </form>

        {error && (
          <div className="text-center text-red-600 p-4 mb-8">
            {error}
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded-lg border">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <select className="p-2 border border-gray-300 rounded-md">
                <option>10</option>
                <option>25</option>
                <option>50</option>
                <option>100</option>
              </select>
              <button className="p-2 border border-gray-300 rounded-md bg-white">Copy</button>
              <button className="p-2 border border-gray-300 rounded-md bg-white">Excel</button>
              <button className="p-2 border border-gray-300 rounded-md bg-white">CSV</button>
              <button className="p-2 border border-gray-300 rounded-md bg-white">PDF</button>
              <button className="p-2 border border-gray-300 rounded-md bg-white">Print</button>
              <button className="p-2 border border-gray-300 rounded-md bg-white">Stop</button>
              <button className="p-2 border border-gray-300 rounded-md bg-white">Reload</button>
            </div>
            <div className="flex items-center gap-2">
              <span>{isLoading ? 'Checking...' : `${displayResults.length}/${displayResults.length} links checked`}</span>
              <div className="flex items-center gap-2">
                <label htmlFor="search-table">Search:</label>
                <input id="search-table" type="text" className="p-2 border border-gray-300 rounded-md" />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-3 text-left font-semibold border-b">Site</th>
                  <th className="p-3 text-left font-semibold border-b">Status</th>
                  <th className="p-3 text-left font-semibold border-b">Link</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={3} className="text-center p-8">
                      <div className="flex justify-center items-center">
                        <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    </td>
                  </tr>
                )}
                {!isLoading && displayResults.sort((a, b) => a.siteName.localeCompare(b.siteName)).map((result) => (
                  <tr key={result.siteName} className="hover:bg-gray-100 border-b">
                    <td className="p-3">{result.siteName}</td>
                    <td className={`p-3 font-semibold ${result.status === 'Available' ? 'text-green-600' : 'text-red-600'}`}>
                      {result.status}
                    </td>
                    <td className="p-3">
                      <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate block max-w-xs">
                        {result.url}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-4">
            <div>
              <p>Showing 1 to {displayResults.length} of {displayResults.length} entries</p>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-2 border rounded-md" disabled>&laquo;</button>
              <button className="p-2 border rounded-md" disabled>&lsaquo;</button>
              <button className="px-4 py-2 border rounded-md bg-blue-500 text-white">1</button>
              <button className="p-2 border rounded-md">&rsaquo;</button>
              <button className="p-2 border rounded-md">&raquo;</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
