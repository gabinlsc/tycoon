import { useState } from 'react';
import type { VueActu, VueDecision } from '@tycoon/label-tycoon';
import { BellRing, Hourglass, Inbox, Mail } from 'lucide-react';
import { Button } from '../../components/arcade/ui/Button';
import { useLabel } from './LabelContext';
import { Panneau } from './Visuels';

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
    <li className={`label-decision lt-decision${restantes === 0 ? ' is-urgent' : ''}`}>
      <header className="lt-decision__tete">
        <span className="lt-decision__icone" aria-hidden="true">
          <Mail size={22} strokeWidth={2.4} />
        </span>
        <h4>{decision.titre}</h4>
        <span className="lt-chip lt-decision__delai">
          <Hourglass aria-hidden="true" size={14} />
          {restantes === 0 ? 'Maintenant' : `${restantes} sem.`}
        </span>
      </header>
      <p>{decision.texte}</p>
      {parDefaut ? (
        <p className="label-decision__deadline">
          {restantes === 0 ? 'À trancher maintenant. ' : ''}Si tu ne réponds pas : «{' '}
          {parDefaut.libelle} ».
        </p>
      ) : null}
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
      <Panneau titre="Décisions" Icone={Inbox} ton="gold" id="inbox-decisions">
        {vue.decisions.length === 0 ? (
          <p className="lt-rien">Aucune décision en attente.</p>
        ) : (
          <ul className="label-decisions lt-decisions">
            {vue.decisions.map((d) => (
              <Decision key={d.instanceId} decision={d} semaine={vue.semaine} />
            ))}
          </ul>
        )}
      </Panneau>
      <Panneau titre="Messages" Icone={BellRing} ton="blue" id="inbox-notifs">
        {nouvelles.length > 0 ? (
          <p>
            <span className="label-badge">{nouvelles.length}</span> à lire
          </p>
        ) : null}
        {vue.fil.length === 0 ? (
          <p className="lt-rien">Rien pour l’instant.</p>
        ) : (
          <ul className="label-notifs lt-recus">
            {vue.fil.slice(0, 15).map((a) => (
              <li
                key={a.id}
                className={a.id > dernierLu && a.importance >= 2 ? 'is-new' : undefined}
              >
                <strong>{a.titre}</strong> <span className="lt-chip">sem. {a.semaine}</span>
                <p>{a.texte}</p>
              </li>
            ))}
          </ul>
        )}
        {nouvelles.length > 0 ? (
          <Button type="button" tone="ghost" onClick={() => onLu(plusRecent)}>
            Tout marquer comme lu
          </Button>
        ) : null}
      </Panneau>
    </section>
  );
}
