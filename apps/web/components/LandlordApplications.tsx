'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

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
      .catch((err) => {
        if (active) setError('Erreur de chargement des candidatures.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const handleUpdateStatus = async (id: string, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      const updated = await apiFetch<Application>(`/applications/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setApplications((current) =>
        current.map((app) => (app.id === id ? updated : app))
      );
    } catch (err) {
      alert('Erreur lors de la mise à jour.');
    }
  };

  if (loading) return <div className="mt-8">Chargement des candidatures...</div>;
  if (error) return <div className="mt-8 text-red-600">{error}</div>;

  if (applications.length === 0) {
    return (
      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold text-ink">Candidatures reçues</h2>
        <div className="mt-4 rounded-2xl border border-dashed border-sand bg-white p-8 text-center text-ink-soft">
          Aucune candidature pour le moment.
        </div>
      </section>
    );
  }

  return (
    <section className="mt-12">
      <h2 className="font-display text-xl font-semibold text-ink">Candidatures reçues</h2>
      <div className="mt-4 grid gap-4">
        {applications.map((app) => (
          <article key={app.id} className="rounded-xl border border-sand bg-white p-5 shadow-sm">
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
                  <div className="mt-3 rounded-lg bg-sand/30 p-3 text-sm text-ink-soft">
                    &quot;{app.message}&quot;
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end gap-2">
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                  app.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800' :
                  app.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                  'bg-amber-100 text-amber-800'
                }`}>
                  {app.status === 'PENDING' ? 'En attente' :
                   app.status === 'ACCEPTED' ? 'Acceptée' : 'Refusée'}
                </span>

                {app.status === 'PENDING' && (
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => handleUpdateStatus(app.id, 'REJECTED')}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                    >
                      Refuser
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(app.id, 'ACCEPTED')}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
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
