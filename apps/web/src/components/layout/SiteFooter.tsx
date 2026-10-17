import { Link } from 'react-router-dom';
import { GAMES } from '../../data/games';
import { SITE } from '../../config/site';
import { Logo } from './Logo';

/** Pied de page : liens, liste des jeux et mentions légales (placeholders). */
export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="footer__inner page">
        <div className="footer__brand">
          <p className="footer__logo">
            <Logo size={36} />
            <span>{SITE.name}</span>
          </p>
          <p>Hébergé en France. Chaque jeu est indépendant : ton compte ne garde que ton pseudo.</p>
        </div>
        <nav aria-label="Plan du site">
          <h2 className="footer__title">Le hub</h2>
          <ul>
            <li>
              <Link className="ink-link" to="/jeux">
                Tous les jeux
              </Link>
            </li>
            <li>
              <Link className="ink-link" to="/#comment-jouer">
                Comment jouer
              </Link>
            </li>
            <li>
              <Link className="ink-link" to="/#abonnement">
                Être prévenu
              </Link>
            </li>
          </ul>
        </nav>
        <nav aria-label="Les jeux">
          <h2 className="footer__title">Les jeux</h2>
          <ul>
            {GAMES.map((game) => (
              <li key={game.slug}>
                <Link className="ink-link" to={`/jeux/${game.slug}`}>
                  {game.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Informations légales">
          <h2 className="footer__title">Infos</h2>
          <ul>
            <li>
              <Link className="ink-link" to="/mentions-legales">
                Mentions légales
              </Link>
            </li>
            <li>
              <Link className="ink-link" to="/confidentialite">
                Confidentialité
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <p className="footer__legal page">
        © {year} {SITE.name} · {SITE.domain} · Éditeur, hébergeur et directeur de la publication : à
        renseigner.
      </p>
    </footer>
  );
}
