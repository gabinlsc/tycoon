import type { VueJeu } from '@tycoon/label-tycoon';
import { OBJECTIF_TEXTES } from '@tycoon/label-tycoon';
import { useState } from 'react';
import { Award, CheckCircle2, Circle, Disc3, Inbox, Radar, Rocket, Users } from 'lucide-react';
import { Button } from '../../components/arcade/ui/Button';
import { TapisRouge } from './Ceremonie';
import { eurCourt } from './Hud';
import type { EcranId } from './ecrans';
import { GraphCourbe } from './graphiques/Graphiques';
import { Terme } from './Infobulle';
import { useLabel } from './LabelContext';

const eur = (cents: number): string => `${Math.round(cents / 100).toLocaleString('fr-FR')} €`;

export interface Alerte {
  id: string;
  niveau: 'danger' | 'info';
  texte: string;
  ecran?: EcranId;
}

/** Alertes du tableau de bord « par exceptions » : seulement ce qui demande de l'attention. */
export function alertes(vue: VueJeu): Alerte[] {
  const out: Alerte[] = [];
  if (vue.finances.faillite)
    out.push({ id: 'faillite', niveau: 'danger', texte: 'Faillite : la partie est terminée.' });
  else if (vue.finances.semainesNegatives > 0)
    out.push({
      id: 'tresorerie',
      niveau: 'danger',
      texte: `Trésorerie négative depuis ${vue.finances.semainesNegatives} semaine(s) : la faillite menace à 8.`,
    });
  if (vue.decisions.length > 0)
    out.push({
      id: 'decisions',
      niveau: 'info',
      texte: `${vue.decisions.length} décision(s) en attente.`,
      ecran: 'boite',
    });
  for (const e of vue.echeances)
    if (e.type === 'contrat' && e.semaine - vue.semaine <= 4)
      out.push({
        id: `contrat-${e.artisteId}`,
        niveau: 'info',
        texte: `Le contrat de ${e.nom} arrive à terme (semaine ${e.semaine}).`,
        ecran: 'roster',
      });
  return out;
}

export const progressionObjectif = (o: VueJeu['objectifs'][number]): number => {
  if (o.kind === 'tresorerie') return Math.min(1, Math.max(0, o.progression / o.cible));
  return Math.min(1, Math.max(0, (o.progression - o.base) / o.cible));
};

/** Une étape des « Premiers pas » : faite ou non, et l'écran où la faire. */
export interface EtapePremiersPas {
  id: string;
  titre: string;
  aide: string;
  faite: boolean;
  ecran?: EcranId;
  action?: string;
}

/** Les cinq gestes de base d'une première partie, déduits de l'état du jeu. */
export function premiersPas(vue: VueJeu): EtapePremiersPas[] {
  const signe = vue.roster.length > 0;
  const sorti = vue.projets.some((p) => p.statut === 'sortie');
  return [
    {
      id: 'reperer',
      titre: 'Repère des talents',
      aide: 'Lance une session de repérage : des artistes inconnus apparaissent.',
      faite: signe || vue.suivis.length > 0,
      ecran: 'reperage',
      action: 'Aller repérer',
    },
    {
      id: 'signer',
      titre: 'Signe ton premier artiste',
      aide: 'Ouvre la fiche d’un talent suivi et fais-lui une offre qui lui plaît.',
      faite: signe,
      ecran: 'reperage',
      action: 'Négocier',
    },
    {
      id: 'produire',
      titre: 'Lance un projet en studio',
      aide: 'Un single pour commencer : studio, producteur, mixage.',
      faite: sorti || vue.projets.length > 0,
      ecran: 'studio',
      action: 'Ouvrir le studio',
    },
    {
      id: 'sortir',
      titre: 'Sors ton premier titre',
      aide: 'Quand le projet est prêt, sors-le : les écoutes et l’argent arrivent.',
      faite: sorti,
      ecran: 'studio',
      action: 'Sortir un titre',
    },
    {
      id: 'temps',
      titre: 'Fais tourner le temps',
      aide: 'Bouton « Semaine » ou une vitesse en haut de l’écran (espace pour pause).',
      faite: vue.semaine >= 4,
    },
  ];
}

const CLE_MASQUE = 'tycoon:label:premiers-pas-masques';
const lireMasque = (): boolean => {
  try {
    return window.localStorage.getItem(CLE_MASQUE) === '1';
  } catch {
    return false;
  }
};

/** Carte de mission des premières minutes : ce qu'il faut faire, dans l'ordre, avec un bouton. */
function PremiersPas({ vue, allerA }: { vue: VueJeu; allerA: (ecran: EcranId) => void }) {
  const [masque, setMasque] = useState(lireMasque);
  const etapes = premiersPas(vue);
  const faites = etapes.filter((e) => e.faite).length;
  if (masque || faites === etapes.length || vue.partie.mode === 'tutoriel') return null;
  const prochaine = etapes.find((e) => !e.faite);
  return (
    <section className="lt-mission" aria-labelledby="qg-premiers-pas">
      <div className="lt-mission__tete">
        <span className="lt-mission__icone" aria-hidden="true">
          <Rocket size={26} />
        </span>
        <div>
          <h2 id="qg-premiers-pas">Premiers pas</h2>
          <p>
            {faites} sur {etapes.length} —{' '}
            {faites === 0
              ? 'cinq gestes pour lancer ton label.'
              : faites < 3
                ? 'bon début, continue.'
                : 'tu y es presque, patron.'}
          </p>
        </div>
        <button
          type="button"
          className="lt-mission__masquer"
          onClick={() => {
            setMasque(true);
            try {
              window.localStorage.setItem(CLE_MASQUE, '1');
            } catch {
              /* préférence non mémorisée */
            }
          }}
        >
          Masquer
        </button>
      </div>
      <div
        className="lt-barre"
        role="progressbar"
        aria-label="Progression des premiers pas"
        aria-valuemin={0}
        aria-valuemax={etapes.length}
        aria-valuenow={faites}
      >
        <span style={{ width: `${(faites / etapes.length) * 100}%` }} />
      </div>
      <ol className="lt-mission__etapes">
        {etapes.map((e) => (
          <li
            key={e.id}
            className={`lt-etape${e.faite ? ' is-faite' : ''}${e === prochaine ? ' is-prochaine' : ''}`}
          >
            {e.faite ? (
              <CheckCircle2 aria-hidden="true" size={24} />
            ) : (
              <Circle aria-hidden="true" size={24} />
            )}
            <div>
              <strong>
                {e.titre}
                {e.faite ? <span className="visually-hidden"> (fait)</span> : null}
              </strong>
              {e === prochaine ? <p>{e.aide}</p> : null}
            </div>
            {e === prochaine && e.ecran ? (
              <Button type="button" tone="gold" onClick={() => allerA(e.ecran as EcranId)}>
                {e.action}
              </Button>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}

const pourcent = (actuel: number, requis: number): number =>
  requis <= 0 ? 100 : Math.max(0, Math.min(100, Math.round((actuel / requis) * 100)));

/** Ce qui manque pour le palier suivant : trois jauges qui se lisent d'un coup d'œil. */
function ProchainPalier({ vue }: { vue: VueJeu }) {
  const p = vue.prochainPalier;
  if (!p) return null;
  const conditions = [
    {
      nom: 'Réputation',
      texte: `${p.reputation.actuelle} / ${p.reputation.requise}`,
      pct: pourcent(p.reputation.actuelle, p.reputation.requise),
    },
    {
      nom: 'Chiffre d’affaires sur un an',
      texte: `${eurCourt(p.chiffreAffaires.actuel)} / ${eurCourt(p.chiffreAffaires.requis)}`,
      pct: pourcent(p.chiffreAffaires.actuel, p.chiffreAffaires.requis),
    },
  ];
  return (
    <section className="label-screen lt-palier-suivant" aria-labelledby="qg-palier">
      <h2 id="qg-palier">
        <Award aria-hidden="true" size={24} /> Prochain palier : {p.nom}
      </h2>
      <ul className="lt-conditions">
        {conditions.map((c) => (
          <li key={c.nom}>
            <span className="lt-conditions__nom">{c.nom}</span>
            <span className="lt-barre" aria-hidden="true">
              <span style={{ width: `${c.pct}%` }} />
            </span>
            <span className="mono">{c.texte}</span>
          </li>
        ))}
        {p.certification.requise ? (
          <li>
            <span className="lt-conditions__nom">
              Disque {p.certification.requise === 'or' ? 'd’or' : `de ${p.certification.requise}`}
            </span>
            <span className={`lt-coche${p.certification.atteinte ? ' is-ok' : ''}`}>
              {p.certification.atteinte ? 'obtenu' : 'à décrocher'}
            </span>
          </li>
        ) : null}
      </ul>
    </section>
  );
}

/** Tableau de bord : mission de départ, indicateurs, palier suivant, alertes, finances, actus. */
export function QG({
  allerA,
  revoirCeremonie,
}: {
  allerA: (ecran: EcranId) => void;
  revoirCeremonie?: () => void;
}) {
  const { vue } = useLabel();
  if (!vue) return null;
  const liste = alertes(vue);
  const points = vue.historiqueTresorerie.map((c) => Math.round(c / 100));
  const tuiles = [
    {
      id: 'artistes',
      Icone: Users,
      libelle: 'Artistes',
      valeur: `${vue.roster.length}${vue.plafondRoster !== null ? ` / ${vue.plafondRoster}` : ''}`,
      ecran: 'roster' as const,
    },
    {
      id: 'suivis',
      Icone: Radar,
      libelle: 'Talents suivis',
      valeur: String(vue.suivis.length),
      ecran: 'reperage' as const,
    },
    {
      id: 'projets',
      Icone: Disc3,
      libelle: 'En studio',
      valeur: String(vue.projets.filter((p) => p.statut !== 'sortie').length),
      ecran: 'studio' as const,
    },
    {
      id: 'decisions',
      Icone: Inbox,
      libelle: 'À décider',
      valeur: String(vue.decisions.length),
      ecran: 'boite' as const,
    },
  ];

  return (
    <div className="label-qg lt-qg">
      {vue.ceremonie ? (
        <TapisRouge ceremonie={vue.ceremonie} semaine={vue.semaine} revoir={revoirCeremonie} />
      ) : null}
      <PremiersPas vue={vue} allerA={allerA} />

      <ul className="lt-tuiles" aria-label="Indicateurs du label">
        {tuiles.map((t) => (
          <li key={t.id}>
            <button type="button" className="lt-tuile" onClick={() => allerA(t.ecran)}>
              <t.Icone aria-hidden="true" size={26} />
              <span className="lt-tuile__valeur mono">{t.valeur}</span>
              <span className="lt-tuile__libelle">{t.libelle}</span>
            </button>
          </li>
        ))}
      </ul>

      <section className="label-screen label-qg__alerts" aria-labelledby="qg-alertes">
        <h2 id="qg-alertes">Alertes</h2>
        {liste.length === 0 ? (
          <p className="label-screen__soon">Tout est calme. Aucune alerte.</p>
        ) : (
          <ul className="label-alerts">
            {liste.map((a) => (
              <li key={a.id} className={`label-alert label-alert--${a.niveau}`}>
                <strong>{a.niveau === 'danger' ? '⚠ Urgent : ' : 'ℹ À noter : '}</strong>
                {a.texte}
                {a.ecran ? (
                  <Button type="button" tone="ghost" onClick={() => allerA(a.ecran as EcranId)}>
                    Voir
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <ProchainPalier vue={vue} />

      <section className="label-screen" aria-labelledby="qg-finances">
        <h2 id="qg-finances">Finances</h2>
        <p className="label-qg__big mono">
          <Terme id="tresorerie">{eur(vue.finances.tresorerie)}</Terme>
        </p>
        {points.length >= 2 ? (
          <GraphCourbe
            titre="Trésorerie des dernières semaines (en euros)"
            etiquettes={points.map((_, i) => `S${vue.semaine - points.length + i + 1}`)}
            series={[{ nom: 'Trésorerie', valeurs: points }]}
            aire
          />
        ) : (
          <p className="label-screen__soon">La courbe apparaîtra après quelques semaines.</p>
        )}
        {vue.rapport ? (
          <p>
            Dernier mois : {vue.rapport.net >= 0 ? '+' : ''}
            {eur(vue.rapport.net)} · {vue.rapport.reussites} réussite(s), {vue.rapport.echecs}{' '}
            échec(s).
          </p>
        ) : null}
      </section>

      <section className="label-screen" aria-labelledby="qg-echeances">
        <h2 id="qg-echeances">Échéances</h2>
        {vue.echeances.length === 0 ? (
          <p className="label-screen__soon">Rien de prévu.</p>
        ) : (
          <ul className="label-list">
            {vue.echeances.map((e) => (
              <li key={`${e.type}-${e.artisteId}-${e.semaine}`}>
                <span className="mono">sem. {e.semaine}</span> —{' '}
                {e.type === 'projet' ? 'Sortie de' : 'Fin de contrat de'} {e.nom}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="label-screen" aria-labelledby="qg-objectifs">
        <h2 id="qg-objectifs">Objectifs</h2>
        {vue.objectifs.length === 0 ? (
          <p className="label-screen__soon">Les objectifs arrivent avec les premières semaines.</p>
        ) : (
          <ul className="label-list lt-objectifs">
            {vue.objectifs.map((o) => (
              <li key={o.id}>
                <span>{OBJECTIF_TEXTES[o.kind as keyof typeof OBJECTIF_TEXTES] ?? o.kind}</span>
                <progress
                  max={1}
                  value={progressionObjectif(o)}
                  aria-label={`Progression : ${OBJECTIF_TEXTES[o.kind as keyof typeof OBJECTIF_TEXTES] ?? o.kind}`}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="label-screen" aria-labelledby="qg-actus">
        <h2 id="qg-actus">Dernières actus</h2>
        {vue.fil.length === 0 ? (
          <p className="label-screen__soon">Le Fil se remplira au fil des semaines.</p>
        ) : (
          <ul className="label-list">
            {vue.fil.slice(0, 5).map((a) => (
              <li key={a.id}>
                <strong>{a.titre}</strong>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
