// Ce qui compte comme une bonne reponse.
//
// Le jeu s'adresse d'abord a des ecoliers : exiger « Kirghizistan » a la lettre
// pres, accents compris, ne mesurerait plus la geographie mais la dactylo. On
// est donc genereux sur la forme et strict sur le fond.
//
//   accents, casse, traits d'union, apostrophes et articles : ignores ;
//   alias declares dans les donnees                          : acceptes ;
//   une lettre de travers                                    : « presque »,
//     accepte, mais l'orthographe juste s'affiche ;
//   confusions classiques (Angleterre, Hollande, Congo)      : refusees avec
//     l'explication qui manquait.
//
// Aucune fonction d'ici ne touche au DOM : tout se teste en Node.

export function normaliser(texte) {
    return String(texte ?? '')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')   // les accents tombent
        .toLowerCase()
        .replace(/[’'`-]/g, ' ')
        .replace(/[^a-z0-9 ]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/^(le|la|les|l|du|de la|des|de|d)\s+/, '');
}

// Levenshtein plafonne : au-dela de deux differences la reponse est fausse, et
// compter plus loin ne sert a rien.
export function distance(a, b, plafond = 2) {
    if (Math.abs(a.length - b.length) > plafond) return plafond + 1;
    let ligne = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
        const precedente = ligne;
        ligne = [i];
        let meilleur = i;
        for (let j = 1; j <= b.length; j++) {
            const cout = a[i - 1] === b[j - 1] ? 0 : 1;
            ligne[j] = Math.min(precedente[j] + 1, ligne[j - 1] + 1, precedente[j - 1] + cout);
            if (ligne[j] < meilleur) meilleur = ligne[j];
        }
        if (meilleur > plafond) return plafond + 1;
    }
    return ligne[b.length];
}

// Tous les libelles qui designent une entite : son nom, ses alias.
export const libelles = entite => [entite.nom, ...(entite.alias ?? [])];

// La forme compacte, espaces retires. « cote d ivoire » et « cotedivoire »
// deviennent la meme chose, ce qui evite d'exiger de deviner ou tombent les
// blancs d'un nom compose. Deux pays ne se confondent pas pour autant : aucune
// paire de la table ne devient identique une fois les espaces enleves — un test
// s'en assure.
const compacte = forme => forme.replace(/ /g, '');

// L'index d'un atlas : chaque forme normalisee pointe vers son entite. Il sert
// a la correction, a l'aide a la saisie, et surtout a savoir si une saisie est
// deja le nom exact d'un autre pays — auquel cas la tolerance ne s'applique
// pas. Sans ce garde-fou, « Irak » passerait pour l'Iran : une seule lettre les
// separe.
export function indexer(entites) {
    const index = new Map();
    for (const entite of entites) {
        for (const libelle of libelles(entite)) {
            const forme = normaliser(libelle);
            if (!index.has(forme)) index.set(forme, entite);
        }
    }
    return index;
}

export function verifier(saisie, attendue, { index, pieges = [] } = {}) {
    const forme = normaliser(saisie);
    if (!forme) return { verdict: 'vide' };

    for (const libelle of libelles(attendue)) {
        const cible = normaliser(libelle);
        if (cible === forme || compacte(cible) === compacte(forme)) return { verdict: 'juste' };
    }

    const piege = pieges.find(p => normaliser(p.saisie) === forme && p.pour.includes(attendue.id));
    if (piege) return { verdict: 'piege', message: piege.message, correction: attendue.nom };

    // Un autre pays porte exactement ce nom : c'est une erreur, pas une faute
    // de frappe. On le nomme, parce que savoir ce qu'on a confondu s'apprend.
    const autre = index?.get(forme);
    if (autre && autre.id !== attendue.id) {
        return { verdict: 'confusion', correction: attendue.nom, confondu: autre.nom };
    }

    if (forme.length >= 4) {
        for (const libelle of libelles(attendue)) {
            const cible = normaliser(libelle);
            if (distance(compacte(forme), compacte(cible), 1) <= 1) {
                return { verdict: 'presque', correction: attendue.nom };
            }
        }
    }

    return { verdict: 'faux', correction: attendue.nom };
}

export const compteJuste = verdict => verdict === 'juste' || verdict === 'presque';

// L'aide a la saisie : ce que le joueur a commence a ecrire, complete par les
// noms qui commencent pareil. Elle ne cherche pas « au milieu » d'un nom —
// taper « ande » ne doit pas donner l'Islande, sinon l'aide repond a la place
// du joueur.
export function suggestions(debut, entites, maximum = 5) {
    const forme = normaliser(debut);
    if (forme.length < 2) return [];
    const trouves = [];
    for (const entite of entites) {
        if (libelles(entite).some(l => normaliser(l).startsWith(forme))) trouves.push(entite);
        if (trouves.length >= maximum) break;
    }
    return trouves;
}
