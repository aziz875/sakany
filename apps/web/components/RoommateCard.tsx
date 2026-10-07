'use client';

import Link from 'next/link';
import Image from 'next/image';
import { memo, type CSSProperties } from 'react';
import { RoommateProfileSummary } from '@/lib/server-queries';
import {
  SLEEP_SCHEDULE_LABELS,
  CLEANLINESS_LABELS,
  SMOKING_LABELS,
  GUESTS_LABELS,
} from '@sakany/shared';
import { MapPin, GraduationCap, Calendar, Sparkles } from 'lucide-react';

interface RoommateCardProps {
  profile: RoommateProfileSummary;
  index?: number;
}

function RoommateCardInner({ profile, index = 0 }: RoommateCardProps) {
  const initial = profile.user?.fullName?.charAt(0).toUpperCase() || 'E';
  const sleepLabel = profile.sleepSchedule ? SLEEP_SCHEDULE_LABELS[profile.sleepSchedule] : null;
  const cleanLabel = profile.cleanlinessLevel ? CLEANLINESS_LABELS[profile.cleanlinessLevel] : null;
  const smokeLabel = profile.smokingPolicy ? SMOKING_LABELS[profile.smokingPolicy] : null;
  const guestsLabel = profile.guestsPolicy ? GUESTS_LABELS[profile.guestsPolicy] : null;

  return (
    <article
      className="card-enter group relative flex flex-col justify-between rounded-2xl border border-sand bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-door/40 hover:shadow-lg"
      style={{ '--card-delay': `${index * 60}ms` } as CSSProperties}
      aria-label={`Profil colocataire : ${profile.user?.fullName}`}
    >
      <div>
        {/* Header: Avatar, Name, Age/Gender & Budget */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {profile.avatarUrl ? (
              <div className="relative h-14 w-14 overflow-hidden rounded-full border-2 border-white shadow-md">
                <Image
                  src={profile.avatarUrl}
                  alt={profile.user?.fullName || 'Avatar'}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-door to-door-deep text-xl font-bold text-white shadow-md">
                {initial}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-ink text-base group-hover:text-door transition-colors">
                  {profile.user?.fullName}
                </h3>
                {profile.age && (
                  <span className="text-xs text-ink-soft">({profile.age} ans)</span>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-ink-soft mt-0.5">
                <MapPin size={13} className="text-door shrink-0" />
                <span className="font-medium truncate max-w-[150px]">{profile.targetCity}</span>
              </div>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="block text-xs text-ink-soft">Budget</span>
            <span className="font-bold text-sm sm:text-base text-door">
              {profile.budgetMin} - {profile.budgetMax} <span className="text-xs font-normal text-ink-soft">DT</span>
            </span>
          </div>
        </div>

        {/* University Badge */}
        {profile.university && (
          <div className="mt-3.5 flex items-center gap-1.5 text-xs text-ink bg-sand/40 rounded-lg px-2.5 py-1.5 font-medium">
            <GraduationCap size={15} className="text-door shrink-0" />
            <span className="truncate">{profile.university}</span>
          </div>
        )}

        {/* Bio Excerpt */}
        <p className="mt-3 text-xs sm:text-sm text-ink-soft line-clamp-3 leading-relaxed">
          &ldquo;{profile.bio}&rdquo;
        </p>

        {/* Lifestyle Chips */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {sleepLabel && (
            <span className="inline-flex items-center rounded-full bg-blue-50/80 px-2.5 py-1 text-[11px] font-medium text-blue-700">
              {sleepLabel}
            </span>
          )}
          {cleanLabel && (
            <span className="inline-flex items-center rounded-full bg-emerald-50/80 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
              {cleanLabel}
            </span>
          )}
          {smokeLabel && (
            <span className="inline-flex items-center rounded-full bg-amber-50/80 px-2.5 py-1 text-[11px] font-medium text-amber-700">
              {smokeLabel}
            </span>
          )}
          {guestsLabel && (
            <span className="inline-flex items-center rounded-full bg-purple-50/80 px-2.5 py-1 text-[11px] font-medium text-purple-700">
              {guestsLabel}
            </span>
          )}
        </div>
      </div>

      {/* Footer CTA & Move-in date */}
      <div className="mt-5 pt-3.5 border-t border-sand/60 flex items-center justify-between">
        {profile.moveInDate ? (
          <div className="flex items-center gap-1 text-[11px] text-ink-soft">
            <Calendar size={12} className="text-ink-soft/70" />
            <span>Dispo dès {new Date(profile.moveInDate).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
            <Sparkles size={12} />
            <span>Disponible maintenant</span>
          </div>
        )}

        <Link
          href={`/colocataires/${profile.id}`}
          className="inline-flex items-center justify-center rounded-full bg-door/10 px-3.5 py-1.5 text-xs font-semibold text-door transition-colors hover:bg-door hover:text-white"
        >
          Voir le profil
        </Link>
      </div>
    </article>
  );
}

export const RoommateCard = memo(RoommateCardInner);
