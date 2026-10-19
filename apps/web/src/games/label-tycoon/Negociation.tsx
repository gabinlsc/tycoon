import { useEffect, useRef, useState } from 'react';
import { NEGOTIATION, type Reaction } from '@tycoon/label-tycoon';
import { Button } from '../../components/arcade/ui/Button';
import { Avatar } from './avatar';
import { Terme } from './Infobulle';
import { useLabel } from './LabelContext';
import {
  LIBELLE_REACTION,
  LIBELLE_VERDICT,
  NIVEAUX,
  OFFRE_DE_DEPART,
  type Offre,
  clausesDepuis,
  offreDepuis,
} from './negociationOffre';

const eur = (cents: number): string => `${Math.round(cents / 100).toLocaleString('fr-FR')} €`;

/** Jauge de réaction à quatre niveaux, mise à jour en direct. */
export function JaugeReaction({ reaction }: { reaction: Reaction | null }) {
  const actif = reaction ? NIVEAUX.indexOf(reaction) : -1;
  return (
    <div
      className="label-gauge"
      role="img"
      aria-label={reaction ? `Réaction : ${LIBELLE_REACTION[reaction]}` : 'Réaction : en attente'}
    >
      {NIVEAUX.map((n, i) => (
        <span
          key={n}
          className={`label-gauge__seg label-gauge__seg--${n}`}
          data-on={i <= actif ? '' : undefined}
          aria-hidden="true"
        >
          {LIBELLE_REACTION[n]}
        </span>
      ))}
    </div>
  );
}

/** Tampon encreur « SIGNÉ » (animation coupée en `prefers-reduced-motion`). */
export function Tampon({ texte = 'SIGNÉ' }: { texte?: string }) {
  return (
    <div className="label-stamp" role="status">
      {texte}
    </div>
  );
}

function Curseur({
  libelle,
  valeur,
  min,
  max,
  pas,
  unite,
  onChange,
  terme,
}: {
  libelle: string;
  valeur: number;
  min: number;
  max: number;
  pas: number;
  unite: string;
  onChange: (v: number) => void;
  terme?: string;
}) {
  return (
    <label className="label-field">
      <span>
        {terme ? <Terme id={terme}>{libelle}</Terme> : libelle} :{' '}
        <strong className="mono">
          {valeur.toLocaleString('fr-FR')} {unite}
        </strong>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={pas}
        value={valeur}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

/** Négociation avec un talent suivi : constructeur de clauses, jauge en direct, contre-propositions, tampon. */
export function Negociation({
  artisteId,
  retour,
  renouvellement = false,
}: {
  artisteId: number;
  retour: () => void;
  /** Prolonger le contrat d'un artiste déjà signé plutôt que signer un talent suivi. */
  renouvellement?: boolean;
}) {
  const { vue, envoyer } = useLabel();
  const contratActuel = vue?.roster.find((a) => a.id === artisteId)?.contrat ?? null;
  const [offre, setOffre] = useState<Offre>(() =>
    renouvellement && contratActuel
      ? {
          ...OFFRE_DE_DEPART,
          royaltiesPct: Math.round(contratActuel.royaltiesBps / 100),
          annees: 3,
        }
      : OFFRE_DE_DEPART,
  );
  const [reaction, setReaction] = useState<Reaction | null>(null);
  const [verdict, setVerdict] = useState<keyof typeof LIBELLE_VERDICT | null>(null);
  const [signe, setSigne] = useState(false);
  const cle = useRef(0);

  const suivi = vue?.suivis.find((s) => s.id === artisteId) ?? null;
  const nom = suivi?.nom ?? vue?.roster.find((a) => a.id === artisteId)?.nom ?? 'ce talent';

  useEffect(() => {
    if (signe) return;
    const numero = (cle.current += 1);
    void envoyer({ type: 'evaluer-offre', artisteId, clauses: clausesDepuis(offre) }).then((r) => {
      if (numero !== cle.current || r.type !== 'reaction') return;
      setReaction(r.reaction);
      setVerdict(r.verdict);
    });
  }, [offre, artisteId, envoyer, signe]);

  if (!vue) return null;
  const n = suivi?.negociation ?? null;
  const restantes = n ? Math.max(0, NEGOTIATION.maxCounters - n.contres) : NEGOTIATION.maxCounters;
  const maj = <K extends keyof Offre>(cleOffre: K, valeur: Offre[K]) =>
    setOffre((o) => ({ ...o, [cleOffre]: valeur }));

  const proposer = async () => {
    if (renouvellement) {
      const r = await envoyer({
        type: 'action',
        action: { type: 'renegocier', artisteId, clauses: clausesDepuis(offre) },
      });
      if (r.type === 'vue') setSigne(true);
      return;
    }
    const r = await envoyer({
      type: 'action',
      action: { type: 'proposer', artisteId, clauses: clausesDepuis(offre) },
    });
    if (r.type === 'vue' && r.vue.roster.some((a) => a.id === artisteId)) setSigne(true);
  };
  const genre = suivi?.genre ?? vue.roster.find((a) => a.id === artisteId)?.genre;

  return (
    <section className="label-screen label-nego" aria-labelledby="nego-titre">
      <div className="lt-nego__tete">
        <Button type="button" tone="ghost" onClick={retour}>
          ← Retour
        </Button>
        {genre ? <Avatar nom={nom} genre={genre} taille="lg" /> : null}
        <h2 id="nego-titre">
          {renouvellement ? `Prolonger le contrat de ${nom}` : `Négocier avec ${nom}`}
        </h2>
      </div>
      {signe ? (
        <>
          <Tampon texte={renouvellement ? 'PROLONGÉ' : 'SIGNÉ'} />
          <p>
            {renouvellement
              ? `Contrat prolongé : ${nom} reste chez toi.`
              : `Contrat signé : ${nom} rejoint ton roster.`}
          </p>
          <Button type="button" tone="green" onClick={retour}>
            Continuer
          </Button>
        </>
      ) : n?.rompue ? (
        <p className="label-warn" role="alert">
          {nom} ne veut plus négocier avec toi. Une offre insultante coûte de l’
          <Terme id="affinite">affinité</Terme> pour toute la partie.
        </p>
      ) : (
        <>
          <div className="lt-nego__humeur">
            <JaugeReaction reaction={reaction} />
            {verdict ? <p role="status">{LIBELLE_VERDICT[verdict]}</p> : null}
            {renouvellement && contratActuel ? (
              <p className="lt-nego__repere">
                📄 Contrat actuel : fin à la semaine {contratActuel.echeance}, l’artiste touche{' '}
                {Math.round(contratActuel.royaltiesBps / 100)} % des royalties. Pour rester, un
                artiste de sa notoriété attend une <Terme id="avance">avance</Terme> autour de{' '}
                {eur(vue.roster.find((a) => a.id === artisteId)?.avanceIndicative ?? 0)}.
              </p>
            ) : null}
            {suivi ? (
              <p className="lt-nego__repere">
                💡 Repère : un talent de cette notoriété attend une{' '}
                <Terme id="avance">avance</Terme> autour de {eur(suivi.avanceIndicative)}.
              </p>
            ) : null}
          </div>
          <div className="label-nego__form">
            <Curseur
              libelle="Avance"
              terme="avance"
              valeur={offre.avanceEuros}
              min={0}
              max={50000}
              pas={250}
              unite="€"
              onChange={(v) => maj('avanceEuros', v)}
            />
            <Curseur
              libelle="Royalties de l’artiste"
              terme="royalties"
              valeur={offre.royaltiesPct}
              min={10}
              max={90}
              pas={1}
              unite="%"
              onChange={(v) => maj('royaltiesPct', v)}
            />
            <Curseur
              libelle="Durée"
              valeur={offre.annees}
              min={1}
              max={6}
              pas={1}
              unite="an(s)"
              onChange={(v) => maj('annees', v)}
            />
            <Curseur
              libelle="Part 360 du label"
              terme="contrat-360"
              valeur={offre.part360Pct}
              min={0}
              max={50}
              pas={1}
              unite="%"
              onChange={(v) => maj('part360Pct', v)}
            />
            <Curseur
              libelle="Clause de rachat"
              valeur={offre.rachatEuros}
              min={0}
              max={100000}
              pas={1000}
              unite="€"
              onChange={(v) => maj('rachatEuros', v)}
            />
            <label className="label-field label-field--check">
              <input
                type="checkbox"
                checked={offre.exclusivite}
                onChange={(e) => maj('exclusivite', e.target.checked)}
              />
              <Terme id="exclusivite">Exclusivité</Terme>
            </label>
          </div>
          {n?.contre ? (
            <div className="label-nego__counter">
              <p>
                <strong>Contre-proposition de {nom}</strong> — avance {eur(n.contre.avance)},
                royalties {Math.round(n.contre.royaltiesArtisteBps / 100)} %, {n.contre.dureeAnnees}{' '}
                an(s)
                {n.contre.exclusivite ? ', exclusivité' : ''}.
              </p>
              <Button
                type="button"
                tone="gold"
                onClick={() => setOffre(offreDepuis(n.contre as NonNullable<typeof n.contre>))}
              >
                Reprendre ses conditions
              </Button>
            </div>
          ) : null}
          {renouvellement ? null : (
            <p className="label-screen__soon">
              {restantes} contre-proposition(s) possible(s) encore.
            </p>
          )}
          <Button
            type="button"
            tone="green"
            size="lg"
            className="lt-nego__go"
            onClick={() => void proposer()}
          >
            {renouvellement ? 'Proposer la prolongation' : 'Proposer ce contrat'}
          </Button>
        </>
      )}
    </section>
  );
}
