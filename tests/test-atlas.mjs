// Le gardien du contenu.
//
// Dans un jeu de geographie, la faute la plus probable n'est pas une erreur de
// code : c'est une capitale fausse, un nom oublie, un alias qui designe deux
// pays. Rien de tout cela ne leve d'erreur — le jeu tourne, et il enseigne une
// betise. Ces verifications-la valent donc tous les tests unitaires du moteur.

import { counter, preparer } from './harness.mjs';
import { normaliser, indexer, libelles } from '../js/reponse.js';
import { CATALOGUE } from '../js/atlas.js';

const { check, report } = counter();

for (const carte of CATALOGUE) {
    console.log(`\n${carte.nom} (${carte.id})`);
    const atlas = preparer(carte.id);
    const [, , largeur, hauteur] = atlas.viewBox.split(' ').map(Number);

    check('au moins quarante pays', atlas.entites.length >= 40, `(${atlas.entites.length})`);
    check('un decor non vide', typeof atlas.decor === 'string' && atlas.decor.length > 100);

    const ids = new Set();
    const doublons = [];
    const sansAncre = [];
    const horsCadre = [];
    const sansContour = [];
    const sansRang = [];
    const sansArticle = [];

    for (const entite of atlas.entites) {
        if (ids.has(entite.id)) doublons.push(entite.id);
        ids.add(entite.id);
        if (!Array.isArray(entite.ancre) || entite.ancre.length !== 2) sansAncre.push(entite.id);
        else if (entite.ancre[0] < 0 || entite.ancre[0] > largeur || entite.ancre[1] < 0 || entite.ancre[1] > hauteur) horsCadre.push(entite.id);
        if (!entite.d || entite.d.length < 8) sansContour.push(entite.id);
        if (!(entite.rang >= 1 && entite.rang <= 4)) sansRang.push(entite.id);
        if (typeof entite.article !== 'string') sansArticle.push(entite.id);
    }

    check('identifiants uniques', doublons.length === 0, doublons.join(','));
    check('chaque pays a une ancre', sansAncre.length === 0, sansAncre.join(','));
    check('chaque ancre est dans le cadre', horsCadre.length === 0, horsCadre.join(','));
    check('chaque pays a un contour', sansContour.length === 0, sansContour.join(','));
    check('chaque pays a un rang de 1 a 4', sansRang.length === 0, sansRang.join(','));
    check('chaque pays a un article', sansArticle.length === 0, sansArticle.join(','));

    // Un alias qui designe deux pays rendrait une reponse juste impossible a
    // trancher : « Congo » n'est un alias de personne, c'est un piege.
    const vus = new Map();
    const ambigus = [];
    for (const entite of atlas.entites) {
        for (const libelle of libelles(entite)) {
            const forme = normaliser(libelle);
            if (vus.has(forme) && vus.get(forme) !== entite.id) ambigus.push(`${libelle} → ${vus.get(forme)}/${entite.id}`);
            vus.set(forme, entite.id);
        }
    }
    check('aucun nom ni alias ambigu', ambigus.length === 0, ambigus.join(' ; '));

    // La comparaison sans espaces est une tolerance ; elle ne doit pas
    // confondre deux pays. Si deux noms deviennent identiques une fois les
    // blancs retires, la tolerance devient un bug.
    const compactes = new Map();
    const collisions = [];
    for (const entite of atlas.entites) {
        for (const libelle of libelles(entite)) {
            const forme = normaliser(libelle).replace(/ /g, '');
            if (compactes.has(forme) && compactes.get(forme) !== entite.id) collisions.push(`${libelle} → ${compactes.get(forme)}/${entite.id}`);
            compactes.set(forme, entite.id);
        }
    }
    check('aucune collision une fois les espaces retires', collisions.length === 0, collisions.join(' ; '));

    // Une capitale absente n'est pas une faute — Israel et la Palestine n'en
    // ont pas de consensuelle, et le jeu les sort alors du mode capitales. Mais
    // un pays connu sans capitale serait un oubli.
    const connusSansCapitale = atlas.entites.filter(e => e.rang <= 2 && !e.capitale);
    check('les pays connus ont une capitale', connusSansCapitale.length <= 2,
        connusSansCapitale.map(e => e.nom).join(','));

    const capitales = atlas.entites.filter(e => e.capitale).map(e => normaliser(e.capitale));
    check('assez de capitales pour quatre propositions', new Set(capitales).size >= 20, `(${new Set(capitales).size})`);

    // Il faut de quoi remplir un questionnaire a chaque niveau, sinon le tirage
    // tourne a vide.
    for (const rangMax of [1, 2, 4]) {
        const sac = atlas.entites.filter(e => e.rang <= rangMax);
        check(`au moins dix pays de rang ≤ ${rangMax}`, sac.length >= 10, `(${sac.length})`);
    }

    const index = indexer(atlas.entites);
    check('l’index couvre tous les pays', new Set([...index.values()].map(e => e.id)).size === atlas.entites.length);

    const poids = JSON.stringify(atlas).length;
    check('le fichier reste sous 400 Ko', poids < 400 * 1024, `(${Math.round(poids / 1024)} Ko)`);
}

report();
