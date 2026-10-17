import { useId, useState, type FormEvent } from 'react';
import { useAccount } from '../../accounts/AccountContext';
import { PSEUDO_MAX, PSEUDO_MESSAGES, validatePseudo } from '../../accounts/pseudo';
import { AccountError } from '../../accounts/types';
import { Button } from '../arcade/ui/Button';

/** Création d'un compte : un pseudo, rien d'autre. Les codes de récupération s'affichent ensuite. */
export function CreateAccountForm() {
  const { createAccount } = useAccount();
  const inputId = useId();
  const errorId = useId();
  const [pseudo, setPseudo] = useState('');
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const problem = validatePseudo(pseudo);
  const error = serverError ?? (touched && problem ? PSEUDO_MESSAGES[problem] : null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched(true);
    if (problem) return;
    setBusy(true);
    setServerError(null);
    try {
      await createAccount(pseudo);
    } catch (e) {
      setServerError(e instanceof AccountError ? e.message : 'Une erreur est survenue, réessaie.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="account-form" onSubmit={onSubmit} noValidate>
      <label className="account-form__label" htmlFor={inputId}>
        Choisis ton pseudo
      </label>
      <input
        id={inputId}
        className="field"
        type="text"
        name="pseudo"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        maxLength={PSEUDO_MAX + 8}
        placeholder="TonPseudo"
        value={pseudo}
        onChange={(e) => {
          setPseudo(e.target.value);
          setServerError(null);
        }}
        onBlur={() => setTouched(true)}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
      />
      <p id={errorId} className="field-error" role="alert">
        {error}
      </p>
      <p className="field-hint">
        3 à {PSEUDO_MAX} caractères : lettres, chiffres, tiret ou underscore. Pas d'e-mail, pas de
        mot de passe.
      </p>
      <Button type="submit" tone="green" size="lg" disabled={busy}>
        {busy ? 'Création…' : 'Réserver mon pseudo'}
      </Button>
    </form>
  );
}
