import { type Cents, money } from '@tycoon/core';

/** Friction de fin de partie (GDD, 14.6) : anti-concentration, piratage, plateformes qui renégocient. Dès le palier Groupe. */
export const REGULATION = {
  /** Anti-concentration : part de marché (fans des artistes du label sur ceux des labels) au-delà de laquelle on est surveillé. */
  concentration: {
    threshold: 0.35,
    /** Points de surveillance gagnés par semaine et par point de part au-dessus du seuil (part en 0-1). */
    gain: 40,
    /** Points perdus par semaine sous le seuil. */
    relief: 1.5,
    warning: 70,
    /** À 100, amende : part du chiffre d'affaires des 52 dernières semaines, puis retour à ce niveau. */
    fineShare: 0.02,
    afterFine: 40,
    /** Plaidoyer auprès des autorités : coût, points retirés, semaines avant de pouvoir recommencer. */
    lobbyCost: money.euros(2_000_000) as Cents,
    lobbyRelief: 30,
    lobbyCooldown: 26,
  },
  piratage: {
    /** Durée d'une vague, sa gravité (part des écoutes perdues) et le délai avant la suivante. */
    weeks: { min: 8, max: 16 },
    severity: { min: 0.05, max: 0.15 },
    gap: { min: 80, max: 160 },
    first: { min: 60, max: 140 },
    /** Veille anti-piratage : niveaux, coût hebdomadaire par niveau, part de gravité retirée par niveau. */
    maxLevel: 3,
    levelCost: money.euros(50_000) as Cents,
    levelRelief: 0.3,
  },
  renegociation: {
    /** Préavis avant l'application, durée des nouveaux tarifs, baisse et délai avant le prochain cycle. */
    notice: 8,
    weeks: 52,
    cut: { min: 0.03, max: 0.08 },
    gap: { min: 130, max: 180 },
    first: { min: 120, max: 200 },
    /** Résister : coût, chance de base, poids de la réputation et de l'influence (par point), et part de baisse restante en cas de succès. */
    resistCost: money.euros(1_500_000) as Cents,
    resistBase: 0.2,
    resistPerReputation: 0.005,
    resistPerInfluence: 0.005,
    resistMax: 0.85,
    resistRemaining: 0.4,
  },
} as const;
