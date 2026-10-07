'use client';

import { useEffect, useState } from 'react';
import { apiFetch, authHeaders } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function AdminUsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (!token) return;
    apiFetch<any[]>('/admin/users', { headers: authHeaders(token) })
      .then(setUsers)
      .catch(console.error);
  }, [token]);

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-ink">Utilisateurs récents</h1>
      
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead>
            <tr className="border-b border-sand text-ink-soft">
              <th className="py-3 font-medium">Nom</th>
              <th className="py-3 font-medium">Email</th>
              <th className="py-3 font-medium">Rôle</th>
              <th className="py-3 font-medium">Annonces</th>
              <th className="py-3 font-medium">Date d'inscription</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand">
            {users.map(u => (
              <tr key={u.id}>
                <td className="py-3 text-ink font-medium">{u.fullName}</td>
                <td className="py-3 text-ink-soft">{u.email}</td>
                <td className="py-3">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    u.role === 'ADMIN' ? 'bg-red-100 text-red-700' :
                    u.role === 'LANDLORD' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="py-3 text-ink-soft">{u._count.listings}</td>
                <td className="py-3 text-ink-soft">{new Date(u.createdAt).toLocaleDateString('fr-FR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <p className="mt-4 text-center text-sm text-ink-soft">Aucun utilisateur trouvé.</p>}
      </div>
    </div>
  );
}
