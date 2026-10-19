import { useEffect, useState } from 'react';

const ASTUCES = [
  'Un single qui sort avec un gros clip passe plus souvent en playlist.',
  'Garde un œil sur le moral : un artiste à bout de souffle claque la porte.',
  'Les festivals en été propulsent la notoriété des têtes d’affiche.',
  'Diversifie ton catalogue : un seul genre, c’est un seul risque de flop.',
  'Une bonne tournée se prépare plusieurs semaines à l’avance.',
];

/** Écran d'attente du moteur : vinyle qui tourne et astuce du jour. */
export function Chargement() {
  const [i, setI] = useState(() => Math.floor(Math.random() * ASTUCES.length));
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % ASTUCES.length), 3200);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="lt-chargement" role="status">
      <svg className="lt-chargement__disque" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="48" fill="#15102e" />
        <circle cx="50" cy="50" r="40" fill="none" stroke="#2b2250" strokeWidth="2" />
        <circle cx="50" cy="50" r="33" fill="none" stroke="#2b2250" strokeWidth="2" />
        <circle cx="50" cy="50" r="26" fill="none" stroke="#2b2250" strokeWidth="2" />
        <path
          d="M50 2a48 48 0 0 1 40 22"
          stroke="#fff"
          strokeOpacity=".35"
          strokeWidth="3"
          fill="none"
        />
        <circle cx="50" cy="50" r="17" fill="#ffc61a" />
        <circle cx="50" cy="50" r="17" fill="none" stroke="#1f1547" strokeWidth="2.5" />
        <circle cx="50" cy="50" r="3.5" fill="#1f1547" />
      </svg>
      <p className="lt-chargement__titre">Chargement du moteur…</p>
      <p className="lt-chargement__astuce">{ASTUCES[i]}</p>
    </div>
  );
}
