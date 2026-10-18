import { useState } from 'react';
import type { LabelAction, VueFinancesDetail, VueLigneFinance } from '@tycoon/label-tycoon';
import { Button } from '../../components/arcade/ui/Button';
import { GraphCourbe } from './graphiques/Graphiques';
import { useLabel } from './LabelContext';

const eur = (cents: number): string => `${Math.round(cents / 100).toLocaleString('fr-FR')} €`;
const pct = (bps: number): string => `${(bps / 100).toLocaleString('fr-FR')} %`;

const NOMS_STRATEGIES: Record<string, string> = {
  prudente: 'Prudente',
  optimisee: 'Optimisée',
  agressive: 'Agressive',
};

/** Total d'une liste de lignes de compte. */
export const totalLignes = (lignes: readonly VueLigneFinance[]): number =>
  lignes.reduce((somme, l) => somme + l.montant, 0);

/** Charge mensuelle d'un prêt (capital restant réparti sur les semaines restantes, en centimes par semaine). */
export const remboursementSemaine = (p: VueFinancesDetail['prets'][number]): number =>
  Math.ceil(p.restant / Math.max(1, p.semainesRestantes));

function Lignes({ titre, lignes }: { titre: string; lignes: readonly VueLigneFinance[] }) {
  return (
    <table className="label-table">
      <caption>{titre}</caption>
      <thead>
        <tr>
          <th scope="col">Catégorie</th>
          <th scope="col">Montant</th>
        </tr>
      </thead>
      <tbody>
        {lignes.length === 0 ? (
          <tr>
            <td colSpan={2}>Rien pour l’instant.</td>
          </tr>
        ) : (
          lignes.map((l) => (
            <tr key={l.cle}>
              <th scope="row">{l.nom}</th>
              <td className="mono">{eur(l.montant)}</td>
            </tr>
          ))
        )}
      </tbody>
      <tfoot>
        <tr>
          <th scope="row">Total</th>
          <td className="mono">{eur(totalLignes(lignes))}</td>
        </tr>
      </tfoot>
    </table>
  );
}

/** Finances : compte par catégorie, prêts, investisseurs et stratégie fiscale. */
export function Finances() {
  const { vue, envoyer } = useLabel();
  const [montant, setMontant] = useState(10_000);
  const [semaines, setSemaines] = useState(52);
  if (!vue) return null;
  const f = vue.financesDetail;
  const e = f.emprunt;
  const agir = (action: LabelAction) => void envoyer({ type: 'action', action });

  return (
    <section className="label-screen" aria-labelledby="finances-titre">
      <h2 id="finances-titre">Finances</h2>
      <p>
        Trésorerie : <strong className="mono">{eur(vue.finances.tresorerie)}</strong>
        {vue.finances.semainesNegatives > 0
          ? ` · en négatif depuis ${vue.finances.semainesNegatives} semaine(s)`
          : ''}
      </p>
      {f.mois.length > 1 ? (
        <GraphCourbe
          titre="Résultat net par mois (euros)"
          etiquettes={f.mois.map((m) => `S${m.fin}`)}
          series={[{ nom: 'Net', valeurs: f.mois.map((m) => Math.round(m.net / 100)) }]}
        />
      ) : null}
      <h3>{f.periode === 'mois' ? 'Dernier mois clos' : 'Semaine en cours'}</h3>
      <Lignes titre="Revenus" lignes={f.revenus} />
      <Lignes titre="Dépenses" lignes={f.depenses} />

      <h3>Prêts</h3>
      {!e.debloque ? (
        <p className="label-screen__soon">Les prêts s’ouvrent au palier Indépendant.</p>
      ) : (
        <>
          <p>
            Encours <span className="mono">{eur(e.encours)}</span> sur un plafond de{' '}
            <span className="mono">{eur(e.plafond)}</span> · taux annuel proposé{' '}
            <span className="mono">{pct(e.tauxBps)}</span>.
          </p>
          <div className="label-nego__form">
            <label className="label-field">
              Montant (€)
              <input
                type="number"
                min={Math.round(e.minimum / 100)}
                step={1000}
                value={montant}
                onChange={(ev) => setMontant(Number(ev.target.value))}
              />
            </label>
            <label className="label-field">
              Durée (semaines)
              <input
                type="number"
                min={e.semaines.min}
                max={e.semaines.max}
                value={semaines}
                onChange={(ev) => setSemaines(Number(ev.target.value))}
              />
            </label>
          </div>
          <Button
            type="button"
            tone="gold"
            onClick={() => agir({ type: 'emprunter', montant: montant * 100, semaines })}
          >
            Emprunter
          </Button>
          {f.prets.length === 0 ? (
            <p className="label-screen__soon">Aucun prêt en cours.</p>
          ) : (
            <ul className="label-list">
              {f.prets.map((p) => (
                <li key={p.id}>
                  Prêt de {eur(p.capital)} à {pct(p.tauxBps)} : reste{' '}
                  <span className="mono">{eur(p.restant)}</span> sur {p.semainesRestantes} sem. (
                  {eur(remboursementSemaine(p))} par semaine){' '}
                  <Button
                    type="button"
                    disabled={vue.finances.tresorerie < p.restant}
                    onClick={() => agir({ type: 'rembourser-pret', pretId: p.id })}
                  >
                    Rembourser le prêt de {eur(p.capital)}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <h3>Investisseurs</h3>
      {!f.investisseursDebloques ? (
        <p className="label-screen__soon">Les investisseurs s’intéressent aux labels Établis.</p>
      ) : (
        <>
          {f.offresInvestisseurs.length === 0 ? (
            <p className="label-screen__soon">Aucune offre pour l’instant.</p>
          ) : (
            <ul className="label-list">
              {f.offresInvestisseurs.map((o) => (
                <li key={o.id}>
                  {o.nom} apporte {eur(o.apport)} contre {pct(o.partBps)} de la valorisation, à
                  condition d’atteindre {eur(o.objectifCA)} de chiffre d’affaires (offre valable
                  jusqu’à la semaine {o.expire}).{' '}
                  <Button
                    type="button"
                    tone="gold"
                    onClick={() => agir({ type: 'accepter-investisseur', offreId: o.id })}
                  >
                    Accepter {o.nom}
                  </Button>{' '}
                  <Button
                    type="button"
                    onClick={() => agir({ type: 'refuser-investisseur', offreId: o.id })}
                  >
                    Refuser {o.nom}
                  </Button>
                </li>
              ))}
            </ul>
          )}
          {f.investisseurs.length > 0 ? (
            <ul className="label-list">
              {f.investisseurs.map((i) => (
                <li key={i.id}>
                  {i.nom} : {eur(i.apport)} pour {pct(i.partBps)}, objectif {eur(i.objectifCA)}{' '}
                  avant la semaine {i.echeance} ({i.statut}).
                </li>
              ))}
            </ul>
          ) : null}
        </>
      )}

      <h3>Fiscalité</h3>
      <p>
        Dernier impôt : <span className="mono">{eur(f.fiscalite.dernierImpot)}</span> · contrôles
        subis : {f.fiscalite.controles}.
      </p>
      <div role="radiogroup" aria-label="Stratégie fiscale" className="label-nego__form">
        {f.fiscalite.options.map((o) => (
          <label key={o.id} className="label-field">
            <input
              type="radio"
              name="fiscalite"
              checked={f.fiscalite.strategie === o.id}
              onChange={() => agir({ type: 'choisir-fiscalite', strategie: o.id })}
            />{' '}
            {NOMS_STRATEGIES[o.id] ?? o.id} : impôt {pct(o.tauxBps)}, risque de contrôle{' '}
            {Math.round(o.risque * 100)} %
          </label>
        ))}
      </div>
    </section>
  );
}
