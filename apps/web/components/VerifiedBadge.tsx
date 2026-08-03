export function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-medium text-door shadow-sm">
      <span className="h-1.5 w-1.5 rounded-full bg-door" aria-hidden />
      Vérifié
    </span>
  );
}
