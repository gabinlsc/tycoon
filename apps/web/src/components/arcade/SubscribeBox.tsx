import { useId, useState, type FormEvent } from 'react';
import { EMAIL_MESSAGES, validateEmail } from '../../lib/validateEmail';
import { Button } from './ui/Button';
import { Coin } from './ui/Coin';
import { SectionTitle } from './ui/SectionTitle';

type Status = 'idle' | 'sending' | 'done';

/** Délai simulé : pas de backend pour l'instant, on mime l'aller-retour réseau. */
const FAKE_LATENCY_MS = 700;

export function SubscribeBox() {
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
      <SectionTitle
        level="6"
        id="abonnement-titre"
        title="Sois prévenu au lancement"
        kicker="Un message par sortie de jeu, pas un de plus. Désabonnement en un clic."
      />
      <div className="subscribe__box card">
        {status === 'done' ? (
          <div className="subscribe__done" role="status">
            <div className="subscribe__coins" aria-hidden="true">
              <Coin size={64} className="subscribe__coin" />
              <Coin size={44} className="subscribe__coin subscribe__coin--b" />
              <Coin size={52} className="subscribe__coin subscribe__coin--c" />
            </div>
            <p className="subscribe__done-title">Bien joué, patron !</p>
            <p>
              Ton adresse est enregistrée. Tu seras le premier prévenu à l'ouverture du premier jeu.
            </p>
          </div>
        ) : (
          <form className="subscribe__form" onSubmit={onSubmit} noValidate>
            <label className="subscribe__label" htmlFor={inputId}>
              Ton adresse e-mail
            </label>
            <div className="subscribe__row">
              <input
                id={inputId}
                className="subscribe__input"
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                placeholder="toi@exemple.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
              />
              <Button type="submit" tone="green" size="lg" disabled={status === 'sending'}>
                {status === 'sending' ? 'Envoi…' : "Je m'inscris"}
              </Button>
            </div>
            <p id={errorId} className="subscribe__error" role="alert">
              {error}
            </p>
            <p className="subscribe__note">
              Aucun compte créé, aucune pub. Ton adresse ne sert qu'à t'écrire.
            </p>
          </form>
        )}
      </div>
    </section>
  );
}
