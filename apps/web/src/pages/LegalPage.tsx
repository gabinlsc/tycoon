import { usePageTitle } from '../lib/usePageTitle';

interface LegalPageProps {
  title: string;
}

/** Page légale provisoire : le contenu définitif dépend de l'éditeur et de l'hébergeur, pas encore choisis. */
export function LegalPage({ title }: LegalPageProps) {
  usePageTitle(title);
  return (
    <section className="legal page" aria-labelledby="legal-titre">
      <h1 id="legal-titre" className="legal__title">
        {title}
      </h1>
      <p className="card legal__card">
        Cette page sera rédigée avant l'ouverture au public : éditeur, hébergeur, directeur de la
        publication et traitement des données y seront précisés.
      </p>
    </section>
  );
}
