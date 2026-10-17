import { GAMES } from '../../data/games';
import { SITE } from '../../config/site';
import { Rule } from '../ui/Rule';

const NAV = [
  { href: '#la-cote', label: 'Jeux' },
  { href: '#defi-du-jour', label: 'Défi du jour' },
  { href: '#classements', label: 'Classements' },
  { href: '#a-propos', label: 'À propos' },
  { href: '#abonnement', label: "Recevoir l'édition" },
] as const;

/** Pied de page : colophon de journal, liens et mentions légales (placeholders). */
export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer page">
      <Rule weight="double" />
      <div className="footer__grid">
        <section className="footer__colophon" aria-labelledby="colophon-titre">
          <h2 id="colophon-titre" className="footer__title mono">
            Colophon
          </h2>
          <p>
            {SITE.name} est imprimé sur des serveurs français, composé en Libre Caslon Display,
            Public Sans et IBM Plex Mono, et tiré chaque matin à zéro exemplaire papier.
          </p>
          <p>Les entreprises, les cours et les fortunes cités sont fictifs.</p>
        </section>
        <nav className="footer__nav" aria-label="Plan du site">
          <h2 className="footer__title mono">Rubriques</h2>
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
        <nav className="footer__nav" aria-label="Les jeux">
          <h2 className="footer__title mono">La cote</h2>
          <ul>
            {GAMES.map((game) => (
              <li key={game.symbol}>
                <a className="ink-link" href="#la-cote">
                  <span className="mono">{game.symbol}</span> · {game.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <nav className="footer__nav" aria-label="Informations légales">
          <h2 className="footer__title mono">Mentions</h2>
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
      <p className="footer__legal mono">
        © {year} {SITE.name} · {SITE.domain} · Éditeur, hébergeur et directeur de la publication : à
        renseigner.
      </p>
    </footer>
  );
}
