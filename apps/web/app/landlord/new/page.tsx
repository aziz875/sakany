'use client';

import { useRouter } from 'next/navigation';
import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { RoomType, UserRole } from '@sakany/shared';
import { apiFetch, authHeaders } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { ROOM_TYPE_OPTIONS } from '@/lib/constants';

export default function NewListingPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [photoInput, setPhotoInput] = useState('');

  useEffect(() => {
    if (authLoading) return;
    setReady(true);

    if (!user || !token || user.role !== UserRole.LANDLORD) {
      router.replace('/auth/login');
    }
  }, [authLoading, router, token, user]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!token) {
      setError("Connecte-toi d'abord en tant que proprietaire.");
      setLoading(false);
      router.push('/auth/login');
      return;
    }

    const form = new FormData(e.currentTarget);
    const lat = parseFloat(form.get('lat') as string);
    const lng = parseFloat(form.get('lng') as string);

    try {
      const listing = await apiFetch<{ id: string }>('/listings', {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({
          title: form.get('title'),
          description: form.get('description'),
          lat,
          lng,
          pricePerMonth: parseInt(form.get('pricePerMonth') as string, 10),
          roomType: form.get('roomType'),
          furnished: form.get('furnished') === 'on',
        }),
      });

      if (photoUrls.length > 0) {
        await apiFetch(`/listings/${listing.id}/photos`, {
          method: 'POST',
          headers: authHeaders(token),
          body: JSON.stringify({
            photos: photoUrls.map((url, index) => ({ url, sortOrder: index })),
          }),
        });
      }

      router.push(`/listings/${listing.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la publication.');
    } finally {
      setLoading(false);
    }
  }

  function addPhotoUrl() {
    const url = photoInput.trim();
    if (!url) return;
    setPhotoUrls((previous) => [...previous, url]);
    setPhotoInput('');
  }

  async function addPhotoFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const toDataUrl = (file: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });

    try {
      const dataUrls = await Promise.all(Array.from(files).map((file) => toDataUrl(file)));
      setPhotoUrls((previous) => [...previous, ...dataUrls]);
    } finally {
      event.target.value = '';
    }
  }

  function removePhotoUrl(index: number) {
    setPhotoUrls((previous) => previous.filter((_, currentIndex) => currentIndex !== index));
  }

  if (!ready || authLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="h-40 animate-pulse rounded-2xl bg-sand" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-ink">Publier une annonce</h1>
      <p className="mt-2 text-ink-soft">
        Remplis les infos de ton logement. Les etudiants te contacteront directement par
        telephone.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <label className="block">
          <span className="text-sm font-medium text-ink-soft">Titre</span>
          <input
            name="title"
            required
            minLength={3}
            className="mt-1 w-full rounded-lg border border-sand bg-white px-3 py-2"
            placeholder="Studio lumineux a 5 min d'ESPRIT"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-ink-soft">Description</span>
          <textarea
            name="description"
            required
            minLength={10}
            rows={4}
            className="mt-1 w-full rounded-lg border border-sand bg-white px-3 py-2"
            placeholder="Decris le logement, le quartier, ce qui est inclus..."
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-ink-soft">Prix (DT/mois)</span>
            <input
              name="pricePerMonth"
              type="number"
              required
              min={1}
              step={1}
              inputMode="numeric"
              className="mt-1 w-full rounded-lg border border-sand bg-white px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink-soft">Type</span>
            <select
              name="roomType"
              required
              defaultValue={RoomType.STUDIO}
              className="mt-1 w-full rounded-lg border border-sand bg-white px-3 py-2"
            >
              {ROOM_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-ink-soft">Latitude</span>
            <input
              name="lat"
              type="number"
              step="any"
              required
              defaultValue="36.8981"
              className="mt-1 w-full rounded-lg border border-sand bg-white px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink-soft">Longitude</span>
            <input
              name="lng"
              type="number"
              step="any"
              required
              defaultValue="10.1872"
              className="mt-1 w-full rounded-lg border border-sand bg-white px-3 py-2"
            />
          </label>
        </div>
        <p className="text-xs text-ink-soft">
          Pour l'instant, entre les coordonnees GPS. Le geocodage automatique viendra ensuite.
        </p>

        <label className="flex items-center gap-2">
          <input name="furnished" type="checkbox" className="accent-door" />
          <span className="text-sm text-ink-soft">Logement meuble</span>
        </label>

        <div className="rounded-2xl border border-sand bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex-1">
              <span className="text-sm font-medium text-ink-soft">Photos</span>
              <input
                type="url"
                value={photoInput}
                onChange={(event) => setPhotoInput(event.target.value)}
                placeholder="https://..."
                className="mt-1 w-full rounded-lg border border-sand bg-white px-3 py-2"
              />
            </label>
            <button type="button" onClick={addPhotoUrl} className="btn-secondary">
              Ajouter la photo
            </button>
          </div>

          <label className="mt-3 block">
            <span className="text-sm font-medium text-ink-soft">Ou importer des fichiers</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={addPhotoFiles}
              className="mt-1 block w-full rounded-lg border border-sand bg-white px-3 py-2 text-sm"
            />
          </label>

          <p className="mt-3 text-xs text-ink-soft">
            Tu peux coller des URLs d'images ou importer plusieurs fichiers directement.
          </p>

          {photoUrls.length > 0 && (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {photoUrls.map((url, index) => (
                <li key={url} className="overflow-hidden rounded-xl border border-sand bg-sand/20">
                  <div className="aspect-[4/3] bg-sand/40">
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="flex items-center justify-between gap-3 px-3 py-2 text-xs text-ink-soft">
                    <span className="truncate">{url.startsWith('data:') ? 'Image importee' : url}</span>
                    <button
                      type="button"
                      onClick={() => removePhotoUrl(index)}
                      className="text-door hover:text-door-deep"
                    >
                      Retirer
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Publication...' : "Publier l'annonce"}
        </button>
      </form>
    </div>
  );
}
