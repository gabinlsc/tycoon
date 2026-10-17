import { useEffect, useMemo, useState } from 'react';
import type { Game } from '../../data/games';
import { Coin } from '../arcade/ui/Coin';
import { GameIcon } from '../arcade/ui/GameIcon';

interface GameIntroProps {
  game: Game;
  onDone: () => void;
}

/** Durée avant le début de la sortie, puis durée de la sortie (doit suivre le CSS). */
const HOLD_MS = 3200;
const LEAVE_MS = 650;

const BIT_COUNT = 30;

/**
 * Pièces et confettis : positions réparties au « nombre d'or » pour un éventail régulier,
 * sans hasard, donc identiques à chaque rendu.
 */
function makeBits() {
  return Array.from({ length: BIT_COUNT }, (_, i) => {
    const angle = (i * 137.508 * Math.PI) / 180;
    const distance = 160 + ((i * 53) % 9) * 38;
    return {
      id: i,
      coin: i % 3 === 0,
      dx: Math.round(Math.cos(angle) * distance),
      dy: Math.round(Math.sin(angle) * distance * 0.8),
      rot: ((i * 71) % 540) - 270,
      delay: 1000 + (i % 6) * 40,
      tone: i % 4,
    };
  });
}

/**
 * Entrée en scène d'un jeu : la couleur du jeu inonde l'écran, l'emblème s'abat avec une onde de
 * choc et un tremblement, le titre jaillit lettre par lettre dans une pluie de pièces, puis le
 * rideau se lève. Passable à tout moment (clic, Échap, Entrée, espace, bouton).
 */
export function GameIntro({ game, onDone }: GameIntroProps) {
  const [leaving, setLeaving] = useState(false);
  const bits = useMemo(makeBits, []);

  // Enchaîne la tenue puis la sortie, sauf si l'utilisateur passe avant
  useEffect(() => {
    const hold = window.setTimeout(() => setLeaving(true), HOLD_MS);
    return () => window.clearTimeout(hold);
  }, []);
  useEffect(() => {
    if (!leaving) return;
    const done = window.setTimeout(onDone, LEAVE_MS);
    return () => window.clearTimeout(done);
  }, [leaving, onDone]);

  // Pas de défilement derrière le rideau
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    const skip = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setLeaving(true);
      }
    };
    window.addEventListener('keydown', skip);
    return () => window.removeEventListener('keydown', skip);
  }, []);

  const letters = [...game.name];

  return (
    <div
      className={`intro game-bg game-bg--${game.color}${leaving ? ' intro--leaving' : ''}`}
      onClick={() => setLeaving(true)}
      role="presentation"
    >
      {/* Tout ce qui est décoratif est caché aux lecteurs d'écran ; seul le bouton « Passer » reste. */}
      <div className="intro__decor" aria-hidden="true">
        <div className="intro__rays" />
        <div className="intro__stage">
          <span className="intro__ring" />
          <span className="intro__ring intro__ring--2" />
          <span className="intro__ring intro__ring--3" />
          {bits.map((bit) => (
            <span
              key={bit.id}
              className={`intro__bit intro__bit--${bit.coin ? 'coin' : `tone${bit.tone}`}`}
              style={
                {
                  '--dx': `${bit.dx}px`,
                  '--dy': `${bit.dy}px`,
                  '--rot': `${bit.rot}deg`,
                  animationDelay: `${bit.delay}ms`,
                } as React.CSSProperties
              }
            >
              {bit.coin ? <Coin size={34} /> : null}
            </span>
          ))}
          <div className="intro__emblem">
            <GameIcon name={game.icon} size={150} />
          </div>
          <h2 className="intro__title">
            {letters.map((letter, index) => (
              <span
                key={index}
                className="intro__letter"
                style={
                  {
                    animationDelay: `${1000 + index * 45}ms`,
                    '--r': `${((index * 37) % 31) - 15}deg`,
                  } as React.CSSProperties
                }
              >
                {letter === ' ' ? ' ' : letter}
              </span>
            ))}
          </h2>
          <p className="intro__tagline">{game.genre}</p>
        </div>
      </div>
      <button
        type="button"
        className="intro__skip"
        onClick={(event) => {
          event.stopPropagation();
          setLeaving(true);
        }}
      >
        Passer
      </button>
    </div>
  );
}
