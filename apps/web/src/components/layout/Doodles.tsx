/** Formes en suspension derrière toute l'interface : décoratives, immobiles en reduced-motion. */
const SHAPES = [
  { kind: 'plus', x: 6, y: 12, size: 34, dur: 11, delay: 0 },
  { kind: 'ring', x: 17, y: 62, size: 46, dur: 14, delay: -3 },
  { kind: 'tri', x: 29, y: 24, size: 30, dur: 12, delay: -6 },
  { kind: 'square', x: 41, y: 78, size: 28, dur: 15, delay: -2 },
  { kind: 'plus', x: 53, y: 8, size: 26, dur: 10, delay: -5 },
  { kind: 'ring', x: 64, y: 46, size: 38, dur: 13, delay: -8 },
  { kind: 'tri', x: 75, y: 84, size: 34, dur: 16, delay: -1 },
  { kind: 'square', x: 84, y: 20, size: 32, dur: 12, delay: -4 },
  { kind: 'plus', x: 92, y: 58, size: 38, dur: 14, delay: -7 },
  { kind: 'ring', x: 96, y: 90, size: 28, dur: 11, delay: -9 },
  { kind: 'tri', x: 3, y: 88, size: 26, dur: 13, delay: -10 },
  { kind: 'square', x: 47, y: 40, size: 22, dur: 17, delay: -3 },
] as const;

function Shape({ kind }: { kind: (typeof SHAPES)[number]['kind'] }) {
  switch (kind) {
    case 'plus':
      return <path d="M10 2h4v8h8v4h-8v8h-4v-8H2v-4h8z" />;
    case 'ring':
      return <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="4" />;
    case 'tri':
      return <path d="M12 3 22 21H2z" />;
    case 'square':
      return <rect x="4" y="4" width="16" height="16" rx="4" />;
  }
}

export function Doodles() {
  return (
    <div className="doodles" aria-hidden="true">
      {SHAPES.map((shape, index) => (
        <svg
          key={index}
          className="doodles__shape"
          viewBox="0 0 24 24"
          width={shape.size}
          height={shape.size}
          fill="currentColor"
          style={{
            left: `${shape.x}%`,
            top: `${shape.y}%`,
            animationDuration: `${shape.dur}s`,
            animationDelay: `${shape.delay}s`,
          }}
        >
          <Shape kind={shape.kind} />
        </svg>
      ))}
    </div>
  );
}
