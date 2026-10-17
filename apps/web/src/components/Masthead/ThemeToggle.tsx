import { useTheme } from '../../lib/useTheme';

/** Bascule manuelle entre « Édition du matin » et « Édition du soir ». */
export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const dark = theme === 'dark';
  return (
    <button type="button" className="theme-toggle mono" onClick={toggle} aria-pressed={dark}>
      {dark ? '● ' : '○ '}Édition du soir
    </button>
  );
}
