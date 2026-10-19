import { useState } from 'react';
import type { LabelAction, VueFinancesDetail, VueLigneFinance } from '@tycoon/label-tycoon';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  Handshake,
  Landmark,
  Scale,
  Shield,
  Siren,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { Button } from '../../components/arcade/ui/Button';
import { GraphCourbe } from './graphiques/Graphiques';
import { useLabel } from './LabelContext';
import { Anneau, Panneau, Tuile, Tuiles } from './Visuels';

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

/** Finances : compte par catégorie, prêts, investisseurs et stratégie fiscale. */
export function Finances() {
  const { vue, envoyer } = useLabel();
  const [montant, setMontant] = useState(10_000);
  const [semaines, setSemaines] = useState(52);
  if (!vue) return null;
  const f = vue.financesDetail;
  const e = f.emprunt;
  const agir = (action: LabelAction) => void envoyer({ type: 'action', action });

  const revenus = totalLignes(f.revenus);
  const depenses = totalLignes(f.depenses);
  const net = revenus - depenses;

  return (
    <section className="label-screen" aria-labelledby="finances-titre">
      <h2 id="finances-titre">Finances</h2>
      <Tuiles label="Chiffres clés">
        <Tuile
          Icone={Wallet}
          valeur={eur(vue.finances.tresorerie)}
          libelle={
            vue.finances.semainesNegatives > 0
              ? `Trésorerie · négatif depuis ${vue.finances.semainesNegatives} sem.`
              : 'Trésorerie'
          }
          ton={vue.finances.tresorerie < 0 ? 'red' : 'green'}
          alerte={vue.finances.tresorerie < 0}
        />
        <Tuile Icone={ArrowUpCircle} valeur={eur(revenus)} libelle="Revenus" ton="teal" />
        <Tuile Icone={ArrowDownCircle} valeur={eur(depenses)} libelle="Dépenses" ton="orange" />
        <Tuile
          Icone={TrendingUp}
          valeur={`${net >= 0 ? '+' : ''}${eur(net)}`}
          libelle={f.periode === 'mois' ? 'Net du dernier mois' : 'Net de la semaine'}
          ton={net >= 0 ? 'purple' : 'red'}
          alerte={net < 0}
        />
      </Tuiles>
      {f.mois.length > 1 ? (
        <Panneau titre="Résultat net par mois" Icone={TrendingUp} ton="purple" id="fin-courbe">
          <GraphCourbe
            titre="Résultat net par mois (euros)"
            etiquettes={f.mois.map((m) => `S${m.fin}`)}
            series={[{ nom: 'Net', valeurs: f.mois.map((m) => Math.round(m.net / 100)) }]}
            aire
          />
        </Panneau>
      ) : null}
      <div className="lt-panneaux">
        <Panneau titre="Revenus" Icone={ArrowUpCircle} ton="teal" id="fin-rev">
          {f.revenus.length === 0 ? (
            <p className="lt-rien">Rien pour l’instant.</p>
          ) : (
            <Anneau
              titre="Répartition des revenus"
              parts={f.revenus.map((l) => ({ nom: l.nom, valeur: l.montant }))}
              centre={eur(revenus)}
              format={eur}
            />
          )}
        </Panneau>
        <Panneau titre="Dépenses" Icone={ArrowDownCircle} ton="orange" id="fin-dep">
          {f.depenses.length === 0 ? (
            <p className="lt-rien">Rien pour l’instant.</p>
          ) : (
            <Anneau
              titre="Répartition des dépenses"
              parts={f.depenses.map((l) => ({ nom: l.nom, valeur: l.montant }))}
              centre={eur(depenses)}
              format={eur}
            />
          )}
        </Panneau>
      </div>

      <Panneau titre="Prêts" Icone={Landmark} ton="blue" id="fin-prets">
        {!e.debloque ? (
          <p className="lt-rien">Les prêts s’ouvrent au palier Indépendant.</p>
        ) : (
          <>
            <Tuiles label="Endettement">
              <Tuile Icone={Banknote} valeur={eur(e.encours)} libelle="Encours" ton="blue" />
              <Tuile Icone={Shield} valeur={eur(e.plafond)} libelle="Plafond" ton="purple" />
              <Tuile
                Icone={Scale}
                valeur={pct(e.tauxBps)}
                libelle="Taux annuel proposé"
                ton="gold"
              />
            </Tuiles>
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
              <p className="lt-rien">Aucun prêt en cours.</p>
            ) : (
              <ul className="lt-cartes-fin">
                {f.prets.map((p) => (
                  <li key={p.id} className="lt-carte-fin">
                    <strong className="mono">{eur(p.restant)}</strong>
                    <span className="lt-chip">sur {p.semainesRestantes} sem.</span>
                    <span className="lt-chip">{eur(remboursementSemaine(p))} par semaine</span>
                    <span className="lt-chip">{pct(p.tauxBps)}</span>
                    <progress
                      max={p.capital}
                      value={p.capital - p.restant}
                      aria-label={`Remboursement du prêt de ${eur(p.capital)}`}
                    />
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
      </Panneau>

      <Panneau titre="Investisseurs" Icone={Handshake} ton="pink" id="fin-inv">
        {!f.investisseursDebloques ? (
          <p className="lt-rien">Les investisseurs s’intéressent aux labels Établis.</p>
        ) : (
          <>
            {f.offresInvestisseurs.length === 0 ? (
              <p className="lt-rien">Aucune offre pour l’instant.</p>
            ) : (
              <ul className="lt-cartes-fin">
                {f.offresInvestisseurs.map((o) => (
                  <li key={o.id} className="lt-carte-fin">
                    <strong>{o.nom}</strong>
                    <span className="lt-chip">apporte {eur(o.apport)}</span>
                    <span className="lt-chip">{pct(o.partBps)} de la valorisation</span>
                    <span className="lt-chip">objectif {eur(o.objectifCA)} de CA</span>
                    <span className="lt-chip">jusqu’à la sem. {o.expire}</span>
                    <span className="lt-carte-fin__actions">
                      <Button
                        type="button"
                        tone="gold"
                        onClick={() => agir({ type: 'accepter-investisseur', offreId: o.id })}
                      >
                        Accepter {o.nom}
                      </Button>
                      <Button
                        type="button"
                        onClick={() => agir({ type: 'refuser-investisseur', offreId: o.id })}
                      >
                        Refuser {o.nom}
                      </Button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {f.investisseurs.length > 0 ? (
              <ul className="lt-cartes-fin">
                {f.investisseurs.map((i) => (
                  <li key={i.id} className="lt-carte-fin">
                    <strong>{i.nom}</strong>
                    <span className="lt-chip">
                      {eur(i.apport)} pour {pct(i.partBps)}
                    </span>
                    <span className="lt-chip">objectif {eur(i.objectifCA)}</span>
                    <span className="lt-chip">avant la sem. {i.echeance}</span>
                    <span className="lt-chip">{i.statut}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        )}
      </Panneau>

      <Panneau titre="Fiscalité" Icone={Siren} ton="red" id="fin-fisc">
        <p className="lt-puces-info">
          <span className="lt-chip">dernier impôt {eur(f.fiscalite.dernierImpot)}</span>
          <span className="lt-chip">{f.fiscalite.controles} contrôle(s) subi(s)</span>
        </p>
        <div role="radiogroup" aria-label="Stratégie fiscale" className="lt-choix-fisc">
          {f.fiscalite.options.map((o) => (
            <label
              key={o.id}
              className={`lt-choix-fisc__carte${f.fiscalite.strategie === o.id ? ' is-actif' : ''}`}
            >
              <input
                type="radio"
                name="fiscalite"
                checked={f.fiscalite.strategie === o.id}
                onChange={() => agir({ type: 'choisir-fiscalite', strategie: o.id })}
              />
              <strong>{NOMS_STRATEGIES[o.id] ?? o.id}</strong>
              <span>impôt {pct(o.tauxBps)}</span>
              <span className="lt-choix-fisc__risque">
                <span style={{ width: `${Math.round(o.risque * 100)}%` }} />
              </span>
              <small>risque de contrôle {Math.round(o.risque * 100)} %</small>
            </label>
          ))}
        </div>
      </Panneau>
    </section>
  );
}
