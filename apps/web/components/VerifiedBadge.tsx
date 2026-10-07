type BadgeProps = {
  className?: string;
};

export function VerifiedBadge({ className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 shadow-[0_10px_24px_-18px_rgba(16,185,129,0.45)] ${className}`.trim()}
    >
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
        <path
          d="M6.7 10.2 4.7 8.2l-1 1 3 3 6-6-1-1-5 5Z"
          fill="currentColor"
        />
      </svg>
      Vérifié
    </span>
  );
}

export function FeaturedBadge({ className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 shadow-[0_10px_24px_-18px_rgba(201,123,61,0.45)] ${className}`.trim()}
    >
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
        <path
          d="m8 1.8 1.7 3.4 3.8.5-2.8 2.7.7 3.7L8 10.3l-3.4 1.8.7-3.7-2.8-2.7 3.8-.5L8 1.8Z"
          fill="currentColor"
        />
      </svg>
      En vedette
    </span>
  );
}
