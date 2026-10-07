'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ALL_TUNISIAN_CITIES,
  TUNISIAN_REGIONS_WITH_CITIES,
  TUNISIAN_UNIVERSITIES,
  SLEEP_SCHEDULE_OPTIONS,
  CLEANLINESS_OPTIONS,
  SMOKING_OPTIONS,
  GUESTS_OPTIONS,
  GENDER_PREFERENCE_OPTIONS,
} from '@/lib/constants';
import { ArrowLeft, Sparkles, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function RoommateProfileFormPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();

  const [existingProfileId, setExistingProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form Fields
  const [bio, setBio] = useState('');
  const [budgetMin, setBudgetMin] = useState<number>(200);
  const [budgetMax, setBudgetMax] = useState<number>(500);
  const [targetCity, setTargetCity] = useState('Ariana Soghra / Ghazela');
  const [university, setUniversity] = useState('ESPRIT (Ghazela)');
  const [moveInDate, setMoveInDate] = useState('');
  const [sleepSchedule, setSleepSchedule] = useState('flexible');
  const [cleanlinessLevel, setCleanlinessLevel] = useState('moderate');
  const [smokingPolicy, setSmokingPolicy] = useState('no_smoking');
  const [guestsPolicy, setGuestsPolicy] = useState('occasional');
  const [gender, setGender] = useState('no_preference');
  const [age, setAge] = useState<number>(22);
  const [avatarUrl, setAvatarUrl] = useState('');

  // Fetch existing profile if available
  useEffect(() => {
    if (authLoading) return;
    if (!user || !token) {
      router.push('/auth/login?redirect=/colocataires/profile');
      return;
    }

    async function loadProfile() {
      try {
        const res = await fetch('/api/colocataires', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          // Find if user already has a profile
          const mine = data.profiles?.find((p: any) => p.userId === user?.id);
          if (mine) {
            setExistingProfileId(mine.id);
            setBio(mine.bio || '');
            setBudgetMin(mine.budgetMin || 200);
            setBudgetMax(mine.budgetMax || 500);
            setTargetCity(mine.targetCity || 'Ariana Soghra / Ghazela');
            setUniversity(mine.university || 'ESPRIT (Ghazela)');
            setMoveInDate(mine.moveInDate ? mine.moveInDate.split('T')[0] : '');
            setSleepSchedule(mine.sleepSchedule || 'flexible');
            setCleanlinessLevel(mine.cleanlinessLevel || 'moderate');
            setSmokingPolicy(mine.smokingPolicy || 'no_smoking');
            setGuestsPolicy(mine.guestsPolicy || 'occasional');
            setGender(mine.gender || 'no_preference');
            setAge(mine.age || 22);
            setAvatarUrl(mine.avatarUrl || '');
          }
        }
      } catch (err) {
        console.error('Failed to fetch roommate profile:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user, token, authLoading, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSaving(true);
    setMessage(null);

    const payload = {
      bio: bio.trim(),
      budgetMin: Number(budgetMin),
      budgetMax: Number(budgetMax),
      targetCity,
      university: university || undefined,
      moveInDate: moveInDate || undefined,
      sleepSchedule,
      cleanlinessLevel,
      smokingPolicy,
      guestsPolicy,
      gender,
      age: age ? Number(age) : undefined,
      avatarUrl: avatarUrl.trim() || undefined,
    };

    try {
      const url = existingProfileId
        ? `/api/colocataires/${existingProfileId}`
        : '/api/colocataires';
      const method = existingProfileId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Erreur lors de la sauvegarde du profil.');
      }

      setMessage({
        type: 'success',
        text: existingProfileId
          ? 'Profil mis à jour avec succès !'
          : 'Profil colocataire créé avec succès !',
      });

      if (!existingProfileId && data.id) {
        setExistingProfileId(data.id);
      }

      setTimeout(() => {
        router.push('/colocataires');
      }, 1500);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Une erreur est survenue.' });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={32} className="animate-spin text-door" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-whitewash py-10 px-4 sm:px-6 pb-24">
      <div className="mx-auto max-w-3xl">
        {/* Back Link */}
        <Link
          href="/colocataires"
          className="inline-flex items-center gap-2 text-sm font-medium text-ink-soft hover:text-ink transition mb-6"
        >
          <ArrowLeft size={16} />
          <span>Retour aux colocataires</span>
        </Link>

        {/* Form Container */}
        <div className="rounded-3xl border border-sand bg-white p-6 sm:p-10 shadow-sm">
          <div className="flex items-center gap-2 text-door text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles size={16} />
            <span>Matchmaking Colocataires</span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
            {existingProfileId ? 'Modifier mon profil colocataire' : 'Créer mon profil colocataire'}
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Décris tes attentes, tes habitudes et ton budget pour que les autres étudiants puissent te contacter.
          </p>

          {message && (
            <div
              className={`mt-6 flex items-center gap-2 rounded-2xl p-4 text-sm ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'bg-red-50 text-red-800'
              }`}
            >
              {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {/* Bio / Description */}
            <div>
              <label className="block text-sm font-semibold text-ink mb-1.5">
                Présentation / Bio <span className="text-door">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Ex: Étudiant en 3ème année à ESPRIT, calme et sociable. J'aime cuisiner et travailler en silence le soir..."
                className="w-full rounded-2xl border border-sand bg-sand/10 p-3.5 text-sm text-ink outline-none focus:border-door focus:bg-white transition"
              />
              <span className="block text-xs text-ink-soft mt-1">Au moins 10 caractères.</span>
            </div>

            {/* Target City & University */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">
                  Ville / Quartier recherché <span className="text-door">*</span>
                </label>
                <select
                  value={targetCity}
                  onChange={(e) => setTargetCity(e.target.value)}
                  className="w-full rounded-2xl border border-sand bg-sand/10 p-3.5 text-sm text-ink outline-none focus:border-door focus:bg-white"
                >
                  {TUNISIAN_REGIONS_WITH_CITIES.map((reg) => (
                    <optgroup key={reg.group} label={`📍 ${reg.group}`}>
                      {reg.cities.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">
                  Université / Campus
                </label>
                <select
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="w-full rounded-2xl border border-sand bg-sand/10 p-3.5 text-sm text-ink outline-none focus:border-door focus:bg-white"
                >
                  {TUNISIAN_UNIVERSITIES.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Budget Range & Age */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">
                  Budget Min (DT/mois) <span className="text-door">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(Number(e.target.value))}
                  className="w-full rounded-2xl border border-sand bg-sand/10 p-3.5 text-sm text-ink outline-none focus:border-door focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">
                  Budget Max (DT/mois) <span className="text-door">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(Number(e.target.value))}
                  className="w-full rounded-2xl border border-sand bg-sand/10 p-3.5 text-sm text-ink outline-none focus:border-door focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">Âge</label>
                <input
                  type="number"
                  min={16}
                  max={99}
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full rounded-2xl border border-sand bg-sand/10 p-3.5 text-sm text-ink outline-none focus:border-door focus:bg-white"
                />
              </div>
            </div>

            {/* Move-in Date & Avatar URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">
                  Date d&apos;emménagement souhaitée
                </label>
                <input
                  type="date"
                  value={moveInDate}
                  onChange={(e) => setMoveInDate(e.target.value)}
                  className="w-full rounded-2xl border border-sand bg-sand/10 p-3.5 text-sm text-ink outline-none focus:border-door focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">
                  Photo de profil (URL)
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-2xl border border-sand bg-sand/10 p-3.5 text-sm text-ink outline-none focus:border-door focus:bg-white"
                />
              </div>
            </div>

            {/* Lifestyle & Compatibility Preferences */}
            <div className="border-t border-sand/60 pt-6">
              <h3 className="text-base font-bold text-ink mb-4">
                Habitudes & Préférences de colocation
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">
                    Rythme de sommeil
                  </label>
                  <select
                    value={sleepSchedule}
                    onChange={(e) => setSleepSchedule(e.target.value)}
                    className="w-full rounded-2xl border border-sand bg-sand/10 p-3 text-sm text-ink outline-none focus:border-door focus:bg-white"
                  >
                    {SLEEP_SCHEDULE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">
                    Niveau d&apos;ordre & Propreté
                  </label>
                  <select
                    value={cleanlinessLevel}
                    onChange={(e) => setCleanlinessLevel(e.target.value)}
                    className="w-full rounded-2xl border border-sand bg-sand/10 p-3 text-sm text-ink outline-none focus:border-door focus:bg-white"
                  >
                    {CLEANLINESS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">
                    Politique Fumeur
                  </label>
                  <select
                    value={smokingPolicy}
                    onChange={(e) => setSmokingPolicy(e.target.value)}
                    className="w-full rounded-2xl border border-sand bg-sand/10 p-3 text-sm text-ink outline-none focus:border-door focus:bg-white"
                  >
                    {SMOKING_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">
                    Invités & Visiteurs
                  </label>
                  <select
                    value={guestsPolicy}
                    onChange={(e) => setGuestsPolicy(e.target.value)}
                    className="w-full rounded-2xl border border-sand bg-sand/10 p-3 text-sm text-ink outline-none focus:border-door focus:bg-white"
                  >
                    {GUESTS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-4 border-t border-sand/60 pt-6">
              <Link
                href="/colocataires"
                className="rounded-full px-5 py-2.5 text-sm font-semibold text-ink-soft hover:bg-sand/30"
              >
                Annuler
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-door px-8 py-3 text-sm font-bold text-white shadow-md transition hover:bg-door-deep disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <span>{existingProfileId ? 'Mettre à jour' : 'Publier mon profil'}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
