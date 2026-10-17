import { Masthead } from './components/Masthead/Masthead';

export function App() {
  return (
    <>
      <a className="skip-link" href="#contenu">
        Aller au contenu
      </a>
      <Masthead />
      <main id="contenu" className="page" />
    </>
  );
}
