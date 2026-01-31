import React from 'react';

interface SkeletonLoaderProps {
  type?: 'text' | 'card' | 'repository' | 'analysis';
  lines?: number;
  className?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type = 'text',
  lines = 3,
  className = ''
}) => {
  const baseClasses = 'animate-pulse bg-dark-surface rounded';
  
  const renderTextLines = () => (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className={`${baseClasses} ${
            i === lines - 1 ? 'w-3/4' : 'w-full'
          } h-4`}
        />
      ))}
    </div>
  );

  const renderCard = () => (
    <div className={`${baseClasses} p-4 ${className}`}>
      <div className="h-6 w-3/4 mb-3 rounded" />
      <div className="space-y-2">
        <div className="h-4 w-full rounded" />
        <div className="h-4 w-5/6 rounded" />
      </div>
    </div>
  );

  const renderRepository = () => (
    <div className={`${baseClasses} p-4 mb-3 border border-dark-border rounded-lg ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="h-5 w-48 mb-2 rounded" />
          <div className="h-4 w-64 rounded" />
        </div>
        <div className="h-8 w-20 rounded ml-3" />
      </div>
      <div className="h-4 w-full rounded" />
    </div>
  );

  const renderAnalysis = () => (
    <div className={`${baseClasses} p-6 border border-dark-border rounded-lg ${className}`}>
      <div className="h-7 w-64 mb-4 rounded" />
      <div className="space-y-4">
        <div>
          <div className="h-5 w-32 mb-2 rounded" />
          <div className="h-4 w-full rounded" />
        </div>
        <div>
          <div className="h-5 w-40 mb-2 rounded" />
          <div className="h-4 w-5/6 rounded" />
        </div>
        <div>
          <div className="h-5 w-36 mb-2 rounded" />
          <div className="flex flex-wrap gap-2">
            <div className="h-6 w-24 rounded" />
            <div className="h-6 w-32 rounded" />
            <div className="h-6 w-28 rounded" />
          </div>
        </div>
      </div>
    </div>
  );

  switch (type) {
    case 'card':
      return renderCard();
    case 'repository':
      return renderRepository();
    case 'analysis':
      return renderAnalysis();
    default:
      return renderTextLines();
  }
};

export default SkeletonLoader;
