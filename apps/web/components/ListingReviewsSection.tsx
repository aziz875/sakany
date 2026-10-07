'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState, useId } from 'react';
import { Review } from '@sakany/shared';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { FriendlyEmptyState } from './FriendlyEmptyState';
import { Skeleton } from './Skeleton';

interface ListingReviewsSectionProps {
  listingId: string;
  reviews: Review[];
  averageRating?: number;
}

const ratingLabels = ['Très mauvais', 'Mauvais', 'Moyen', 'Bon', 'Excellent'];

function formatRating(value?: number) {
  if (value === undefined) return null;
  return value.toFixed(1);
}

export function ListingReviewsSection({
  listingId,
  reviews,
  averageRating,
}: ListingReviewsSectionProps) {
  const { user, isStudent, loading: authLoading } = useAuth();
  const [items, setItems] = useState(reviews);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [application, setApplication] = useState<{ status: string } | null>(null);
  const [appLoading, setAppLoading] = useState(true);

  const commentId = useId();
  const errorId = useId();
  const successId = useId();

  useEffect(() => {
    if (!user || !isStudent) {
      setAppLoading(false);
      return;
    }

    apiFetch<{ status: string } | null>(`/listings/${listingId}/applications/me`)
      .then((data) => setApplication(data))
      .catch(() => setApplication(null))
      .finally(() => setAppLoading(false));
  }, [user, isStudent, listingId]);

  const formattedAverage = useMemo(() => formatRating(averageRating), [averageRating]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!user) {
      setError('Tu dois te connecter pour laisser un avis.');
      return;
    }

    if (!isStudent) {
      setError('Seuls les étudiants peuvent laisser un avis.');
      return;
    }

    if (comment.trim().length < 10) {
      setError('Le commentaire doit contenir au moins 10 caractères.');
      return;
    }

    setLoading(true);
    try {
      const created = await apiFetch<Review>(`/listings/${listingId}/reviews`, {
        method: 'POST',
        body: JSON.stringify({
          rating,
          comment: comment.trim(),
        }),
      });

      setItems((current) => [created, ...current]);
      setComment('');
      setRating(5);
      setSuccessMsg('Ton avis a bien été ajouté.');
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'envoyer ton avis.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-12" aria-labelledby="reviews-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="reviews-heading" className="font-display text-2xl font-semibold text-ink">
            Avis d&apos;anciens colocataires
            {formattedAverage && (
              <span className="ml-2 text-lg font-normal text-ink-soft">· {formattedAverage}/5</span>
            )}
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Retours partagés par des anciens colocataires et étudiants.
          </p>
        </div>
        <div className="rounded-full bg-sand px-4 py-2 text-sm text-ink-soft" aria-live="polite">
          {items.length} avis
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div role="list" aria-label="Liste des avis">
          {items.length === 0 ? (
            <FriendlyEmptyState
              title="Aucun avis pour le moment"
              description="Tu peux être le premier à partager ton expérience et aider les autres étudiants."
            />
          ) : (
            <div className="space-y-4">
              {items.map((review) => (
                <article
                  key={review.id}
                  className="rounded-xl border border-sand bg-white p-4 shadow-sm"
                  role="listitem"
                  aria-label={`Avis de ${review.author?.fullName ?? 'Étudiant'} — note ${review.rating}/5`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-ink">{review.author?.fullName ?? 'Étudiant'}</p>
                      <p className="text-xs text-ink-soft">
                        <time dateTime={review.createdAt}>
                          {new Date(review.createdAt).toLocaleDateString('fr-TN')}
                        </time>
                      </p>
                    </div>
                    <p
                      className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800"
                      aria-label={`Note : ${review.rating} sur 5`}
                    >
                      {review.rating}/5
                    </p>
                  </div>
                  <p className="mt-3 text-ink-soft">{review.comment}</p>
                </article>
              ))}
            </div>
          )}
        </div>

        <aside className="rounded-3xl border border-sand bg-white p-5 shadow-sm" aria-label="Formulaire d'avis">
          <h3 className="font-display text-lg font-semibold text-ink">Laisser ton avis</h3>
          <p className="mt-1 text-sm text-ink-soft">
            En tant qu&apos;étudiant, tu peux partager ton retour sur ce logement.
          </p>

          {authLoading || appLoading ? (
            <div className="mt-4 space-y-3 rounded-2xl border border-sand bg-sand/30 p-4">
              <Skeleton className="h-4 w-32 rounded-full" />
              <Skeleton className="h-4 w-full rounded-full" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ) : user && isStudent ? (
            application?.status === 'ACCEPTED' ? (
              <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
                <fieldset>
                  <legend className="block text-sm font-medium text-ink-soft">Ta note</legend>
                  <div className="mt-2 grid grid-cols-5 gap-2" role="radiogroup" aria-label="Sélectionne une note de 1 à 5">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRating(value)}
                        aria-pressed={rating === value}
                        aria-label={`${value} — ${ratingLabels[value - 1]}`}
                        className={`pressable rounded-xl border px-2 py-3 text-sm transition ${
                          rating === value
                            ? 'border-door bg-amber-50 text-door'
                            : 'border-sand bg-white text-ink-soft hover:border-door/50'
                        }`}
                      >
                        <span className="block font-semibold">{value}</span>
                        <span className="mt-1 block text-[11px] leading-tight" aria-hidden="true">
                          {ratingLabels[value - 1]}
                        </span>
                      </button>
                    ))}
                  </div>
                </fieldset>

                <div>
                  <label htmlFor={commentId} className="block text-sm font-medium text-ink-soft">
                    Ton avis <span aria-hidden="true">(min. 10 caractères)</span>
                  </label>
                  <textarea
                    id={commentId}
                    name="comment"
                    rows={5}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Décris l'ambiance, la propreté, le quartier, le colocataire, etc."
                    minLength={10}
                    maxLength={500}
                    aria-describedby={error ? errorId : successMsg ? successId : undefined}
                    aria-invalid={error ? 'true' : undefined}
                    className="mt-2 w-full rounded-2xl border border-sand bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-door aria-[invalid=true]:border-red-400"
                  />
                </div>

                <div aria-live="polite" aria-atomic="true">
                  {error && (
                    <div
                      id={errorId}
                      role="alert"
                      className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700"
                    >
                      {error}
                    </div>
                  )}

                  {successMsg && (
                    <div
                      id={successId}
                      role="status"
                      className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                    >
                      <span className="mr-2 inline-block align-middle">✓</span>
                      {successMsg}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary pressable w-full py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
                  aria-busy={loading}
                >
                  {loading ? 'Envoi en cours...' : 'Publier mon avis'}
                </button>
              </form>
            ) : (
              <div className="mt-4 rounded-2xl border border-sand bg-sand/40 p-4 text-sm text-ink-soft" role="status">
                Tu dois avoir postulé et été accepté(e) par le propriétaire pour laisser un avis sur ce
                logement.
              </div>
            )
          ) : (
            <div className="mt-4 rounded-2xl border border-sand bg-sand/40 p-4 text-sm text-ink-soft">
              {user ? (
                <p>Cette zone est réservée aux étudiants.</p>
              ) : (
                <p>
                  <Link href="/auth/login" className="text-door hover:text-door-deep focus-visible:underline">
                    Connecte-toi
                  </Link>{' '}
                  pour laisser un avis.
                </p>
              )}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
