import type { LucideIcon } from 'lucide-react';
import { Button } from '../../components/arcade/ui/Button';

/** Écran vide qui explique quoi faire, avec un gros bouton pour le faire. */
export function EtatVide({
  Icone,
  titre,
  texte,
  action,
  onAction,
}: {
  Icone: LucideIcon;
  titre: string;
  texte: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="lt-vide">
      <span className="lt-vide__icone" aria-hidden="true">
        <Icone size={44} strokeWidth={2.2} />
      </span>
      <p className="lt-vide__titre">{titre}</p>
      <p className="label-screen__soon lt-vide__texte">{texte}</p>
      {action && onAction ? (
        <Button type="button" tone="gold" size="lg" onClick={onAction}>
          {action}
        </Button>
      ) : null}
    </div>
  );
}
