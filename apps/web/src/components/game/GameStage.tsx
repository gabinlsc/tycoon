import { Suspense } from 'react';
import { Link } from 'react-router-dom';
import { useAccount } from '../../accounts/AccountContext';
import { GAME_MODULES } from '../../games/registry';
import type { Game } from '../../data/games';
import { Button } from '../arcade/ui/Button';
import { GameIcon } from '../arcade/ui/GameIcon';

/**
 * Emplacement du jeu. Si le jeu est enregistré dans le registre, il est chargé ici, sinon on
 * affiche l'écran d'attente façon borne d'arcade.
 */
export function GameStage({ game }: { game: Game }) {
  const { status, account } = useAccount();
  const GameModule = GAME_MODULES[game.slug];

  if (GameModule) {
    return (
      <section className="stage stage--live card" aria-label={`Jouer à ${game.name}`}>
        <Suspense fallback={<p className="stage__loading">Chargement du niveau…</p>}>
          <GameModule slug={game.slug} />
        </Suspense>
      </section>
    );
  }

  return (
    <section className="stage card" aria-labelledby="stage-titre">
      <div className="stage__screen">
        <div className="stage__icon">
          <GameIcon name={game.icon} size={96} />
        </div>
        <h2 id="stage-titre" className="stage__title">
          Bientôt jouable
        </h2>
        <p className="stage__blink" aria-hidden="true">
          ▶ INSERT COIN
        </p>
      </div>
      <div className="stage__actions">
        <p>
          {status === 'in' && account
            ? `${account.pseudo}, ta sauvegarde t'attendra ici dès l'ouverture du jeu.`
            : 'Crée ton pseudo : ta sauvegarde t’attendra dès l’ouverture du jeu.'}
        </p>
        <div className="stage__buttons">
          {status === 'in' ? null : (
            <Button as={Link} to="/compte" tone="green" size="lg">
              Créer mon pseudo
            </Button>
          )}
          <Button as={Link} to="/#abonnement" tone="gold" size="lg">
            Me prévenir de la sortie
          </Button>
        </div>
      </div>
    </section>
  );
}
