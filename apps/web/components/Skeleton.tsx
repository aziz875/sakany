import type { CSSProperties, HTMLAttributes } from 'react';

type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  delayMs?: number;
  durationMs?: number;
};

export function Skeleton({
  className = '',
  delayMs = 0,
  durationMs,
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`skeleton ${className}`.trim()}
      style={
        {
          ...style,
          ...(delayMs ? { '--skeleton-delay': `${delayMs}ms` } : null),
          ...(durationMs ? { '--skeleton-duration': `${durationMs}ms` } : null),
        } as CSSProperties
      }
      {...props}
    />
  );
}

