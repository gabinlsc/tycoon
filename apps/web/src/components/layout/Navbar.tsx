import { Link, NavLink } from 'react-router-dom';
import { SITE } from '../../config/site';
import { useTheme } from '../../lib/useTheme';
import { Logo } from './Logo';

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

/** Barre du haut : logo, rubriques, bascule de thème. Le compte s'y ajoute avec la feature comptes. */
export function Navbar({ account }: { account?: React.ReactNode }) {
  return (
    <header className="navbar">
      <div className="navbar__inner page">
        <Link className="navbar__logo" to="/" aria-label={`${SITE.name}, accueil`}>
          <Logo />
          <span>{SITE.name}</span>
        </Link>
        <nav className="navbar__nav" aria-label="Rubriques">
          <ul>
            <li>
              <NavLink to="/jeux">Jeux</NavLink>
            </li>
            <li>
              <Link to="/#comment-jouer">Comment jouer</Link>
            </li>
            <li>
              <Link to="/#abonnement">Être prévenu</Link>
            </li>
          </ul>
        </nav>
        <div className="navbar__hud">
          {account}
          <ThemeSwitch />
        </div>
      </div>
    </header>
  );
}
