import { ListingGridSkeleton } from '@/components/LoadingStates';
import { Skeleton } from '@/components/Skeleton';

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="max-w-2xl space-y-3">
        <Skeleton className="h-4 w-28 rounded-full" />
        <Skeleton className="h-10 w-72 rounded-full" />
        <Skeleton className="h-5 w-full max-w-xl rounded-full" />
      </div>
      <div className="mt-8">
        <ListingGridSkeleton count={3} />
      </div>
    </div>
  );
}
