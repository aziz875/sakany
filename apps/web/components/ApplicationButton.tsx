'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { MOTION } from '@/lib/motion';
import { Skeleton } from './Skeleton';

interface ApplicationButtonProps {
  listingId: string;
}

type ApplicationState = {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
};

export function ApplicationButton({ listingId }: ApplicationButtonProps) {
  const { user, isStudent } = useAuth();
  const [application, setApplication] = useState<ApplicationState | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user || !isStudent) {
      setLoading(false);
      return;
    }

    apiFetch<ApplicationState | null>(`/listings/${listingId}/applications/me`)
      .then((data) => setApplication(data))
      .catch(() => setApplication(null))
      .finally(() => setLoading(false));
  }, [user, isStudent, listingId]);

  if (!isStudent) return null;
  if (loading) return <Skeleton className="mt-4 h-11 w-full rounded-xl" />;

  if (application) {
    const statusText =
      {
        PENDING: 'En attente',
        ACCEPTED: 'Acceptée',
        REJECTED: 'Refusée',
      }[application.status] ?? application.status;

    const statusClass =
      {
        PENDING: 'text-amber-700 bg-amber-50 border-amber-200',
        ACCEPTED: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        REJECTED: 'text-red-700 bg-red-50 border-red-200',
      }[application.status] ?? 'text-ink-soft bg-sand border-sand';

    return (
      <div
        className={`mt-4 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium ${statusClass}`}
        aria-live="polite"
      >
        <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-full bg-current animate-pulse" />
        Candidature : {statusText}
      </div>
    );
  }

  const handleApply = async () => {
    setSubmitting(true);
    try {
      const data = await apiFetch<ApplicationState>(`/listings/${listingId}/applications`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      setApplication(data);
      toast.success('Candidature envoyée avec succès.');
    } catch {
      toast.error('Erreur lors de la candidature.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleApply}
      disabled={submitting}
      className="pressable mt-4 w-full rounded-xl bg-door px-4 py-2.5 text-sm font-medium text-white transition hover:bg-door-deep disabled:opacity-50"
    >
      {submitting ? 'Envoi...' : 'Postuler pour ce logement'}
    </button>
  );
}
