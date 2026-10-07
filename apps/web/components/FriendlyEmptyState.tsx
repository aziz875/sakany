import Link from 'next/link';

type FriendlyEmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  actionKind?: 'primary' | 'secondary';
};

function Illustration() {
  return (
    <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
      <div className="absolute inset-0 rounded-full bg-door/10 blur-[1px]" />
      <div className="absolute inset-3 rounded-full bg-ochre/10" />
      <svg
        viewBox="0 0 64 64"
        className="relative h-14 w-14 text-door"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M12 28.5 32 14l20 14.5V50a2 2 0 0 1-2 2H14a2 2 0 0 1-2-2V28.5Z"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M24 52V36h16v16"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M40 14.5c3 0 6 1 8 3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function FriendlyEmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  actionKind = 'primary',
}: FriendlyEmptyStateProps) {
  const actionClass = actionKind === 'primary' ? 'btn-primary' : 'btn-secondary';

  return (
    <div className="surface-panel rounded-3xl border border-dashed border-sand/80 bg-white p-8 text-center sm:p-10">
      <Illustration />
      <h2 className="mt-5 font-display text-[1.65rem] font-semibold tracking-[-0.035em] text-ink">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-ink-soft">{description}</p>
      {actionHref && actionLabel && (
        <div className="mt-6">
          <Link href={actionHref} className={actionClass}>
            {actionLabel}
          </Link>
        </div>
      )}
    </div>
  );
}
