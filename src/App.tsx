import React from 'react';
import SeoAnalyzer from './components/SeoAnalyzer';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8">SEO Analyzer Tool</h1>
        <p className="text-center text-gray-600 mb-12">
          Analyze your website's SEO performance and get actionable recommendations
        </p>
        <SeoAnalyzer />
      </div>
    </div>
  );
}

export default App;