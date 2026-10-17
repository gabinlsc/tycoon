import { HOW_IT_WORKS } from '../../data/howItWorks';
import { Reveal } from '../ui/Reveal';
import { SectionHeading } from '../ui/SectionHeading';

/** Quatre colonnes de texte façon article, sans icônes : la mise en page fait le travail. */
export function HowItWorks() {
  return (
    <section id="a-propos" className="how page" aria-labelledby="comment-titre">
      <SectionHeading
        number="04"
        id="comment-titre"
        title="Comment ça marche"
        kicker="Quatre règles, dont aucune ne demande votre e-mail."
      />
      <div className="how__columns">
        {HOW_IT_WORKS.map((article) => (
          <Reveal as="article" key={article.numeral} className="how__article">
            <p className="how__numeral mono" aria-hidden="true">
              {article.numeral}
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
