'use client';

import { useEffect, useState } from 'react';
import { apiFetch, authHeaders } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function AdminListingsPage() {
  const { token } = useAuth();
  const [listings, setListings] = useState<any[]>([]);

  useEffect(() => {
    fetchListings();
  }, [token]);

  function fetchListings() {
    if (!token) return;
    apiFetch<any[]>('/admin/listings', { headers: authHeaders(token) })
      .then(setListings)
      .catch(console.error);
  }

  async function toggleVerified(id: string, currentStatus: boolean) {
    if (!token) return;
    try {
      await apiFetch(`/admin/listings/${id}/verify`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ verified: !currentStatus })
      });
      toast.success(currentStatus ? 'Annonce dé-vérifiée' : 'Annonce vérifiée');
      fetchListings();
    } catch (err) {
      toast.error('Erreur lors de la mise à jour');
    }
  }

  async function deleteListing(id: string) {
    if (!token || !confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) return;
    try {
      await apiFetch(`/admin/listings/${id}/verify`, {
        method: 'DELETE',
        headers: authHeaders(token)
      });
      toast.success('Annonce supprimée');
      fetchListings();
    } catch (err) {
      toast.error('Erreur lors de la suppression');
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-ink">Modération des Annonces</h1>
      
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead>
            <tr className="border-b border-sand text-ink-soft">
              <th className="py-3 font-medium">Titre</th>
              <th className="py-3 font-medium">Propriétaire</th>
              <th className="py-3 font-medium">Signalements</th>
              <th className="py-3 font-medium">Statut</th>
              <th className="py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand">
            {listings.map(l => (
              <tr key={l.id}>
                <td className="py-3 text-ink font-medium max-w-[300px] truncate">
                  <Link href={`/listings/${l.id}`} className="hover:underline text-door" target="_blank">
                    {l.title}
                  </Link>
                </td>
                <td className="py-3 text-ink-soft">{l.landlord.fullName}</td>
                <td className="py-3">
                  {l._count.reports > 0 ? (
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700">
                      {l._count.reports} signalement(s)
                    </span>
                  ) : (
                    <span className="text-ink-soft">Aucun</span>
                  )}
                </td>
                <td className="py-3">
                  {l.verified ? (
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700">
                      Vérifié
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-sand text-ink-soft">
                      Standard
                    </span>
                  )}
                </td>
                <td className="py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => toggleVerified(l.id, l.verified)}
                      className="text-xs font-medium text-door hover:text-door-deep transition"
                    >
                      {l.verified ? 'Dé-vérifier' : 'Vérifier'}
                    </button>
                    <span className="text-sand">|</span>
                    <button
                      onClick={() => deleteListing(l.id)}
                      className="text-xs font-medium text-red-500 hover:text-red-700 transition"
                    >
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {listings.length === 0 && <p className="mt-4 text-center text-sm text-ink-soft">Aucune annonce trouvée.</p>}
      </div>
    </div>
  );
}
