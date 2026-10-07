import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getRoommateProfile, getRoommateProfiles } from '@/lib/server-queries';
import { RoommateCard } from '@/components/RoommateCard';
import { DirectMessageModal } from '@/components/DirectMessageModal';
import {
  SLEEP_SCHEDULE_LABELS,
  CLEANLINESS_LABELS,
  SMOKING_LABELS,
  GUESTS_LABELS,
} from '@sakany/shared';
import {
  ArrowLeft,
  MapPin,
  GraduationCap,
  Calendar,
  Sparkles,
  ShieldCheck,
  Check,
  Heart,
  Share2,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 60;

export default async function RoommateDetailPage({ params }: PageProps) {
  const { id } = await params;
  const profile = await getRoommateProfile(id);

  if (!profile) notFound();

  const { profiles: similar } = await getRoommateProfiles({
    city: profile.targetCity,
    pageSize: 3,
  });

  const similarList = similar.filter((p) => p.id !== profile.id);
  const initial = profile.user?.fullName?.charAt(0).toUpperCase() || 'E';

  const sleepLabel = profile.sleepSchedule ? SLEEP_SCHEDULE_LABELS[profile.sleepSchedule] : 'Non spécifié';
  const cleanLabel = profile.cleanlinessLevel ? CLEANLINESS_LABELS[profile.cleanlinessLevel] : 'Non spécifié';
  const smokeLabel = profile.smokingPolicy ? SMOKING_LABELS[profile.smokingPolicy] : 'Non spécifié';
  const guestsLabel = profile.guestsPolicy ? GUESTS_LABELS[profile.guestsPolicy] : 'Non spécifié';

  return (
    <div className="min-h-screen bg-whitewash pb-24">
      {/* Top navigation row */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-6">
        <div className="flex items-center justify-between">
          <Link
            href="/colocataires"
            className="inline-flex items-center gap-2 text-sm font-medium text-ink-soft hover:text-ink transition"
          >
            <ArrowLeft size={16} />
            <span>Retour aux colocataires</span>
          </Link>
        </div>
      </div>

      {/* Main Content Layout */}
      <main className="mx-auto max-w-6xl px-4 sm:px-6 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Columns: Full Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header Card */}
            <div className="rounded-3xl border border-sand bg-white p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                {profile.avatarUrl ? (
                  <div className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-full border-4 border-sand/40 shadow-lg">
                    <Image
                      src={profile.avatarUrl}
                      alt={profile.user?.fullName || 'Avatar'}
                      fill
                      className="object-cover"
                      sizes="112px"
                      priority
                    />
                  </div>
                ) : (
                  <div className="flex h-24 w-24 sm:h-28 sm:w-28 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-door to-door-deep text-4xl font-bold text-white shadow-lg">
                    {initial}
                  </div>
                )}

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
                      {profile.user?.fullName}
                    </h1>
                    {profile.age && (
                      <span className="text-base text-ink-soft font-normal">
                        ({profile.age} ans)
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-ink-soft">
                    <div className="flex items-center gap-1.5 font-medium text-ink">
                      <MapPin size={16} className="text-door" />
                      <span>{profile.targetCity}</span>
                    </div>

                    {profile.university && (
                      <div className="flex items-center gap-1.5 font-medium text-door bg-door/10 rounded-full px-3 py-0.5 text-xs">
                        <GraduationCap size={15} />
                        <span>{profile.university}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 rounded-xl px-3 py-1.5 w-fit font-medium">
                    <ShieldCheck size={16} />
                    <span>Profil étudiant vérifié sur Sakany</span>
                  </div>
                </div>
              </div>

              {/* Bio Section */}
              <div className="mt-8 border-t border-sand/60 pt-6">
                <h2 className="font-semibold text-ink text-base mb-3">À propos de moi</h2>
                <p className="text-sm sm:text-base text-ink-soft leading-relaxed whitespace-pre-line">
                  {profile.bio}
                </p>
              </div>
            </div>

            {/* Lifestyle & Compatibility Breakdown */}
            <div className="rounded-3xl border border-sand bg-white p-6 sm:p-8 shadow-sm">
              <h2 className="font-semibold text-ink text-lg mb-6 flex items-center gap-2">
                <Sparkles size={20} className="text-door" />
                Compatibilité & Habitudes de vie
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl bg-sand/20 p-4 border border-sand/40">
                  <span className="block text-xs font-semibold text-ink-soft uppercase tracking-wider">
                    Rythme de vie
                  </span>
                  <p className="mt-1.5 font-medium text-ink text-sm sm:text-base">
                    {sleepLabel}
                  </p>
                </div>

                <div className="rounded-2xl bg-sand/20 p-4 border border-sand/40">
                  <span className="block text-xs font-semibold text-ink-soft uppercase tracking-wider">
                    Niveau de propreté
                  </span>
                  <p className="mt-1.5 font-medium text-ink text-sm sm:text-base">
                    {cleanLabel}
                  </p>
                </div>

                <div className="rounded-2xl bg-sand/20 p-4 border border-sand/40">
                  <span className="block text-xs font-semibold text-ink-soft uppercase tracking-wider">
                    Tabac & Cigarette
                  </span>
                  <p className="mt-1.5 font-medium text-ink text-sm sm:text-base">
                    {smokeLabel}
                  </p>
                </div>

                <div className="rounded-2xl bg-sand/20 p-4 border border-sand/40">
                  <span className="block text-xs font-semibold text-ink-soft uppercase tracking-wider">
                    Invités & Soirées
                  </span>
                  <p className="mt-1.5 font-medium text-ink text-sm sm:text-base">
                    {guestsLabel}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Contact & Budget Card */}
          <div className="space-y-6">
            <div className="sticky top-24 rounded-3xl border border-sand bg-white p-6 sm:p-7 shadow-xl">
              <div className="border-b border-sand/60 pb-5">
                <span className="text-xs text-ink-soft uppercase font-semibold tracking-wider">
                  Fourchette de budget
                </span>
                <div className="mt-1 flex items-baseline gap-1 text-2xl sm:text-3xl font-extrabold text-door">
                  <span>{profile.budgetMin} - {profile.budgetMax}</span>
                  <span className="text-sm font-semibold text-ink-soft">DT / mois</span>
                </div>
                <p className="text-xs text-ink-soft mt-1">Par personne en colocation</p>
              </div>

              {/* Move-in Date availability */}
              <div className="py-5 border-b border-sand/60 space-y-3">
                <div className="flex items-center gap-2.5 text-sm text-ink">
                  <Calendar size={18} className="text-door shrink-0" />
                  <div>
                    <span className="block text-xs text-ink-soft font-medium">Disponibilité</span>
                    <span className="font-semibold">
                      {profile.moveInDate
                        ? `Dès le ${new Date(profile.moveInDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`
                        : 'Immédiatement disponible'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-sm text-ink">
                  <MapPin size={18} className="text-door shrink-0" />
                  <div>
                    <span className="block text-xs text-ink-soft font-medium">Ville de recherche</span>
                    <span className="font-semibold">{profile.targetCity}</span>
                  </div>
                </div>
              </div>

              {/* CTAs */}
              <div className="mt-6 flex flex-col gap-3">
                <DirectMessageModal
                  recipientId={profile.userId}
                  recipientName={profile.user?.fullName || 'Colocataire'}
                  buttonLabel="Envoyer un message direct"
                  buttonClassName="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-door px-5 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-door-deep"
                />
              </div>

              <p className="mt-4 text-center text-[11px] text-ink-soft">
                Messagerie sécurisée entre étudiants vérifiés.
              </p>
            </div>
          </div>
        </div>

        {/* Similar Roommates Section */}
        {similarList.length > 0 && (
          <section className="mt-16 border-t border-sand/60 pt-10">
            <h2 className="font-semibold text-ink text-xl mb-6">
              D&apos;autres colocataires à {profile.targetCity}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarList.map((sim, i) => (
                <RoommateCard key={sim.id} profile={sim} index={i} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
