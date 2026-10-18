import { money } from '@tycoon/core';
import { describe, expect, it } from 'vitest';
import { EVENTS } from '../../balance';
import { newGame } from '../../game';
import { sizedCost } from './helpers';

const avec = (euros: number) => {
  const s = newGame('sized');
  s.engine.data.label.tresorerie = money.euros(euros);
  return s.engine.data;
};

describe('coût des mésaventures', () => {
  it('plafonne le coût à une part de la trésorerie pour un petit label', () => {
    const d = avec(20_000);
    expect(sizedCost(d, money.euros(15_000))).toBe(
      Math.round(money.euros(20_000) * EVENTS.misfortuneCashShare),
    );
  });
  it('garde un plancher quand la caisse est presque vide ou négative', () => {
    expect(sizedCost(avec(100), money.euros(15_000))).toBe(EVENTS.misfortuneFloor);
    expect(sizedCost(avec(-5000), money.euros(15_000))).toBe(EVENTS.misfortuneFloor);
  });
  it('fait payer le prix plein à un label riche, jamais plus que prévu', () => {
    expect(sizedCost(avec(1_000_000), money.euros(15_000))).toBe(money.euros(15_000));
    expect(sizedCost(avec(20_000), money.euros(500))).toBe(money.euros(500));
  });
});
