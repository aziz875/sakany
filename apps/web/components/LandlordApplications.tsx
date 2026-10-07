'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { ApplicationsSkeleton } from './LoadingStates';
import { FriendlyEmptyState } from './FriendlyEmptyState';

interface Application {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  message: string | null;
  createdAt: string;
  student: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
  };
  listing: {
    id: string;
    title: string;
    pricePerMonth: number;
    roomType: string;
  };
}

export function LandlordApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    apiFetch<Application[]>('/applications')
      .then((data) => {
        if (active) setApplications(data);
      })
      .catch(() => {
        if (active) setError('Erreur de chargement des candidatures.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleUpdateStatus = async (id: string, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      const updated = await apiFetch<Application>(`/applications/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setApplications((current) => current.map((app) => (app.id === id ? updated : app)));
      toast.success('Candidature mise à jour.');
    } catch {
      toast.error('Erreur lors de la mise à jour.');
    }
  };

  if (loading) return <ApplicationsSkeleton />;
  if (error) {
    return (
      <section className="mt-12">
        <h2 className="font-display text-[1.35rem] font-semibold tracking-[-0.03em] text-ink">
          Candidatures reçues
        </h2>
        <div className="surface-panel mt-4 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700" role="alert">
          {error}
        </div>
      </section>
    );
  }

  if (applications.length === 0) {
    return (
      <section className="mt-12">
        <h2 className="font-display text-[1.35rem] font-semibold tracking-[-0.03em] text-ink">
          Candidatures reçues
        </h2>
        <div className="mt-4">
          <FriendlyEmptyState
            title="Aucune candidature pour le moment"
            description="Les étudiants verront bientôt tes annonces et pourront te contacter ici."
          />
        </div>
      </section>
    );
  }

  return (
    <section className="mt-12">
      <h2 className="font-display text-[1.35rem] font-semibold tracking-[-0.03em] text-ink">
        Candidatures reçues
      </h2>
      <div className="mt-4 grid gap-4">
        {applications.map((app) => (
          <article
            key={app.id}
            className="surface-panel rounded-[1.25rem] border border-sand/80 bg-white p-5"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="font-semibold text-ink">{app.student.fullName}</h3>
                <p className="text-sm text-ink-soft">
                  Postule pour : <span className="font-medium text-ink">{app.listing.title}</span>
                </p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-soft">
                  <span>Email: {app.student.email}</span>
                  <span>Tél: {app.student.phone}</span>
                </div>
                {app.message && (
                  <div className="mt-3 rounded-2xl bg-sand/30 p-3 text-sm text-ink-soft">
                    &quot;{app.message}&quot;
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    app.status === 'ACCEPTED'
                      ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                      : app.status === 'REJECTED'
                        ? 'border border-rose-200 bg-rose-50 text-rose-800'
                        : 'border border-amber-200 bg-amber-50 text-amber-800'
                  }`}
                >
                  {app.status === 'PENDING' ? 'En attente' : app.status === 'ACCEPTED' ? 'Acceptée' : 'Refusée'}
                </span>

                {app.status === 'PENDING' && (
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(app.id, 'REJECTED')}
                      className="pressable rounded-full border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50"
                    >
                      Refuser
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(app.id, 'ACCEPTED')}
                      className="pressable rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                    >
                      Accepter
                    </button>
                  </div>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
