// La revision guidee : ce qui fait revenir les pays rates.

import { counter, preparer } from './harness.mjs';
import { creerMemoire, jourDe } from '../js/memoire.js';

const { check, report } = counter();
const atlas = preparer('monde-pays');
const pays = id => atlas.parId.get(id);

console.log('\nLes trois etats');
const memoire = creerMemoire();
check('un pays jamais vu est inconnu', memoire.niveauDe('FRA') === 'inconnu');
memoire.noter('FRA', true, 0);
check('une seule reussite ne suffit pas a acquerir', memoire.niveauDe('FRA') === 'hesitant');
memoire.noter('FRA', true, 0);
memoire.noter('FRA', true, 0);
check('trois reussites acquierent', memoire.niveauDe('FRA') === 'acquis');
memoire.noter('FRA', false, 0);
check('une erreur remet en revision', memoire.niveauDe('FRA') === 'hesitant');

console.log('\nLes poids');
const neuf = creerMemoire();
neuf.noter('ESP', false, 0);
neuf.noter('ITA', true, 0); neuf.noter('ITA', true, 0); neuf.noter('ITA', true, 0);
const poidsRate = neuf.poidsDe(pays('ESP'), 0);
const poidsAcquis = neuf.poidsDe(pays('ITA'), 0);
const poidsInconnu = neuf.poidsDe(pays('PER'), 0);
check('un pays rate passe devant un acquis', poidsRate > poidsAcquis, `${poidsRate.toFixed(2)} > ${poidsAcquis.toFixed(2)}`);
check('un pays jamais vu passe devant un acquis', poidsInconnu > poidsAcquis, `${poidsInconnu.toFixed(2)} > ${poidsAcquis.toFixed(2)}`);
check('un pays rate passe devant un jamais vu', poidsRate > poidsInconnu, `${poidsRate.toFixed(2)} > ${poidsInconnu.toFixed(2)}`);
check('aucun poids n’est nul', poidsAcquis > 0);

console.log('\nL’oubli');
const tout_de_suite = neuf.poidsDe(pays('ITA'), 0);
const un_mois_plus_tard = neuf.poidsDe(pays('ITA'), 30);
check('un pays non revu remonte doucement', un_mois_plus_tard > tout_de_suite,
    `${un_mois_plus_tard.toFixed(2)} > ${tout_de_suite.toFixed(2)}`);
check('l’oubli est plafonne', neuf.poidsDe(pays('ITA'), 10000) < poidsRate);

console.log('\nDeterminisme et rangement');
const range = neuf.serialiser();
const repris = creerMemoire(range);
check('l’etat se serialise et se relit', repris.niveauDe('ITA') === neuf.niveauDe('ITA'));
check('les poids survivent au rangement', repris.poidsDe(pays('ESP'), 0) === neuf.poidsDe(pays('ESP'), 0));
check('le rangement reste compact', JSON.stringify(range).length < 40 * Object.keys(range).length);

console.log('\nLe resume de la carte');
const compte = neuf.resume(atlas.entites);
check('le resume couvre tous les pays', compte.acquis + compte.hesitant + compte.inconnu === atlas.entites.length);
check('le resume compte un acquis', compte.acquis === 1);
check('le resume compte un hesitant', compte.hesitant === 1);

console.log('\nLe jour');
check('le jour est un entier positif', Number.isInteger(jourDe(new Date('2026-09-06'))) && jourDe(new Date('2026-09-06')) > 0);
check('demain vaut aujourd’hui plus un',
    jourDe(new Date('2026-09-07')) === jourDe(new Date('2026-09-06')) + 1);

report();
