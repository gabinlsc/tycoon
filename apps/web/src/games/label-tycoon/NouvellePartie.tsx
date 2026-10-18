import { useState } from 'react';
import { Button } from '../../components/arcade/ui/Button';
import { useLabel } from './LabelContext';

/** Écran de départ : choisir une graine (facultatif) et lancer une partie. */
export function NouvellePartie() {
  const { nouvellePartie, etat } = useLabel();
  const [graine, setGraine] = useState('');
  return (
    <div className="label-start">
      <h2 className="label-start__title">Fonde ton label</h2>
      <p>Une partie, un monde généré : repère des talents, signe-les, sors des hits.</p>
      <label className="label-start__field">
        Graine (facultatif)
        <input
          value={graine}
          onChange={(e) => setGraine(e.target.value)}
          placeholder="une même graine donne le même monde"
          maxLength={40}
        />
      </label>
      <Button
        type="button"
        tone="green"
        size="lg"
        disabled={etat !== 'pret'}
        onClick={() => void nouvellePartie(graine.trim() || Date.now().toString(36))}
      >
        Nouvelle partie
      </Button>
    </div>
  );
}
