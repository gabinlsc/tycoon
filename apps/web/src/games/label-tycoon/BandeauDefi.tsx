import { useEffect, useState } from 'react';
import type { VueDefi } from '@tycoon/label-tycoon';
import { Button } from '../../components/arcade/ui/Button';
import { enregistrerScore } from './defi';

/** Suivi du défi du jour : semaines restantes, puis score, meilleur score et texte à partager. */
export function BandeauDefi({ defi }: { defi: VueDefi }) {
  const [copie, setCopie] = useState<string | null>(null);
  const [meilleur, setMeilleur] = useState<number | null>(null);
  const { termine, score, date } = defi;

  useEffect(() => {
    if (termine) setMeilleur(enregistrerScore(date, score));
  }, [termine, score, date]);

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(defi.partage);
      setCopie('Résultat copié dans le presse-papiers.');
    } catch {
      setCopie('Copie impossible : sélectionne le texte ci-dessus pour le copier.');
    }
  };

  return (
    <section className="label-screen label-scenario" aria-label={`Défi du ${defi.date}`}>
      <h2>Défi du jour — {defi.date}</h2>
      {termine ? (
        <>
          <p role="status">
            Défi terminé ! Score :{' '}
            <strong className="mono">{score.toLocaleString('fr-FR')} €</strong>
            {meilleur !== null && meilleur > score
              ? ` (ton meilleur score du jour : ${meilleur.toLocaleString('fr-FR')} €)`
              : ''}
            .
          </p>
          <pre className="label-share">{defi.partage}</pre>
          <Button type="button" tone="gold" onClick={() => void copier()}>
            Copier le résultat
          </Button>
          {copie ? <p role="status">{copie}</p> : null}
        </>
      ) : (
        <p>
          Semaines restantes : <strong className="mono">{defi.semainesRestantes}</strong> · score
          provisoire <span className="mono">{score.toLocaleString('fr-FR')} €</span> (la valeur de
          ton label à la fin des 52 semaines).
        </p>
      )}
    </section>
  );
}
