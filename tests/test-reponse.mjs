// Ce qui compte comme une bonne reponse — le module le plus expose du jeu,
// puisqu'il arbitre a la place d'un maitre.

import { counter, preparer } from './harness.mjs';
import { normaliser, distance, verifier, indexer, suggestions, compteJuste } from '../js/reponse.js';

const { check, report } = counter();
const atlas = preparer('monde-pays');
const index = indexer(atlas.entites);
const pays = id => atlas.parId.get(id);

console.log('\nNormalisation');
check('les accents tombent', normaliser('Égypte') === 'egypte');
check('la casse aussi', normaliser('PORTUGAL') === 'portugal');
check('les traits d’union deviennent des espaces', normaliser('Pays-Bas') === 'pays bas');
check('l’article initial saute', normaliser('la France') === 'france');
check('l’apostrophe passe', normaliser("Côte d'Ivoire") === 'cote d ivoire');
check('les blancs multiples se resserrent', normaliser('  Costa   Rica ') === 'costa rica');

console.log('\nDistance');
check('un mot identique est a zero', distance('france', 'france') === 0);
check('une lettre de travers est a un', distance('irak', 'iran') === 1);
check('le plafond coupe court', distance('france', 'mongolie', 2) === 3);

console.log('\nVerdicts');
const cas = [
    ['France', 'FRA', 'juste', 'le nom exact'],
    ['france', 'FRA', 'juste', 'sans majuscule'],
    ['la France', 'FRA', 'juste', 'avec article'],
    ['etats unis', 'USA', 'juste', 'sans accents ni tiret'],
    ['USA', 'USA', 'juste', 'par son alias'],
    ['Myanmar', 'MMR', 'juste', 'alias d’un pays rebaptise'],
    ['cote divoire', 'CIV', 'juste', 'apostrophe collee'],
    ['Kirghiziztan', 'KGZ', 'presque', 'une lettre de travers'],
    ['Portugual', 'PRT', 'presque', 'une lettre en trop'],
    ['Irak', 'IRN', 'confusion', 'un autre pays, a une lettre pres'],
    ['Espagne', 'PRT', 'confusion', 'un autre pays, franchement'],
    ['Zorglub', 'FRA', 'faux', 'rien de connu'],
    ['', 'FRA', 'vide', 'reponse vide']
];
for (const [saisie, id, attendu, propos] of cas) {
    const resultat = verifier(saisie, pays(id), { index });
    check(`« ${saisie || '—'} » pour ${pays(id).nom} : ${attendu} (${propos})`,
        resultat.verdict === attendu, `→ ${resultat.verdict}`);
}

console.log('\nLe garde-fou');
// C'est la regle la plus importante du module : la tolerance orthographique ne
// doit jamais transformer un pays en un autre. Iran/Irak sont a une lettre.
const paires = [];
for (const a of atlas.entites) {
    for (const b of atlas.entites) {
        if (a.id >= b.id) continue;
        if (distance(normaliser(a.nom), normaliser(b.nom), 1) <= 1) paires.push(`${a.nom}/${b.nom}`);
    }
}
check('les paires a une lettre sont connues', paires.length <= 4, paires.join(', '));
for (const paire of paires) {
    const [nomA, nomB] = paire.split('/');
    const a = atlas.entites.find(e => e.nom === nomA);
    const b = atlas.entites.find(e => e.nom === nomB);
    check(`« ${nomB} » ne passe pas pour ${nomA}`, verifier(nomB, a, { index }).verdict === 'confusion');
    check(`« ${nomA} » ne passe pas pour ${nomB}`, verifier(nomA, b, { index }).verdict === 'confusion');
}

console.log('\nCe qui compte comme reussi');
check('juste compte', compteJuste('juste'));
check('presque compte aussi', compteJuste('presque'));
check('une confusion ne compte pas', !compteJuste('confusion'));
check('un piege ne compte pas', !compteJuste('piege'));

console.log('\nAide a la saisie');
const propositions = suggestions('portu', atlas.entites);
check('« portu » propose le Portugal', propositions.some(e => e.id === 'PRT'));
check('une seule lettre ne propose rien', suggestions('p', atlas.entites).length === 0);
check('l’aide ne cherche pas au milieu d’un nom', !suggestions('ande', atlas.entites).some(e => e.id === 'ISL'));

report();
