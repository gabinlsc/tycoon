import type { LabelAction } from '@tycoon/label-tycoon';
import { Eye, Gavel, Percent, ShieldAlert, Tv } from 'lucide-react';
import { Button } from '../../components/arcade/ui/Button';
import { useLabel } from './LabelContext';
import { Barre, Panneau, Tuile, Tuiles } from './Visuels';

const eur = (cents: number): string => `${Math.round(cents / 100).toLocaleString('fr-FR')} €`;

/** Régulation : surveillance de la concurrence, piratage et tarifs des plateformes. */
export function Regulation() {
  const { vue, envoyer } = useLabel();
  if (!vue) return null;
  const r = vue.regulation;
  const action = (a: LabelAction) => void envoyer({ type: 'action', action: a });

  if (!r.actif)
    return (
      <section className="label-screen" aria-labelledby="reg-titre">
        <h2 id="reg-titre">Régulation</h2>
        <p className="lt-rien">
          Les autorités, le piratage et les plateformes ne s’intéressent à toi qu’à partir du palier
          Groupe. Tu es actuellement un {vue.label.palier}.
        </p>
      </section>
    );

  return (
    <section className="label-screen" aria-labelledby="reg-titre">
      <h2 id="reg-titre">Régulation</h2>

      <Panneau titre="Concentration" Icone={Gavel} ton="red" id="reg-conc">
        <Tuiles label="Concentration">
          <Tuile
            Icone={Percent}
            valeur={`${r.partDeMarche} %`}
            libelle={`part de marché (seuil ${r.seuil} %)`}
            ton="purple"
          />
          <Tuile
            Icone={Eye}
            valeur={`${r.surveillance} / 100`}
            libelle="Surveillance"
            ton={r.surveillance >= 70 ? 'red' : 'orange'}
            alerte={r.surveillance >= 70}
          />
          <Tuile Icone={Gavel} valeur={eur(r.amendes)} libelle="amendes payées" ton="gold" />
        </Tuiles>
        <progress value={r.surveillance} max={100} aria-label="Surveillance des autorités" />
        {r.averti ? <p className="label-warn">Avertissement reçu : une amende approche.</p> : null}
        <p className="lt-puces-info">
          <Button
            type="button"
            disabled={!r.plaidoyerPossible || vue.finances.tresorerie < r.coutPlaidoyer}
            onClick={() => action({ type: 'plaider' })}
          >
            Plaider auprès des autorités ({eur(r.coutPlaidoyer)})
          </Button>
          {r.plaidoyerPossible ? null : (
            <span className="lt-chip">Tu as déjà plaidé récemment.</span>
          )}
        </p>
      </Panneau>

      <Panneau titre="Piratage" Icone={ShieldAlert} ton="orange" id="reg-pirate">
        {r.piratage ? (
          <p className="label-warn">
            <strong>Vague en cours :</strong> {r.piratage.severite} % des écoutes perdues, encore{' '}
            {r.piratage.restantes} semaine(s).
          </p>
        ) : (
          <p className="lt-rien">Aucune vague de piratage en ce moment.</p>
        )}
        <Barre libelle="Veille" valeur={r.veille} max={r.veilleMax} ton="teal" />
        <p className="lt-sous-titre">
          Veille anti-piratage : niveau {r.veille} / {r.veilleMax} ({eur(r.veille * r.coutVeille)}{' '}
          par semaine).
        </p>
        <div className="lt-puces-info">
          {Array.from({ length: r.veilleMax + 1 }, (_, n) => (
            <Button
              key={n}
              type="button"
              {...(n === r.veille ? { tone: 'gold' as const } : {})}
              aria-pressed={n === r.veille}
              onClick={() => action({ type: 'regler-veille', niveau: n })}
            >
              Veille niveau {n}
            </Button>
          ))}
        </div>
      </Panneau>

      <Panneau titre="Plateformes" Icone={Tv} ton="blue" id="reg-plat">
        {r.renegociation ? (
          <>
            <p>
              Les plateformes baissent leur tarif de <strong>{r.renegociation.baisse} %</strong>,{' '}
              {r.renegociation.enCours
                ? `en vigueur jusqu’à la semaine ${r.renegociation.fin}.`
                : `à partir de la semaine ${r.renegociation.debut}.`}
            </p>
            {r.renegociation.resistee ? (
              <p className="lt-rien">Tu as déjà tenté de résister à cette renégociation.</p>
            ) : r.renegociation.enCours ? null : (
              <Button
                type="button"
                disabled={vue.finances.tresorerie < r.coutResistance}
                onClick={() => action({ type: 'resister-plateformes' })}
              >
                Résister ({eur(r.coutResistance)}, {r.renegociation.chance} % de chances)
              </Button>
            )}
          </>
        ) : (
          <p className="lt-rien">Aucune renégociation n’est annoncée.</p>
        )}
      </Panneau>
    </section>
  );
}
