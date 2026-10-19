/**
 * Moteur audio du jeu : bruitages et musique de fond, tout synthétisé avec Web Audio (aucun fichier).
 * Le contexte audio n'est créé qu'au premier geste du joueur (règle des navigateurs). Sans Web Audio
 * (tests, vieux navigateur), toutes les méthodes ne font rien.
 */

export type Son =
  | 'clic'
  | 'piece'
  | 'signature'
  | 'disque'
  | 'rideau'
  | 'alerte'
  | 'succes'
  | 'carte'
  | 'revelation'
  | 'trophee';

export interface PreferencesAudio {
  sons: boolean;
  musique: boolean;
}

export const PREFERENCES_PAR_DEFAUT: PreferencesAudio = { sons: true, musique: true };

const CLE = 'tycoon:label:audio';

export function lirePreferences(): PreferencesAudio {
  try {
    const brut = window.localStorage.getItem(CLE);
    return brut
      ? { ...PREFERENCES_PAR_DEFAUT, ...(JSON.parse(brut) as Partial<PreferencesAudio>) }
      : PREFERENCES_PAR_DEFAUT;
  } catch {
    return PREFERENCES_PAR_DEFAUT;
  }
}

export function ecrirePreferences(p: PreferencesAudio): void {
  try {
    window.localStorage.setItem(CLE, JSON.stringify(p));
  } catch {
    /* stockage indisponible : le choix vaut pour la session */
  }
}

/** Fréquence d'une note MIDI. */
export const frequence = (midi: number): number => 440 * 2 ** ((midi - 69) / 12);

/** Grille d'accords de la musique de fond : La mineur, Fa, Do, Sol (basse puis accord). */
export const ACCORDS: readonly { basse: number; notes: readonly number[] }[] = [
  { basse: 45, notes: [57, 60, 64] },
  { basse: 41, notes: [57, 60, 65] },
  { basse: 48, notes: [55, 60, 64] },
  { basse: 43, notes: [55, 59, 62] },
];

const TEMPO = 96;
const TEMPS = 60 / TEMPO;

type Contexte = AudioContext;

export class MoteurAudio {
  private ctx: Contexte | null = null;
  private maitre: GainNode | null = null;
  private busSons: GainNode | null = null;
  private busMusique: GainNode | null = null;
  private minuteur: ReturnType<typeof setInterval> | null = null;
  private prochaineNote = 0;
  private pas = 0;
  private prefs: PreferencesAudio;

  constructor(
    prefs: PreferencesAudio = PREFERENCES_PAR_DEFAUT,
    private readonly fabrique: () => Contexte | null = () =>
      typeof window !== 'undefined' && 'AudioContext' in window ? new window.AudioContext() : null,
  ) {
    this.prefs = prefs;
  }

  get preferences(): PreferencesAudio {
    return this.prefs;
  }

  /** À appeler depuis un geste du joueur : crée le contexte, le réveille et lance la musique. */
  activer(): void {
    if (!this.ctx) {
      const ctx = this.fabrique();
      if (!ctx) return;
      this.ctx = ctx;
      this.maitre = ctx.createGain();
      this.maitre.gain.value = 0.7;
      this.maitre.connect(ctx.destination);
      this.busSons = ctx.createGain();
      this.busSons.gain.value = 0.9;
      this.busSons.connect(this.maitre);
      this.busMusique = ctx.createGain();
      this.busMusique.gain.value = 0.16;
      this.busMusique.connect(this.maitre);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    this.appliquerMusique();
  }

  regler(prefs: PreferencesAudio): void {
    this.prefs = prefs;
    ecrirePreferences(prefs);
    this.appliquerMusique();
  }

  arreter(): void {
    this.couperMusique();
    void this.ctx?.close();
    this.ctx = null;
  }

  private appliquerMusique(): void {
    if (this.prefs.musique) this.lancerMusique();
    else this.couperMusique();
  }

  private lancerMusique(): void {
    const ctx = this.ctx;
    if (!ctx || this.minuteur) return;
    this.prochaineNote = ctx.currentTime + 0.1;
    this.pas = 0;
    this.minuteur = setInterval(() => this.planifier(), 40);
  }

  private couperMusique(): void {
    if (this.minuteur) clearInterval(this.minuteur);
    this.minuteur = null;
  }

  /** Planifie les notes des 200 prochaines millisecondes (croches : 8 par mesure, 4 mesures). */
  private planifier(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    while (this.prochaineNote < ctx.currentTime + 0.2) {
      const croche = TEMPS / 2;
      const indice = this.pas % 32;
      const accord = ACCORDS[Math.floor(indice / 8) % ACCORDS.length];
      const t = this.prochaineNote;
      if (accord) {
        const dansMesure = indice % 8;
        if (dansMesure === 0) {
          this.note(frequence(accord.basse), t, TEMPS * 3.6, 'sine', 0.55, this.busMusique);
          for (const n of accord.notes)
            this.note(frequence(n), t, TEMPS * 3.8, 'triangle', 0.16, this.busMusique, 1200);
        }
        if (dansMesure === 4)
          this.note(frequence(accord.basse + 12), t, TEMPS * 0.9, 'sine', 0.3, this.busMusique);
        const arpege = accord.notes[dansMesure % accord.notes.length];
        if (arpege !== undefined && dansMesure % 2 === 1)
          this.note(frequence(arpege + 12), t, croche * 0.9, 'square', 0.07, this.busMusique, 1800);
      }
      if (indice % 2 === 0) this.bruit(t, 0.03, 0.08, 7000, this.busMusique);
      this.prochaineNote += croche;
      this.pas += 1;
    }
  }

  /** Une note enveloppée (attaque courte, extinction douce). */
  private note(
    freq: number,
    quand: number,
    duree: number,
    type: OscillatorType,
    volume: number,
    bus: GainNode | null,
    filtre = 0,
    glisse = 0,
  ): void {
    const ctx = this.ctx;
    if (!ctx || !bus) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, quand);
    if (glisse) osc.frequency.exponentialRampToValueAtTime(Math.max(20, glisse), quand + duree);
    gain.gain.setValueAtTime(0.0001, quand);
    gain.gain.exponentialRampToValueAtTime(volume, quand + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, quand + duree);
    let sortie: AudioNode = osc;
    if (filtre) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = filtre;
      osc.connect(f);
      sortie = f;
    }
    sortie.connect(gain);
    gain.connect(bus);
    osc.start(quand);
    osc.stop(quand + duree + 0.05);
  }

  /** Un souffle de bruit filtré (frappe, balayage, tampon). */
  private bruit(
    quand: number,
    duree: number,
    volume: number,
    coupure: number,
    bus: GainNode | null,
    balayage = 0,
  ): void {
    const ctx = this.ctx;
    if (!ctx || !bus) return;
    const longueur = Math.max(1, Math.floor(ctx.sampleRate * duree));
    const tampon = ctx.createBuffer(1, longueur, ctx.sampleRate);
    const donnees = tampon.getChannelData(0);
    for (let i = 0; i < longueur; i += 1)
      donnees[i] = ((i * 7919 + (i >> 3) * 104729) % 2000) / 1000 - 1;
    const source = ctx.createBufferSource();
    source.buffer = tampon;
    const f = ctx.createBiquadFilter();
    f.type = balayage ? 'bandpass' : 'highpass';
    f.frequency.setValueAtTime(coupure, quand);
    if (balayage) f.frequency.exponentialRampToValueAtTime(balayage, quand + duree);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, quand);
    gain.gain.exponentialRampToValueAtTime(0.0001, quand + duree);
    source.connect(f);
    f.connect(gain);
    gain.connect(bus);
    source.start(quand);
  }

  /** Joue un bruitage (ignoré si les sons sont coupés ou le contexte pas encore activé). */
  jouer(son: Son): void {
    const ctx = this.ctx;
    if (!ctx || !this.prefs.sons) return;
    const t = ctx.currentTime;
    const b = this.busSons;
    switch (son) {
      case 'clic':
        this.note(1200, t, 0.05, 'triangle', 0.1, b);
        break;
      case 'piece':
        this.note(1318, t, 0.09, 'square', 0.12, b, 4000);
        this.note(1760, t + 0.07, 0.22, 'square', 0.12, b, 4000);
        break;
      case 'signature':
        this.bruit(t, 0.12, 0.5, 300, b);
        this.note(130, t, 0.25, 'sine', 0.7, b, 0, 55);
        this.note(523, t + 0.18, 0.12, 'triangle', 0.2, b);
        this.note(784, t + 0.28, 0.3, 'triangle', 0.2, b);
        break;
      case 'disque':
        [72, 76, 79, 84].forEach((m, i) =>
          this.note(frequence(m), t + i * 0.09, 0.4, 'triangle', 0.2, b),
        );
        break;
      case 'rideau':
        this.bruit(t, 0.9, 0.35, 300, b, 3200);
        break;
      case 'alerte':
        this.note(440, t, 0.18, 'sawtooth', 0.14, b, 1500);
        this.note(330, t + 0.18, 0.3, 'sawtooth', 0.14, b, 1500);
        break;
      case 'succes':
        [67, 72, 76].forEach((m, i) =>
          this.note(frequence(m), t + i * 0.12, 0.35, 'square', 0.12, b, 3000),
        );
        break;
      case 'carte':
        this.bruit(t, 0.18, 0.25, 1500, b, 6000);
        break;
      case 'revelation':
        this.note(300, t, 0.6, 'sine', 0.25, b, 0, 1400);
        this.bruit(t + 0.5, 0.4, 0.2, 5000, b);
        break;
      case 'trophee':
        [72, 76, 79, 84, 88].forEach((m, i) =>
          this.note(frequence(m), t + i * 0.1, 0.6, 'triangle', 0.22, b),
        );
        this.bruit(t + 0.5, 0.8, 0.25, 6000, b);
        break;
    }
  }
}
