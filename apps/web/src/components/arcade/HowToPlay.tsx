import { HOW_IT_WORKS } from '../../data/howItWorks';
import { Reveal } from './ui/Reveal';
import { SectionTitle } from './ui/SectionTitle';

const COLORS = ['green', 'purple', 'orange', 'pink'] as const;

/** Quatre cartes numérotées : les règles du hub en un coup d'œil. */
export function HowToPlay() {
  return (
    <section id="a-propos" className="how page" aria-labelledby="comment-titre">
      <SectionTitle
        level="4"
        id="comment-titre"
        title="Comment jouer"
        kicker="Quatre règles, dont aucune ne demande ton e-mail."
      />
      <div className="how__grid">
        {HOW_IT_WORKS.map((article, index) => (
          <Reveal as="article" key={article.numeral} delay={index * 90} className="how__card card">
            <p
              className={`how__number mono game-bg game-bg--${COLORS[index % COLORS.length] ?? 'green'}`}
              aria-hidden="true"
            >
              {index + 1}
            </p>
            <h3 className="how__title">{article.title}</h3>
            {article.paragraphs.map((text) => (
              <p key={text}>{text}</p>
            ))}
          </Reveal>
        ))}
      </div>
    </section>
  );
}
