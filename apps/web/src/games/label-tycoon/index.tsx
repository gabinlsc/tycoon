import { Coquille } from './Coquille';
import { LabelProvider } from './LabelContext';
import { Persistance } from './Persistance';
import './label.css';
import './jeu.css';

/** Label Tycoon : point d'entrée chargé à la demande par le registre des jeux. */
export default function LabelTycoon() {
  return (
    <LabelProvider>
      <Coquille sauvegardes={<Persistance />} />
    </LabelProvider>
  );
}
