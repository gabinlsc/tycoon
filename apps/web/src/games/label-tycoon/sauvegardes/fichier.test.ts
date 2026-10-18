import { describe, expect, it } from 'vitest';
import { LabelPilot } from '@tycoon/label-tycoon';
import { exporterFichier, importerFichier, nomFichier, validerPartie } from './fichier';
import type { SauvegardeLabel } from './stockage';

function partieReelle(): SauvegardeLabel {
  const pilote = new LabelPilot();
  pilote.handle({ type: 'nouvelle-partie', graine: 'export' });
  pilote.handle({ type: 'avancer', semaines: 2 });
  const r = pilote.handle({ type: 'sauvegarder' });
  if (r.type !== 'sauvegarde') throw new Error('sauvegarde attendue');
  return {
    version: 1,
    sauvegarde: r.sauvegarde,
    semaine: 2,
    label: 'Néon Records',
    palier: 'Home-studio',
    tresorerie: 123,
    enregistreLe: '',
  };
}

describe('export et import de sauvegarde', () => {
  it('fait l’aller-retour sans perte', () => {
    const s = partieReelle();
    const lu = importerFichier(exporterFichier(s));
    expect(lu.ok).toBe(true);
    if (lu.ok) {
      expect(JSON.parse(lu.sauvegarde.sauvegarde)).toEqual(JSON.parse(s.sauvegarde));
      expect(lu.sauvegarde.label).toBe('Néon Records');
      expect(lu.sauvegarde.semaine).toBe(2);
    }
  });
  it('refuse sans lever d’exception un fichier qui n’est pas du JSON', () => {
    expect(importerFichier('pas du json {')).toEqual({
      ok: false,
      erreur: 'ce fichier n’est pas du JSON valide',
    });
  });
  it('refuse un JSON étranger', () => {
    const r = importerFichier('{"hello":"world"}');
    expect(r.ok).toBe(false);
  });
  it('refuse une version plus récente', () => {
    const f = JSON.parse(exporterFichier(partieReelle())) as Record<string, unknown>;
    f['version'] = 99;
    const r = importerFichier(JSON.stringify(f));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erreur).toMatch(/plus récente/);
  });
  it('détecte une partie abîmée', () => {
    const f = JSON.parse(exporterFichier(partieReelle())) as {
      partie: { engine: { data: { label: { tresorerie: unknown } } } };
    };
    f.partie.engine.data.label.tresorerie = 'beaucoup';
    const r = importerFichier(JSON.stringify(f));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erreur).toMatch(/abîmée/);
  });
  it('valide une partie du moteur et rejette un texte tronqué', () => {
    const s = partieReelle();
    expect(validerPartie(s.sauvegarde).ok).toBe(true);
    expect(validerPartie(s.sauvegarde.slice(0, 200)).ok).toBe(false);
    expect(validerPartie('{"engine":{}}').ok).toBe(false);
  });
  it('propose un nom de fichier propre', () => {
    expect(nomFichier(partieReelle())).toBe('label-tycoon-n-on-records-semaine-2.json');
  });
});
