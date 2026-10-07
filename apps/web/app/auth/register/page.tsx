'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState, useEffect, useCallback } from 'react';
import { AuthResponse, UserRole } from '@sakany/shared';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (pw.length >= 12) score += 1;
  if (/(?=.*[a-z])(?=.*[A-Z])/.test(pw)) score += 1;
  if (/(?=.*\d)/.test(pw)) score += 1;
  if (/(?=.*[!@#$%^&*])/.test(pw)) score += 1;

  if (score <= 1) return { score, label: 'Faible', color: 'bg-red-500' };
  if (score <= 2) return { score, label: 'Moyen', color: 'bg-orange-500' };
  if (score <= 3) return { score, label: 'Bon', color: 'bg-yellow-500' };
  return { score, label: 'Fort', color: 'bg-green-500' };
}

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [devVerificationLink, setDevVerificationLink] = useState<string | null>(null);

  const strength = passwordStrength(password);

  // Debounced email check
  const checkEmail = useCallback(async (email: string) => {
    if (!email || !email.includes('@')) {
      setEmailAvailable(null);
      return;
    }
    setCheckingEmail(true);
    try {
      const res = await apiFetch<{ available: boolean }>(`/auth/check-email?email=${encodeURIComponent(email)}`);
      setEmailAvailable(res.available);
      if (!res.available) {
        setFieldErrors(prev => ({ ...prev, email: 'Cet email est déjà utilisé.' }));
      } else {
        setFieldErrors(prev => {
          const { email: _, ...rest } = prev;
          return rest;
        });
      }
    } catch {
      setEmailAvailable(null);
    } finally {
      setCheckingEmail(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const emailInput = document.querySelector<HTMLInputElement>('input[name="email"]');
      if (emailInput?.value) checkEmail(emailInput.value);
    }, 500);
    return () => clearTimeout(timer);
  }, [checkEmail]);

  function validateField(name: string, value: string): string | null {
    switch (name) {
      case 'fullName':
        return value.length < 2 ? 'Le nom doit contenir au moins 2 caractères.' : null;
      case 'email':
        if (!value.includes('@')) return 'Email invalide.';
        return null;
      case 'phone':
        if (!/^(\+216)?[0-9]{8}$/.test(value.replace(/\s/g, ''))) {
          return 'Format invalide. Ex: +216 XX XXX XXX';
        }
        return null;
      case 'password':
        if (value.length < 8) return 'Minimum 8 caractères.';
        if (!/(?=.*[A-Za-z])(?=.*\d)/.test(value)) return 'Au moins une lettre et un chiffre.';
        return null;
      default:
        return null;
    }
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    const err = validateField(name, value);
    setFieldErrors(prev => {
      if (err) return { ...prev, [name]: err };
      const { [name]: _, ...rest } = prev;
      return rest;
    });
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const fullName = form.get('fullName') as string;
    const email = (form.get('email') as string).toLowerCase().trim();
    const phone = form.get('phone') as string;
    const password = form.get('password') as string;

    // Validate all fields
    const errors: Record<string, string> = {};
    for (const field of ['fullName', 'email', 'phone', 'password']) {
      const val = field === 'email' ? email : form.get(field) as string;
      const err = validateField(field, val);
      if (err) errors[field] = err;
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setLoading(false);
      return;
    }

    try {
      const data = await apiFetch<AuthResponse & { devVerificationLink?: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ fullName, email, password, phone, role }),
      });

      login(data);

      // In dev (no email provider), show the verification link so the user can verify.
      if (data.devVerificationLink) {
        setDevVerificationLink(data.devVerificationLink);
        return;
      }

      router.push(data.user.role === UserRole.LANDLORD ? '/landlord/listings' : '/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Inscription impossible.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-ink">Créer un compte</h1>
      <p className="mt-2 text-ink-soft">
        Déjà inscrit ?{' '}
        <Link href="/auth/login" className="text-door hover:text-door-deep">
          Se connecter
        </Link>
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setRole(UserRole.STUDENT)}
          className={`flex-1 min-w-[120px] rounded-full px-4 py-2 text-sm font-medium transition ${
            role === UserRole.STUDENT ? 'bg-door text-white shadow-sm' : 'border border-sand text-ink-soft hover:border-door'
          }`}
        >
          Étudiant
        </button>
        <button
          type="button"
          onClick={() => setRole(UserRole.LANDLORD)}
          className={`flex-1 min-w-[120px] rounded-full px-4 py-2 text-sm font-medium transition ${
            role === UserRole.LANDLORD ? 'bg-door text-white shadow-sm' : 'border border-sand text-ink-soft hover:border-door'
          }`}
        >
          Propriétaire
        </button>
      </div>

      {role === UserRole.STUDENT && (
        <p className="mt-3 text-sm text-ink-soft">
          Cherche un logement et trouve des colocataires compatibles.
        </p>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-ink-soft">Nom complet</label>
          <input
            name="fullName"
            required
            minLength={2}
            onBlur={handleBlur}
            className={`mt-1 w-full rounded-lg border bg-white px-3 py-2.5 text-sm transition ${
              fieldErrors.fullName ? 'border-red-400 ring-1 ring-red-400' : 'border-sand focus:border-door'
            }`}
          />
          {fieldErrors.fullName && (
            <p className="mt-1 text-xs text-red-500" role="alert">{fieldErrors.fullName}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-ink-soft">Email</label>
          <div className="relative mt-1">
            <input
              name="email"
              type="email"
              required
              onChange={(e) => {
                if (e.target.value.includes('@')) checkEmail(e.target.value);
              }}
              onBlur={handleBlur}
              className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm pr-8 transition ${
                fieldErrors.email ? 'border-red-400 ring-1 ring-red-400' : 'border-sand focus:border-door'
              }`}
            />
            {checkingEmail && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-soft">
                ↻
              </span>
            )}
            {!checkingEmail && emailAvailable === true && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-500">
                ✓
              </span>
            )}
            {!checkingEmail && emailAvailable === false && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-red-500">
                ✗
              </span>
            )}
          </div>
          {fieldErrors.email && (
            <p className="mt-1 text-xs text-red-500" role="alert">{fieldErrors.email}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-ink-soft">Téléphone</label>
          <input
            name="phone"
            type="tel"
            required
            minLength={8}
            placeholder="+216 XX XXX XXX"
            onBlur={handleBlur}
            className={`mt-1 w-full rounded-lg border bg-white px-3 py-2.5 text-sm transition ${
              fieldErrors.phone ? 'border-red-400 ring-1 ring-red-400' : 'border-sand focus:border-door'
            }`}
          />
          {fieldErrors.phone && (
            <p className="mt-1 text-xs text-red-500" role="alert">{fieldErrors.phone}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-ink-soft">Mot de passe</label>
          <div className="relative mt-1">
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={handleBlur}
              className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm pr-10 transition ${
                fieldErrors.password ? 'border-red-400 ring-1 ring-red-400' : 'border-sand focus:border-door'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-soft hover:text-ink"
              tabIndex={-1}
            >
              {showPassword ? '🙈' : '👁'}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="mt-1 text-xs text-red-500" role="alert">{fieldErrors.password}</p>
          )}

          {/* Strength indicator */}
          {password.length > 0 && (
            <div className="mt-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition ${
                      i <= strength.score ? strength.color : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <p className="mt-0.5 text-xs text-ink-soft">{strength.label}</p>
            </div>
          )}
        </div>

        {/* General error */}
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600" role="alert">{error}</div>
        )}

        {/* Dev-only verification link (no email provider configured) */}
        {devVerificationLink && (
          <div className="rounded-lg bg-amber-50 p-3 text-left">
            <p className="text-xs font-medium text-amber-800">
              Mode développement — aucun fournisseur d'email configuré. Lien de vérification :
            </p>
            <a
              href={devVerificationLink}
              className="mt-1 block break-all text-sm text-door underline hover:text-door-deep"
            >
              {devVerificationLink}
            </a>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-2.5 text-sm font-medium disabled:opacity-50"
        >
          {loading ? 'Inscription…' : 'Créer mon compte'}
        </button>
      </form>
    </div>
  );
}