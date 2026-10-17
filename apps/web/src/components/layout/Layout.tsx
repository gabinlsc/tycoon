import { Outlet } from 'react-router-dom';
import { SiteFooter } from './SiteFooter';
import { Navbar } from './Navbar';
import { ScrollManager } from './ScrollManager';

/** Structure commune à toutes les pages : barre, contenu, pied de page. */
export function Layout() {
  return (
    <>
      <ScrollManager />
      <a className="skip-link" href="#contenu">
        Aller au contenu
      </a>
      <Navbar />
      <main id="contenu">
        <Outlet />
      </main>
      <SiteFooter />
    </>
  );
}
