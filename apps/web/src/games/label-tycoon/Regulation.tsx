import type { LabelAction } from '@tycoon/label-tycoon';
import { Button } from '../../components/arcade/ui/Button';
import { useLabel } from './LabelContext';

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
        <p className="label-screen__soon">
          Les autorités, le piratage et les plateformes ne s’intéressent à toi qu’à partir du palier
          Groupe. Tu es actuellement un {vue.label.palier}.
        </p>
      </section>
    );

  return (
    <section className="label-screen" aria-labelledby="reg-titre">
      <h2 id="reg-titre">Régulation</h2>

      <h3>Concentration</h3>
      <p>
        Ta part de marché : <strong className="mono">{r.partDeMarche} %</strong> (seuil de
        surveillance : {r.seuil} %). Surveillance :{' '}
        <strong className="mono">{r.surveillance} / 100</strong>
        {r.averti ? ' — avertissement reçu, une amende approche' : ''}. Amendes payées :{' '}
        {eur(r.amendes)}.
      </p>
      <progress value={r.surveillance} max={100} aria-label="Surveillance des autorités" />
      <p>
        <Button
          type="button"
          disabled={!r.plaidoyerPossible || vue.finances.tresorerie < r.coutPlaidoyer}
          onClick={() => action({ type: 'plaider' })}
        >
          Plaider auprès des autorités ({eur(r.coutPlaidoyer)})
        </Button>
        {r.plaidoyerPossible ? '' : ' Tu as déjà plaidé récemment.'}
      </p>

      <h3>Piratage</h3>
      {r.piratage ? (
        <p>
          <strong>Vague en cours :</strong> {r.piratage.severite} % des écoutes perdues, encore{' '}
          {r.piratage.restantes} semaine(s).
        </p>
      ) : (
        <p>Aucune vague de piratage en ce moment.</p>
      )}
      <p>
        Veille anti-piratage : niveau {r.veille} / {r.veilleMax} ({eur(r.veille * r.coutVeille)} par
        semaine).
      </p>
      <div>
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

      <h3>Plateformes</h3>
      {r.renegociation ? (
        <>
          <p>
            Les plateformes baissent leur tarif de <strong>{r.renegociation.baisse} %</strong>,{' '}
            {r.renegociation.enCours
              ? `en vigueur jusqu’à la semaine ${r.renegociation.fin}.`
              : `à partir de la semaine ${r.renegociation.debut}.`}
          </p>
          {r.renegociation.resistee ? (
            <p>Tu as déjà tenté de résister à cette renégociation.</p>
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
        <p>Aucune renégociation n’est annoncée.</p>
      )}
    </section>
  );
}
