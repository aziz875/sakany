import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politique de Confidentialité — Sakany',
  description: 'Politique de confidentialité et de protection des données personnelles de Sakany.',
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="rounded-3xl border border-sand bg-white p-6 sm:p-10 shadow-sm">
        <h1 className="font-display text-3xl font-bold text-ink">Politique de Confidentialité</h1>
        <p className="mt-2 text-sm text-ink-soft">Dernière mise à jour : Septembre 2026</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-ink-soft">
          <section>
            <h2 className="font-display text-lg font-semibold text-ink">1. Responsable du Traitement</h2>
            <p className="mt-2">
              Le responsable du traitement des données personnelles collectées via la plateforme Sakany est
              l&apos;équipe Sakany, joignable à l&apos;adresse{' '}
              <a href="mailto:contact@sakany.tn" className="text-door hover:underline">contact@sakany.tn</a>.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">2. Données Collectées</h2>
            <p className="mt-2">Nous collectons les données suivantes :</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li><strong>Données d&apos;identification :</strong> nom complet, adresse email, numéro de téléphone</li>
              <li><strong>Données d&apos;authentification :</strong> mot de passe (stocké sous forme chiffrée avec bcrypt)</li>
              <li><strong>Données de localisation :</strong> coordonnées géographiques des logements publiés (latitude/longitude)</li>
              <li><strong>Contenus utilisateurs :</strong> annonces, photos de logements, messages, avis</li>
              <li><strong>Données techniques :</strong> adresse IP (pour la limitation de débit), cookies d&apos;authentification</li>
              <li><strong>Profil colocataire :</strong> bio, budget, préférences de vie commune (si renseigné)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">3. Finalités du Traitement</h2>
            <p className="mt-2">Vos données sont utilisées pour :</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Créer et gérer votre compte utilisateur</li>
              <li>Publier et afficher des annonces de logement</li>
              <li>Permettre la communication entre étudiants et propriétaires</li>
              <li>Calculer les distances entre logements et universités</li>
              <li>Envoyer des notifications relatives à votre activité</li>
              <li>Assurer la sécurité de la Plateforme (limitation de débit, détection d&apos;abus)</li>
              <li>Vérifier les adresses email des utilisateurs</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">4. Stockage et Sécurité</h2>
            <p className="mt-2">
              Vos données sont stockées sur des serveurs sécurisés hébergés par Supabase (Union Européenne).
              Les mots de passe sont chiffrés avec l&apos;algorithme bcrypt. Les connexions à la base de données
              sont chiffrées via SSL/TLS. Les tokens d&apos;authentification sont signés avec des clés secrètes
              et ont une durée de vie limitée.
            </p>
            <p className="mt-2">
              Les photos de logements sont stockées sur Supabase Storage avec des URLs publiques. Les cookies
              d&apos;authentification sont marqués comme HttpOnly et Secure.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">5. Partage des Données</h2>
            <p className="mt-2">
              Vos données ne sont pas vendues à des tiers. Certaines informations sont visibles par d&apos;autres
              utilisateurs de la Plateforme :
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Votre nom est visible sur vos annonces, avis et messages</li>
              <li>Votre numéro de téléphone est accessible uniquement aux utilisateurs authentifiés consultant vos annonces</li>
              <li>Votre profil colocataire est visible publiquement si vous l&apos;activez</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">6. Durée de Conservation</h2>
            <p className="mt-2">
              Vos données personnelles sont conservées tant que votre compte est actif. Les tokens de
              rafraîchissement expirent automatiquement après 7 à 30 jours. Les tokens de réinitialisation
              de mot de passe expirent après 1 heure.
            </p>
            <p className="mt-2">
              En cas de suppression de compte, vos données personnelles, annonces, avis et messages seront
              supprimés de manière permanente.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">7. Vos Droits</h2>
            <p className="mt-2">
              Conformément à la loi organique n° 2004-63 du 27 juillet 2004 portant sur la protection des
              données à caractère personnel en Tunisie, vous disposez des droits suivants :
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li><strong>Droit d&apos;accès :</strong> obtenir une copie de vos données personnelles</li>
              <li><strong>Droit de rectification :</strong> corriger vos données inexactes ou incomplètes</li>
              <li><strong>Droit de suppression :</strong> demander la suppression de votre compte et données</li>
              <li><strong>Droit d&apos;opposition :</strong> vous opposer au traitement de vos données</li>
            </ul>
            <p className="mt-2">
              Pour exercer ces droits, contactez-nous à{' '}
              <a href="mailto:contact@sakany.tn" className="text-door hover:underline">contact@sakany.tn</a>.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">8. Cookies</h2>
            <p className="mt-2">
              Sakany utilise des cookies strictement nécessaires au fonctionnement de l&apos;authentification
              (<code className="rounded bg-sand/50 px-1 py-0.5 text-xs">sakany_refresh</code>).
              Aucun cookie de tracking, de publicité ou d&apos;analyse n&apos;est utilisé.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">9. Contact</h2>
            <p className="mt-2">
              Pour toute question relative à cette politique de confidentialité :{' '}
              <a href="mailto:contact@sakany.tn" className="text-door hover:underline">contact@sakany.tn</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
