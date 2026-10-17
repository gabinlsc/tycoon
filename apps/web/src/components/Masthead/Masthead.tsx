import { SITE } from '../../config/site';
import { editionNumber, formatEdition, formatLongDate } from '../../lib/edition';
import { Rule } from '../ui/Rule';
import { ThemeToggle } from './ThemeToggle';

const NAV = [
  { href: '#la-cote', label: 'Jeux' },
  { href: '#defi-du-jour', label: 'Défi du jour' },
  { href: '#classements', label: 'Classements' },
  { href: '#a-propos', label: 'À propos' },
] as const;

export function Masthead() {
  // Calculé au rendu : la date du jour suffit, pas besoin de la rafraîchir en continu.
  const now = new Date();

  return (
    <header className="masthead page">
      <div className="masthead__strip mono">
        <span>{formatLongDate(now)}</span>
        <span className="masthead__edition">{formatEdition(editionNumber(now))}</span>
        <span className="masthead__price">{SITE.price}</span>
        <ThemeToggle />
      </div>
      <Rule weight="thin" draw />
      <div className="masthead__title-wrap">
        <p className="masthead__name">
          <span className="masthead__name-ink">{SITE.name}</span>
        </p>
        <p className="masthead__tagline">{SITE.tagline}</p>
      </div>
      <Rule weight="double" draw />
      <nav className="masthead__nav" aria-label="Rubriques">
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
      <Rule weight="thin" draw />
    </header>
  );
}
