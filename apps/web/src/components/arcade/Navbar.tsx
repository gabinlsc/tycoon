import { SITE } from '../../config/site';
import { useTheme } from '../../lib/useTheme';
import { Coin } from './ui/Coin';

const NAV = [
  { href: '#jeux', label: 'Jeux' },
  { href: '#defi-du-jour', label: 'Défi du jour' },
  { href: '#classements', label: 'Classements' },
  { href: '#a-propos', label: 'Comment jouer' },
] as const;

function ThemeSwitch() {
  const { theme, toggle } = useTheme();
  const night = theme === 'dark';
  return (
    <button type="button" className="theme-switch" onClick={toggle} aria-pressed={night}>
      <span className="visually-hidden">Mode nuit</span>
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        {night ? (
          <path
            d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z"
            fill="var(--gold)"
            stroke="var(--outline)"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        ) : (
          <g stroke="var(--outline)" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="5" fill="var(--gold)" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
          </g>
        )}
      </svg>
    </button>
  );
}

/** Barre du haut façon HUD de jeu : logo, rubriques, niveau et trésorerie de départ. */
export function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar__inner page">
        <a className="navbar__logo" href="#top" aria-label={`${SITE.name}, accueil`}>
          <Coin size={40} />
          <span>{SITE.name}</span>
        </a>
        <nav className="navbar__nav" aria-label="Rubriques">
          <ul>
            {NAV.map((item) => (
              <li key={item.href}>
                <a href={item.href}>{item.label}</a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="navbar__hud">
          <p className="hud-pill hud-pill--level" title="Niveau de départ">
            <span>Niv.</span> 1
          </p>
          <p className="hud-pill hud-pill--money" title="Trésorerie de départ">
            <Coin size={22} />
            <span className="mono">1 000</span>
          </p>
          <ThemeSwitch />
        </div>
      </div>
    </header>
  );
}
