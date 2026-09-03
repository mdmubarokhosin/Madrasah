'use client';

interface PageSkeletonProps {
  cards?: number;
  showStats?: boolean;
  showBanner?: boolean;
}

export default function PageSkeleton({ cards = 6, showStats = false, showBanner = false }: PageSkeletonProps) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 animate-pulse" aria-hidden="true" aria-busy="true">
      {/* Banner skeleton */}
      {showBanner && <div className="h-40 bg-gray-200 rounded-2xl" />}

      {/* Stats skeleton */}
      {showStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl" />
          ))}
        </div>
      )}

      {/* Content cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-5 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-100 rounded w-full" />
            <div className="h-3 bg-gray-100 rounded w-5/6" />
            <div className="h-3 bg-gray-100 rounded w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
