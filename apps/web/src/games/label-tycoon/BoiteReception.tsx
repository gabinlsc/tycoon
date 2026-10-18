import { useState } from 'react';
import type { VueActu, VueDecision } from '@tycoon/label-tycoon';
import { Button } from '../../components/arcade/ui/Button';
import { useLabel } from './LabelContext';

/** Semaines restantes avant l'échéance d'une décision (jamais négatif). */
export const semainesRestantes = (decision: VueDecision, semaine: number): number =>
  Math.max(0, decision.echeance - semaine);

/** Actus à signaler : importantes (2 et plus) et pas encore lues. */
export const notificationsNonLues = (fil: readonly VueActu[], dernierLu: number): VueActu[] =>
  fil.filter((a) => a.importance >= 2 && a.id > dernierLu);

function Decision({ decision, semaine }: { decision: VueDecision; semaine: number }) {
  const { envoyer } = useLabel();
  const [envoi, setEnvoi] = useState(false);
  const restantes = semainesRestantes(decision, semaine);
  const parDefaut = decision.choix.find((c) => c.id === decision.parDefaut);

  const choisir = async (choiceId: string) => {
    setEnvoi(true);
    await envoyer({
      type: 'action',
      action: { type: 'resoudre-evenement', instanceId: decision.instanceId, choiceId },
    });
    setEnvoi(false);
  };

  return (
    <li className="label-decision">
      <h4>{decision.titre}</h4>
      <p>{decision.texte}</p>
      <p className="label-decision__deadline">
        {restantes === 0
          ? 'À trancher maintenant.'
          : `Il reste ${restantes} semaine${restantes > 1 ? 's' : ''}.`}
        {parDefaut ? <> Si tu ne réponds pas : « {parDefaut.libelle} ».</> : null}
      </p>
      <div className="label-decision__choices">
        {decision.choix.map((c) => (
          <Button
            key={c.id}
            type="button"
            tone={c.id === decision.parDefaut ? 'ghost' : 'gold'}
            disabled={!c.disponible || envoi}
            onClick={() => void choisir(c.id)}
          >
            {c.libelle}
          </Button>
        ))}
      </div>
    </li>
  );
}

/** Boîte de réception : décisions avec échéance, puis notifications en lecture seule. */
export function BoiteReception({
  dernierLu,
  onLu,
}: {
  dernierLu: number;
  onLu: (id: number) => void;
}) {
  const { vue } = useLabel();
  if (!vue) return null;
  const nouvelles = notificationsNonLues(vue.fil, dernierLu);
  const plusRecent = vue.fil[0]?.id ?? dernierLu;

  return (
    <section className="label-screen label-inbox" aria-labelledby="inbox-titre">
      <h2 id="inbox-titre">Boîte de réception</h2>
      <h3>Décisions</h3>
      {vue.decisions.length === 0 ? (
        <p className="label-screen__soon">Aucune décision en attente.</p>
      ) : (
        <ul className="label-decisions">
          {vue.decisions.map((d) => (
            <Decision key={d.instanceId} decision={d} semaine={vue.semaine} />
          ))}
        </ul>
      )}
      <h3>
        Notifications <span className="label-badge">{nouvelles.length}</span>
      </h3>
      {vue.fil.length === 0 ? (
        <p className="label-screen__soon">Rien pour l’instant.</p>
      ) : (
        <ul className="label-notifs">
          {vue.fil.slice(0, 15).map((a) => (
            <li key={a.id} className={a.id > dernierLu && a.importance >= 2 ? 'is-new' : undefined}>
              <strong>{a.titre}</strong> <span className="mono">sem. {a.semaine}</span>
              <br />
              {a.texte}
            </li>
          ))}
        </ul>
      )}
      {nouvelles.length > 0 ? (
        <Button type="button" tone="ghost" onClick={() => onLu(plusRecent)}>
          Tout marquer comme lu
        </Button>
      ) : null}
    </section>
  );
}
