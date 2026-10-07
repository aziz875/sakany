'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@sakany/shared';
import { ShieldAlert, Users, Home, Flag } from 'lucide-react';
import { ListingFormSkeleton } from '@/components/LoadingStates';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loading) return;
    
    if (!user || user.role !== UserRole.ADMIN) {
      router.replace('/');
    } else {
      setReady(true);
    }
  }, [user, loading, router]);

  if (!ready || loading) {
    return <ListingFormSkeleton />;
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col md:flex-row gap-6 px-4 py-8 sm:px-6">
      <aside className="w-full shrink-0 md:w-64">
        <nav className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm border border-sand">
          <h2 className="mb-2 px-2 text-xs font-bold uppercase tracking-wider text-ink-soft">Administration</h2>
          <Link href="/admin" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-sand/30">
            <ShieldAlert size={18} />
            Dashboard
          </Link>
          <Link href="/admin/users" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-sand/30">
            <Users size={18} />
            Utilisateurs
          </Link>
          <Link href="/admin/listings" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-sand/30">
            <Home size={18} />
            Annonces
          </Link>
          <Link href="/admin/reports" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-sand/30">
            <Flag size={18} />
            Signalements
          </Link>
        </nav>
      </aside>
      
      <main className="flex-1">
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-sand min-h-[500px]">
          {children}
        </div>
      </main>
    </div>
  );
}
