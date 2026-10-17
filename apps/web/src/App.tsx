import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { GamePage } from './pages/GamePage';
import { GamesPage } from './pages/GamesPage';
import { HomePage } from './pages/HomePage';
import { LegalPage } from './pages/LegalPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="jeux" element={<GamesPage />} />
        <Route path="jeux/:slug" element={<GamePage />} />
        <Route path="mentions-legales" element={<LegalPage title="Mentions légales" />} />
        <Route path="confidentialite" element={<LegalPage title="Confidentialité" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
