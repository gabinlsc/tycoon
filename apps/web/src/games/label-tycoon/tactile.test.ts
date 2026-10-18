import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const lire = (chemin: string): string => readFileSync(resolve(process.cwd(), chemin), 'utf8');

/** Corps du bloc `@media (pointer: coarse)…` d'une feuille de style. */
const blocTactile = (css: string): string => {
  const debut = css.indexOf('@media (pointer: coarse)');
  return debut < 0 ? '' : css.slice(debut);
};

describe('cibles tactiles', () => {
  it('le jeu impose 44 px aux boutons du temps, de la navigation et aux champs', () => {
    const bloc = blocTactile(lire('src/games/label-tycoon/label.css'));
    for (const sel of ['.label-time__btn', '.label-nav__item', 'select', "input[type='number']"])
      expect(bloc, sel).toContain(sel);
    expect(bloc).toContain('min-height: 44px');
  });
  it('la barre du site et les boutons génériques font de même', () => {
    expect(blocTactile(lire('src/styles/arcade/navbar.css'))).toContain('min-height: 44px');
    expect(blocTactile(lire('src/styles/arcade/ui.css'))).toContain('.btn');
  });
});
