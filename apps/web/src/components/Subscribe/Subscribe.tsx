import { useId, useState, type FormEvent } from 'react';
import { EMAIL_MESSAGES, validateEmail } from '../../lib/validateEmail';
import { SectionHeading } from '../ui/SectionHeading';

type Status = 'idle' | 'sending' | 'done';

/** Délai simulé : il n'y a pas encore de backend, on mime l'aller-retour réseau. */
const FAKE_LATENCY_MS = 700;

export function Subscribe() {
  const inputId = useId();
  const errorId = useId();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const problem = validateEmail(email);
    if (problem) {
      setError(EMAIL_MESSAGES[problem]);
      return;
    }
    setError(null);
    setStatus('sending');
    window.setTimeout(() => setStatus('done'), FAKE_LATENCY_MS);
  };

  return (
    <section id="abonnement" className="subscribe page" aria-labelledby="abonnement-titre">
      <SectionHeading
        number="06"
        id="abonnement-titre"
        title="Recevoir l'édition"
        kicker="Un message par sortie de jeu, pas un de plus. Désabonnement en un clic."
      />
      <div className="subscribe__box">
        {status === 'done' ? (
          <div className="subscribe__done" role="status">
            <p className="subscribe__stamp mono" aria-hidden="true">
              Reçu
            </p>
            <p className="subscribe__done-title">C'est noté.</p>
            <p>
              Votre adresse est enregistrée sur la liste de diffusion. L'édition de lancement vous
              sera envoyée à l'ouverture du premier jeu.
            </p>
          </div>
        ) : (
          <form className="subscribe__form" onSubmit={onSubmit} noValidate>
            <label className="subscribe__label mono" htmlFor={inputId}>
              Votre adresse e-mail
            </label>
            <div className="subscribe__row">
              <input
                id={inputId}
                className="subscribe__input"
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                placeholder="prenom@exemple.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
              />
              <button className="stamp-button" type="submit" disabled={status === 'sending'}>
                {status === 'sending' ? 'Envoi…' : "S'abonner"}
              </button>
            </div>
            <p id={errorId} className="subscribe__error" role="alert">
              {error}
            </p>
            <p className="subscribe__note">
              Aucun compte créé, aucune publicité. Votre adresse ne sert qu'à vous écrire.
            </p>
          </form>
        )}
      </div>
    </section>
  );
}
