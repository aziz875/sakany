'use client';

import { useEffect, useState } from 'react';
import { apiFetch, authHeaders } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Users, Home, AlertCircle } from 'lucide-react';

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<{ userCount: number; listingCount: number; pendingReports: number } | null>(null);

  useEffect(() => {
    if (!token) return;
    apiFetch<{ userCount: number; listingCount: number; pendingReports: number }>('/admin/stats', { headers: authHeaders(token) })
      .then(setStats)
      .catch(console.error);
  }, [token]);

  if (!stats) return <div className="text-sm text-ink-soft">Chargement des statistiques...</div>;

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-ink">Vue d'ensemble</h1>
      <p className="mt-1 text-sm text-ink-soft">Bienvenue sur le panneau d'administration de Sakany.</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-xl border border-sand bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-door/10 text-door">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-ink-soft">Utilisateurs</p>
            <p className="text-2xl font-bold text-ink">{stats.userCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-sand bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Home size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-ink-soft">Annonces</p>
            <p className="text-2xl font-bold text-ink">{stats.listingCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-sand bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-ink-soft">Signalements (En attente)</p>
            <p className="text-2xl font-bold text-ink">{stats.pendingReports}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
