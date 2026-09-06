// La fabrique de questions : le noyau du jeu.
//
// Elle ne touche ni au DOM, ni a l'horloge, ni a Math.random — on lui passe un
// generateur a graine. Deux consequences : la meme graine donne partout la meme
// manche (c'est le defi du jour), et tout se teste en Node.
//
// Une question fabriquee ici ne sait rien de son affichage :
//
//   { sens, cible, enonce, reponse, propositions[], aide }
//
// `cible` est l'identifiant du pays a montrer ou a trouver, `reponse` le texte
// attendu, `propositions` les boutons a offrir — vides quand il faut ecrire ou
// toucher la carte.

import { NIVEAUX, SENS } from './variantes.js';

const SENS_ALTERNES = ['nommer', 'localiser', 'capitale'];

// Le sac de tirage : ce qui est jouable a ce niveau, dans ce sens.
export function sacDe(atlas, { niveau, sens }) {
    const rangMax = NIVEAUX[niveau].rangMax;
    const sens_ = SENS[sens];
    return atlas.entites.filter(entite => {
        if (entite.rang > rangMax) return false;
        if (sens_?.exige === 'capitale') return Boolean(entite.capitale);
        if (sens === 'alterne') return true;
        return true;
    });
}

const carre = x => x * x;
const eloignement = (a, b) => carre(a.ancre[0] - b.ancre[0]) + carre(a.ancre[1] - b.ancre[1]);

// Les distracteurs — la vraie difficulte d'un questionnaire a choix.
//
// Quatre propositions tirees au hasard sur toute la carte se devinent sans
// rien savoir : personne n'hesite entre la Belgique et les Fidji. La ou les
// trois autres reponses sont credibles, il faut vraiment reconnaitre le pays.
export function distracteurs(cible, sac, nombre, hasard, style) {
    const candidats = sac.filter(e => e.id !== cible.id);
    if (candidats.length <= nombre) return hasard.melanger(candidats.slice()).slice(0, nombre);

    let vivier;
    if (style === 'voisins') {
        // Les plus proches sur la carte : c'est ainsi qu'on cesse de confondre
        // la Slovaquie et la Slovenie.
        vivier = candidats.slice().sort((a, b) => eloignement(cible, a) - eloignement(cible, b))
            .slice(0, Math.max(nombre * 3, 8));
    } else if (style === 'continent') {
        const memeContinent = candidats.filter(e => e.continent === cible.continent);
        vivier = memeContinent.length >= nombre ? memeContinent : candidats;
    } else {
        const ailleurs = candidats.filter(e => e.continent !== cible.continent);
        vivier = ailleurs.length >= nombre ? ailleurs : candidats;
    }
    return hasard.melanger(vivier.slice()).slice(0, nombre);
}

// Choisit les pays d'une manche. `poids` vient de la memoire du joueur quand
// elle est active : un pays rate pese plus lourd et revient plus vite. Sans
// elle, tout pese pareil et le tirage est un simple melange.
export function choisirCibles(sac, nombre, hasard, poids = null) {
    const restants = sac.slice();
    const choisis = [];
    const voulu = Math.min(nombre, restants.length);
    while (choisis.length < voulu) {
        if (!poids) {
            choisis.push(...hasard.melanger(restants).slice(0, voulu - choisis.length));
            break;
        }
        const poids_ = restants.map(e => Math.max(poids(e), 0.0001));
        const total = poids_.reduce((a, b) => a + b, 0);
        let tirage = hasard.suivant() * total;
        let i = 0;
        while (i < restants.length - 1 && (tirage -= poids_[i]) > 0) i++;
        choisis.push(restants.splice(i, 1)[0]);
    }
    return choisis;
}

export function fabriquer(cible, sac, { niveau, sens }, hasard) {
    const reglage = NIVEAUX[niveau];
    const sensReel = sens === 'alterne' ? hasard.choisir(SENS_ALTERNES) : sens;
    const question = {
        sens: sensReel,
        cible: cible.id,
        enonce: SENS[sensReel].question,
        reponse: sensReel === 'capitale' ? cible.capitale : cible.nom,
        propositions: [],
        aide: reglage.aides.continent ? cible.continent : null,
        zoom: reglage.aides.zoom || Boolean(cible.minuscule)
    };

    if (sensReel === 'localiser') return question;          // la carte est la reponse
    if (reglage.choix < 2) return question;                 // le nom est a ecrire

    const autres = distracteurs(cible, sac, reglage.choix - 1, hasard, reglage.distracteurs);
    const textes = autres.map(e => sensReel === 'capitale' ? e.capitale : e.nom);
    question.propositions = hasard.melanger([question.reponse, ...textes]);
    return question;
}

// Une manche entiere, d'un coup : c'est ce que le defi du jour partage.
export function composerManche(atlas, config, hasard, { nombre = 10, poids = null } = {}) {
    const sac = sacDe(atlas, config);
    const cibles = choisirCibles(sac, nombre, hasard, poids);
    return cibles.map(cible => fabriquer(cible, sac, config, hasard));
}
