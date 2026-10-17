import { useMemo } from 'react';
import { dailyFeed } from '../../data/feed';
import { Coin } from './ui/Coin';

/**
 * Fil d'actualité qui défile en boucle : deux copies de la liste, translation de -50 %.
 * La version animée est cachée aux lecteurs d'écran, qui reçoivent une liste statique.
 */
export function ActivityFeed() {
  const items = useMemo(() => dailyFeed(new Date()), []);

  return (
    <section className="feed" aria-label="Dernières nouvelles de la communauté">
      <div className="feed__viewport" aria-hidden="true">
        <div className="feed__track">
          {[0, 1].map((copy) => (
            <ul key={copy} className="feed__list">
              {items.map((item) => (
                <li key={item.id} className="feed__item">
                  <Coin size={26} />
                  <span>{item.text}</span>
                  <strong className="mono">+${item.amount}</strong>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
      <ul className="visually-hidden">
        {items.map((item) => (
          <li key={item.id}>
            {item.text} : plus {item.amount} de dollars.
          </li>
        ))}
      </ul>
    </section>
  );
}
