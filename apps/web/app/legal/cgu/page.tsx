import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation — Sakany",
  description: "Conditions générales d'utilisation de la plateforme Sakany.",
};

export default function CGUPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="rounded-3xl border border-sand bg-white p-6 sm:p-10 shadow-sm">
        <h1 className="font-display text-3xl font-bold text-ink">Conditions Générales d&apos;Utilisation</h1>
        <p className="mt-2 text-sm text-ink-soft">Dernière mise à jour : Septembre 2026</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-ink-soft">
          <section>
            <h2 className="font-display text-lg font-semibold text-ink">1. Objet</h2>
            <p className="mt-2">
              Les présentes conditions générales d&apos;utilisation (ci-après « CGU ») ont pour objet de définir les
              modalités et conditions d&apos;utilisation de la plateforme Sakany (ci-après « la Plateforme »), accessible
              à l&apos;adresse sakany.tn, ainsi que les droits et obligations des utilisateurs.
            </p>
            <p className="mt-2">
              Sakany est une plateforme de mise en relation entre étudiants cherchant un logement et propriétaires
              proposant des biens à la location en Tunisie. Sakany n&apos;est pas partie aux contrats de location conclus
              entre les utilisateurs.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">2. Inscription et Compte</h2>
            <p className="mt-2">
              L&apos;inscription est ouverte à toute personne physique majeure. L&apos;utilisateur s&apos;engage à fournir
              des informations exactes, complètes et à jour lors de son inscription, notamment son nom complet, son
              adresse email et son numéro de téléphone.
            </p>
            <p className="mt-2">
              Chaque utilisateur est responsable de la confidentialité de son mot de passe et de toute activité réalisée
              sous son compte. En cas de suspicion d&apos;utilisation non autorisée, l&apos;utilisateur doit en informer
              Sakany immédiatement.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">3. Rôles des Utilisateurs</h2>
            <p className="mt-2">
              <strong>Étudiants :</strong> Peuvent rechercher des logements, postuler à des annonces, envoyer des messages
              aux propriétaires, laisser des avis sur les logements et chercher des colocataires.
            </p>
            <p className="mt-2">
              <strong>Propriétaires :</strong> Peuvent publier des annonces de logement, gérer les candidatures reçues,
              communiquer avec les étudiants et consulter les statistiques de leurs annonces.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">4. Annonces et Contenus</h2>
            <p className="mt-2">
              Les propriétaires s&apos;engagent à publier des annonces conformes à la réalité du bien proposé. Toute
              annonce trompeuse, frauduleuse ou illicite pourra être signalée par les utilisateurs et supprimée par
              Sakany sans préavis.
            </p>
            <p className="mt-2">
              Les photos publiées doivent représenter fidèlement le bien. Les contenus à caractère discriminatoire,
              offensant ou illégal sont strictement interdits.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">5. Messagerie</h2>
            <p className="mt-2">
              La messagerie intégrée permet aux utilisateurs de communiquer dans le cadre de la recherche de logement.
              Tout usage abusif (spam, harcèlement, contenu inapproprié) entraînera la suspension du compte.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">6. Responsabilité</h2>
            <p className="mt-2">
              Sakany agit en tant que simple intermédiaire et ne garantit ni la qualité des logements proposés, ni la
              solvabilité des locataires. Sakany ne saurait être tenue responsable des litiges entre utilisateurs.
            </p>
            <p className="mt-2">
              La Plateforme est fournie « en l&apos;état ». Sakany ne garantit pas la disponibilité ininterrompue du
              service et ne pourra être tenue responsable des dommages résultant d&apos;une indisponibilité temporaire.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">7. Propriété Intellectuelle</h2>
            <p className="mt-2">
              L&apos;ensemble des éléments de la Plateforme (design, textes, logos, code source) sont la propriété
              exclusive de Sakany. Toute reproduction, même partielle, est interdite sans autorisation préalable.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">8. Suspension et Résiliation</h2>
            <p className="mt-2">
              Sakany se réserve le droit de suspendre ou supprimer tout compte en cas de violation des présentes CGU,
              de comportement abusif ou de contenu illicite, sans préavis ni indemnité.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">9. Modification des CGU</h2>
            <p className="mt-2">
              Sakany se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés
              de toute modification significative. L&apos;utilisation continue de la Plateforme vaut acceptation des
              nouvelles conditions.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">10. Contact</h2>
            <p className="mt-2">
              Pour toute question relative aux présentes CGU, vous pouvez nous contacter à l&apos;adresse :{' '}
              <a href="mailto:contact@sakany.tn" className="text-door hover:underline">contact@sakany.tn</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
