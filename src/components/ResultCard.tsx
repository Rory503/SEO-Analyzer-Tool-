import React from 'react';

interface ResultCardProps {
  title: string;
  score: number;
  issues: string[];
}

const ResultCard: React.FC<ResultCardProps> = ({ title, score, issues }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">{title}</h3>
        <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
          {score}/100
        </span>
      </div>
      <ul className="space-y-2">
        {issues.map((issue, index) => (
          <li key={index} className="flex items-start">
            <span className="mr-2">•</span>
            <span>{issue}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ResultCard;