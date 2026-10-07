'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { apiFetch, authHeaders } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

interface ReportModalProps {
  listingId: string;
}

export function ReportModal({ listingId }: ReportModalProps) {
  const { token, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('Fausse annonce');
  const [description, setDescription] = useState('');

  const REASONS = [
    'Fausse annonce / Arnaque',
    'Logement déjà loué',
    'Prix incorrect',
    'Photos mensongères',
    'Autre',
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      toast.error('Connectez-vous pour signaler une annonce.');
      return;
    }

    setLoading(true);
    try {
      await apiFetch('/reports', {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ listingId, reason, description }),
      });
      toast.success('Signalement envoyé. Merci !');
      setIsOpen(false);
      setDescription('');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors du signalement.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (!user) {
            toast.error('Connectez-vous pour signaler une annonce.');
          } else {
            setIsOpen(true);
          }
        }}
        className="text-xs font-medium text-red-500 hover:text-red-700 transition underline underline-offset-2"
      >
        Signaler cette annonce
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-ink">Signaler une annonce</h2>
            <p className="mt-2 text-sm text-ink-soft">
              Pourquoi souhaitez-vous signaler cette annonce ? Notre équipe examinera votre signalement.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-ink-soft">Motif</span>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-sand bg-white px-3 py-2 text-sm"
                >
                  {REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-ink-soft">Détails (Optionnel)</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-lg border border-sand bg-white px-3 py-2 text-sm"
                  placeholder="Donnez-nous plus de précisions..."
                />
              </label>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-ink-soft hover:bg-sand/30"
                  disabled={loading}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Envoi...' : 'Envoyer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
