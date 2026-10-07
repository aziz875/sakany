'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { apiFetch, authHeaders } from '@/lib/api';
import { Flag, ExternalLink, CheckCircle, Clock, AlertTriangle, Filter } from 'lucide-react';

interface ReportItem {
  id: string;
  reporterId: string;
  listingId: string;
  reason: string;
  description: string | null;
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED';
  createdAt: string;
  reporter: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
  };
  listing: {
    id: string;
    title: string;
    pricePerMonth: number;
    verified: boolean;
  };
}

export default function AdminReportsPage() {
  const { token } = useAuth();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'REVIEWED' | 'RESOLVED'>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    apiFetch<ReportItem[]>('/admin/reports', { headers: authHeaders(token) })
      .then((data) => setReports(data))
      .catch((err) => setError(err.message || 'Erreur lors du chargement des signalements.'))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleStatusChange(reportId: string, newStatus: 'PENDING' | 'REVIEWED' | 'RESOLVED') {
    if (!token) return;
    setUpdatingId(reportId);

    try {
      const updated = await apiFetch<ReportItem>('/admin/reports', {
        method: 'PATCH',
        headers: authHeaders(token),
        body: JSON.stringify({ reportId, status: newStatus }),
      });

      setReports((prev) => prev.map((r) => (r.id === reportId ? updated : r)));
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la mise à jour.');
    } finally {
      setUpdatingId(null);
    }
  }

  const filteredReports = reports.filter((r) => {
    if (filter === 'ALL') return true;
    return r.status === filter;
  });

  const pendingCount = reports.filter((r) => r.status === 'PENDING').length;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded-xl bg-sand/40 animate-pulse" />
        <div className="h-40 rounded-2xl bg-sand/20 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold text-ink">Gestion des signalements</h1>
            {pendingCount > 0 && (
              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700">
                {pendingCount} en attente
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-ink-soft">
            Examinez et traitez les signalements d&apos;annonces suspectes ou non conformes.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 rounded-xl bg-sand/30 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className={`rounded-lg px-3 py-1.5 transition ${
              filter === 'ALL' ? 'bg-white text-ink shadow-xs' : 'text-ink-soft hover:text-ink'
            }`}
          >
            Tous ({reports.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('PENDING')}
            className={`rounded-lg px-3 py-1.5 transition ${
              filter === 'PENDING' ? 'bg-white text-amber-700 shadow-xs' : 'text-ink-soft hover:text-ink'
            }`}
          >
            En attente ({reports.filter((r) => r.status === 'PENDING').length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('REVIEWED')}
            className={`rounded-lg px-3 py-1.5 transition ${
              filter === 'REVIEWED' ? 'bg-white text-blue-700 shadow-xs' : 'text-ink-soft hover:text-ink'
            }`}
          >
            Examinés ({reports.filter((r) => r.status === 'REVIEWED').length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('RESOLVED')}
            className={`rounded-lg px-3 py-1.5 transition ${
              filter === 'RESOLVED' ? 'bg-white text-emerald-700 shadow-xs' : 'text-ink-soft hover:text-ink'
            }`}
          >
            Résolus ({reports.filter((r) => r.status === 'RESOLVED').length})
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      {filteredReports.length === 0 ? (
        <div className="rounded-2xl border border-sand bg-sand/10 p-12 text-center text-ink-soft">
          <Flag size={36} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold">Aucun signalement dans cette catégorie</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="rounded-2xl border border-sand bg-white p-5 shadow-sm transition hover:shadow-md space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-sand/50 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-ink">{report.reason}</span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        report.status === 'PENDING'
                          ? 'bg-amber-100 text-amber-800'
                          : report.status === 'REVIEWED'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {report.status === 'PENDING' ? 'En attente' : report.status === 'REVIEWED' ? 'Examiné' : 'Résolu'}
                    </span>
                  </div>
                  <p className="text-xs text-ink-soft mt-1">
                    Signalé par <strong className="text-ink">{report.reporter.fullName}</strong> ({report.reporter.email}) ·{' '}
                    {new Date(report.createdAt).toLocaleDateString('fr-TN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                <Link
                  href={`/listings/${report.listingId}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-door hover:underline self-start shrink-0"
                >
                  <span>Voir l&apos;annonce</span>
                  <ExternalLink size={13} />
                </Link>
              </div>

              {/* Reported listing info & description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl bg-sand/20 p-3">
                  <span className="font-bold text-ink-soft uppercase text-[10px] block mb-1">Annonce concernée</span>
                  <p className="font-semibold text-ink">{report.listing?.title || 'Annonce supprimée'}</p>
                  {report.listing && (
                    <p className="text-ink-soft mt-0.5">{report.listing.pricePerMonth} DT/mois</p>
                  )}
                </div>

                <div className="rounded-xl bg-sand/20 p-3">
                  <span className="font-bold text-ink-soft uppercase text-[10px] block mb-1">Détails du signalement</span>
                  <p className="text-ink leading-relaxed">
                    {report.description || 'Aucun détail supplémentaire fourni.'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-1">
                {report.status !== 'PENDING' && (
                  <button
                    type="button"
                    disabled={updatingId === report.id}
                    onClick={() => handleStatusChange(report.id, 'PENDING')}
                    className="rounded-full border border-sand px-3.5 py-1.5 text-xs font-semibold text-ink-soft hover:bg-sand/30 disabled:opacity-50"
                  >
                    Remettre en attente
                  </button>
                )}

                {report.status !== 'REVIEWED' && (
                  <button
                    type="button"
                    disabled={updatingId === report.id}
                    onClick={() => handleStatusChange(report.id, 'REVIEWED')}
                    className="rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                  >
                    Marquer comme examiné
                  </button>
                )}

                {report.status !== 'RESOLVED' && (
                  <button
                    type="button"
                    disabled={updatingId === report.id}
                    onClick={() => handleStatusChange(report.id, 'RESOLVED')}
                    className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    <CheckCircle size={13} />
                    <span>Résoudre</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
