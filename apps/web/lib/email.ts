import { Resend } from 'resend';

// Lazily initialize Resend only if the API key exists.
// In dev without RESEND_API_KEY, emails fall back to console.log.
const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'Sakany <onboarding@resend.dev>';

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
}

/**
 * Sends the email verification link. Falls back to console.log in development
 * if RESEND_API_KEY is not configured (so local dev still works).
 */
export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const url = `${getBaseUrl()}/auth/verify-email?token=${token}`;

  if (!resend) {
    console.log('========================================');
    console.log(`🔗 VERIFICATION LINK: ${url}`);
    console.log('========================================');
    return;
  }

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Vérifie ton email — Sakany',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px">
        <h2 style="color:#1F5C86">Bienvenue sur Sakany 🏠</h2>
        <p>Clique sur le bouton ci-dessous pour vérifier ton adresse email :</p>
        <a href="${url}" style="display:inline-block;background:#C97B3D;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none;margin:16px 0">
          Vérifier mon email
        </a>
        <p style="color:#666;font-size:13px">Ce lien expire dans 24h. Si tu n'as pas créé de compte, ignore cet email.</p>
      </div>
    `,
  });
}

/**
 * Sends the password reset link. Falls back to console.log in development.
 */
export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const url = `${getBaseUrl()}/auth/reset-password?token=${token}`;

  if (!resend) {
    console.log('========================================');
    console.log(`🔗 PASSWORD RESET LINK: ${url}`);
    console.log('========================================');
    return;
  }

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Réinitialise ton mot de passe — Sakany',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px">
        <h2 style="color:#1F5C86">Réinitialisation de mot de passe</h2>
        <p>Clique sur le bouton ci-dessous pour choisir un nouveau mot de passe :</p>
        <a href="${url}" style="display:inline-block;background:#C97B3D;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none;margin:16px 0">
          Réinitialiser mon mot de passe
        </a>
        <p style="color:#666;font-size:13px">Ce lien expire dans 1h. Si tu n'as pas demandé cette réinitialisation, ignore cet email.</p>
      </div>
    `,
  });
}