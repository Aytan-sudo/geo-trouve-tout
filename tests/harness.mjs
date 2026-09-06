// Harnais commun aux tests. Tout le noyau du jeu — questions, reponses,
// memoire, partie — se teste en Node, sans navigateur : c'est la contrainte
// d'architecture la plus importante du projet.

export function counter() {
    const etat = { pass: 0, fail: 0 };
    const check = (libelle, condition, detail = '') => {
        if (condition) { etat.pass++; console.log(`  OK    ${libelle}`); }
        else { etat.fail++; console.log(`  ECHEC ${libelle} ${detail}`); }
    };
    const report = () => {
        console.log(`\n${etat.pass} reussis, ${etat.fail} echecs\n`);
        process.exit(etat.fail === 0 ? 0 : 1);
    };
    return { check, report };
}

import { readFileSync } from 'node:fs';

export const lireAtlas = id =>
    JSON.parse(readFileSync(new URL(`../data/${id}.json`, import.meta.url), 'utf8'));

export const lireSource = chemin =>
    readFileSync(new URL(`../${chemin}`, import.meta.url), 'utf8');

// Les atlas sont charges par fetch dans le jeu ; en test on les lit sur le
// disque et on refait a la main le petit travail que js/atlas.js fait au
// chargement.
export function preparer(id) {
    const atlas = lireAtlas(id);
    atlas.parId = new Map(atlas.entites.map(e => [e.id, e]));
    const [, , largeur, hauteur] = atlas.viewBox.split(' ').map(Number);
    atlas.largeur = largeur;
    atlas.hauteur = hauteur;
    return atlas;
}
