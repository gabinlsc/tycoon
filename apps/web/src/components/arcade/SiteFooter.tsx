import { GAMES } from '../../data/games';
import { SITE } from '../../config/site';
import { Coin } from './ui/Coin';

const NAV = [
  { href: '#jeux', label: 'Jeux' },
  { href: '#defi-du-jour', label: 'Défi du jour' },
  { href: '#classements', label: 'Classements' },
  { href: '#a-propos', label: 'Comment jouer' },
  { href: '#abonnement', label: 'Être prévenu' },
] as const;

/** Pied de page : liens, liste des jeux et mentions légales (placeholders). */
export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="footer__inner page">
        <div className="footer__brand">
          <p className="footer__logo">
            <Coin size={36} />
            <span>{SITE.name}</span>
          </p>
          <p>Hébergé en France. Les entreprises, les cours et les fortunes cités sont fictifs.</p>
        </div>
        <nav aria-label="Plan du site">
          <h2 className="footer__title">Le hub</h2>
          <ul>
            {NAV.map((item) => (
              <li key={item.href}>
                <a className="ink-link" href={item.href}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Les jeux">
          <h2 className="footer__title">Les jeux</h2>
          <ul>
            {GAMES.map((game) => (
              <li key={game.symbol}>
                <a className="ink-link" href="#jeux">
                  {game.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Informations légales">
          <h2 className="footer__title">Infos</h2>
          <ul>
            <li>
              <a className="ink-link" href="#mentions-legales">
                Mentions légales
              </a>
            </li>
            <li>
              <a className="ink-link" href="#confidentialite">
                Confidentialité
              </a>
            </li>
            <li>
              <a className="ink-link" href="#contact">
                Contact
              </a>
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
