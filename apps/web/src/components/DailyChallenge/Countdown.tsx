import { useEffect, useState } from 'react';
import { secondsUntilNextChallenge } from '../../lib/daily';
import { FlipDigits } from '../ui/FlipDigits';

const pad = (n: number): string => String(n).padStart(2, '0');

function format(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/** Compte à rebours jusqu'au prochain défi. L'horloge est relue à chaque tick pour ne pas dériver. */
export function Countdown() {
  const [seconds, setSeconds] = useState(() => secondsUntilNextChallenge(new Date()));

  useEffect(() => {
    const id = window.setInterval(() => setSeconds(secondsUntilNextChallenge(new Date())), 1000);
    return () => window.clearInterval(id);
  }, []);

  const text = format(seconds);
  return (
    <p className="countdown">
      <span className="countdown__label mono">Prochaine quête dans</span>
      {/* La version animée change chaque seconde : on ne l'annonce pas, on donne l'heure en clair */}
      <span aria-hidden="true" className="countdown__digits">
        <FlipDigits value={text} />
      </span>
      <span className="visually-hidden">
        {Math.floor(seconds / 3600)} heures et {Math.floor((seconds % 3600) / 60)} minutes
      </span>
    </p>
  );
}
