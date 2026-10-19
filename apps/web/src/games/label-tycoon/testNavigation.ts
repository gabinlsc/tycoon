import { fireEvent, screen, within } from '@testing-library/react';
import { ECRANS, poleDe } from './ecrans';

/** Ouvre un écran comme le ferait un joueur : le pôle dans la barre latérale, puis l'onglet. */
export async function allerAEcran(nom: RegExp): Promise<void> {
  const ecran = ECRANS.find((e) => nom.test(e.titre));
  if (!ecran) throw new Error(`Écran introuvable : ${String(nom)}`);
  const pole = poleDe(ecran.id);
  const nav = await screen.findByRole('navigation', { name: 'Écrans du jeu' });
  fireEvent.click(within(nav).getByRole('button', { name: new RegExp(`^${pole.titre}`) }));
  if (pole.ecrans.length > 1)
    fireEvent.click(await screen.findByRole('tab', { name: new RegExp(`^${ecran.titre}`) }));
}
