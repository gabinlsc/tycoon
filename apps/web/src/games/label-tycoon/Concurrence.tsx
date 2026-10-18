import type { VueConcurrence } from '@tycoon/label-tycoon';
import { Button } from '../../components/arcade/ui/Button';
import { GraphBarres } from './graphiques/Graphiques';
import { useLabel } from './LabelContext';

const eur = (cents: number): string => `${Math.round(cents / 100).toLocaleString('fr-FR')} €`;

/** Rivaux triés du plus valorisé au moins valorisé. */
export const parValorisation = (rivaux: VueConcurrence['rivaux']): VueConcurrence['rivaux'] =>
  [...rivaux].sort((a, b) => b.valorisation - a.valorisation || a.nom.localeCompare(b.nom, 'fr'));

/** Les labels rivaux, leurs artistes, les offres de rachat et la part de marché par genre. */
export function Concurrence() {
  const { vue, envoyer } = useLabel();
  if (!vue) return null;
  const c = vue.concurrence;
  const parts = c.parts.filter((p) => p.joueur + p.rivaux + p.libres > 0);

  return (
    <section className="label-screen" aria-labelledby="concurrence-titre">
      <h2 id="concurrence-titre">Concurrence</h2>

      {c.offres.length > 0 ? (
        <>
          <h3>Offres de rachat reçues</h3>
          <ul className="label-list">
            {c.offres.map((o) => (
              <li key={o.id}>
                {o.rival} propose {eur(o.prix)} pour {o.artiste} (expire semaine {o.expire}).{' '}
                <Button
                  type="button"
                  tone="gold"
                  onClick={() =>
                    void envoyer({
                      type: 'action',
                      action: { type: 'accepter-rachat', offreId: o.id },
                    })
                  }
                >
                  Accepter l’offre de {o.rival}
                </Button>{' '}
                <Button
                  type="button"
                  onClick={() =>
                    void envoyer({
                      type: 'action',
                      action: { type: 'refuser-rachat', offreId: o.id },
                    })
                  }
                >
                  Refuser l’offre de {o.rival}
                </Button>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <h3>Labels rivaux</h3>
      {c.rivaux.length === 0 ? (
        <p className="label-screen__soon">Aucun rival pour l’instant.</p>
      ) : (
        parValorisation(c.rivaux).map((r) => (
          <article key={r.id} className="label-card" aria-label={r.nom}>
            <h4>{r.nom}</h4>
            <p>
              {r.personnalite} · genre fétiche : {r.genreFetiche} · réputation{' '}
              <span className="mono">{r.reputation}</span>
            </p>
            <p>
              Trésorerie <span className="mono">{eur(r.tresorerie)}</span> · valorisation estimée{' '}
              <span className="mono">{eur(r.valorisation)}</span>
            </p>
            {r.roster.length === 0 ? (
              <p className="label-screen__soon">Aucun artiste sous contrat.</p>
            ) : (
              <ul className="label-list">
                {r.roster.map((a) => (
                  <li key={a.id}>
                    {a.nom} — {a.genreNom}, notoriété <span className="mono">{a.notoriete}</span>{' '}
                    <Button
                      type="button"
                      disabled={vue.finances.tresorerie < a.prixRachat}
                      onClick={() =>
                        void envoyer({
                          type: 'action',
                          action: { type: 'racheter-artiste', artisteId: a.id },
                        })
                      }
                    >
                      Racheter {a.nom} ({eur(a.prixRachat)})
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))
      )}

      <h3>Parts de marché par genre</h3>
      {parts.length === 0 ? (
        <p className="label-screen__soon">Aucun artiste actif pour l’instant.</p>
      ) : (
        <GraphBarres
          titre="Artistes par genre : toi, les rivaux, libres"
          etiquettes={parts.map((p) => p.nom.slice(0, 8))}
          series={[
            { nom: 'Toi', valeurs: parts.map((p) => p.joueur) },
            { nom: 'Rivaux', valeurs: parts.map((p) => p.rivaux) },
            { nom: 'Libres', valeurs: parts.map((p) => p.libres) },
          ]}
        />
      )}

      <h3>Affrontements récents</h3>
      {c.affrontements.length === 0 ? (
        <p className="label-screen__soon">Rien à signaler.</p>
      ) : (
        <ul className="label-list">
          {c.affrontements.map((a) => (
            <li key={a.id}>
              <strong>Sem. {a.semaine}</strong> — {a.titre} : {a.texte}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
