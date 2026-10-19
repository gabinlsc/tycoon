import { useEffect, useRef, useState } from 'react';
import type { VueJeu } from '@tycoon/label-tycoon';
import { Award, Crown, Trophy } from 'lucide-react';
import { Confettis } from './Ceremonie';
import { eurCourt } from './Hud';

type Effet =
  | { id: number; type: 'flottant'; texte: string; gain: boolean; x: number; y: number }
  | { id: number; type: 'tampon'; texte: string; nom: string }
  | {
      id: number;
      type: 'bandeau';
      texte: string;
      sous: string;
      icone: 'disque' | 'trophee' | 'palier';
    };

type SansId<T> = T extends unknown ? Omit<T, 'id'> : never;

const DUREES = { flottant: 1800, tampon: 1700, bandeau: 3200 } as const;

/** Variation de trésorerie assez grosse pour mériter un chiffre qui s'envole (100 €). */
export const SEUIL_FLOTTANT = 10_000;

/** Bandeau à afficher pour une actu du Fil, ou `null`. */
export function bandeauDeLActu(kind: string): Extract<Effet, { type: 'bandeau' }>['icone'] | null {
  if (kind === 'certification') return 'disque';
  if (kind === 'prix-remporte' || kind === 'label-de-l-annee') return 'trophee';
  if (kind === 'palier') return 'palier';
  return null;
}

/**
 * Couche d'effets du jeu : chiffres de trésorerie qui s'envolent, tampon « SIGNÉ ! » plein écran,
 * bandeaux de réussite avec confettis. Purement décoratif (aria-hidden) et coupé en
 * `prefers-reduced-motion`.
 */
export function Effets({ vue }: { vue: VueJeu | null }) {
  const [effets, setEffets] = useState<Effet[]>([]);
  const prec = useRef<{
    tresorerie: number;
    artistes: Set<number>;
    fil: number;
  } | null>(null);
  const compteur = useRef(0);

  useEffect(() => {
    if (!vue) {
      prec.current = null;
      return;
    }
    const maintenant = {
      tresorerie: vue.finances.tresorerie,
      artistes: new Set(vue.roster.map((a) => a.id)),
      fil: vue.fil[0]?.id ?? 0,
    };
    const avant = prec.current;
    prec.current = maintenant;
    if (!avant) return;

    const nouveaux: Effet[] = [];
    const ajouter = (e: SansId<Effet>) =>
      nouveaux.push({ ...e, id: (compteur.current += 1) } as Effet);

    const delta = maintenant.tresorerie - avant.tresorerie;
    if (Math.abs(delta) >= SEUIL_FLOTTANT) {
      const cible = document.querySelector('.lt-stat--cash')?.getBoundingClientRect();
      ajouter({
        type: 'flottant',
        texte: `${delta > 0 ? '+' : '−'}${eurCourt(Math.abs(delta))}`,
        gain: delta > 0,
        x: cible ? cible.left + cible.width / 2 : 160,
        y: cible ? cible.bottom : 70,
      });
    }
    for (const a of vue.roster)
      if (!avant.artistes.has(a.id)) ajouter({ type: 'tampon', texte: 'SIGNÉ !', nom: a.nom });
    for (const a of vue.fil.filter((x) => x.id > avant.fil)) {
      const icone = bandeauDeLActu(a.kind);
      if (icone) ajouter({ type: 'bandeau', texte: a.titre, sous: a.texte, icone });
    }
    if (nouveaux.length === 0) return;
    setEffets((l) => [...l, ...nouveaux]);
    for (const e of nouveaux)
      window.setTimeout(() => setEffets((l) => l.filter((x) => x.id !== e.id)), DUREES[e.type]);
    if (nouveaux.some((e) => e.type === 'tampon')) {
      const app = document.querySelector('.lt-app');
      app?.classList.add('is-secousse');
      window.setTimeout(() => app?.classList.remove('is-secousse'), 450);
    }
  }, [vue]);

  if (effets.length === 0) return null;
  return (
    <div className="lt-effets" aria-hidden="true">
      {effets.map((e) =>
        e.type === 'flottant' ? (
          <span
            key={e.id}
            className={`lt-flottant ${e.gain ? 'lt-flottant--gain' : 'lt-flottant--perte'}`}
            style={{ left: e.x, top: e.y }}
          >
            {e.texte}
          </span>
        ) : e.type === 'tampon' ? (
          <div key={e.id} className="lt-tampon-ecran">
            <span>{e.texte}</span>
            <small>{e.nom} rejoint ton label</small>
          </div>
        ) : (
          <div key={e.id} className="lt-bandeau-exploit">
            <Confettis nombre={36} />
            <span className="lt-bandeau-exploit__icone">
              {e.icone === 'disque' ? (
                <Award size={34} />
              ) : e.icone === 'trophee' ? (
                <Trophy size={34} />
              ) : (
                <Crown size={34} />
              )}
            </span>
            <strong>{e.texte}</strong>
            <small>{e.sous}</small>
          </div>
        ),
      )}
    </div>
  );
}
