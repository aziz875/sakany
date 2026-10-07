type BrandImageFallbackProps = {
  title?: string;
  compact?: boolean;
  className?: string;
};

export function BrandImageFallback({ title = 'Logement Sakany', compact = false, className = '' }: BrandImageFallbackProps) {
  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,rgba(239,230,208,0.95),rgba(251,248,242,0.98))] ${className}`.trim()}
      aria-label={`${title} - image indisponible`}
    >
      <div className="flex flex-col items-center justify-center gap-2 text-center">
        <div className={`relative rounded-full bg-white/75 shadow-[0_12px_28px_-18px_rgba(18,48,58,0.35)] ${compact ? 'p-3' : 'p-4'}`}>
          <svg
            viewBox="0 0 64 64"
            className={compact ? 'h-8 w-8 text-door' : 'h-10 w-10 text-door'}
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M12 29 32 15l20 14v20a2 2 0 0 1-2 2H14a2 2 0 0 1-2-2V29Z"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinejoin="round"
            />
            <path
              d="M24 51V37h16v14"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M40 16c3 0 5.5 1 7.5 2.8"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
            />
          </svg>
        </div>
        {!compact && <span className="sr-only">{title}</span>}
      </div>
    </div>
  );
}
