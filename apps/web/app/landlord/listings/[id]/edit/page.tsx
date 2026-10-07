'use client';

import { useRouter, useParams } from 'next/navigation';
import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { RoomType, UserRole } from '@sakany/shared';
import { apiFetch, authHeaders } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { ROOM_TYPE_OPTIONS } from '@/lib/constants';
import { ListingFormSkeleton } from '@/components/LoadingStates';
import { toast } from 'react-hot-toast';
import { MapInput } from '@/components/MapInput';

interface ListingDetails {
  id: string;
  title: string;
  description: string;
  pricePerMonth: number;
  roomType: string;
  lat: number;
  lng: number;
  furnished: boolean;
  photos: { id: string; url: string; sortOrder: number }[];
}

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams();
  const { user, token, loading: authLoading } = useAuth();
  
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [listing, setListing] = useState<ListingDetails | null>(null);
  
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [photoFiles, setPhotoFiles] = useState<{file: File, previewUrl: string}[]>([]);
  const [photoInput, setPhotoInput] = useState('');

  useEffect(() => {
    if (authLoading) return;
    setReady(true);

    if (!user || !token || user.role !== UserRole.LANDLORD) {
      router.replace('/auth/login');
      return;
    }

    const listingId = params?.id as string;
    if (!listingId) return;

    apiFetch<ListingDetails>(`/listings/${listingId}`)
      .then(data => {
        setListing(data);
        // We could load existing photos here if we want to support deleting them,
        // but for now we'll just allow adding new ones easily.
      })
      .catch(() => {
        toast.error("Impossible de charger l'annonce.");
        router.push('/landlord/listings');
      })
      .finally(() => setFetching(false));
      
  }, [authLoading, router, token, user, params?.id]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!token || !listing) return;

    const form = new FormData(e.currentTarget);
    const lat = parseFloat(form.get('lat') as string);
    const lng = parseFloat(form.get('lng') as string);

    try {
      await apiFetch<{ id: string }>(`/listings/${listing.id}`, {
        method: 'PATCH',
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

      // Handle photos exactly as in new/page.tsx
      if (photoUrls.length > 0) {
        await apiFetch(`/listings/${listing.id}/photos`, {
          method: 'POST',
          headers: authHeaders(token),
          body: JSON.stringify({
            photos: photoUrls.map((url, index) => ({ url, sortOrder: index + (listing.photos?.length || 0) })),
          }),
        });
      }

      if (photoFiles.length > 0) {
        const formData = new FormData();
        photoFiles.forEach(pf => formData.append('file', pf.file));
        formData.append('sortOffset', (photoUrls.length + (listing.photos?.length || 0)).toString());

        await apiFetch(`/listings/${listing.id}/photos/upload`, {
          method: 'POST',
          headers: authHeaders(token),
          body: formData,
        });
      }

      toast.success("Annonce modifiée avec succès");
      router.push(`/listings/${listing.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la modification.');
      toast.error('Erreur lors de la modification.');
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

  function addPhotoFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const newFiles = Array.from(files).map(file => ({
      file,
      previewUrl: URL.createObjectURL(file)
    }));
    
    setPhotoFiles((previous) => [...previous, ...newFiles]);
    event.target.value = '';
  }

  function removePhotoUrl(index: number) {
    setPhotoUrls((previous) => previous.filter((_, currentIndex) => currentIndex !== index));
  }

  function removePhotoFile(index: number) {
    setPhotoFiles((previous) => {
      const updated = [...previous];
      URL.revokeObjectURL(updated[index].previewUrl);
      updated.splice(index, 1);
      return updated;
    });
  }

  if (!ready || authLoading || fetching) {
    return <ListingFormSkeleton />;
  }

  if (!listing) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-ink">Modifier l'annonce</h1>
      <p className="mt-2 text-ink-soft">
        Mets à jour les informations de ton logement.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <label className="block">
          <span className="text-sm font-medium text-ink-soft">Titre</span>
          <input
            name="title"
            required
            minLength={5}
            defaultValue={listing.title}
            className="mt-1 w-full rounded-lg border border-sand bg-white px-3 py-2"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-ink-soft">Description</span>
          <textarea
            name="description"
            required
            minLength={20}
            rows={4}
            defaultValue={listing.description}
            className="mt-1 w-full rounded-lg border border-sand bg-white px-3 py-2"
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
              defaultValue={listing.pricePerMonth}
              className="mt-1 w-full rounded-lg border border-sand bg-white px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink-soft">Type</span>
            <select
              name="roomType"
              required
              defaultValue={listing.roomType}
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

        <div className="mt-4">
          <label className="block mb-2">
            <span className="text-sm font-medium text-ink-soft">Localisation sur la carte</span>
          </label>
          <MapInput defaultLat={listing.lat} defaultLng={listing.lng} />
        </div>

        <label className="flex items-center gap-2">
          <input name="furnished" type="checkbox" defaultChecked={listing.furnished} className="accent-door" />
          <span className="text-sm text-ink-soft">Logement meuble</span>
        </label>

        <div className="rounded-2xl border border-sand bg-white p-4">
          <div className="mb-4">
             <span className="text-sm font-medium text-ink-soft block mb-2">Photos existantes ({listing.photos?.length || 0})</span>
             <p className="text-xs text-ink-soft mb-2">La suppression des photos n'est pas encore supportée dans cette version.</p>
             {listing.photos && listing.photos.length > 0 && (
                <ul className="grid gap-2 sm:grid-cols-4 mb-4">
                  {listing.photos.map(photo => (
                    <li key={photo.id} className="aspect-[4/3] rounded-md overflow-hidden bg-sand/20">
                       <img src={photo.url} alt="" className="w-full h-full object-cover" />
                    </li>
                  ))}
                </ul>
             )}
          </div>
        
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end border-t border-sand pt-4">
            <label className="flex-1">
              <span className="text-sm font-medium text-ink-soft">Ajouter de nouvelles photos</span>
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

          {(photoUrls.length > 0 || photoFiles.length > 0) && (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {photoUrls.map((url, index) => (
                <li key={url} className="overflow-hidden rounded-xl border border-sand bg-sand/20">
                  <div className="aspect-[4/3] bg-sand/40">
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="flex items-center justify-between gap-3 px-3 py-2 text-xs text-ink-soft">
                    <span className="truncate">{url}</span>
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
              {photoFiles.map((pf, index) => (
                <li key={pf.file.name + index} className="overflow-hidden rounded-xl border border-sand bg-sand/20">
                  <div className="aspect-[4/3] bg-sand/40">
                    <img src={pf.previewUrl} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="flex items-center justify-between gap-3 px-3 py-2 text-xs text-ink-soft">
                    <span className="truncate">{pf.file.name}</span>
                    <button
                      type="button"
                      onClick={() => removePhotoFile(index)}
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

        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Modification...' : "Enregistrer les modifications"}
        </button>
      </form>
    </div>
  );
}
