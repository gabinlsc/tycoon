import { useState } from 'react';
import { useAccount } from '../accounts/AccountContext';
import { CreateAccountForm } from '../components/account/CreateAccountForm';
import { ProfilePanel } from '../components/account/ProfilePanel';
import { RecoverForm } from '../components/account/RecoverForm';
import { RecoveryCodes } from '../components/account/RecoveryCodes';
import { usePageTitle } from '../lib/usePageTitle';

type Tab = 'create' | 'recover';

export function AccountPage() {
  usePageTitle('Mon compte');
  const { status, account, pendingCodes, confirmCodes } = useAccount();
  const [tab, setTab] = useState<Tab>('create');

  let content;
  if (status === 'loading') {
    content = <p className="field-hint">Chargement…</p>;
  } else if (account && pendingCodes) {
    content = (
      <RecoveryCodes pseudo={account.pseudo} codes={pendingCodes} onConfirm={confirmCodes} />
    );
  } else if (account) {
    content = <ProfilePanel />;
  } else {
    content = (
      <div className="auth card">
        <div className="tabs" role="tablist" aria-label="Compte">
          <button
            type="button"
            role="tab"
            id="tab-create"
            aria-selected={tab === 'create'}
            aria-controls="panel-account"
            className="tabs__tab"
            onClick={() => setTab('create')}
          >
            Créer mon pseudo
          </button>
          <button
            type="button"
            role="tab"
            id="tab-recover"
            aria-selected={tab === 'recover'}
            aria-controls="panel-account"
            className="tabs__tab"
            onClick={() => setTab('recover')}
          >
            J'ai déjà un compte
          </button>
        </div>
        <div id="panel-account" role="tabpanel" aria-labelledby={`tab-${tab}`}>
          {tab === 'create' ? <CreateAccountForm /> : <RecoverForm />}
        </div>
      </div>
    );
  }

  return (
    <section className="account-page page" aria-labelledby="compte-titre">
      <h1 id="compte-titre" className="account-page__title">
        {account ? 'Mon compte' : 'Ton pseudo, ton empire'}
      </h1>
      {!account && status !== 'loading' ? (
        <p className="account-page__lead">
          Pas d'e-mail, pas de mot de passe : un pseudo, et des codes de récupération. Ton
          navigateur te reconnaît ensuite automatiquement.
        </p>
      ) : null}
      {content}
    </section>
  );
}
