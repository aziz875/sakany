'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api';

interface ApplicationButtonProps {
  listingId: string;
}

export function ApplicationButton({ listingId }: ApplicationButtonProps) {
  const { user, isStudent } = useAuth();
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user || !isStudent) {
      setLoading(false);
      return;
    }

    apiFetch(`/listings/${listingId}/applications/me`)
      .then((data) => setApplication(data))
      .catch(() => setApplication(null))
      .finally(() => setLoading(false));
  }, [user, isStudent, listingId]);

  if (!isStudent) return null;
  if (loading) return <div className="mt-4 text-sm text-ink-soft">Chargement...</div>;

  if (application) {
    const statusText = {
      PENDING: 'En attente',
      ACCEPTED: 'Acceptée',
      REJECTED: 'Refusée'
    }[application.status as string] || application.status;

    const statusColor = {
      PENDING: 'text-amber-600 bg-amber-50 border-amber-200',
      ACCEPTED: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      REJECTED: 'text-red-700 bg-red-50 border-red-200'
    }[application.status as string] || 'text-ink-soft bg-sand border-sand';

    return (
      <div className={`mt-4 inline-flex items-center rounded-xl border px-3 py-1.5 text-sm font-medium ${statusColor}`}>
        Candidature : {statusText}
      </div>
    );
  }

  const handleApply = async () => {
    setSubmitting(true);
    try {
      const data = await apiFetch(`/listings/${listingId}/applications`, {
        method: 'POST',
        body: JSON.stringify({ message }),
      });
      setApplication(data);
      setShowModal(false);
    } catch (err) {
      alert('Erreur lors de la candidature.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <button 
      onClick={handleApply}
      disabled={submitting}
      className="mt-4 w-full rounded-xl bg-door px-4 py-2.5 text-sm font-medium text-white transition hover:bg-door-deep disabled:opacity-50"
    >
      {submitting ? 'Envoi...' : 'Postuler pour ce logement'}
    </button>
  );
}
