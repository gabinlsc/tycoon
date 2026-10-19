import { SCOUTING, SOURCES, fr } from '@tycoon/label-tycoon';
import type { ScoutSource, VueSuivi } from '@tycoon/label-tycoon';
import {
  Coins,
  Crosshair,
  Eye,
  Mail,
  Mic2,
  Radar,
  Smartphone,
  Swords,
  type LucideIcon,
  Users,
} from 'lucide-react';
import { Button } from '../../components/arcade/ui/Button';
import { CarteArtiste } from './CarteArtiste';
import { Pack, genreNomDe, statsDuSuivi } from './Pack';
import { rareteDe, scoreSuivi } from './rarete';
import { useState } from 'react';
import { EtatVide } from './EtatVide';
import { Terme } from './Infobulle';
import { useLabel } from './LabelContext';

const eur = (cents: number): string => `${Math.round(cents / 100).toLocaleString('fr-FR')} €`;

const ICONES_SOURCES: Readonly<Record<ScoutSource, LucideIcon>> = {
  'open-mic': Mic2,
  plateforme: Smartphone,
  battle: Swords,
  candidature: Mail,
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
    <li className="label-prospect lt-prospect-carte">
      <CarteArtiste
        nom={suivi.nom}
        genre={suivi.genre}
        genreNom={genreNomDe(suivi.genre)}
        rarete={rareteDe(scoreSuivi(suivi))}
        stats={statsDuSuivi(suivi)}
      />
      <div className="lt-prospect-carte__infos">
        <strong className="lt-prospect__nom">{suivi.nom}</strong>
        <small className="lt-prospect__meta">
          <Eye aria-hidden="true" size={14} /> {suivi.observations} sem. d’observation · incertitude
          ±{Math.round(incertitude(suivi) / 2)}
        </small>
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
      </div>
    </li>
  );
}

/** Repérage : lancer des sessions, suivre les talents trouvés, révéler leurs attributs cachés. */
export function Reperage({ onNegocier }: { onNegocier: (artisteId: number) => void }) {
  const { vue, envoyer } = useLabel();
  const [pack, setPack] = useState<{ source: string; talents: VueSuivi[] } | null>(null);
  if (!vue) return null;
  const sources = Object.keys(SOURCES) as ScoutSource[];
  const lancer = async (id: ScoutSource) => {
    const avant = new Set(vue.suivis.map((x) => x.id));
    const r = await envoyer({ type: 'action', action: { type: 'reperer', source: id } });
    if (r.type === 'vue')
      setPack({
        source: fr.sourcesDeReperage[id],
        talents: r.vue.suivis.filter((x) => !avant.has(x.id)),
      });
  };
  const plein = vue.suivis.length >= SCOUTING.maxFollowed;

  return (
    <section className="label-screen" aria-labelledby="rep-titre">
      <h2 id="rep-titre">Repérage</h2>
      <p>
        Tu ne vois jamais la valeur exacte d’un talent, seulement une{' '}
        <Terme id="fourchette">fourchette</Terme> qui se resserre avec le temps.
      </p>
      <h3>Sources</h3>
      <ul className="label-sources lt-sources">
        {sources.map((id) => {
          const s = SOURCES[id];
          const abordable = vue.finances.tresorerie >= s.cost;
          const Icone = ICONES_SOURCES[id];
          return (
            <li key={id} className="lt-source">
              <span className="lt-source__icone" aria-hidden="true">
                <Icone size={26} strokeWidth={2.4} />
              </span>
              <strong>{fr.sourcesDeReperage[id]}</strong>
              <span className="lt-source__chips">
                <span className="lt-chip">
                  <Users aria-hidden="true" size={14} /> {s.count} talents
                </span>
                <span className="lt-chip">
                  <Coins aria-hidden="true" size={14} /> {s.cost === 0 ? 'gratuit' : eur(s.cost)}
                </span>
                <span className="lt-chip">
                  <Crosshair aria-hidden="true" size={14} /> ±{s.width}
                </span>
              </span>
              <Button
                type="button"
                tone="gold"
                disabled={!abordable || plein}
                onClick={() => void lancer(id)}
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
        <EtatVide
          Icone={Radar}
          titre="Ton carnet d’adresses est vide"
          texte="Aucun talent suivi. Lance une session de repérage."
        />
      ) : (
        <ul className="label-prospects">
          {vue.suivis.map((s) => (
            <Suivi key={s.id} suivi={s} onNegocier={onNegocier} />
          ))}
        </ul>
      )}
      {pack ? (
        <Pack source={pack.source} talents={pack.talents} fermer={() => setPack(null)} />
      ) : null}
    </section>
  );
}
