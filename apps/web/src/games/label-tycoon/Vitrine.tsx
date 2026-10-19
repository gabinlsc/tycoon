import { useRef, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { VueJeu } from '@tycoon/label-tycoon';
import { Download, Flame, Image as ImageIcon } from 'lucide-react';
import { Button } from '../../components/arcade/ui/Button';
import { eurCourt } from './Hud';
import { useLabel } from './LabelContext';
import { rareteDe, scoreArtiste } from './rarete';
import { calculerSerie, dateDuJour, lireJours, titreDeSerie } from './serie';
import { Visage } from './Visage';
import { Panneau } from './Visuels';

const COULEURS_RARETE = {
  commun: '#b8b2cc',
  rare: '#34a4ff',
  epique: '#8b66ff',
  legendaire: '#ffc61a',
} as const;

interface DonneesVitrine {
  label: string;
  palier: string;
  valorisation: string;
  reputation: number;
  serie: number;
  artistes: { nom: string; rarete: keyof typeof COULEURS_RARETE }[];
}

export function donneesVitrine(vue: VueJeu, serie: number): DonneesVitrine {
  const meilleurs = [...vue.roster]
    .sort((a, b) => scoreArtiste(b) - scoreArtiste(a))
    .slice(0, 3)
    .map((a) => ({ nom: a.nom, rarete: rareteDe(scoreArtiste(a)) }));
  return {
    label: vue.label.nom,
    palier: vue.label.palier,
    valorisation: eurCourt(vue.finances.valorisation),
    reputation: vue.label.reputation,
    serie,
    artistes: meilleurs,
  };
}

/** Affiche de ton label : nom, palier, valorisation et tes trois meilleurs artistes. */
export function AfficheVitrine({ d }: { d: DonneesVitrine }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 600 400"
      width="600"
      height="400"
      role="img"
      aria-label={`Vitrine de ${d.label}`}
      className="lt-vitrine__svg"
    >
      <defs>
        <linearGradient id="vit-fond" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#1b1050" />
          <stop offset="0.6" stopColor="#4a2a9c" />
          <stop offset="1" stopColor="#ff8a5c" />
        </linearGradient>
      </defs>
      <rect width="600" height="400" rx="28" fill="url(#vit-fond)" />
      <rect
        x="6"
        y="6"
        width="588"
        height="388"
        rx="24"
        fill="none"
        stroke="#ffc61a"
        strokeWidth="4"
      />
      <text
        x="300"
        y="70"
        textAnchor="middle"
        fontSize="44"
        fontWeight="900"
        fill="#ffe1f0"
        fontFamily="'Lilita One', Arial Rounded MT Bold, system-ui, sans-serif"
      >
        {d.label}
      </text>
      <text
        x="300"
        y="104"
        textAnchor="middle"
        fontSize="20"
        fontWeight="800"
        fill="#ffc61a"
        fontFamily="system-ui, sans-serif"
      >
        {`${d.palier.toUpperCase()} · VALEUR ${d.valorisation}`}
      </text>
      {d.artistes.length === 0 ? (
        <text
          x="300"
          y="240"
          textAnchor="middle"
          fontSize="22"
          fontWeight="800"
          fill="#ffffffcc"
          fontFamily="system-ui, sans-serif"
        >
          Signe des artistes pour remplir ta vitrine
        </text>
      ) : null}
      {d.artistes.map((a, i) => {
        const x = 300 + (i - (d.artistes.length - 1) / 2) * 170 - 70;
        return (
          <g key={a.nom} transform={`translate(${x} 140)`}>
            <rect
              width="140"
              height="190"
              rx="16"
              fill="#1b0f3a"
              stroke={COULEURS_RARETE[a.rarete]}
              strokeWidth="5"
            />
            <svg x="10" y="10" width="120" height="132" viewBox="0 0 100 110">
              <g dangerouslySetInnerHTML={{ __html: facesDe(a.nom) }} />
            </svg>
            <text
              x="70"
              y="168"
              textAnchor="middle"
              fontSize="15"
              fontWeight="900"
              fill="#fff"
              fontFamily="system-ui, sans-serif"
            >
              {a.nom.length > 16 ? `${a.nom.slice(0, 15)}…` : a.nom}
            </text>
          </g>
        );
      })}
      <text
        x="24"
        y="382"
        fontSize="18"
        fontWeight="800"
        fill="#fff"
        fontFamily="system-ui, sans-serif"
      >
        {`Réputation ${d.reputation} · Série ${d.serie} jour${d.serie > 1 ? 's' : ''}`}
      </text>
      <text
        x="576"
        y="382"
        textAnchor="end"
        fontSize="16"
        fontWeight="800"
        fill="#ffc61a"
        fontFamily="system-ui, sans-serif"
      >
        Label Tycoon
      </text>
    </svg>
  );
}

/** Intérieur du SVG d'un visage (sans l'élément racine), pour l'insérer dans l'affiche. */
function facesDe(nom: string): string {
  const marque = renderToStaticMarkup(<Visage graine={nom} taille={100} />);
  return marque.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
}

/** Dessine l'affiche dans un canvas puis la télécharge en PNG ; `false` si le navigateur ne sait pas. */
export async function telechargerPng(svg: string, nom: string): Promise<boolean> {
  if (typeof document === 'undefined') return false;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext?.('2d');
  if (!ctx) return false;
  canvas.width = 1200;
  canvas.height = 800;
  const image = new Image();
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('image'));
      image.src = url;
    });
    ctx.drawImage(image, 0, 0, 1200, 800);
    const lien = document.createElement('a');
    lien.download = `${nom.replace(/[^\w-]+/g, '-').toLowerCase()}-vitrine.png`;
    lien.href = canvas.toDataURL('image/png');
    lien.click();
    return true;
  } catch {
    return false;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Vitrine : l'affiche partageable de ton label et ta série de jours. */
export function Vitrine() {
  const { vue } = useLabel();
  const [statut, setStatut] = useState<string | null>(null);
  const zone = useRef<HTMLDivElement>(null);
  if (!vue) return null;
  const serie = calculerSerie(lireJours(), dateDuJour());
  const titre = titreDeSerie(serie);
  const donnees = donneesVitrine(vue, serie);

  const telecharger = async () => {
    const svg = renderToStaticMarkup(<AfficheVitrine d={donnees} />);
    const ok = await telechargerPng(svg, vue.label.nom);
    setStatut(ok ? 'Affiche téléchargée.' : 'Ton navigateur ne peut pas créer l’image.');
  };

  return (
    <section className="label-screen" aria-labelledby="vitrine-titre">
      <h2 id="vitrine-titre">Vitrine</h2>
      <Panneau titre="Série de jours" Icone={Flame} ton="orange" id="vit-serie">
        <p className="lt-puces-info">
          <span className="lt-chip lt-chip--bon">
            <Flame aria-hidden="true" size={14} /> {serie} jour{serie > 1 ? 's' : ''} d’affilée
          </span>
          {titre ? <span className="lt-chip">{titre}</span> : null}
          <span className="lt-chip">3 jours : Régulier · 7 : Habitué · 30 : Légende du label</span>
        </p>
      </Panneau>
      <Panneau titre="Affiche de ton label" Icone={ImageIcon} ton="pink" id="vit-affiche">
        <div ref={zone} className="lt-vitrine">
          <AfficheVitrine d={donnees} />
        </div>
        <Button type="button" tone="gold" onClick={() => void telecharger()}>
          <Download aria-hidden="true" size={18} /> Télécharger l’affiche
        </Button>
        {statut ? (
          <p className="lt-rien" role="status">
            {statut}
          </p>
        ) : null}
      </Panneau>
    </section>
  );
}
