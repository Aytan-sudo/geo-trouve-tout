// Le gardien du contenu.
//
// Dans un jeu de geographie, la faute la plus probable n'est pas une erreur de
// code : c'est une capitale fausse, un nom oublie, un alias qui designe deux
// pays. Rien de tout cela ne leve d'erreur — le jeu tourne, et il enseigne une
// betise. Ces verifications-la valent donc tous les tests unitaires du moteur.

import { counter, preparer } from './harness.mjs';
import { normaliser, indexer, libelles } from '../js/reponse.js';
import { CATALOGUE } from '../js/atlas.js';
import { NIVEAUX, sensDe } from '../js/variantes.js';
import { sacDe } from '../js/questions.js';

const { check, report } = counter();

for (const carte of CATALOGUE) {
    console.log(`\n${carte.nom} (${carte.id})`);
    const atlas = preparer(carte.id);
    const [, , largeur, hauteur] = atlas.viewBox.split(' ').map(Number);

    // De quoi composer une manche de dix avec quatre propositions differentes :
    // c'est le vrai plancher, et les dix-huit regions le passent.
    check('assez d’entites pour une manche', atlas.entites.length >= 15, `(${atlas.entites.length})`);
    check('un decor non vide', typeof atlas.decor === 'string' && atlas.decor.length > 100);
    check('la carte dit ce qu’elle accepte de perdre', atlas.couverture >= 1 && atlas.couverture <= 2, `(${atlas.couverture})`);

    // Les mots de la carte remplissent les enonces : il en manque un, et le jeu
    // ecrit « Quel est  ? » sans que rien ne leve d'erreur.
    const MOTS_ATTENDUS = ['entite', 'entites', 'unEntite', 'leEntite', 'ceEntite', 'quelEst',
        'leLa', 'chef', 'laChef', 'saChef', 'quelEstChef', 'groupe', 'leGroupe', 'duGroupe',
        'acquis', 'jamaisVus'];
    const motsManquants = MOTS_ATTENDUS.filter(clef => !atlas.mots?.[clef]);
    check('la carte porte tous ses mots', motsManquants.length === 0, motsManquants.join(','));

    const ids = new Set();
    const doublons = [];
    const sansAncre = [];
    const horsCadre = [];
    const sansContour = [];
    const sansRang = [];
    const sansArticle = [];
    const sansGroupe = [];

    for (const entite of atlas.entites) {
        if (ids.has(entite.id)) doublons.push(entite.id);
        ids.add(entite.id);
        if (!Array.isArray(entite.ancre) || entite.ancre.length !== 2) sansAncre.push(entite.id);
        else if (entite.ancre[0] < 0 || entite.ancre[0] > largeur || entite.ancre[1] < 0 || entite.ancre[1] > hauteur) horsCadre.push(entite.id);
        if (!entite.d || entite.d.length < 8) sansContour.push(entite.id);
        if (!(entite.rang >= 1 && entite.rang <= 4)) sansRang.push(entite.id);
        if (typeof entite.article !== 'string') sansArticle.push(entite.id);
        if (!entite.groupe) sansGroupe.push(entite.id);
    }

    check('identifiants uniques', doublons.length === 0, doublons.join(','));
    check('chaque pays a une ancre', sansAncre.length === 0, sansAncre.join(','));
    check('chaque ancre est dans le cadre', horsCadre.length === 0, horsCadre.join(','));
    check('chaque pays a un contour', sansContour.length === 0, sansContour.join(','));
    check('chaque pays a un rang de 1 a 4', sansRang.length === 0, sansRang.join(','));
    check('chaque entite a un article', sansArticle.length === 0, sansArticle.join(','));
    check('chaque entite a un groupe', sansGroupe.length === 0, sansGroupe.join(','));

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
    check('assez de chefs-lieux pour quatre propositions', new Set(capitales).size >= 12, `(${new Set(capitales).size})`);

    // Les numeros, quand la carte en a. Deux departements qui partagent un
    // numero rendraient la question sans reponse tranchable, et « 2A » doit
    // survivre a la normalisation — sans quoi la Corse-du-Sud devient « 2 ».
    const numerotes = atlas.entites.filter(e => e.numero);
    if (numerotes.length) {
        check('chaque entite porte un numero', numerotes.length === atlas.entites.length,
            `(${numerotes.length}/${atlas.entites.length})`);
        check('les numeros sont uniques', new Set(numerotes.map(e => e.numero)).size === numerotes.length);
        const corses = numerotes.filter(e => /^2[AB]$/.test(e.numero));
        check('la Corse garde ses deux numeros', corses.length === 2, corses.map(e => e.numero).join(','));
        check('« 2A » survit a la normalisation', normaliser('2A') === '2a', normaliser('2A'));
        check('« 2A » et « 2B » ne se confondent pas', normaliser('2A') !== normaliser('2B'));
        const zeros = numerotes.filter(e => /^\d$/.test(e.numero));
        check('les numeros a un chiffre sont ecrits sur deux', zeros.length === 0, zeros.map(e => e.numero).join(','));
    }

    // Les cartouches : chaque case tient dans le cadre, ne recouvre pas sa
    // voisine, et l'entite qu'elle annonce s'y trouve vraiment.
    for (const cartouche of atlas.cartouches ?? []) {
        const [x0, y0, x1, y1] = cartouche.boite;
        check(`le cartouche « ${cartouche.nom} » tient dans le cadre`,
            x0 >= 0 && y0 >= 0 && x1 <= largeur && y1 <= hauteur && x1 > x0 && y1 > y0,
            cartouche.boite.join(' '));
        for (const id of cartouche.ids) {
            const entite = atlas.entites.find(e => e.id === id);
            check(`« ${cartouche.nom} » contient bien ${id}`,
                Boolean(entite) && entite.ancre[0] >= x0 && entite.ancre[0] <= x1
                && entite.ancre[1] >= y0 && entite.ancre[1] <= y1,
                entite ? entite.ancre.join(',') : 'entité absente');
        }
    }
    const boites = (atlas.cartouches ?? []).map(c => c.boite);
    const chevauchent = boites.some(([ax0, ay0, ax1, ay1], i) => boites.slice(i + 1)
        .some(([bx0, by0, bx1, by1]) => ax0 < bx1 && bx0 < ax1 && ay0 < by1 && by0 < ay1));
    check('les cartouches ne se recouvrent pas', !chevauchent);

    // Un piege doit pouvoir se declencher : s'il porte le nom exact d'une
    // entite de cette carte, la bonne reponse passe avant lui et il est mort.
    // S'il designe une entite absente, il ne sert a personne.
    const formes = new Map(atlas.entites.flatMap(e => libelles(e).map(l => [normaliser(l), e.id])));
    const morts = (atlas.pieges ?? []).filter(p => formes.has(normaliser(p.saisie)));
    check('aucun piege ne double une bonne reponse', morts.length === 0, morts.map(p => p.saisie).join(','));
    const vides = (atlas.pieges ?? []).filter(p => !p.pour.length || p.pour.some(id => !ids.has(id)));
    check('chaque piege designe des entites de la carte', vides.length === 0, vides.map(p => p.saisie).join(','));
    const sansMessage = (atlas.pieges ?? []).filter(p => !p.message?.trim());
    check('chaque piege explique ce qui manque', sansMessage.length === 0, sansMessage.map(p => p.saisie).join(','));

    // Il faut de quoi remplir un questionnaire a chaque niveau, sinon le tirage
    // tourne a vide.
    for (const rangMax of [1, 2, 4]) {
        const sac = atlas.entites.filter(e => e.rang <= rangMax);
        check(`au moins dix entites de rang ≤ ${rangMax}`, sac.length >= 10, `(${sac.length})`);
    }

    const index = indexer(atlas.entites);
    check('l’index couvre toutes les entites', new Set([...index.values()].map(e => e.id)).size === atlas.entites.length);

    // Chaque sens que la carte annonce doit avoir de quoi remplir une manche a
    // tous les niveaux : un sens offert au menu et sans reponses serait un
    // ecran vide.
    for (const sens of sensDe(atlas)) {
        if (sens === 'alterne') continue;
        for (const niveau of Object.keys(NIVEAUX)) {
            const sac = sacDe(atlas, { niveau, sens });
            check(`« ${sens} » en ${niveau} : de quoi jouer dix questions`, sac.length >= 10, `(${sac.length})`);
        }
    }

    const poids = JSON.stringify(atlas).length;
    check('le fichier reste sous 400 Ko', poids < 400 * 1024, `(${Math.round(poids / 1024)} Ko)`);
}

report();
