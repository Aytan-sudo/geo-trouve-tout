// La fabrique de questions : determinisme, distracteurs, sacs de tirage.

import { counter, preparer } from './harness.mjs';
import { creerHasard, graineDepuisTexte } from '../js/hasard.js';
import { composerManche, sacDe, fabriquer, distracteurs, choisirCibles } from '../js/questions.js';
import { NIVEAUX } from '../js/variantes.js';

const { check, report } = counter();
const atlas = preparer('monde-pays');
const graine = () => creerHasard(graineDepuisTexte('2026-09-06'));

console.log('\nLes sacs');
const tailles = {};
for (const niveau of Object.keys(NIVEAUX)) {
    tailles[niveau] = sacDe(atlas, { niveau, sens: 'nommer' }).length;
}
check('Decouverte est le plus petit sac', tailles.decouverte < tailles.ecolier);
check('Ecolier est plus petit que Voyageur', tailles.ecolier < tailles.voyageur);
check('Voyageur prend toute la carte', tailles.voyageur === atlas.entites.length);
check('Decouverte tient entre 30 et 70 pays', tailles.decouverte >= 30 && tailles.decouverte <= 70, `(${tailles.decouverte})`);
check('le sac « capitale » ecarte les pays sans capitale',
    sacDe(atlas, { niveau: 'voyageur', sens: 'capitale' }).every(e => e.capitale));

console.log('\nDeterminisme');
const a = composerManche(atlas, { niveau: 'ecolier', sens: 'nommer' }, graine());
const b = composerManche(atlas, { niveau: 'ecolier', sens: 'nommer' }, graine());
check('meme graine, meme manche', JSON.stringify(a) === JSON.stringify(b));
const c = composerManche(atlas, { niveau: 'ecolier', sens: 'nommer' }, creerHasard(graineDepuisTexte('2026-09-07')));
check('graine differente, manche differente', JSON.stringify(a) !== JSON.stringify(c));
check('une manche fait dix questions', a.length === 10);

console.log('\nUne manche bien formee');
check('aucun pays ne revient deux fois', new Set(a.map(q => q.cible)).size === a.length);
for (const question of a) {
    const entite = atlas.parId.get(question.cible);
    if (!check(`${entite?.nom ?? question.cible} : quatre propositions`, question.propositions.length === 4)) break;
}
check('la bonne reponse est toujours proposee',
    a.every(q => q.propositions.includes(q.reponse)));
check('les propositions sont distinctes',
    a.every(q => new Set(q.propositions).size === q.propositions.length));
check('la bonne reponse ne tombe pas toujours a la meme place',
    new Set(a.map(q => q.propositions.indexOf(q.reponse))).size > 1);

console.log('\nLes distracteurs');
const sac = sacDe(atlas, { niveau: 'voyageur', sens: 'nommer' });
const france = atlas.parId.get('FRA');
const voisins = distracteurs(france, sac, 3, graine(), 'voisins');
check('« voisins » choisit des pays proches',
    voisins.every(e => Math.hypot(e.ancre[0] - france.ancre[0], e.ancre[1] - france.ancre[1]) < atlas.largeur / 6),
    voisins.map(e => e.nom).join(','));
const lointains = distracteurs(france, sac, 3, graine(), 'lointains');
check('« lointains » sort du continent', lointains.every(e => e.continent !== france.continent),
    lointains.map(e => e.nom).join(','));
const memeCoin = distracteurs(france, sac, 3, graine(), 'continent');
check('« continent » reste en Europe', memeCoin.every(e => e.continent === france.continent),
    memeCoin.map(e => e.nom).join(','));
check('un distracteur n’est jamais la reponse',
    [...voisins, ...lointains, ...memeCoin].every(e => e.id !== 'FRA'));

console.log('\nLe poids de revision');
// Un poids ecrasant sur un seul pays doit le faire sortir a tous les coups :
// c'est le mecanisme qui ramene les pays rates.
const force = choisirCibles(sac, 5, graine(), e => e.id === 'MNG' ? 100000 : 0.0001);
check('un poids ecrasant fait sortir le pays', force[0].id === 'MNG');
check('le tirage pondere ne repete pas', new Set(force.map(e => e.id)).size === 5);

console.log('\nLes sens');
const localiser = fabriquer(france, sac, { niveau: 'voyageur', sens: 'localiser' }, graine());
check('« localiser » n’offre pas de propositions', localiser.propositions.length === 0);
const expert = fabriquer(france, sac, { niveau: 'expert', sens: 'nommer' }, graine());
check('« expert » n’offre pas de propositions', expert.propositions.length === 0);
const capitale = fabriquer(france, sac, { niveau: 'ecolier', sens: 'capitale' }, graine());
check('« capitale » attend Paris', capitale.reponse === 'Paris');
check('« capitale » propose des capitales', capitale.propositions.length === 4 && capitale.propositions.includes('Paris'));

console.log('\nLes aides');
const facile = fabriquer(france, sac, { niveau: 'decouverte', sens: 'nommer' }, graine());
check('Decouverte donne le continent', facile.aide === 'Europe');
check('Voyageur ne donne rien', fabriquer(france, sac, { niveau: 'voyageur', sens: 'nommer' }, graine()).aide === null);
const monaco = atlas.parId.get('MCO');
check('un micro-Etat declenche le zoom quel que soit le niveau',
    fabriquer(monaco, sac, { niveau: 'voyageur', sens: 'nommer' }, graine()).zoom === true);

report();
