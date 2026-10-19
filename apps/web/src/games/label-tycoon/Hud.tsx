import { CalendarDays, Star, TrendingUp, Wallet } from 'lucide-react';
import { BarreTemps } from './BarreTemps';
import { InfobulleCalcul, Terme } from './Infobulle';
import { useLabel } from './LabelContext';

const eur = (cents: number): string => `${Math.round(cents / 100).toLocaleString('fr-FR')} €`;

/** Montant court pour le HUD : 1,2 M€, 340 k€, 980 €. */
export function eurCourt(cents: number): string {
  const e = cents / 100;
  const abs = Math.abs(e);
  if (abs >= 1e9) return `${(e / 1e9).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Md€`;
  if (abs >= 1e6) return `${(e / 1e6).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} M€`;
  if (abs >= 1e4) return `${Math.round(e / 1e3).toLocaleString('fr-FR')} k€`;
  return `${Math.round(e).toLocaleString('fr-FR')} €`;
}

/** Bandeau de jeu : date, trésorerie, valeur, réputation et commandes du temps. */
export function Hud() {
  const { vue } = useLabel();
  if (!vue) return null;
  const negatif = vue.finances.tresorerie < 0;
  return (
    <header className="lt-hud label-bar">
      <div className="lt-hud__stats">
        <span className="lt-stat lt-stat--date">
          <CalendarDays aria-hidden="true" size={18} />
          <span className="label-bar__date mono">
            An {vue.date.annee} · mois {vue.date.mois} · sem. {vue.date.semaineDuMois}
          </span>
        </span>
        <span
          className={`lt-stat lt-stat--cash${negatif ? ' is-negatif' : ''}`}
          aria-label="Trésorerie"
        >
          <Wallet aria-hidden="true" size={18} />
          <span className="label-bar__cash mono">
            <Terme id="tresorerie">{eur(vue.finances.tresorerie)}</Terme>
          </span>
        </span>
        <span className="lt-stat lt-stat--valeur">
          <TrendingUp aria-hidden="true" size={18} />
          <span className="label-bar__value mono">
            <InfobulleCalcul termes={vue.finances.termesValorisation} argent>
              Valeur {eurCourt(vue.finances.valorisation)}
            </InfobulleCalcul>
          </span>
        </span>
        <span className="lt-stat lt-stat--reputation" title="Réputation du label (0 à 100)">
          <Star aria-hidden="true" size={18} />
          <span className="mono">
            <Terme id="reputation">{vue.label.reputation}</Terme>
          </span>
          <span className="lt-jauge" aria-hidden="true">
            <span style={{ width: `${vue.label.reputation}%` }} />
          </span>
        </span>
      </div>
      <BarreTemps />
    </header>
  );
}
