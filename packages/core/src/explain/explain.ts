/**
 * Explication d'un calcul : au lieu de renvoyer un nombre nu, une formule peut renvoyer le nombre
 * **et** la liste ordonnée des termes qui l'ont produit. L'interface en fait une infobulle (« la
 * qualité vient pour 12 points de la plume, 8 du producteur… ») : le joueur comprend toujours
 * pourquoi il gagne ou perd.
 *
 * Le calcul se construit pas à pas à partir de 0. Chaque terme enregistre sa **contribution**,
 * c'est-à-dire la variation qu'il apporte à la valeur courante. La somme des contributions est donc
 * toujours exactement la valeur finale.
 *
 * Aucun texte ici : un terme porte une clé (`key`) que l'interface traduit.
 */

export type TermKind =
  /** Terme pondéré ajouté à la somme : `valeur × poids`. */
  | 'terme'
  /** Facteur multiplicatif appliqué à tout ce qui précède. */
  | 'facteur'
  /** Ajout ou retrait d'une quantité fixe (un bruit, un bonus). */
  | 'ajout'
  /** Bornage : n'a d'effet que si la valeur sortait de l'intervalle. */
  | 'borne';

export interface Term {
  key: string;
  kind: TermKind;
  /** Donnée d'entrée du terme (la compétence, le facteur, le bonus, la borne appliquée). */
  input: number;
  /** Poids d'un terme pondéré (1 pour les autres). */
  weight: number;
  /** Variation apportée à la valeur courante. */
  contribution: number;
}

export interface Explained {
  value: number;
  terms: readonly Term[];
}

/** Constructeur d'explication. Chaque méthode renvoie le constructeur pour s'enchaîner. */
export class Explainer {
  private current = 0;
  private readonly steps: Term[] = [];

  private push(term: Omit<Term, 'contribution'>, after: number): this {
    const before = this.current;
    this.current = after;
    this.steps.push({ ...term, contribution: after - before });
    return this;
  }

  /** Ajoute `input × weight` à la somme. */
  term(key: string, input: number, weight = 1): this {
    return this.push({ key, kind: 'terme', input, weight }, this.current + input * weight);
  }

  /** Multiplie tout ce qui précède par `factor`. */
  scale(key: string, factor: number): this {
    return this.push({ key, kind: 'facteur', input: factor, weight: 1 }, this.current * factor);
  }

  /** Ajoute une quantité fixe (positive ou négative). */
  offset(key: string, delta: number): this {
    return this.push({ key, kind: 'ajout', input: delta, weight: 1 }, this.current + delta);
  }

  /** Borne la valeur dans `[low, high]`. La contribution est nulle si la valeur y était déjà. */
  limit(key: string, low: number, high: number): this {
    const bounded = this.current < low ? low : this.current > high ? high : this.current;
    return this.push({ key, kind: 'borne', input: bounded, weight: 1 }, bounded);
  }

  /** Valeur courante (utile pour enchaîner des étapes qui dépendent du résultat intermédiaire). */
  get value(): number {
    return this.current;
  }

  done(): Explained {
    return { value: this.current, terms: [...this.steps] };
  }
}

/** Démarre une explication. */
export const explain = (): Explainer => new Explainer();

/** Termes classés du plus grand effet (en valeur absolue) au plus petit, bornes sans effet exclues. */
export function dominantTerms(explained: Explained, limit = explained.terms.length): Term[] {
  return explained.terms
    .filter((t) => t.contribution !== 0)
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
    .slice(0, limit);
}

/**
 * Part de chaque terme dans la valeur finale, entre -∞ et +∞ (un terme négatif a une part
 * négative). Renvoie 0 pour tous si la valeur finale est nulle.
 */
export function shares(explained: Explained): Array<{ key: string; share: number }> {
  return explained.terms.map((t) => ({
    key: t.key,
    share: explained.value === 0 ? 0 : t.contribution / explained.value,
  }));
}
