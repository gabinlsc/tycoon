import { useState } from 'react';
import { Check, Crown, Gem, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '../../components/arcade/ui/Button';
import {
  type CadreCarte,
  OFFRES,
  type Offre,
  type OffreId,
  type ThemeMonde,
  choisirOffre,
  definirAbonnement,
  JEU_BOUTIQUE,
  droitsDe,
  offreDe,
  prixTexte,
  useAbonnement,
} from '../../lib/pass';
import { useAchats } from '../../lib/boutique';
import { Panneau } from './Visuels';

const ICONES: Record<OffreId, typeof Crown> = { gratuit: Sparkles, pro: Gem, legende: Crown };
const NOMS_THEMES: Record<ThemeMonde, string> = {
  saison: 'Saisons',
  aube: 'Aube',
  neon: 'Néon',
};
const NOMS_CADRES: Record<CadreCarte, string> = {
  classique: 'Classique',
  chrome: 'Chrome',
  diamant: 'Diamant',
};

function CarteOffre({
  offre,
  actuelle,
  choisir,
}: {
  offre: Offre;
  actuelle: boolean;
  choisir: () => void;
}) {
  const Icone = ICONES[offre.id];
  return (
    <li className={`lt-offre lt-offre--${offre.id}${actuelle ? ' is-actuelle' : ''}`}>
      {offre.id === 'legende' ? <span className="lt-offre__ruban">Le plus complet</span> : null}
      <span className="lt-offre__icone" aria-hidden="true">
        <Icone size={34} strokeWidth={2.2} />
      </span>
      <h3>{offre.nom}</h3>
      <p className="lt-offre__prix">
        <strong>{prixTexte(offre.prixMensuel)}</strong>
        {offre.prixMensuel > 0 ? <small> / mois</small> : null}
      </p>
      <p className="lt-offre__accroche">{offre.accroche}</p>
      <ul>
        {offre.avantages.map((a) => (
          <li key={a}>
            <Check aria-hidden="true" size={16} /> {a}
          </li>
        ))}
      </ul>
      <Button
        type="button"
        tone={actuelle ? 'ghost' : 'gold'}
        disabled={actuelle}
        onClick={choisir}
        aria-label={actuelle ? `Offre ${offre.nom} active` : `Choisir l’offre ${offre.nom}`}
      >
        {actuelle
          ? 'Offre active'
          : offre.prixMensuel === 0
            ? 'Revenir au gratuit'
            : 'Essayer (démo)'}
      </Button>
    </li>
  );
}

/** Abonnement fictif : offres, activation locale sans paiement, réglage des avantages débloqués. */
export function Abonnement() {
  const etat = useAbonnement();
  const droits = droitsDe(etat.offre, useAchats(JEU_BOUTIQUE));
  const [confirmation, setConfirmation] = useState<OffreId | null>(null);

  const demander = (id: OffreId) => {
    if (id === 'gratuit') choisirOffre('gratuit');
    else setConfirmation(id);
  };

  return (
    <section className="label-screen" aria-labelledby="abo-titre">
      <h2 id="abo-titre">Abonnement</h2>
      <p className="lt-puces-info">
        <span className="lt-chip lt-chip--bon">
          <ShieldCheck aria-hidden="true" size={14} /> Démonstration : aucun paiement, aucune carte
          demandée
        </span>
        <a className="lt-chip" href="/#pass">
          Pass Tycoon : valable dans les six jeux
        </a>
      </p>
      <ul className="lt-offres">
        {OFFRES.map((o) => (
          <CarteOffre
            key={o.id}
            offre={o}
            actuelle={o.id === etat.offre}
            choisir={() => demander(o.id)}
          />
        ))}
      </ul>

      <Panneau titre="Tes avantages" Icone={Gem} ton="purple" id="abo-avantages">
        <fieldset className="lt-choix">
          <legend>Thème du monde</legend>
          {droits.themes
            .concat((['aube', 'neon'] as const).filter((t) => !droits.themes.includes(t)))
            .map((t) => {
              const permis = droits.themes.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  className={`lt-choix__carte${etat.theme === t ? ' is-actif' : ''}`}
                  aria-pressed={etat.theme === t}
                  disabled={!permis}
                  onClick={() => definirAbonnement({ theme: t })}
                >
                  <strong>{NOMS_THEMES[t]}</strong>
                  <small>{permis ? 'Disponible' : 'Avec Pro'}</small>
                </button>
              );
            })}
        </fieldset>
        <fieldset className="lt-choix">
          <legend>Cadre des cartes</legend>
          {(['classique', 'chrome', 'diamant'] as const).map((c) => {
            const permis = droits.cadres.includes(c);
            return (
              <button
                key={c}
                type="button"
                className={`lt-choix__carte${etat.cadre === c ? ' is-actif' : ''}`}
                aria-pressed={etat.cadre === c}
                disabled={!permis}
                onClick={() => definirAbonnement({ cadre: c })}
              >
                <strong>{NOMS_CADRES[c]}</strong>
                <small>
                  {permis ? 'Disponible' : c === 'chrome' ? 'Avec Pro' : 'Avec Légende'}
                </small>
              </button>
            );
          })}
        </fieldset>
      </Panneau>

      {confirmation ? (
        <div
          className="lt-pack"
          role="dialog"
          aria-modal="true"
          aria-label="Confirmer l’abonnement (démonstration)"
        >
          <div className="lt-pack__scene">
            <p className="lt-cer__surtitre">Démonstration</p>
            <h2 className="lt-cer__titre">Offre {offreDe(confirmation).nom}</h2>
            <p className="lt-cer__sous">
              {prixTexte(offreDe(confirmation).prixMensuel)} par mois,{' '}
              <strong>sans aucun débit</strong> : l’abonnement n’existe que dans ce navigateur.
            </p>
            <div className="lt-pack__actions">
              <button
                type="button"
                className="lt-cer__passer"
                onClick={() => setConfirmation(null)}
              >
                Annuler
              </button>
              <button
                type="button"
                className="lt-cer__go"
                onClick={() => {
                  choisirOffre(confirmation);
                  setConfirmation(null);
                }}
              >
                Activer l’offre {offreDe(confirmation).nom}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
