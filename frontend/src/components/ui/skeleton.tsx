interface SkeletonProps {
  lines?: number;
}

export function Skeleton({ lines = 3 }: SkeletonProps) {
  return (
    <div className="skeleton-block" aria-hidden="true">
      {Array.from({ length: lines }, (_, index) => (
        <div key={index} className="skeleton-line" style={{ width: `${70 + (index % 3) * 10}%` }} />
      ))}
    </div>
  );
}
