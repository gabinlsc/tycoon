import type { ReactNode } from 'react';
import type { PoleId } from './ecrans';
import { ICONES_POLES } from './icones';

const ACCROCHES: Record<PoleId, string> = {
  qg: 'Ton siège',
  artistes: 'Ton écurie',
  production: 'Du studio à la scène',
  boite: 'Ce qui t’attend',
  marche: 'Le terrain de jeu',
  gestion: 'Les comptes',
  empire: 'Vois plus grand',
  suivi: 'Tes exploits',
};

const COULEURS: Record<PoleId, string> = {
  qg: 'purple',
  artistes: 'pink',
  production: 'purple',
  boite: 'blue',
  marche: 'teal',
  gestion: 'green',
  empire: 'orange',
  suivi: 'gold',
};

/** Décor SVG propre à chaque pôle, animé en douceur. */
function Decor({ pole }: { pole: PoleId }): ReactNode {
  switch (pole) {
    case 'artistes':
      return (
        <g>
          {[0, 1, 2].map((i) => (
            <g key={i} className="lt-bp__bob" style={{ animationDelay: `${i * 0.35}s` }}>
              <circle cx={380 + i * 62} cy={44} r={15} fill="#fff" opacity=".9" />
              <rect
                x={364 + i * 62}
                y={60}
                width={32}
                height={46}
                rx={14}
                fill="#fff"
                opacity=".75"
              />
              <circle
                cx={380 + i * 62}
                cy={44}
                r={15}
                fill="none"
                stroke="#1f1547"
                strokeWidth={3}
              />
            </g>
          ))}
          <path
            d="M330 24l4 9 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z"
            fill="#ffc61a"
            stroke="#1f1547"
            strokeWidth={2.5}
            className="lt-bp__scint"
          />
        </g>
      );
    case 'production':
      return (
        <g>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <g key={i}>
              <rect
                x={340 + i * 34}
                y={14}
                width={10}
                height={76}
                rx={5}
                fill="#1f1547"
                opacity=".55"
              />
              <rect
                x={334 + i * 34}
                y={30}
                width={22}
                height={14}
                rx={5}
                fill={['#ff6fb5', '#ffc61a', '#35d36b', '#34a4ff', '#ff8a2b', '#1fd0c0'][i]}
                stroke="#1f1547"
                strokeWidth={2.5}
                className="lt-bp__fader"
                style={{ animationDelay: `${i * 0.4}s` }}
              />
            </g>
          ))}
        </g>
      );
    case 'marche':
      return (
        <g>
          <path
            d="M320 84 L372 62 L418 72 L470 38 L520 48 L572 16"
            fill="none"
            stroke="#fff"
            strokeWidth={6}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lt-bp__trace"
          />
          {(
            [
              [372, 62],
              [470, 38],
              [572, 16],
            ] as const
          ).map(([x, y]) => (
            <circle key={x} cx={x} cy={y} r={7} fill="#ffc61a" stroke="#1f1547" strokeWidth={3} />
          ))}
        </g>
      );
    case 'gestion':
      return (
        <g>
          {[0, 1, 2, 3].map((i) => (
            <g key={i} className="lt-bp__bob" style={{ animationDelay: `${i * 0.3}s` }}>
              <ellipse
                cx={400 + i * 52}
                cy={72 - (i % 2) * 14}
                rx={22}
                ry={9}
                fill="#ffc61a"
                stroke="#1f1547"
                strokeWidth={3}
              />
              <ellipse
                cx={400 + i * 52}
                cy={64 - (i % 2) * 14}
                rx={22}
                ry={9}
                fill="#ffe27a"
                stroke="#1f1547"
                strokeWidth={3}
              />
            </g>
          ))}
          <g className="lt-bp__tourne" style={{ transformOrigin: '330px 52px' }}>
            <circle
              cx={330}
              cy={52}
              r={30}
              fill="#fff"
              opacity=".9"
              stroke="#1f1547"
              strokeWidth={3}
            />
            <path
              d="M330 24v14M330 66v14M302 52h14M344 52h14"
              stroke="#1f1547"
              strokeWidth={4}
              strokeLinecap="round"
            />
          </g>
        </g>
      );
    case 'empire':
      return (
        <g>
          {(
            [
              [340, 50],
              [384, 28],
              [430, 44],
              [478, 16],
              [526, 40],
              [566, 58],
            ] as const
          ).map(([x, y], i) => (
            <rect
              key={x}
              x={x}
              y={y}
              width={34}
              height={100 - y}
              fill="#1f1547"
              opacity={0.55 + (i % 3) * 0.12}
            />
          ))}
          <path
            d="M470 10l8 10 10-6-3 14h-30l-3-14 10 6z"
            fill="#ffc61a"
            stroke="#1f1547"
            strokeWidth={2.5}
            className="lt-bp__scint"
          />
        </g>
      );
    case 'suivi':
      return (
        <g>
          <path
            d="M440 20h50v26a25 25 0 0 1-50 0z"
            fill="#ffc61a"
            stroke="#1f1547"
            strokeWidth={3.5}
          />
          <path
            d="M440 28h-14a14 14 0 0 0 16 20M490 28h14a14 14 0 0 1-16 20"
            fill="none"
            stroke="#1f1547"
            strokeWidth={3.5}
          />
          <rect
            x={456}
            y={68}
            width={18}
            height={12}
            fill="#d99500"
            stroke="#1f1547"
            strokeWidth={3}
          />
          <rect
            x={442}
            y={80}
            width={46}
            height={10}
            rx={3}
            fill="#ffc61a"
            stroke="#1f1547"
            strokeWidth={3}
          />
          {(
            [
              [400, 30],
              [530, 24],
              [550, 64],
            ] as const
          ).map(([x, y], i) => (
            <path
              key={x}
              d={`M${x} ${y - 9}l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z`}
              fill="#fff"
              className="lt-bp__scint"
              style={{ animationDelay: `${i * 0.5}s` }}
            />
          ))}
        </g>
      );
    default:
      return null;
  }
}

/** Bandeau illustré en tête d'un pôle : titre, accroche et décor animé. */
export function BandeauPole({ pole, titre }: { pole: PoleId; titre: string }) {
  const Icone = ICONES_POLES[pole];
  return (
    <div className={`lt-bp lt-bp--${COULEURS[pole]}`} data-pole={pole}>
      <span className="lt-bp__icone" aria-hidden="true">
        <Icone size={26} strokeWidth={2.6} />
      </span>
      <div className="lt-bp__texte">
        <p className="lt-bp__titre">{titre}</p>
        <p className="lt-bp__accroche">{ACCROCHES[pole]}</p>
      </div>
      <svg
        className="lt-bp__decor"
        viewBox="0 0 600 100"
        preserveAspectRatio="xMaxYMid slice"
        aria-hidden="true"
      >
        <Decor pole={pole} />
      </svg>
    </div>
  );
}
