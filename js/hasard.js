// Le hasard, en un seul endroit.
//
// Rien d'autre dans le projet n'appelle Math.random. Le tirage d'une manche,
// l'ordre des quatre propositions, le choix des distracteurs : tout passe par
// ce generateur a graine. C'est ce qui rend le defi du jour possible sans
// serveur — chaque joueur refabrique la meme serie de questions chez lui — et
// ce qui permet de rejouer une partie a l'identique depuis un lien.

// mulberry32 : court, rapide, de bonne qualite pour ce qu'on lui demande, et
// son etat tient dans un entier — donc il se serialise.
export function creerHasard(graine) {
    let etat = (graine >>> 0) || 1;

    const suivant = () => {
        etat = (etat + 0x6d2b79f5) >>> 0;
        let t = etat;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    return {
        suivant,
        entier: borne => Math.floor(suivant() * borne),
        entre: (min, max) => min + Math.floor(suivant() * (max - min + 1)),
        melanger(tableau) {
            for (let i = tableau.length - 1; i > 0; i--) {
                const j = Math.floor(suivant() * (i + 1));
                [tableau[i], tableau[j]] = [tableau[j], tableau[i]];
            }
            return tableau;
        },
        choisir: tableau => tableau[Math.floor(suivant() * tableau.length)],
        etat: () => etat,
        reprendre: valeur => { etat = valeur >>> 0; }
    };
}

// FNV-1a : une chaine (« 2026-09-06 », une configuration) devient une graine.
// Deux dates voisines donnent des graines eloignees, donc des series sans
// parente visible.
export function graineDepuisTexte(texte) {
    let empreinte = 0x811c9dc5;
    for (let i = 0; i < texte.length; i++) {
        empreinte ^= texte.charCodeAt(i);
        empreinte = Math.imul(empreinte, 0x01000193) >>> 0;
    }
    return empreinte >>> 0;
}
