import { SCOUTING, SOURCES, fr } from '@tycoon/label-tycoon';
import type { ScoutSource, VueSuivi } from '@tycoon/label-tycoon';
import { Button } from '../../components/arcade/ui/Button';
import { Terme } from './Infobulle';
import { useLabel } from './LabelContext';

const eur = (cents: number): string => `${Math.round(cents / 100).toLocaleString('fr-FR')} €`;

const COMPETENCES: Record<string, string> = {
  plume: 'Plume',
  flow: 'Flow',
  voix: 'Voix',
  charisme: 'Charisme',
  scene: 'Scène',
};

/** Fourchette 0-100 : la barre colorée est la plage connue, jamais la valeur exacte. */
export function Fourchette({
  libelle,
  plage,
}: {
  libelle: string;
  plage: readonly [number, number];
}) {
  const [bas, haut] = plage;
  return (
    <div className="label-range" role="img" aria-label={`${libelle} : entre ${bas} et ${haut}`}>
      <span>{libelle}</span>
      <span className="label-range__track" aria-hidden="true">
        <span style={{ left: `${bas}%`, width: `${Math.max(2, haut - bas)}%` }} />
      </span>
      <span className="mono" aria-hidden="true">
        {bas}–{haut}
      </span>
    </div>
  );
}

/** Largeur moyenne des fourchettes d'un talent : plus c'est petit, mieux on le connaît. */
export const incertitude = (s: VueSuivi): number => {
  const plages = Object.values(s.fourchettes);
  if (plages.length === 0) return 100;
  return Math.round(plages.reduce((sum, [bas, haut]) => sum + (haut - bas), 0) / plages.length);
};

function Suivi({
  suivi,
  onNegocier,
}: {
  suivi: VueSuivi;
  onNegocier: (artisteId: number) => void;
}) {
  const { envoyer, vue } = useLabel();
  const essaiAbordable = (vue?.finances.tresorerie ?? 0) >= SCOUTING.trialCost;
  return (
    <li className="label-prospect">
      <header>
        <strong>{suivi.nom}</strong>{' '}
        <span>{fr.genres[suivi.genre as keyof typeof fr.genres] ?? suivi.genre}</span>
        <small>
          {' '}
          · {suivi.observations} sem. d’observation · incertitude moyenne ±
          {Math.round(incertitude(suivi) / 2)}
        </small>
      </header>
      <div className="label-prospect__ranges">
        {Object.entries(suivi.fourchettes).map(([cle, plage]) => (
          <Fourchette key={cle} libelle={COMPETENCES[cle] ?? cle} plage={plage} />
        ))}
      </div>
      <p className="label-prospect__hidden">
        {suivi.essai
          ? 'Attributs cachés révélés (en fourchette).'
          : 'Potentiel, éthique, ego, loyauté et polyvalence restent cachés.'}
      </p>
      <div className="label-prospect__actions">
        {suivi.essai ? null : (
          <Button
            type="button"
            tone="gold"
            disabled={!essaiAbordable}
            onClick={() =>
              void envoyer({
                type: 'action',
                action: { type: 'essai-studio', artisteId: suivi.id },
              })
            }
          >
            Essai en studio ({eur(SCOUTING.trialCost)})
          </Button>
        )}
        <Button type="button" tone="green" onClick={() => onNegocier(suivi.id)}>
          Négocier
        </Button>
        <Button
          type="button"
          tone="ghost"
          onClick={() =>
            void envoyer({
              type: 'action',
              action: { type: 'abandonner-suivi', artisteId: suivi.id },
            })
          }
        >
          Abandonner
        </Button>
      </div>
    </li>
  );
}

/** Repérage : lancer des sessions, suivre les talents trouvés, révéler leurs attributs cachés. */
export function Reperage({ onNegocier }: { onNegocier: (artisteId: number) => void }) {
  const { vue, envoyer } = useLabel();
  if (!vue) return null;
  const sources = Object.keys(SOURCES) as ScoutSource[];
  const plein = vue.suivis.length >= SCOUTING.maxFollowed;

  return (
    <section className="label-screen" aria-labelledby="rep-titre">
      <h2 id="rep-titre">Repérage</h2>
      <p>
        Tu ne vois jamais la valeur exacte d’un talent, seulement une{' '}
        <Terme id="fourchette">fourchette</Terme> qui se resserre avec le temps.
      </p>
      <h3>Sources</h3>
      <ul className="label-sources">
        {sources.map((id) => {
          const s = SOURCES[id];
          const abordable = vue.finances.tresorerie >= s.cost;
          return (
            <li key={id}>
              <strong>{fr.sourcesDeReperage[id]}</strong>
              <small>
                {s.count} talents · {s.cost === 0 ? 'gratuit' : eur(s.cost)} · précision ±{s.width}
              </small>
              <Button
                type="button"
                tone="gold"
                disabled={!abordable || plein}
                onClick={() =>
                  void envoyer({ type: 'action', action: { type: 'reperer', source: id } })
                }
              >
                Lancer une session
              </Button>
            </li>
          );
        })}
      </ul>
      {plein ? (
        <p className="label-warn">
          Tu suis déjà {SCOUTING.maxFollowed} talents : abandonnes-en avant d’en chercher d’autres.
        </p>
      ) : null}
      <h3>
        Talents suivis <span className="label-badge">{vue.suivis.length}</span>
      </h3>
      {vue.suivis.length === 0 ? (
        <p className="label-screen__soon">Aucun talent suivi. Lance une session de repérage.</p>
      ) : (
        <ul className="label-prospects">
          {vue.suivis.map((s) => (
            <Suivi key={s.id} suivi={s} onNegocier={onNegocier} />
          ))}
        </ul>
      )}
    </section>
  );
}
