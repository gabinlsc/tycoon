import type { VueLigneRapport, VueRapportMensuel } from '@tycoon/label-tycoon';
import { useLabel } from './LabelContext';

const eur = (cents: number): string => `${Math.round(cents / 100).toLocaleString('fr-FR')} €`;

/** Montant signé, avec le signe moins typographique. */
export const eurSigne = (cents: number): string =>
  `${cents > 0 ? '+' : cents < 0 ? '−' : ''}${eur(Math.abs(cents))}`;

/** Phrase de synthèse d'un rapport. */
export function resume(r: VueRapportMensuel): string {
  const sens = r.net >= 0 ? 'bénéfice' : 'perte';
  const principal = r.premierRevenu ? `, porté par : ${r.premierRevenu.toLowerCase()}` : '';
  return `Mois clos à la semaine ${r.semaine} : ${sens} de ${eur(Math.abs(r.net))}${principal}.`;
}

function Lignes({ titre, lignes }: { titre: string; lignes: readonly VueLigneRapport[] }) {
  return (
    <>
      <h4>{titre}</h4>
      {lignes.length === 0 ? (
        <p className="label-screen__soon">Rien à signaler.</p>
      ) : (
        <ul className="label-list">
          {lignes.map((l, i) => (
            <li key={`${l.titre}-${i}`}>
              <strong>{l.titre}</strong>
              {l.artiste ? ` — ${l.artiste}` : ''}
              {l.causes.length > 0 ? ` (causes : ${l.causes.join(', ')})` : ''}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/** Rapports mensuels : bilan chiffré, réussites et échecs avec leurs causes. */
export function RapportMensuel() {
  const { vue } = useLabel();
  if (!vue) return null;
  const rapports = vue.rapportsMensuels;
  return (
    <section className="label-screen" aria-labelledby="rapport-titre">
      <h2 id="rapport-titre">Rapport mensuel</h2>
      {rapports.length === 0 ? (
        <p className="label-screen__soon">
          Le premier rapport arrive à la fin du premier mois (quatre semaines).
        </p>
      ) : (
        rapports.map((r, i) => (
          <article
            key={r.semaine}
            className="label-card"
            aria-label={`Rapport de la semaine ${r.semaine}`}
          >
            <h3>{i === 0 ? 'Dernier rapport' : `Semaine ${r.semaine}`}</h3>
            <p>{resume(r)}</p>
            <p>
              Revenus <span className="mono">{eur(r.revenus)}</span> · dépenses{' '}
              <span className="mono">{eur(r.depenses)}</span> · trésorerie{' '}
              <span className="mono">{eur(r.tresorerie)}</span> (
              <span className="mono">{eurSigne(r.variation)}</span> sur le mois)
            </p>
            <Lignes titre="Réussites" lignes={r.reussites} />
            <Lignes titre="Échecs" lignes={r.echecs} />
          </article>
        ))
      )}
    </section>
  );
}
