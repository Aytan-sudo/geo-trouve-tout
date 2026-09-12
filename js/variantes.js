// Tous les reglages du jeu, dans un seul fichier.
//
// Le reste du code lit ces tables et ne sait rien d'autre : ajouter un niveau
// ou un rythme ne demande pas d'aller modifier le moteur. Les axes sont
// independants et se combinent librement — un Expert peut jouer en marathon
// sans chrono, un Debutant en manche chronometree.

// Les mots de la carte en cours. Chaque atlas porte les siens (`atlas.mots`,
// ecrits par scripts/atlas.mjs) ; ceux-ci servent de repli et disent le monde.
//
// C'est ce qui permet d'ajouter une carte sans toucher aux enonces : « Quel est
// ce pays ? » et « Quelle est cette région ? » sont le meme gabarit, rempli
// avec deux vocabulaires. Le genre voyage avec les mots, sinon le jeu ecrirait
// « Quel est cette région ? » a la premiere carte francaise.
export const MOTS = {
    entite: 'pays', entites: 'pays', unEntite: 'un pays', leEntite: 'le pays',
    ceEntite: 'ce pays', quelEst: 'Quel est', leLa: 'le', ilEntite: 'il',
    chef: 'capitale', laChef: 'la capitale', saChef: 'sa capitale', quelEstChef: 'Quelle est',
    groupe: 'continent', leGroupe: 'le continent', duGroupe: 'du même continent',
    acquis: 'acquis', jamaisVus: 'jamais vus'
};

const majuscule = mot => mot.charAt(0).toUpperCase() + mot.slice(1);

// « Var (83) ». Dans l'usage francais, le numero fait partie du nom d'un
// departement : on dit « le 83 » comme on dit « le Var ». L'afficher partout ou
// le nom apparait — propositions, corrections, listes a revoir — l'apprend sans
// jamais avoir a le demander. Les cartes sans numero ne changent pas.
export const nomAffiche = entite =>
    entite?.numero ? `${entite.nom} (${entite.numero})` : (entite?.nom ?? '');

// Remplit un gabarit. `{entite}` prend le mot tel quel, `{Entite}` le prend
// avec une majuscule — de quoi commencer une phrase sans dedoubler la table.
export const texte = (gabarit, mots = {}) => String(gabarit ?? '').replace(/\{(\w+)\}/g, (_, clef) => {
    const table = { ...MOTS, ...mots };
    if (clef in table) return table[clef];
    const bas = clef.charAt(0).toLowerCase() + clef.slice(1);
    return bas in table ? majuscule(table[bas]) : '';
});

// Le rang de notoriete est porte par chaque entite dans data/*.json : 1 pour
// celles qu'une ecole francaise attend, 4 pour les plus pointues. Un niveau
// n'est donc pas un reglage vague, c'est un sac de tirage.
export const NIVEAUX = {
    decouverte: {
        libelle: 'Découverte',
        resume: 'Les plus connus, avec {leGroupe} en indice.',
        rangMax: 1, choix: 4, distracteurs: 'lointains',
        aides: { groupe: true, zoom: true }
    },
    ecolier: {
        libelle: 'Écolier',
        resume: 'Un cran plus loin, et des propositions {duGroupe}.',
        rangMax: 2, choix: 4, distracteurs: 'groupe',
        aides: { groupe: false, zoom: true }
    },
    voyageur: {
        libelle: 'Voyageur',
        resume: 'Toute la carte, et les voisins comme pièges.',
        rangMax: 4, choix: 4, distracteurs: 'voisins',
        aides: { groupe: false, zoom: false }
    },
    expert: {
        libelle: 'Expert',
        resume: 'Toute la carte, et le nom à écrire soi-même.',
        rangMax: 4, choix: 0, distracteurs: 'voisins',
        aides: { groupe: false, zoom: false }
    }
};

// Ce qu'on demande. `nommer` est le jeu tel qu'on l'imagine ; `localiser` est
// la carte muette de l'ecole, et c'est le sens le plus naturel au doigt.
//
// `exige` nomme le champ que l'entite doit porter pour que la question ait une
// reponse : sans capitale, pas de question de capitale ; sans numero, pas de
// question de numero. C'est ce qui fait qu'une carte n'offre que ses sens.
export const SENS = {
    nommer: {
        libelle: 'Nommer {leEntite}',
        resume: '{UnEntite} s’allume sur la carte, vous {leLa} nommez.',
        question: '{quelEst} {ceEntite} ?'
    },
    localiser: {
        libelle: 'Trouver sur la carte',
        resume: 'Un nom s’affiche, vous le touchez sur la carte.',
        question: 'Où est-ce ?'
    },
    capitale: {
        libelle: 'Nommer {laChef}',
        resume: '{UnEntite} s’allume, vous donnez {saChef}.',
        question: '{quelEstChef} {saChef} ?',
        exige: 'capitale'
    },
    numero: {
        libelle: 'Donner le numéro',
        resume: 'Un département s’allume, vous tapez son numéro. 35, c’est l’Ille-et-Vilaine.',
        question: 'Quel est son numéro ?',
        invite: 'Tapez le numéro…',
        exige: 'numero',
        chiffres: true
    },
    // Le sens propre aux cours d'eau, et toute la difference entre les deux
    // mots : un fleuve finit dans la mer, une riviere dans un autre cours
    // d'eau. La Loire va a l'Atlantique, la Marne va a la Seine.
    //
    // L'indice du niveau Decouverte est coupe ici, et il faut qu'il le soit :
    // il annonce le bassin, et « Bassin de la Loire » repondrait a la question
    // posee sur le Cher. C'est le meme scrupule qui tient la question du numero
    // a l'ecart de « Var (83) ».
    embouchure: {
        libelle: 'Dire où ça se jette',
        resume: '{UnEntite} s’allume, vous dites où {ilEntite} se jette.',
        question: 'Où se jette {ceEntite} ?',
        invite: 'Écrivez où il se jette…',
        exige: 'embouchure',
        sansIndiceGroupe: true
    },
    alterne: {
        libelle: 'En alternance',
        resume: 'Les questions de cette carte se suivent, sans prévenir.',
        question: ''
    }
};

// Les sens qu'une carte peut poser : ceux dont elle a les reponses. Le monde
// n'a pas de numeros, une carte de fleuves n'aura pas de chef-lieu — chacune
// n'offre que ce qu'elle sait demander.
export function sensDe(atlas) {
    const possede = champ => atlas?.entites?.some(e => e[champ]);
    return Object.entries(SENS)
        .filter(([, fiche]) => !fiche.exige || possede(fiche.exige))
        .map(([id]) => id);
}

// Ceux que « En alternance » melange : tous les sens reels de la carte.
export const sensAlternes = atlas => sensDe(atlas).filter(id => id !== 'alterne');

export const RYTHMES = {
    manche: {
        libelle: 'Manche de dix',
        resume: 'Dix questions, une note sur dix. Le format d’une interrogation.',
        questions: 10, vies: Infinity
    },
    marathon: {
        libelle: 'Marathon',
        resume: 'On enchaîne jusqu’à trois erreurs. Le score est la série.',
        questions: Infinity, vies: 3
    }
};

export const CHRONOS = {
    sans: { libelle: 'Sans chrono', resume: 'Prenez le temps de chercher.', secondes: 0 },
    dix: { libelle: 'Dix secondes', resume: 'Dix secondes par question, et la suivante arrive.', secondes: 10 }
};

export const DEFAUTS = {
    atlas: 'monde-pays',
    niveau: 'ecolier',
    sens: 'nommer',
    rythme: 'manche',
    chrono: 'sans',
    aideSaisie: true
};

// La signature d'une configuration : c'est elle qui separe les palmares. Un
// dix sur dix en Decouverte ne concourt pas contre un dix sur dix en Expert.
export const signature = ({ atlas, niveau, sens, rythme, chrono }) =>
    [atlas, niveau, sens, rythme, chrono].join('·');

export const libelleConfiguration = ({ atlas, niveau, sens, rythme, chrono }, nomAtlas = atlas, mots = MOTS) =>
    [nomAtlas, NIVEAUX[niveau]?.libelle, texte(SENS[sens]?.libelle, mots), RYTHMES[rythme]?.libelle,
        CHRONOS[chrono]?.secondes ? CHRONOS[chrono].libelle : null].filter(Boolean).join(' · ');
