import { Link } from 'react-router-dom';
import { Button } from '../components/arcade/ui/Button';
import { usePageTitle } from '../lib/usePageTitle';

export function NotFoundPage() {
  usePageTitle('Page introuvable');
  return (
    <section className="notfound page" aria-labelledby="nf-titre">
      <p className="notfound__code mono" aria-hidden="true">
        404
      </p>
      <h1 id="nf-titre" className="notfound__title">
        Cette page n'existe pas
      </h1>
      <p>Le lien est peut-être périmé, ou le jeu n'est pas encore sorti.</p>
      <Button as={Link} to="/" tone="gold" size="lg">
        Retour à l'accueil
      </Button>
    </section>
  );
}
