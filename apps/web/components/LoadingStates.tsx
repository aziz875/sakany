import { Skeleton } from './Skeleton';
import { MOTION } from '@/lib/motion';

export function SearchBarSkeleton() {
  return (
    <div className="surface-panel rounded-[1.75rem] border border-sand/80 bg-white/88 p-4 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-32 rounded-full" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <Skeleton className="h-5 w-36 rounded-full" />
        <Skeleton className="h-5 w-36 rounded-full" />
        <div className="ml-auto">
          <Skeleton className="h-11 w-32 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function ListingCardSkeleton({ delayMs = 0 }: { delayMs?: number }) {
  return (
    <article className="overflow-hidden rounded-[1.7rem] border border-sand/80 bg-white shadow-[0_20px_60px_-36px_rgba(24,38,44,0.34),0_6px_18px_-14px_rgba(30,20,12,0.08)]">
      <div className="relative mx-3 mt-3">
        <div className="arch-frame relative aspect-[4/3] bg-sand">
          <Skeleton className="absolute inset-0 rounded-[inherit]" durationMs={MOTION.duration.shimmer} />
          <Skeleton className="absolute left-3 top-3 h-6 w-20 rounded-full bg-white/40" />
          <Skeleton className="absolute right-3 top-3 h-6 w-24 rounded-full bg-white/40" />
          <Skeleton className="absolute bottom-3 right-3 h-10 w-10 rounded-full bg-white/40" />
        </div>
      </div>

      <div className="space-y-3 p-4 pt-3">
        <Skeleton className="h-5 w-3/4 rounded-full" delayMs={delayMs} />
        <Skeleton className="h-4 w-1/2 rounded-full" delayMs={delayMs + 20} />

        <div className="mt-4 flex items-end justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-28 rounded-full" delayMs={delayMs + 40} />
            <Skeleton className="h-4 w-24 rounded-full" delayMs={delayMs + 60} />
          </div>
          <Skeleton className="h-7 w-20 rounded-full" delayMs={delayMs + 80} />
        </div>
      </div>
    </article>
  );
}

export function ListingGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <ListingCardSkeleton key={index} delayMs={index * MOTION.stagger.card} />
      ))}
    </div>
  );
}

export function HomePageSkeleton() {
  return (
    <div>
      <section className="hero-wash border-b border-sand/80">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
          <Skeleton className="h-4 w-48 rounded-full" />
          <Skeleton className="mt-4 h-12 w-full max-w-2xl rounded-full" />
          <Skeleton className="mt-5 h-6 w-full max-w-xl rounded-full" />
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <SearchBarSkeleton />
        <div className="my-8 h-px bg-sand" />
        <ListingGridSkeleton />
      </div>
    </div>
  );
}

export function ListingDetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Skeleton className="h-4 w-40 rounded-full" />

      <div className="mt-6 grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Skeleton className="aspect-[16/10] w-full rounded-3xl" durationMs={MOTION.duration.shimmer} />
          <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton
                key={index}
                className="aspect-[4/3] rounded-2xl"
                delayMs={index * MOTION.stagger.card}
              />
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-6 w-32 rounded-full" />
          <Skeleton className="h-10 w-3/4 rounded-full" />
          <Skeleton className="h-4 w-1/2 rounded-full" />
          <Skeleton className="h-10 w-40 rounded-full" />

          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-20 rounded-2xl" delayMs={index * 20} />
            ))}
          </div>

          <Skeleton className="h-4 w-full rounded-full" />
          <Skeleton className="h-4 w-5/6 rounded-full" />
          <Skeleton className="h-4 w-2/3 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="surface-panel rounded-3xl border border-sand/80 bg-white p-6">
        <Skeleton className="h-4 w-28 rounded-full" />
        <Skeleton className="mt-3 h-10 w-48 rounded-full" />
        <Skeleton className="mt-2 h-4 w-64 rounded-full" />

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-2xl bg-sand/40 p-4">
              <Skeleton className="h-4 w-20 rounded-full" />
              <Skeleton className="mt-2 h-5 w-32 rounded-full" />
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Skeleton className="h-11 w-32 rounded-full" />
          <Skeleton className="h-11 w-28 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <Skeleton className="h-4 w-40 rounded-full" />
          <Skeleton className="h-10 w-64 rounded-full" />
          <Skeleton className="h-5 w-72 rounded-full" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-11 w-32 rounded-full" />
          <Skeleton className="h-11 w-36 rounded-full" />
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="surface-panel rounded-2xl border border-sand/80 bg-white p-5">
            <Skeleton className="h-4 w-20 rounded-full" />
            <Skeleton className="mt-2 h-8 w-24 rounded-full" />
            <Skeleton className="mt-2 h-3 w-32 rounded-full" />
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-20 rounded-xl" />
        ))}
      </div>

      <div className="mt-10">
        <Skeleton className="h-6 w-40 rounded-full" />
        <div className="surface-panel mt-4 rounded-2xl border border-sand/80 bg-white p-4">
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-16 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ApplicationsSkeleton() {
  return (
    <section className="mt-12">
      <Skeleton className="h-6 w-44 rounded-full" />
      <div className="mt-4 grid gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <article key={index} className="surface-panel rounded-xl border border-sand/80 bg-white p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-3">
                <Skeleton className="h-5 w-36 rounded-full" />
                <Skeleton className="h-4 w-64 rounded-full" />
                <Skeleton className="h-4 w-52 rounded-full" />
                <Skeleton className="h-16 w-full rounded-2xl" />
              </div>
              <div className="flex flex-col items-end gap-3">
                <Skeleton className="h-6 w-24 rounded-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-16 rounded-lg" />
                  <Skeleton className="h-8 w-16 rounded-lg" />
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function VerifyEmailSkeleton() {
  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6 text-center">
      <div className="surface-panel rounded-2xl border border-sand/80 bg-white p-6">
        <Skeleton className="mx-auto h-8 w-48 rounded-full" />
        <Skeleton className="mx-auto mt-3 h-4 w-40 rounded-full" />
        <Skeleton className="mx-auto mt-8 h-12 w-40 rounded-full" />
      </div>
    </div>
  );
}

export function ListingFormSkeleton() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="space-y-3">
        <Skeleton className="h-10 w-72 rounded-full" />
        <Skeleton className="h-5 w-full max-w-xl rounded-full" />
      </div>

      <div className="mt-8 space-y-5">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="surface-panel rounded-2xl border border-sand/80 bg-white p-4">
          <Skeleton className="h-4 w-24 rounded-full" />
          <Skeleton className="mt-3 h-12 w-full rounded-xl" />
          <Skeleton className="mt-3 h-24 w-full rounded-2xl" />
        </div>
        <Skeleton className="h-12 w-48 rounded-full" />
      </div>
    </div>
  );
}
