import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { humeurDuMoral, Visage } from './Visage';

describe('Visage', () => {
  it('traduit le moral en humeur', () => {
    expect(humeurDuMoral(90)).toBe('ravi');
    expect(humeurDuMoral(50)).toBe('neutre');
    expect(humeurDuMoral(25)).toBe('triste');
    expect(humeurDuMoral(5)).toBe('furieux');
  });

  it('change le dessin selon l’humeur', () => {
    const rendu = (h: 'ravi' | 'neutre' | 'furieux') =>
      renderToStaticMarkup(<Visage graine="Taylar Zweft" humeur={h} />);
    expect(rendu('ravi')).not.toBe(rendu('neutre'));
    expect(rendu('furieux')).not.toBe(rendu('neutre'));
    expect(rendu('neutre')).toBe(renderToStaticMarkup(<Visage graine="Taylar Zweft" />));
  });
});
