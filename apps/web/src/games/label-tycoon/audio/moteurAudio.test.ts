import { describe, expect, it, vi } from 'vitest';
import { sonDeLActu } from './useAudio';
import { ACCORDS, MoteurAudio, frequence } from './moteurAudio';

/** Contexte audio minimal qui compte les oscillateurs créés. */
function faux() {
  const noeud = () => ({
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    gain: { value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    frequency: { value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    getChannelData: () => new Float32Array(8),
  });
  const ctx = {
    currentTime: 0,
    sampleRate: 8000,
    state: 'running',
    destination: {},
    createGain: vi.fn(noeud),
    createOscillator: vi.fn(noeud),
    createBiquadFilter: vi.fn(noeud),
    createBufferSource: vi.fn(noeud),
    createBuffer: vi.fn(() => noeud()),
    close: vi.fn(),
    resume: vi.fn(),
  };
  return ctx;
}

describe('moteur audio', () => {
  it('calcule les fréquences des notes', () => {
    expect(frequence(69)).toBe(440);
    expect(Math.round(frequence(81))).toBe(880);
    expect(ACCORDS).toHaveLength(4);
  });

  it('ne fait rien sans contexte audio', () => {
    const m = new MoteurAudio({ sons: true, musique: true }, () => null);
    expect(() => {
      m.activer();
      m.jouer('piece');
    }).not.toThrow();
  });

  it('joue un bruitage une fois activé, et se tait quand les sons sont coupés', () => {
    const ctx = faux();
    const m = new MoteurAudio({ sons: true, musique: false }, () => ctx as unknown as AudioContext);
    m.jouer('piece');
    expect(ctx.createOscillator).not.toHaveBeenCalled();
    m.activer();
    m.jouer('piece');
    expect(ctx.createOscillator).toHaveBeenCalledTimes(2);
    m.regler({ sons: false, musique: false });
    m.jouer('piece');
    expect(ctx.createOscillator).toHaveBeenCalledTimes(2);
  });

  it('associe les actus importantes à un bruitage', () => {
    expect(sonDeLActu('certification')).toBe('disque');
    expect(sonDeLActu('prix-remporte')).toBe('trophee');
    expect(sonDeLActu('alerte-faillite')).toBe('alerte');
    expect(sonDeLActu('sortie')).toBeNull();
  });
});
