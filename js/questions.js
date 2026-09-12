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

import { NIVEAUX, SENS, texte, sensAlternes, nomAffiche } from './variantes.js';

// Le sac de tirage : ce qui est jouable a ce niveau, dans ce sens.
//
// Une entite sans la reponse demandee sort du sac : un pays sans capitale
// consensuelle ne peut pas etre pose en mode capitales. C'est `exige` qui le
// dit, et cela vaut pour tout champ — le numero d'un departement comme le
// chef-lieu d'une region.
export function sacDe(atlas, { niveau, sens }) {
    const rangMax = NIVEAUX[niveau].rangMax;
    const exige = SENS[sens]?.exige;
    return atlas.entites.filter(entite => {
        if (entite.rang > rangMax) return false;
        if (exige && !entite[exige]) return false;
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
        // la Slovaquie et la Slovenie, l'Aube et l'Aude.
        vivier = candidats.slice().sort((a, b) => eloignement(cible, a) - eloignement(cible, b))
            .slice(0, Math.max(nombre * 3, 8));
    } else if (style === 'groupe') {
        // Le groupe est le continent d'un pays, la region d'un departement :
        // le voisinage administratif plutot que geometrique.
        const memeGroupe = candidats.filter(e => e.groupe === cible.groupe);
        vivier = memeGroupe.length >= nombre ? memeGroupe : candidats;
    } else {
        const ailleurs = candidats.filter(e => e.groupe !== cible.groupe);
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

// Ce que l'entite doit repondre dans ce sens. Un sens qui `exige` un champ
// demande ce champ et rien d'autre — la capitale, le numero, l'embouchure ; les
// autres demandent le nom. Les sens s'ajoutent donc sans toucher a rien.
//
// Le nom se donne affiche — « Var (83) ». La reponse ecrite, elle, reste
// tolerante : js/reponse.js accepte « Var » comme « 83 ».
const reponseDe = (entite, sens) =>
    SENS[sens]?.exige ? entite[SENS[sens].exige] : nomAffiche(entite);

export function fabriquer(cible, sac, { niveau, sens }, hasard, { mots, alternes } = {}) {
    const reglage = NIVEAUX[niveau];
    // « En alternance » ne melange que les sens de la carte : sur le monde il
    // n'y a pas de numero a demander.
    const tire = sens === 'alterne'
        ? hasard.choisir(alternes?.length ? alternes : ['nommer', 'localiser'])
        : sens;
    // Et l'entite doit avoir la reponse. Le sac d'un sens donne l'assure deja,
    // mais celui de l'alternance garde tout le monde : Israel et la Palestine
    // n'ont pas de capitale consensuelle, et la question tombait sans reponse —
    // un bouton vide parmi quatre. On leur demande alors leur nom.
    const sensReel = SENS[tire].exige && !cible[SENS[tire].exige] ? 'nommer' : tire;
    const question = {
        sens: sensReel,
        cible: cible.id,
        enonce: texte(SENS[sensReel].question, mots),
        reponse: reponseDe(cible, sensReel),
        propositions: [],
        // Un sens peut refuser l'indice de groupe parce qu'il y repondrait :
        // le bassin d'un cours d'eau dit deja ou il se jette.
        aide: reglage.aides.groupe && !SENS[sensReel].sansIndiceGroupe ? cible.groupe : null,
        zoom: reglage.aides.zoom || Boolean(cible.minuscule)
    };

    if (sensReel === 'localiser') return question;          // la carte est la reponse
    if (reglage.choix < 2) return question;                 // la reponse est a ecrire

    // Deux entites peuvent donner la meme reponse : le Cher et l'Allier se
    // jettent tous les deux dans la Loire. Quatre boutons dont deux identiques,
    // l'un juste et l'autre faux, ne sont plus une question — c'est un aveu.
    // On ne garde donc que des libelles distincts.
    const vus = new Set([question.reponse]);
    const textes = [];
    const retenir = entite => {
        const propose = reponseDe(entite, sensReel);
        if (!propose || vus.has(propose)) return;
        vus.add(propose);
        textes.push(propose);
    };
    for (const autre of distracteurs(cible, sac, reglage.choix - 1, hasard, reglage.distracteurs)) {
        retenir(autre);
    }
    // Ce que le doublon a coute se rattrape chez les voisins les plus proches,
    // et sans retirer au sort : un tirage de plus decalerait toute la suite de
    // la manche, et le defi du jour cesserait d'etre le meme pour tout le
    // monde. Sur les cartes ou chaque entite a sa reponse — un nom, un numero,
    // une capitale — cette boucle ne sert jamais.
    if (textes.length < reglage.choix - 1) {
        const proches = sac.filter(e => e.id !== cible.id)
            .sort((a, b) => eloignement(cible, a) - eloignement(cible, b));
        for (const autre of proches) {
            if (textes.length >= reglage.choix - 1) break;
            retenir(autre);
        }
    }
    question.propositions = hasard.melanger([question.reponse, ...textes]);
    return question;
}

// Une manche entiere, d'un coup : c'est ce que le defi du jour partage.
//
// Toute la manche sort du meme atlas — c'est le sac qui la compose. Un defi du
// jour ne peut donc pas melanger deux cartes, et un test le verifie.
export function composerManche(atlas, config, hasard, { nombre = 10, poids = null } = {}) {
    const sac = sacDe(atlas, config);
    const cibles = choisirCibles(sac, nombre, hasard, poids);
    const options = { mots: atlas.mots, alternes: sensAlternes(atlas) };
    return cibles.map(cible => fabriquer(cible, sac, config, hasard, options));
}
