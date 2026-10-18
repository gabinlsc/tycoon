import { useCallback, useEffect, useId, useState } from 'react';
import { useAccount } from '../../accounts/AccountContext';
import { CODE_COUNT } from '../../accounts/recoveryCodes';
import type { SaveInfo } from '../../accounts/types';
import { SITE } from '../../config/site';
import { findGame } from '../../data/games';
import { PURGES } from '../../games/registry';
import { Button } from '../arcade/ui/Button';
import { Avatar } from './Avatar';

const dateFormat = new Intl.DateTimeFormat(SITE.locale, { dateStyle: 'long' });
const dateTimeFormat = new Intl.DateTimeFormat(SITE.locale, {
  dateStyle: 'short',
  timeStyle: 'short',
});

function SavesList() {
  const { store, account } = useAccount();
  const [saves, setSaves] = useState<SaveInfo[] | null>(null);

  const load = useCallback(async () => setSaves(await store.listSaves()), [store]);
  useEffect(() => {
    void load();
  }, [load]);

  if (saves === null) return <p className="field-hint">Chargement…</p>;
  if (saves.length === 0) {
    return (
      <p className="field-hint">
        Aucune sauvegarde pour l'instant. Elles apparaîtront ici dès que tu auras joué.
      </p>
    );
  }
  return (
    <ul className="saves">
      {saves.map((save) => (
        <li key={save.slug} className="saves__item">
          <div>
            <strong>{findGame(save.slug)?.name ?? save.slug}</strong>
            <span className="saves__meta">
              Dernière partie : {dateTimeFormat.format(new Date(save.updatedAt))}
            </span>
            {save.resume ? <span className="saves__meta">{save.resume}</span> : null}
          </div>
          <Button
            type="button"
            tone="ghost"
            onClick={async () => {
              if (account) await PURGES[save.slug]?.(account.id);
              await store.clearSave(save.slug);
              await load();
            }}
            aria-label={`Effacer la sauvegarde de ${findGame(save.slug)?.name ?? save.slug}`}
          >
            Effacer
          </Button>
        </li>
      ))}
    </ul>
  );
}

function DeleteAccount({ pseudo }: { pseudo: string }) {
  const { deleteAccount, account } = useAccount();
  const inputId = useId();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');

  if (!open) {
    return (
      <Button type="button" tone="ghost" onClick={() => setOpen(true)}>
        Supprimer mon compte
      </Button>
    );
  }
  return (
    <div className="danger card">
      <p>
        Cette action efface ton pseudo et <strong>toutes tes sauvegardes</strong>, définitivement.
      </p>
      <label className="account-form__label" htmlFor={inputId}>
        Pour confirmer, tape ton pseudo : <strong>{pseudo}</strong>
      </label>
      <input
        id={inputId}
        className="field"
        value={typed}
        autoComplete="off"
        onChange={(e) => setTyped(e.target.value)}
      />
      <div className="danger__actions">
        <Button
          type="button"
          tone="gold"
          disabled={typed.trim().toLowerCase() !== pseudo.toLowerCase()}
          onClick={async () => {
            if (account) await Promise.all(Object.values(PURGES).map((purge) => purge(account.id)));
            await deleteAccount();
          }}
        >
          Supprimer définitivement
        </Button>
        <Button type="button" tone="ghost" onClick={() => setOpen(false)}>
          Annuler
        </Button>
      </div>
    </div>
  );
}

/** Page de profil : identité, codes de récupération, sauvegardes par jeu, déconnexion, suppression. */
export function ProfilePanel() {
  const { account, signOut, regenerateCodes, persistent } = useAccount();
  const [confirmRegen, setConfirmRegen] = useState(false);
  if (!account) return null;

  return (
    <div className="profile">
      <section className="profile__card card" aria-labelledby="profil-titre">
        <Avatar pseudo={account.pseudo} size={72} />
        <div>
          <h2 id="profil-titre" className="profile__pseudo">
            {account.pseudo}
          </h2>
          <p className="profile__meta">
            Compte créé le {dateFormat.format(new Date(account.createdAt))}
          </p>
        </div>
        <Button type="button" tone="ghost" onClick={() => void signOut()}>
          Me déconnecter
        </Button>
      </section>

      {!persistent ? (
        <p className="notice notice--warn" role="status">
          Ton navigateur bloque le stockage : ce compte disparaîtra à la fermeture de l'onglet.
        </p>
      ) : (
        <p className="notice" role="note">
          Pour l'instant, ton compte est enregistré dans ce navigateur : un autre appareil ne le
          connaîtra pas, et vider les données du site l'efface.
        </p>
      )}

      <section className="profile__card profile__card--col card" aria-labelledby="codes-titre">
        <h2 id="codes-titre" className="profile__h2">
          Codes de récupération
        </h2>
        <p>
          Il t'en reste <strong className="mono">{account.codesLeft}</strong> sur {CODE_COUNT}.
        </p>
        {account.codesLeft <= 2 ? (
          <p className="notice notice--warn" role="status">
            Il te reste peu de codes : pense à en générer un nouveau lot.
          </p>
        ) : null}
        {confirmRegen ? (
          <div className="danger__actions">
            <p>Les anciens codes ne fonctionneront plus. Continuer ?</p>
            <Button
              type="button"
              tone="gold"
              onClick={async () => {
                await regenerateCodes();
                setConfirmRegen(false);
              }}
            >
              Oui, en générer de nouveaux
            </Button>
            <Button type="button" tone="ghost" onClick={() => setConfirmRegen(false)}>
              Annuler
            </Button>
          </div>
        ) : (
          <Button type="button" tone="ghost" onClick={() => setConfirmRegen(true)}>
            Générer de nouveaux codes
          </Button>
        )}
      </section>

      <section className="profile__card profile__card--col card" aria-labelledby="saves-titre">
        <h2 id="saves-titre" className="profile__h2">
          Mes sauvegardes
        </h2>
        <SavesList />
      </section>

      <DeleteAccount pseudo={account.pseudo} />
    </div>
  );
}
