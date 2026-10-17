import { useId, useState, type FormEvent } from 'react';
import { useAccount } from '../../accounts/AccountContext';
import { AccountError } from '../../accounts/types';
import { Button } from '../arcade/ui/Button';

/** Reconnexion avec un pseudo et un code de récupération (qui est consommé). */
export function RecoverForm() {
  const { recover } = useAccount();
  const pseudoId = useId();
  const codeId = useId();
  const errorId = useId();
  const [pseudo, setPseudo] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!pseudo.trim() || !code.trim()) {
      setError('Renseigne ton pseudo et un code de récupération.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await recover(pseudo, code);
    } catch (e) {
      setError(e instanceof AccountError ? e.message : 'Une erreur est survenue, réessaie.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="account-form" onSubmit={onSubmit} noValidate>
      <label className="account-form__label" htmlFor={pseudoId}>
        Ton pseudo
      </label>
      <input
        id={pseudoId}
        className="field"
        type="text"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        value={pseudo}
        onChange={(e) => setPseudo(e.target.value)}
      />
      <label className="account-form__label" htmlFor={codeId}>
        Un code de récupération
      </label>
      <input
        id={codeId}
        className="field field--code"
        type="text"
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        placeholder="XXXXX-XXXXX"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
      />
      <p id={errorId} className="field-error" role="alert">
        {error}
      </p>
      <p className="field-hint">Chaque code ne sert qu'une fois : le tien sera consommé.</p>
      <Button type="submit" tone="purple" size="lg" disabled={busy}>
        {busy ? 'Connexion…' : 'Me reconnecter'}
      </Button>
    </form>
  );
}
