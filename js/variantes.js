// Tous les reglages du jeu, dans un seul fichier.
//
// Le reste du code lit ces tables et ne sait rien d'autre : ajouter un niveau
// ou un rythme ne demande pas d'aller modifier le moteur. Les axes sont
// independants et se combinent librement — un Expert peut jouer en marathon
// sans chrono, un Debutant en manche chronometree.

// Le rang de notoriete est porte par chaque pays dans data/*.json : 1 pour ceux
// qu'une ecole francaise attend, 4 pour les micro-Etats. Un niveau n'est donc
// pas un reglage vague, c'est un sac de tirage.
export const NIVEAUX = {
    decouverte: {
        libelle: 'Découverte',
        resume: 'Les quarante pays les plus connus, avec le continent en indice.',
        rangMax: 1, choix: 4, distracteurs: 'lointains',
        aides: { continent: true, zoom: true }
    },
    ecolier: {
        libelle: 'Écolier',
        resume: 'Une centaine de pays, et des propositions du même continent.',
        rangMax: 2, choix: 4, distracteurs: 'continent',
        aides: { continent: false, zoom: true }
    },
    voyageur: {
        libelle: 'Voyageur',
        resume: 'Tous les pays, et les voisins comme pièges.',
        rangMax: 4, choix: 4, distracteurs: 'voisins',
        aides: { continent: false, zoom: false }
    },
    expert: {
        libelle: 'Expert',
        resume: 'Tous les pays, et le nom à écrire soi-même.',
        rangMax: 4, choix: 0, distracteurs: 'voisins',
        aides: { continent: false, zoom: false }
    }
};

// Ce qu'on demande. `nommer` est le jeu tel qu'on l'imagine ; `localiser` est
// la carte muette de l'ecole, et c'est le sens le plus naturel au doigt.
export const SENS = {
    nommer: {
        libelle: 'Nommer le pays',
        resume: 'Un pays s’allume sur la carte, vous le nommez.',
        question: 'Quel est ce pays ?'
    },
    localiser: {
        libelle: 'Trouver sur la carte',
        resume: 'Un nom s’affiche, vous le touchez sur la carte.',
        question: 'Où est-ce ?'
    },
    capitale: {
        libelle: 'Nommer la capitale',
        resume: 'Un pays s’allume, vous donnez sa capitale.',
        question: 'Quelle est sa capitale ?',
        exige: 'capitale'
    },
    alterne: {
        libelle: 'En alternance',
        resume: 'Les trois questions se suivent, sans prévenir.',
        question: ''
    }
};

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

export const libelleConfiguration = ({ atlas, niveau, sens, rythme, chrono }, nomAtlas = atlas) =>
    [nomAtlas, NIVEAUX[niveau]?.libelle, SENS[sens]?.libelle, RYTHMES[rythme]?.libelle,
        CHRONOS[chrono]?.secondes ? CHRONOS[chrono].libelle : null].filter(Boolean).join(' · ');
