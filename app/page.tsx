// app/page.tsx
'use client'; // 声明为客户端组件

import { useState } from 'react';
import type { CheckResult } from '@/lib/types'; // 我们稍后会创建这个类型

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

  // 辅助函数，用于根据状态返回不同颜色
  const getStatusColor = (status: 'Available' | 'Taken' | 'Error') => {
    switch (status) {
      case 'Available': return 'text-green-400';
      case 'Taken': return 'text-red-400';
      case 'Error': return 'text-gray-500';
    }
  };

  return (
    <div className="container mx-auto max-w-3xl p-8">
      <h1 className="text-4xl font-bold text-center mb-8">用户名查询工具</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-8">
        <div className="flex gap-4">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="输入用户名..."
            className="flex-grow p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            <option value="allnoporn">All (exclude NSFW)</option>
            <option value="all">All</option>
            <option value="archived">Archived</option>
            <option value="art">Art</option>
            <option value="blog">Blog</option>
            <option value="business">Business</option>
            <option value="coding">Coding</option>
            <option value="dating">Dating</option>
            <option value="finance">Finance</option>
            <option value="gaming">Gaming</option>
            <option value="health">Health</option>
            <option value="hobby">Hobby</option>
            <option value="images">Images</option>
            <option value="misc">Misc</option>
            <option value="music">Music</option>
            <option value="news">News</option>
            <option value="political">Political</option>
            <option value="search">Search</option>
            <option value="shopping">Shopping</option>
            <option value="social">Social</option>
            <option value="tech">Tech</option>
            <option value="video">Video</option>
            <option value="XXNSFWXX">xx NSFW xx</option>
          </select>
        </div>
        <button
          type="submit"
          className="w-full px-6 py-3 bg-blue-600 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
          disabled={isLoading || !username}
        >
          {isLoading ? '查询中...' : '查询'}
        </button>
      </form>

      {error && (
        <div className="text-center text-red-400 p-4 bg-red-900/30 rounded-lg mb-8">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center items-center h-40">
          <svg className="animate-spin h-10 w-10 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}

      {!isLoading && results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((result) => (
            <a
              key={result.siteName}
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <h3 className="font-semibold truncate">{result.siteName}</h3>
              <p className={`font-bold ${getStatusColor(result.status)}`}>
                {result.status}
              </p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
