import { useEffect, useState } from 'react';
import type { VueDefi } from '@tycoon/label-tycoon';
import { Button } from '../../components/arcade/ui/Button';
import type { ReponseValidation } from '@tycoon/label-tycoon';
import { enregistrerScore } from './defi';
import { type EntreeClassement, type ServeurDefi, creerServeurSimule } from './defi/serveur';
import { useLabel } from './LabelContext';

/** Suivi du défi du jour : semaines restantes, puis score, meilleur score et texte à partager. */
export function BandeauDefi({
  defi,
  serveur,
}: {
  defi: VueDefi;
  /** Serveur de défis ; le serveur simulé du navigateur par défaut. */
  serveur?: ServeurDefi;
}) {
  const { envoyer } = useLabel();
  const [cible] = useState<ServeurDefi>(() => serveur ?? creerServeurSimule());
  const [validation, setValidation] = useState<string | null>(null);
  const [classement, setClassement] = useState<EntreeClassement[] | null>(null);
  const [copie, setCopie] = useState<string | null>(null);
  const [meilleur, setMeilleur] = useState<number | null>(null);
  const { termine, score, date } = defi;

  useEffect(() => {
    if (termine) setMeilleur(enregistrerScore(date, score));
  }, [termine, score, date]);

  const valider = async () => {
    const r = await envoyer({ type: 'soumettre-defi' });
    if (r.type !== 'soumission')
      return setValidation('Envoi impossible : le défi n’est pas terminé.');
    let reponse: ReponseValidation;
    try {
      reponse = await cible.soumettre(r.soumission);
    } catch {
      return setValidation('Le serveur de défis est injoignable. Réessaie plus tard.');
    }
    setValidation(
      reponse.statut === 'valide'
        ? `Score validé par rejeu : ${reponse.score.toLocaleString('fr-FR')} €.`
        : `Score refusé : ${reponse.message}`,
    );
    if (reponse.statut === 'valide')
      setClassement(await cible.classement(reponse.date).catch(() => null));
  };

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
          <Button type="button" tone="green" onClick={() => void valider()}>
            Valider mon score
          </Button>
          {validation ? <p role="status">{validation}</p> : null}
          {classement ? (
            <ol className="label-list" aria-label="Classement du jour">
              {classement.map((e) => (
                <li key={e.pseudo}>
                  {e.pseudo} — <span className="mono">{e.score.toLocaleString('fr-FR')} €</span>
                </li>
              ))}
            </ol>
          ) : null}
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
