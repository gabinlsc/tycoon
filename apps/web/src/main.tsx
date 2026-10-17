import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles/arcade/tokens.css';
import './styles/arcade/base.css';
import './styles/arcade/ui.css';
import './styles/arcade/navbar.css';
import './styles/arcade/hero.css';
import './styles/arcade/games.css';
import './styles/arcade/sections.css';
import './styles/arcade/pages.css';
import './styles/arcade/account.css';
import { AccountProvider } from './accounts/AccountContext';
import { App } from './App';

const root = document.getElementById('root');
if (!root) throw new Error('Élément #root introuvable');

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <AccountProvider>
        <App />
      </AccountProvider>
    </BrowserRouter>
  </StrictMode>,
);
