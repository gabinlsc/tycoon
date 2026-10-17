import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/arcade/tokens.css';
import './styles/arcade/base.css';
import './styles/arcade/ui.css';
import './styles/arcade/navbar.css';
import './styles/arcade/hero.css';
import './styles/arcade/games.css';
import './styles/arcade/sections.css';
import { App } from './App';

const root = document.getElementById('root');
if (!root) throw new Error('Élément #root introuvable');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
