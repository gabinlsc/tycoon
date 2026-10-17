import { useEffect, useState } from 'react';
import { SITE } from '../../config/site';
import { Button } from '../arcade/ui/Button';

interface RecoveryCodesProps {
  pseudo: string;
  codes: readonly string[];
  /** Appelé quand l'utilisateur confirme avoir noté ses codes. */
  onConfirm: () => void;
}

function asText(pseudo: string, codes: readonly string[]): string {
  return [
    `${SITE.name} : codes de récupération de ${pseudo}`,
    `Générés le ${new Date().toLocaleDateString(SITE.locale)}`,
    '',
    ...codes,
    '',
    "Chaque code ne sert qu'une seule fois. Garde-les en lieu sûr :",
    "il n'y a pas d'e-mail sur lequel les renvoyer.",
  ].join('\n');
}

/**
 * Affiche les codes une seule fois. On ne peut continuer qu'après avoir coché « j'ai noté mes codes »,
 * et le navigateur prévient si on tente de fermer l'onglet avant.
 */
export function RecoveryCodes({ pseudo, codes, onConfirm }: RecoveryCodesProps) {
  const [noted, setNoted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(asText(pseudo, codes));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([asText(pseudo, codes)], { type: 'text/plain' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `codes-${pseudo}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="codes card">
      <h2 className="codes__title">Tes codes de récupération</h2>
      <p className="codes__warning">
        Note-les maintenant : <strong>ils ne seront plus jamais affichés</strong>. Sans eux, tu ne
        pourras pas récupérer ton compte si tu perds l'accès à ce navigateur.
      </p>
      <ul className="codes__grid">
        {codes.map((code) => (
          <li key={code} className="codes__code">
            {code}
          </li>
        ))}
      </ul>
      <div className="codes__actions">
        <Button type="button" tone="ghost" onClick={copy}>
          {copied ? 'Copié !' : 'Copier'}
        </Button>
        <Button type="button" tone="ghost" onClick={download}>
          Télécharger (.txt)
        </Button>
      </div>
      <label className="codes__confirm">
        <input type="checkbox" checked={noted} onChange={(e) => setNoted(e.target.checked)} />
        <span>J'ai noté mes codes dans un endroit sûr.</span>
      </label>
      <Button type="button" tone="green" size="lg" disabled={!noted} onClick={onConfirm}>
        Continuer
      </Button>
    </div>
  );
}
