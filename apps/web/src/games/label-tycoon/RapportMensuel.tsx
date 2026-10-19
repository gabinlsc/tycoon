import type { VueLigneRapport, VueRapportMensuel } from '@tycoon/label-tycoon';
import { CheckCircle2, FileText, Minus, TrendingDown, TrendingUp, XCircle } from 'lucide-react';
import { useLabel } from './LabelContext';
import { Panneau, Tuile, Tuiles } from './Visuels';

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

function Lignes({
  titre,
  lignes,
  bonnes,
}: {
  titre: string;
  lignes: readonly VueLigneRapport[];
  bonnes: boolean;
}) {
  return (
    <div className={`lt-rapport__bloc ${bonnes ? 'is-bon' : 'is-mauvais'}`}>
      <h4>
        {bonnes ? (
          <CheckCircle2 aria-hidden="true" size={20} />
        ) : (
          <XCircle aria-hidden="true" size={20} />
        )}{' '}
        {titre}
      </h4>
      {lignes.length === 0 ? (
        <p className="lt-rien">
          <Minus aria-hidden="true" size={16} /> Rien à signaler.
        </p>
      ) : (
        <ul>
          {lignes.map((l, i) => (
            <li key={`${l.titre}-${i}`}>
              <strong>{l.titre}</strong>
              {l.artiste ? <span className="lt-chip">{l.artiste}</span> : null}
              {l.causes.map((c) => (
                <span key={c} className="lt-chip">
                  {c}
                </span>
              ))}
            </li>
          ))}
        </ul>
      )}
    </div>
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
        <p className="lt-rien">
          <FileText aria-hidden="true" size={20} /> Le premier rapport arrive à la fin du premier
          mois (quatre semaines).
        </p>
      ) : (
        rapports.map((r, i) => (
          <article
            key={r.semaine}
            className="lt-rapport"
            aria-label={`Rapport de la semaine ${r.semaine}`}
          >
            <Panneau
              titre={i === 0 ? 'Dernier rapport' : `Semaine ${r.semaine}`}
              Icone={r.net >= 0 ? TrendingUp : TrendingDown}
              ton={r.net >= 0 ? 'green' : 'red'}
              id={`rap-${r.semaine}`}
            >
              <p className="lt-sous-titre">{resume(r)}</p>
              <Tuiles label="Bilan du mois">
                <Tuile Icone={TrendingUp} valeur={eur(r.revenus)} libelle="Revenus" ton="teal" />
                <Tuile
                  Icone={TrendingDown}
                  valeur={eur(r.depenses)}
                  libelle="Dépenses"
                  ton="orange"
                />
                <Tuile
                  Icone={FileText}
                  valeur={eur(r.tresorerie)}
                  libelle={`Trésorerie (${eurSigne(r.variation)} sur le mois)`}
                  ton={r.variation >= 0 ? 'green' : 'red'}
                />
              </Tuiles>
              <div className="lt-rapport__blocs">
                <Lignes titre="Réussites" lignes={r.reussites} bonnes />
                <Lignes titre="Échecs" lignes={r.echecs} bonnes={false} />
              </div>
            </Panneau>
          </article>
        ))
      )}
    </section>
  );
}
