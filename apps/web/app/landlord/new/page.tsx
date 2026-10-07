'use client';

import { useRouter } from 'next/navigation';
import { ChangeEvent, FormEvent, useEffect, useState, useMemo } from 'react';
import { RoomType, UserRole, ROOM_TYPE_LABELS } from '@sakany/shared';
import { apiFetch, authHeaders } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { ROOM_TYPE_OPTIONS, UNIVERSITY_SEED_DATA } from '@/lib/constants';
import { ListingFormSkeleton } from '@/components/LoadingStates';
import { MapInput } from '@/components/MapInput';
import { 
  Building2, 
  MapPin, 
  Sparkles, 
  UploadCloud, 
  X, 
  Check, 
  Wifi, 
  Wind, 
  Flame, 
  Tv, 
  Refrigerator, 
  Bath, 
  Zap, 
  ShieldCheck, 
  Star, 
  ChevronRight, 
  ChevronLeft,
  Eye,
  Wand2
} from 'lucide-react';
import Image from 'next/image';

const STUDENT_AMENITIES = [
  { id: 'wifi', label: 'Wi-Fi / Fibre optique', icon: Wifi },
  { id: 'ac', label: 'Climatiseur', icon: Wind },
  { id: 'heating', label: 'Chauffage', icon: Flame },
  { id: 'washing_machine', label: 'Machine à laver', icon: Building2 },
  { id: 'fridge', label: 'Cuisine équipée / Frigo', icon: Refrigerator },
  { id: 'private_bath', label: 'Salle de bain privée', icon: Bath },
  { id: 'bills_included', label: 'Charges incluses (Eau/Élec)', icon: Zap },
  { id: 'balcony', label: 'Balcon / Terrasse', icon: Eye },
];

export default function NewListingPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pricePerMonth, setPricePerMonth] = useState<number | ''>(450);
  const [roomType, setRoomType] = useState<RoomType>(RoomType.STUDIO);
  const [furnished, setFurnished] = useState(true);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(['wifi', 'fridge']);
  
  // Location
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 36.8981, lng: 10.1872 });

  // Photos
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [photoFiles, setPhotoFiles] = useState<{ file: File; previewUrl: string }[]>([]);
  const [photoInput, setPhotoInput] = useState('');

  useEffect(() => {
    if (authLoading) return;
    setReady(true);

    if (!user || !token || user.role !== UserRole.LANDLORD) {
      router.replace('/auth/login');
    }
  }, [authLoading, router, token, user]);

  // Closest university calculated live
  const closestUniversity = useMemo(() => {
    let closest = { name: 'ESPRIT', distance: 0.8 };
    let minD = Infinity;

    function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
      const toRad = (d: number) => (d * Math.PI) / 180;
      const dLat = toRad(lat2 - lat1);
      const dLng = toRad(lng2 - lng1);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
      return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    for (const uni of UNIVERSITY_SEED_DATA) {
      const d = haversine(coords.lat, coords.lng, uni.lat, uni.lng);
      if (d < minD) {
        minD = d;
        closest = { name: uni.shortName || uni.name, distance: Math.round(d * 10) / 10 };
      }
    }
    return closest;
  }, [coords]);

  function toggleAmenity(id: string) {
    setSelectedAmenities((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function generateSmartTitle() {
    const typeLabel = ROOM_TYPE_LABELS[roomType] || 'Logement';
    const furn = furnished ? 'meublé' : '';
    const uniText = closestUniversity ? `près de ${closestUniversity.name}` : '';
    const smart = `${typeLabel} ${furn} lumineux ${uniText} (${closestUniversity.distance} km)`.replace(/\s+/g, ' ').trim();
    setTitle(smart);
  }

  function generateSmartDescription() {
    const amenitiesText = selectedAmenities
      .map((id) => STUDENT_AMENITIES.find((a) => a.id === id)?.label)
      .filter(Boolean)
      .join(', ');

    const desc = `Logement ${furnished ? 'entièrement meublé et équipé' : 'non meublé'}, idéal pour étudiant(e)s. Situé dans un quartier calme et sécurisé, à seulement ${closestUniversity.distance} km de ${closestUniversity.name}.\n\nÉquipements inclus : ${amenitiesText || 'Eau et électricité'}.\nProche de toutes commodités, transports et commerces. N'hésitez pas à me contacter par téléphone pour planifier une visite.`;
    setDescription(desc);
  }

  async function onSubmit(e?: FormEvent) {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    if (!token) {
      setError("Connecte-toi d'abord en tant que propriétaire.");
      setLoading(false);
      router.push('/auth/login');
      return;
    }

    if (!title.trim() || title.length < 5) {
      setError('Veuillez renseigner un titre d’au moins 5 caractères.');
      setCurrentStep(1);
      setLoading(false);
      return;
    }

    if (!pricePerMonth || Number(pricePerMonth) <= 0) {
      setError('Veuillez indiquer un loyer mensuel valide.');
      setCurrentStep(3);
      setLoading(false);
      return;
    }

    try {
      const listing = await apiFetch<{ id: string }>('/listings', {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({
          title,
          description: description || `Logement pour étudiant près de ${closestUniversity.name}`,
          lat: coords.lat,
          lng: coords.lng,
          pricePerMonth: Number(pricePerMonth),
          roomType,
          furnished,
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

      if (photoFiles.length > 0) {
        const formData = new FormData();
        photoFiles.forEach((pf) => formData.append('file', pf.file));
        formData.append('sortOffset', photoUrls.length.toString());

        await apiFetch(`/listings/${listing.id}/photos/upload`, {
          method: 'POST',
          headers: authHeaders(token),
          body: formData,
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
    setPhotoUrls((prev) => [...prev, url]);
    setPhotoInput('');
  }

  function addPhotoFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setPhotoFiles((prev) => [...prev, ...newFiles]);
    event.target.value = '';
  }

  if (!ready || authLoading) {
    return <ListingFormSkeleton />;
  }

  const primaryPhoto = photoFiles[0]?.previewUrl || photoUrls[0] || null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sand/20 via-whitewash to-whitewash py-10 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Title */}
        <div className="mb-8 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-door/10 text-door text-xs font-semibold uppercase tracking-wider mb-2">
            <Building2 size={13} /> Espace Propriétaire
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink">
            Publier un nouveau logement étudiant
          </h1>
          <p className="mt-1.5 text-sm sm:text-base text-ink-soft">
            Renseignez votre bien en 3 étapes rapides. La distance avec les universités sera calculée automatiquement.
          </p>
        </div>

        {/* Stepper Progress Bar */}
        <div className="mb-8 surface-panel rounded-2xl bg-white border border-sand p-3">
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
                currentStep === 1
                  ? 'bg-door text-white shadow-sm'
                  : 'bg-sand/30 text-ink-soft hover:bg-sand/60'
              }`}
            >
              <span>1. Logement</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
                currentStep === 2
                  ? 'bg-door text-white shadow-sm'
                  : 'bg-sand/30 text-ink-soft hover:bg-sand/60'
              }`}
            >
              <span>2. Emplacement</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
                currentStep === 3
                  ? 'bg-door text-white shadow-sm'
                  : 'bg-sand/30 text-ink-soft hover:bg-sand/60'
              }`}
            >
              <span>3. Photos & Tarif</span>
            </button>
          </div>
        </div>

        {/* Main Grid: Form Left, Sticky Preview Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ── FORM CONTENT (7 Cols) ──────────────────────────────── */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* STEP 1: CARACTÉRISTIQUES DU LOGEMENT */}
            {currentStep === 1 && (
              <div className="surface-panel rounded-3xl border border-sand bg-white p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-sand/60 pb-4">
                  <h2 className="text-xl font-bold text-ink">Type de bien & Caractéristiques</h2>
                  <p className="text-xs text-ink-soft mt-1">Sélectionnez le format du logement et son aménagement.</p>
                </div>

                {/* Room Type Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft mb-2.5">
                    Type de logement
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {ROOM_TYPE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setRoomType(opt.value as RoomType)}
                        className={`p-3 rounded-2xl border text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-1.5 ${
                          roomType === opt.value
                            ? 'border-door bg-door/10 text-door shadow-xs'
                            : 'border-sand bg-white text-ink hover:border-door/40 hover:bg-sand/20'
                        }`}
                      >
                        <Building2 size={18} />
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Furnished Toggle */}
                <div className="flex items-center justify-between p-4 rounded-2xl border border-sand bg-sand/20">
                  <div>
                    <span className="block text-sm font-bold text-ink">Logement meublé</span>
                    <span className="block text-xs text-ink-soft">Contient lit, bureau, armoire, etc.</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={furnished}
                      onChange={(e) => setFurnished(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-sand peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-sand after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-door"></div>
                  </label>
                </div>

                {/* Amenities Grid */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft mb-2.5">
                    Équipements & Inclusions populaires
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-2 gap-2.5">
                    {STUDENT_AMENITIES.map((item) => {
                      const Icon = item.icon;
                      const active = selectedAmenities.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => toggleAmenity(item.id)}
                          className={`p-3 rounded-2xl border text-xs font-semibold transition-all text-left flex items-center justify-between gap-2 ${
                            active
                              ? 'border-door bg-door/10 text-door'
                              : 'border-sand bg-white text-ink hover:bg-sand/20'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <Icon size={16} />
                            {item.label}
                          </span>
                          {active && <Check size={14} className="text-door shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Next button */}
                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="btn-primary inline-flex items-center gap-2 px-6"
                  >
                    <span>Étape suivante : Emplacement</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: EMPLACEMENT GÉOGRAPHIQUE */}
            {currentStep === 2 && (
              <div className="surface-panel rounded-3xl border border-sand bg-white p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-sand/60 pb-4">
                  <h2 className="text-xl font-bold text-ink">Localisation & Universités proches</h2>
                  <p className="text-xs text-ink-soft mt-1">
                    Recherchez l'adresse ou déplacez le marqueur pour calculer automatiquement les universités à proximité.
                  </p>
                </div>

                <MapInput defaultLat={coords.lat} defaultLng={coords.lng} onPositionChange={setCoords} />

                {/* Navigation buttons */}
                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="btn-secondary inline-flex items-center gap-2"
                  >
                    <ChevronLeft size={16} />
                    <span>Retour</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="btn-primary inline-flex items-center gap-2 px-6"
                  >
                    <span>Étape suivante : Prix & Photos</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: PHOTOS, TARIFICATION & DESCRIPTION */}
            {currentStep === 3 && (
              <div className="surface-panel rounded-3xl border border-sand bg-white p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-sand/60 pb-4">
                  <h2 className="text-xl font-bold text-ink">Tarification, Photos & Description</h2>
                  <p className="text-xs text-ink-soft mt-1">
                    Fixez le loyer et ajoutez les photos de votre bien pour attirer les étudiants.
                  </p>
                </div>

                {/* Price Input */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft mb-1.5">
                    Loyer mensuel demandé (DT / mois)
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      required
                      min={50}
                      step={10}
                      value={pricePerMonth}
                      onChange={(e) => setPricePerMonth(e.target.value ? Number(e.target.value) : '')}
                      placeholder="450"
                      className="w-full rounded-2xl border border-sand bg-white py-3 pl-4 pr-16 text-lg font-bold text-ink focus:border-door focus:outline-none"
                    />
                    <span className="absolute right-4 text-sm font-bold text-door">DT / mois</span>
                  </div>
                </div>

                {/* Title with Smart Suggestion */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-ink-soft">
                      Titre de l'annonce
                    </label>
                    <button
                      type="button"
                      onClick={generateSmartTitle}
                      className="inline-flex items-center gap-1 text-xs font-bold text-door hover:text-door-deep"
                    >
                      <Wand2 size={13} />
                      Suggérer un titre intelligent
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    minLength={5}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Studio meublé à 5 min d'ESPRIT"
                    className="w-full rounded-2xl border border-sand bg-white py-3 px-4 text-sm font-semibold text-ink focus:border-door focus:outline-none"
                  />
                </div>

                {/* Description with Smart Suggestion */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-ink-soft">
                      Description détaillée
                    </label>
                    <button
                      type="button"
                      onClick={generateSmartDescription}
                      className="inline-flex items-center gap-1 text-xs font-bold text-door hover:text-door-deep"
                    >
                      <Wand2 size={13} />
                      Générer la description
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Décris le logement, les charges incluses, le quartier, la proximité des transports..."
                    className="w-full rounded-2xl border border-sand bg-white p-4 text-sm text-ink focus:border-door focus:outline-none"
                  />
                </div>

                {/* Modern Photo Upload Zone */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft mb-2">
                    Photos du logement
                  </label>

                  <div className="relative border-2 border-dashed border-sand rounded-3xl p-6 text-center hover:border-door/50 hover:bg-sand/10 transition-colors cursor-pointer group">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={addPhotoFiles}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-12 w-12 rounded-full bg-door/10 text-door flex items-center justify-center group-hover:scale-110 transition-transform">
                        <UploadCloud size={24} />
                      </div>
                      <p className="text-sm font-semibold text-ink">
                        Cliquez ou glissez vos photos ici
                      </p>
                      <p className="text-xs text-ink-soft">
                        Formats acceptés : JPG, PNG, WEBP (Plusieurs photos autorisées)
                      </p>
                    </div>
                  </div>

                  {/* Photo Thumbnails */}
                  {(photoFiles.length > 0 || photoUrls.length > 0) && (
                    <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {photoFiles.map((pf, idx) => (
                        <div key={idx} className="relative aspect-[4/3] rounded-xl overflow-hidden border border-sand group">
                          <img src={pf.previewUrl} alt="" className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setPhotoFiles((prev) => prev.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 h-6 w-6 rounded-full bg-ink/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={12} />
                          </button>
                          {idx === 0 && (
                            <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-door text-white text-[9px] font-bold">
                              Photo principale
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {error && (
                  <div className="p-3.5 rounded-2xl bg-red-50 text-red-700 text-xs font-semibold">
                    {error}
                  </div>
                )}

                {/* Submit button */}
                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="btn-secondary inline-flex items-center gap-2"
                  >
                    <ChevronLeft size={16} />
                    <span>Retour</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSubmit()}
                    disabled={loading}
                    className="btn-primary inline-flex items-center gap-2 px-8 py-3.5 text-base font-bold shadow-lg shadow-door/25"
                  >
                    {loading ? 'Publication en cours...' : "🚀 Publier l'annonce"}
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* ── STICKY LIVE PREVIEW CARD (5 Cols) ─────────────────── */}
          <div className="lg:col-span-5 sticky top-24">
            <div className="surface-panel rounded-3xl border border-sand bg-white p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-sand/60">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-soft flex items-center gap-1.5">
                  <Eye size={14} className="text-door" />
                  Aperçu étudiant en direct
                </span>
                <span className="text-[10px] bg-door/10 text-door px-2 py-0.5 rounded-full font-bold">
                  En temps réel
                </span>
              </div>

              {/* Card visual mockup */}
              <div className="rounded-2xl border border-sand overflow-hidden bg-white shadow-sm">
                <div className="relative aspect-[4/3] w-full bg-sand/30 overflow-hidden">
                  {primaryPhoto ? (
                    <img src={primaryPhoto} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-ink-soft gap-2 p-4 text-center">
                      <Building2 size={32} className="text-door/60" />
                      <span className="text-xs font-medium">Ajoutez une photo pour voir le rendu</span>
                    </div>
                  )}

                  <div className="absolute left-3 top-3 flex flex-col gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-md text-door text-xs font-bold shadow-xs">
                      <ShieldCheck size={13} />
                      Vérifié
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-1.5">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-ink text-sm truncate mr-2">
                      {title || 'Titre de votre logement'}
                    </h3>
                    <div className="flex items-center gap-1 shrink-0">
                      <Star size={13} className="fill-ink text-ink" />
                      <span className="text-xs text-ink font-light">Nouveau</span>
                    </div>
                  </div>

                  <p className="text-xs text-ink-soft">
                    {ROOM_TYPE_LABELS[roomType]} · {furnished ? 'Meublé' : 'Non meublé'}
                  </p>

                  <p className="text-xs font-semibold text-door flex items-center gap-1">
                    <MapPin size={12} />
                    <span>{closestUniversity.distance} km de {closestUniversity.name}</span>
                  </p>

                  <p className="pt-2 border-t border-sand/40 mt-2">
                    <span className="font-bold text-ink text-base">
                      {pricePerMonth || '450'} DT
                    </span>
                    <span className="text-xs text-ink-soft"> par mois</span>
                  </p>
                </div>
              </div>

              <div className="text-[11px] text-ink-soft leading-relaxed bg-sand/20 p-3 rounded-xl">
                💡 <strong>Conseil :</strong> Les annonces avec de belles photos et des équipements détaillés reçoivent <strong>3x plus de contacts</strong> d'étudiants.
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
