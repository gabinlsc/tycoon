import { describe, expect, it } from 'vitest';
describe('palier suivant dans la vue', () => {
  it('donne les conditions du palier suivant, puis rien au dernier palier', async () => {
    const { newGame } = await import('./index');
    const { buildView } = await import('./view');
    const d = newGame('palier-vue').engine.data;
    const p = buildView(d, 0).prochainPalier;
    expect(p?.id).toBe('independant');
    expect(p?.reputation.requise).toBeGreaterThan(0);
    expect(p?.certification).toEqual({ requise: 'or', atteinte: false });
    expect(buildView(d, 0).label.palierId).toBe('home-studio');
    d.label.tier = 'institution';
    expect(buildView(d, 0).prochainPalier).toBeNull();
  });
});
