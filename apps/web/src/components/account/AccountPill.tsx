import { Link } from 'react-router-dom';
import { useAccount } from '../../accounts/AccountContext';
import { Button } from '../arcade/ui/Button';
import { Avatar } from './Avatar';

/** Emplacement du compte dans la barre : pseudo cliquable si connecté, bouton sinon. */
export function AccountPill() {
  const { status, account, pendingCodes } = useAccount();

  if (status === 'loading')
    return <span className="account-pill account-pill--loading" aria-hidden="true" />;
  if (!account) {
    return (
      <Button as={Link} to="/compte" tone="green" className="account-login">
        Se connecter
      </Button>
    );
  }
  return (
    <Link className="account-pill" to="/compte">
      <Avatar pseudo={account.pseudo} size={30} />
      <span className="account-pill__name">{account.pseudo}</span>
      {pendingCodes ? (
        <span
          className="account-pill__alert"
          role="img"
          aria-label="Codes de récupération à noter"
        />
      ) : null}
    </Link>
  );
}
