import { describe, expect, it } from 'vitest';
import {
  CERTIFICATIONS,
  bestCertification,
  certificationFor,
  certificationThreshold,
  certify,
  equivalentSales,
  newGame,
} from './index';

const streamsFor = (sales: number) => sales * CERTIFICATIONS.streamsPerSale;

describe('seuils', () => {
  it('croissent avec le niveau, et valent plus pour un album', () => {
    expect(certificationThreshold('platine', 'single')).toBeGreaterThan(
      certificationThreshold('or', 'single'),
    );
    expect(certificationThreshold('diamant', 'single')).toBeGreaterThan(
      certificationThreshold('platine', 'single'),
    );
    expect(certificationThreshold('or', 'album')).toBe(
      certificationThreshold('or', 'single') * CERTIFICATIONS.albumFactor,
    );
  });
  it('donnent le bon niveau selon les streams cumulés', () => {
    expect(equivalentSales(300)).toBe(2);
    expect(certificationFor(streamsFor(100), 'single')).toBeNull();
    expect(certificationFor(streamsFor(certificationThreshold('or', 'single')), 'single')).toBe(
      'or',
    );
    expect(
      certificationFor(streamsFor(certificationThreshold('diamant', 'single')), 'single'),
    ).toBe('diamant');
  });
});

describe('attribution', () => {
  it('décerne chaque niveau une fois, avec réputation et signaux, sans rétrograder', () => {
    const d = newGame('cert').engine.data;
    d.projets.push({
      id: 7,
      artisteId: 1,
      type: 'single',
      clip: 'aucun',
      studio: 1,
      producteur: 1,
      mixage: 0,
      debut: 0,
      fin: 0,
      retard: 0,
      statut: 'sortie',
      qualite: 50,
      sortieLe: 0,
      s1: 0,
      hit: 0,
      viral: null,
      streams: streamsFor(certificationThreshold('platine', 'single')),
      derniers: 0,
      certification: null,
    });
    const signals: string[] = [];
    const rep = d.label.reputation;
    certify(d, (s) => signals.push(`${s.kind}`));
    expect(signals).toHaveLength(2);
    expect(d.projets[0]?.certification).toBe('platine');
    expect(d.label.reputation).toBe(
      rep + CERTIFICATIONS.reputationGain.or + CERTIFICATIONS.reputationGain.platine,
    );
    certify(d, (s) => signals.push(s.kind));
    expect(signals).toHaveLength(2);
    expect(bestCertification(d)).toBe('platine');
  });
});
