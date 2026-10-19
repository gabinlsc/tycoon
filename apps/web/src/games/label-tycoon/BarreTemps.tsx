import { useEffect } from 'react';
import { Pause, Play, Settings2, StepForward } from 'lucide-react';
import { useTemps } from './useTemps';
import { useLabel } from './LabelContext';
import { CATEGORIES_PAUSE, LIBELLES_PAUSE, type Vitesse, vitessesDisponibles } from './temps';

const LIBELLE: Record<Vitesse, string> = {
  0: 'Pause',
  1: '×1',
  2: '×2',
  4: '×4',
  8: '×8',
  16: '×16',
};

/** Barre de temps : pause, vitesses, semaine par semaine, réglage des auto-pauses. */
export function BarreTemps() {
  const { vitesse, reglages, motif, regler, pause, semaine, basculer } = useTemps();
  const { vue } = useLabel();

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const cible = event.target as HTMLElement | null;
      if (
        cible &&
        (cible.isContentEditable ||
          ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(cible.tagName))
      )
        return;
      if (event.key === ' ') {
        event.preventDefault();
        if (vitesse === 0) regler(1);
        else pause();
      } else if (event.key === 'n' || event.key === 'N') {
        void semaine();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [vitesse, regler, pause, semaine]);

  return (
    <section className="label-time" aria-label="Temps">
      <div className="label-time__speeds" role="group" aria-label="Vitesse du temps">
        {vitessesDisponibles(vue?.partie.mode === 'bac-a-sable').map((v) => (
          <button
            key={v}
            type="button"
            className={`label-time__btn${v === 0 ? ' label-time__btn--pause' : ''}`}
            aria-pressed={vitesse === v}
            onClick={() => (v === 0 ? pause() : regler(v))}
            title={v === 0 ? 'Pause (espace)' : `Vitesse ${LIBELLE[v]}`}
          >
            {v === 0 ? <Pause aria-hidden="true" size={18} strokeWidth={3} /> : null}
            {v === 1 && vitesse === 0 ? (
              <Play aria-hidden="true" size={16} strokeWidth={3} />
            ) : null}
            <span className={v === 0 ? 'visually-hidden' : undefined}>{LIBELLE[v]}</span>
          </button>
        ))}
        <button
          type="button"
          className="label-time__btn label-time__btn--week"
          onClick={() => void semaine()}
          title="Avancer d’une semaine (touche N)"
        >
          <StepForward aria-hidden="true" size={18} strokeWidth={3} />
          Semaine
        </button>
      </div>
      <p className="label-time__reason" role="status" aria-live="polite">
        {motif ?? ''}
      </p>
      <details className="label-time__settings">
        <summary title="Choisir quand le jeu se met en pause tout seul">
          <Settings2 aria-hidden="true" size={18} />
          <span className="label-time__settings-texte">Auto-pauses</span>
        </summary>
        <fieldset>
          <legend className="visually-hidden">Mettre le jeu en pause quand…</legend>
          {CATEGORIES_PAUSE.map((c) => (
            <label key={c} className="label-time__check">
              <input
                type="checkbox"
                checked={reglages[c]}
                onChange={(e) => basculer(c, e.target.checked)}
              />
              {LIBELLES_PAUSE[c]}
            </label>
          ))}
        </fieldset>
      </details>
    </section>
  );
}
