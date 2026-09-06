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
// doit jamais transformer une entite en une autre. Iran/Irak sont a une lettre,
// l'Aube et l'Aude aussi — et la carte des departements en compte davantage que
// celle du monde. On parcourt donc chaque carte.
for (const id of ['monde-pays', 'europe-pays', 'france-departements', 'france-regions']) {
    const carte = preparer(id);
    const indexCarte = indexer(carte.entites);
    const paires = [];
    for (const a of carte.entites) {
        for (const b of carte.entites) {
            if (a.id >= b.id) continue;
            if (distance(normaliser(a.nom), normaliser(b.nom), 1) <= 1) paires.push([a, b]);
        }
    }
    check(`${carte.nom} : les paires a une lettre sont connues`, paires.length <= 12,
        paires.map(([a, b]) => `${a.nom}/${b.nom}`).join(', '));
    let fuites = [];
    for (const [a, b] of paires) {
        if (verifier(b.nom, a, { index: indexCarte }).verdict !== 'confusion') fuites.push(`${b.nom}→${a.nom}`);
        if (verifier(a.nom, b, { index: indexCarte }).verdict !== 'confusion') fuites.push(`${a.nom}→${b.nom}`);
    }
    check(`${carte.nom} : aucune ne passe pour l’autre`, fuites.length === 0, fuites.join(', '));
}

console.log('\nLe numero d’un departement');
// Le jeu affiche « Var (83) » : ce qu'il montre, il doit l'accepter. Mais le
// numero voisin reste une confusion — 83 et 84 sont a un caractere.
const departements = preparer('france-departements');
const indexDep = indexer(departements.entites);
const varr = departements.parId.get('83');
for (const [saisie, attendu] of [['Var', 'juste'], ['le Var', 'juste'], ['83', 'juste'],
    ['84', 'confusion'], ['Vaucluse', 'confusion']]) {
    check(`« ${saisie} » pour le Var : ${attendu}`,
        verifier(saisie, varr, { index: indexDep }).verdict === attendu,
        `→ ${verifier(saisie, varr, { index: indexDep }).verdict}`);
}
check('« 2A » repond pour la Corse-du-Sud',
    verifier('2A', departements.parId.get('2A'), { index: indexDep }).verdict === 'juste');
check('« 2B » ne passe pas pour la Corse-du-Sud',
    verifier('2B', departements.parId.get('2A'), { index: indexDep }).verdict === 'confusion');
check('un numero ne designe qu’un departement',
    new Set(departements.entites.map(e => e.numero)).size === departements.entites.length);
// Un numero ne doit ressembler a aucun nom : sans quoi l'index se marcherait
// sur les pieds.
const commeUnNom = departements.entites.filter(e => departements.entites
    .some(autre => autre.id !== e.id && normaliser(autre.nom) === normaliser(e.numero)));
check('aucun numero ne double un nom', commeUnNom.length === 0, commeUnNom.map(e => e.nom).join(','));

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
