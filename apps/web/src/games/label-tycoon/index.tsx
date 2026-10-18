import { Coquille } from './Coquille';
import { LabelProvider } from './LabelContext';
import './label.css';

/** Label Tycoon : point d'entrée chargé à la demande par le registre des jeux. */
export default function LabelTycoon() {
  return (
    <LabelProvider>
      <Coquille />
    </LabelProvider>
  );
}
