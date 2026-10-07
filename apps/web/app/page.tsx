import { Suspense } from 'react';
import { ListingsExplorer } from '@/components/ListingsExplorer';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-72px)] items-center justify-center bg-whitewash">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-sand border-t-door" />
            <p className="mt-4 text-sm text-ink-soft">Chargement de Sakany...</p>
          </div>
        </div>
      }
    >
      <ListingsExplorer />
    </Suspense>
  );
}