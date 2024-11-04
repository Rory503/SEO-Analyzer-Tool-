import React, { useState } from 'react';
import { analyzeSeo } from '../utils/seoAnalyzer';
import ResultCard from './ResultCard';

interface AnalysisResults {
  metaScore: number;
  metaIssues: string[];
  contentScore: number;
  contentIssues: string[];
  performanceScore: number;
  performanceIssues: string[];
}

const SeoAnalyzer: React.FC = () => {
  const [url, setUrl] = useState('');
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalysis = async () => {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setError('Please enter a valid URL starting with http:// or https://');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setResults(null);
      const analysisResults = await analyzeSeo(url);
      setResults(analysisResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze website. Please check the URL and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter website URL (e.g., https://example.com)"
          className="w-full p-3 border rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          onClick={handleAnalysis}
          disabled={loading || !url}
          className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Analyzing...' : 'Analyze SEO'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
          {error}
        </div>
      )}

      {results && (
        <div className="grid gap-6">
          <ResultCard
            title="Meta Tags"
            score={results.metaScore}
            issues={results.metaIssues}
          />
          <ResultCard
            title="Content Analysis"
            score={results.contentScore}
            issues={results.contentIssues}
          />
          <ResultCard
            title="Performance"
            score={results.performanceScore}
            issues={results.performanceIssues}
          />
        </div>
      )}
    </div>
  );
};

export default SeoAnalyzer;