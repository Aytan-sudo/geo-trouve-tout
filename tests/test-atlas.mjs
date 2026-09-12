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

// L'inverse de l'encodage de scripts/geometrie.mjs : « M12 30l4-2 6 1 » redevient
// une suite de points. Les tests de traces en ont besoin pour mesurer ce que
// l'attribut `d` dessine vraiment, et non ce que la fabrique croit y avoir mis.
function decouper(d) {
    const lignes = [];
    for (const bloc of String(d ?? '').split('M').slice(1)) {
        const [tete, suite = ''] = bloc.split('l');
        let [x, y] = tete.trim().split(/\s+/).map(Number);
        const ligne = [[x, y]];
        const deltas = suite.match(/-?\d+/g)?.map(Number) ?? [];
        for (let i = 0; i + 1 < deltas.length; i += 2) {
            x += deltas[i]; y += deltas[i + 1];
            ligne.push([x, y]);
        }
        lignes.push(ligne);
    }
    return lignes;
}

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
    //
    // Une carte ne doit que les mots de ses propres questions. Exiger d'elle le
    // vocabulaire des chefs-lieux obligerait une carte de fleuves a inventer la
    // prefecture de la Loire — et le jeu ne la lui demandera jamais.
    const MOTS_TOUJOURS = ['entite', 'entites', 'unEntite', 'leEntite', 'ceEntite', 'quelEst',
        'leLa', 'groupe', 'leGroupe', 'duGroupe', 'acquis', 'jamaisVus'];
    const MOTS_DE_SENS = {
        capitale: ['chef', 'laChef', 'saChef', 'quelEstChef'],
        embouchure: ['ilEntite']
    };
    const motsAttendus = [...MOTS_TOUJOURS, ...sensDe(atlas).flatMap(sens => MOTS_DE_SENS[sens] ?? [])];
    const motsManquants = motsAttendus.filter(clef => !atlas.mots?.[clef]);
    check('la carte porte tous les mots de ses questions', motsManquants.length === 0, motsManquants.join(','));

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
    // un pays connu sans capitale serait un oubli. Une carte de fleuves, elle,
    // n'a pas de chefs-lieux du tout : la question ne s'y pose pas.
    if (atlas.entites.some(e => e.capitale)) {
        const connusSansCapitale = atlas.entites.filter(e => e.rang <= 2 && !e.capitale);
        check('les pays connus ont une capitale', connusSansCapitale.length <= 2,
            connusSansCapitale.map(e => e.nom).join(','));

        const capitales = atlas.entites.filter(e => e.capitale).map(e => normaliser(e.capitale));
        check('assez de chefs-lieux pour quatre propositions', new Set(capitales).size >= 12,
            `(${new Set(capitales).size})`);
    }

    // Les embouchures, quand la carte en a. Une seule manquante et le cours
    // d'eau sort du mode « ou se jette-t-il ? » sans que rien ne le signale :
    // sur une carte de fleuves, c'est un oubli, pas un cas limite.
    const traces = atlas.entites.filter(e => e.trait);
    if (traces.length) {
        check('tout y est un trace', traces.length === atlas.entites.length,
            `(${traces.length}/${atlas.entites.length})`);
        const sansEmbouchure = atlas.entites.filter(e => !e.embouchure);
        check('chaque cours d’eau dit ou il se jette', sansEmbouchure.length === 0,
            sansEmbouchure.map(e => e.nom).join(','));
        const embouchures = new Set(atlas.entites.map(e => normaliser(e.embouchure ?? '')));
        check('assez d’embouchures pour quatre propositions', embouchures.size >= 12,
            `(${embouchures.size})`);
        // Un trace ferme n'est pas un fleuve : le navigateur joindrait
        // l'embouchure a la source et peindrait la surface entre les deux.
        const fermes = atlas.entites.filter(e => /z/i.test(e.d));
        check('aucun trace n’est referme', fermes.length === 0, fermes.map(e => e.nom).join(','));
        // L'ancre d'un trace sert d'epingle : hors du trace, elle designerait
        // un point ou le fleuve ne passe pas.
        const horsBoite = atlas.entites.filter(e =>
            e.ancre[0] < e.boite[0] - 1 || e.ancre[0] > e.boite[2] + 1
            || e.ancre[1] < e.boite[1] - 1 || e.ancre[1] > e.boite[3] + 1);
        check('chaque epingle tombe sur son trace', horsBoite.length === 0,
            horsBoite.map(e => e.nom).join(','));

        // Un fleuve troue. La source le livre en troncons, et tout ce qui les
        // filtre en chemin — la simplification, la coupe au cadre — peut retirer
        // celui qui reliait deux moities. Rien ne leve d'erreur : le fleuve est
        // dessine, et il manque cent kilometres au milieu. On mesure donc la
        // distance de chaque troncon au reste de son fleuve.
        const ecart = e => {
            const lignes = decouper(e.d);
            if (lignes.length < 2) return 0;
            let pire = 0;
            for (let i = 0; i < lignes.length; i++) {
                let proche = Infinity;
                for (let j = 0; j < lignes.length; j++) {
                    if (i === j) continue;
                    for (const p of [lignes[i][0], lignes[i].at(-1)]) {
                        for (const q of lignes[j]) proche = Math.min(proche, Math.hypot(p[0] - q[0], p[1] - q[1]));
                    }
                }
                pire = Math.max(pire, proche);
            }
            return pire;
        };
        const troues = atlas.entites.map(e => [e, ecart(e)]).filter(([, d]) => d > largeur / 100);
        check('aucun trace n’est coupe en morceaux epars', troues.length === 0,
            troues.map(([e, d]) => `${e.nom} (${Math.round(d)})`).join(','));
    }

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
