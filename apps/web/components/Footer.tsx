import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-sand bg-whitewash py-12" role="contentinfo">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="font-display text-2xl font-bold text-door">
              Sakany
            </Link>
            <p className="mt-4 text-sm text-ink-soft">
              Trouve ton logement idéal partout en Tunisie. Location mensuelle, sans commission.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-ink">Navigation</h3>
            <ul className="mt-4 space-y-2 text-sm text-ink-soft">
              <li>
                <Link href="/" className="hover:text-door">Accueil</Link>
              </li>
              <li>
                <Link href="/favorites" className="hover:text-door">Mes favoris</Link>
              </li>
              <li>
                <Link href="/auth/register" className="hover:text-door">Créer un compte</Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-ink">Propriétaires</h3>
            <ul className="mt-4 space-y-2 text-sm text-ink-soft">
              <li>
                <Link href="/landlord/new" className="hover:text-door">Publier une annonce</Link>
              </li>
              <li>
                <Link href="/auth/login" className="hover:text-door">Espace propriétaire</Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-ink">Légal & Contact</h3>
            <ul className="mt-4 space-y-2 text-sm text-ink-soft">
              <li>
                <Link href="/legal/cgu" className="hover:text-door">Conditions générales (CGU)</Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="hover:text-door">Confidentialité</Link>
              </li>
              <li>
                <a href="mailto:contact@sakany.tn" className="hover:text-door">contact@sakany.tn</a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 border-t border-sand pt-8 text-center text-sm text-ink-soft">
          <p>&copy; {new Date().getFullYear()} Sakany. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
