import { useState } from 'react';
import { X } from 'lucide-react';
import type { VueJeu } from '@tycoon/label-tycoon';
import { conseilDeMax } from './conseil';
import type { EcranId } from './ecrans';
import { Visage } from './Visage';

/** Max, l'assistant du label : une bulle discrète qui suggère la prochaine bonne action. */
export function MaxConseil({ vue, allerA }: { vue: VueJeu; allerA: (ecran: EcranId) => void }) {
  const [ignore, setIgnore] = useState<string | null>(null);
  const conseil = conseilDeMax(vue);
  if (!conseil || conseil.texte === ignore) return null;
  return (
    <aside className={`lt-max lt-max--${conseil.ton}`} aria-label="Conseil de Max">
      <span className="lt-max__avatar" aria-hidden="true">
        <Visage graine="Max" taille={44} humeur={conseil.ton === 'alerte' ? 'triste' : 'ravi'} />
      </span>
      <p className="lt-max__texte">{conseil.texte}</p>
      <button type="button" className="lt-max__go" onClick={() => allerA(conseil.ecran)}>
        {conseil.bouton}
      </button>
      <button
        type="button"
        className="lt-max__x"
        aria-label="Ignorer ce conseil"
        onClick={() => setIgnore(conseil.texte)}
      >
        <X aria-hidden="true" size={16} />
      </button>
    </aside>
  );
}
