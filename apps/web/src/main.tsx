import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import './styles/base.css';
import './styles/masthead.css';
import './styles/ticker.css';
import './styles/reveal.css';
import './styles/headline.css';
import { App } from './App';
import { initIntro } from './lib/intro';

initIntro();

const root = document.getElementById('root');
if (!root) throw new Error('Élément #root introuvable');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
