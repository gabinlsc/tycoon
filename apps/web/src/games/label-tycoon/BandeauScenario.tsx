import type { VueScenario } from '@tycoon/label-tycoon';

const RAISONS: Record<NonNullable<VueScenario['raison']>, string> = {
  faillite: 'Le label a fait faillite.',
  temps: 'Le temps imparti est écoulé.',
  regle: 'Une règle du scénario a été brisée.',
};

/** Ce qu'il reste de temps, en années et semaines (« 1 an 12 sem. »). */
export function formaterDelai(semaines: number): string {
  const ans = Math.floor(semaines / 52);
  const reste = semaines % 52;
  if (ans === 0) return `${reste} sem.`;
  return reste === 0
    ? `${ans} an${ans > 1 ? 's' : ''}`
    : `${ans} an${ans > 1 ? 's' : ''} ${reste} sem.`;
}

/** Suivi du scénario en cours : objectifs, règles, temps restant, puis résultat. */
export function BandeauScenario({ scenario }: { scenario: VueScenario }) {
  const fini = scenario.statut !== 'en-cours';
  return (
    <section className="label-screen label-scenario" aria-label={`Scénario : ${scenario.titre}`}>
      <h2>{scenario.titre}</h2>
      {scenario.statut === 'reussi' ? (
        <p role="status" className="label-scenario__issue">
          Scénario réussi en {formaterDelai(scenario.fin ?? 0)} ! Score :{' '}
          <strong className="mono">{(scenario.score ?? 0).toLocaleString('fr-FR')}</strong>. Tu peux
          continuer à jouer librement.
        </p>
      ) : null}
      {scenario.statut === 'echec' ? (
        <p role="status" className="label-error">
          Scénario perdu. {scenario.raison ? RAISONS[scenario.raison] : ''} Tu peux continuer à
          jouer librement.
        </p>
      ) : null}
      {fini ? null : (
        <p>
          Temps restant :{' '}
          <strong className="mono">{formaterDelai(scenario.semainesRestantes)}</strong>
        </p>
      )}
      <ul className="label-list">
        {scenario.objectifs.map((o) => (
          <li key={o.texte} data-atteint={o.atteint}>
            {o.atteint ? '✔ ' : '○ '}
            {o.texte}
          </li>
        ))}
        {scenario.regles.map((r) => (
          <li key={r.texte} data-respectee={r.respectee}>
            {r.respectee ? '✔ ' : '✘ '}Règle : {r.texte}
          </li>
        ))}
      </ul>
    </section>
  );
}
