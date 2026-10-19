import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Award,
  Bell,
  Crown,
  Flame,
  Inbox,
  type LucideIcon,
  Music,
  Trophy,
  UserMinus,
  UserPlus,
  X,
} from 'lucide-react';
import type { VueActu, VueJeu } from '@tycoon/label-tycoon';
import type { EcranId } from './ecrans';

/** Durée d'affichage d'une notification, et nombre maximal à l'écran. */
export const DUREE_NOTIFICATION = 6500;
export const NOTIFICATIONS_MAX = 3;

export interface Notification {
  id: string;
  titre: string;
  texte: string;
  ton: 'or' | 'info' | 'danger' | 'succes';
  Icone: LucideIcon;
  ecran: EcranId;
}

/** Icône et ton d'une actu selon son type. */
function habillage(kind: string): Pick<Notification, 'Icone' | 'ton'> {
  if (kind === 'certification') return { Icone: Award, ton: 'or' };
  if (kind === 'prix-remporte' || kind === 'label-de-l-annee') return { Icone: Trophy, ton: 'or' };
  if (kind === 'palier') return { Icone: Crown, ton: 'or' };
  if (kind === 'viral' || kind === 'entree-classement') return { Icone: Flame, ton: 'succes' };
  if (kind === 'sortie') return { Icone: Music, ton: 'info' };
  if (kind === 'artiste-signe' || kind === 'contrat-renouvele')
    return { Icone: UserPlus, ton: 'succes' };
  if (kind === 'artiste-parti' || kind === 'debauchage' || kind === 'fin-de-contrat')
    return { Icone: UserMinus, ton: 'danger' };
  if (
    kind.startsWith('alerte') ||
    kind.startsWith('amende') ||
    kind.startsWith('avertissement') ||
    kind === 'vague-piratage' ||
    kind === 'proces'
  )
    return { Icone: AlertTriangle, ton: 'danger' };
  return { Icone: Bell, ton: 'info' };
}

/** Nouvelles notifications depuis la dernière vue : actus importantes et décisions apparues. */
export function nouvellesNotifications(
  avant: { actu: number; decisions: ReadonlySet<number> },
  vue: Pick<VueJeu, 'fil' | 'decisions'>,
): Notification[] {
  const out: Notification[] = [];
  for (const d of vue.decisions)
    if (!avant.decisions.has(d.instanceId))
      out.push({
        id: `decision-${d.instanceId}`,
        titre: 'Décision à prendre',
        texte: d.titre,
        ton: 'info',
        Icone: Inbox,
        ecran: 'boite',
      });
  const actus = vue.fil.filter((a: VueActu) => a.id > avant.actu && a.importance >= 2);
  for (const a of actus)
    out.push({
      id: `actu-${a.id}`,
      titre: a.titre,
      texte: a.texte,
      ecran: 'fil',
      ...habillage(a.kind),
    });
  return out;
}

/**
 * Notifications qui surgissent pendant la partie : certifications, signatures, alertes, décisions.
 * Elles disparaissent seules, se ferment d'un clic, et mènent à l'écran concerné.
 */
export function Notifications({
  vue,
  allerA,
}: {
  vue: Pick<VueJeu, 'fil' | 'decisions'>;
  allerA: (ecran: EcranId) => void;
}) {
  const [liste, setListe] = useState<Notification[]>([]);
  // Au chargement d'une partie, on ne rejoue pas tout l'historique : seules les nouveautés comptent.
  const vu = useRef({
    actu: vue.fil.reduce((m, a) => Math.max(m, a.id), 0),
    decisions: new Set(vue.decisions.map((d) => d.instanceId)) as ReadonlySet<number>,
  });

  useEffect(() => {
    const nouvelles = nouvellesNotifications(vu.current, vue);
    vu.current = {
      actu: vue.fil.reduce((m, a) => Math.max(m, a.id), vu.current.actu),
      decisions: new Set(vue.decisions.map((d) => d.instanceId)),
    };
    if (nouvelles.length === 0) return;
    setListe((l) => [...nouvelles.reverse(), ...l].slice(0, NOTIFICATIONS_MAX));
  }, [vue]);

  const fermer = (id: string) => setListe((l) => l.filter((n) => n.id !== id));

  return (
    <div className="lt-notifs" role="region" aria-label="Notifications" aria-live="polite">
      {liste.map((n) => (
        <Toast key={n.id} notif={n} onFermer={() => fermer(n.id)} allerA={allerA} />
      ))}
    </div>
  );
}

function Toast({
  notif,
  onFermer,
  allerA,
}: {
  notif: Notification;
  onFermer: () => void;
  allerA: (ecran: EcranId) => void;
}) {
  // Le minuteur ne repart pas à chaque rafraîchissement de la vue (le temps de jeu en provoque beaucoup).
  const fermer = useRef(onFermer);
  fermer.current = onFermer;
  useEffect(() => {
    const t = window.setTimeout(() => fermer.current(), DUREE_NOTIFICATION);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <div className={`lt-toast lt-toast--${notif.ton}`}>
      <button
        type="button"
        className="lt-toast__corps"
        onClick={() => {
          allerA(notif.ecran);
          onFermer();
        }}
      >
        <span className="lt-toast__icone" aria-hidden="true">
          <notif.Icone size={22} strokeWidth={2.5} />
        </span>
        <span>
          <strong>{notif.titre}</strong>
          <span className="lt-toast__texte">{notif.texte}</span>
        </span>
      </button>
      <button
        type="button"
        className="lt-toast__fermer"
        aria-label="Fermer la notification"
        onClick={onFermer}
      >
        <X aria-hidden="true" size={18} />
      </button>
      <span className="lt-toast__minuteur" aria-hidden="true" />
    </div>
  );
}
