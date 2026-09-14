// Preferences, partie en cours, palmares, memoire du joueur.
//
// localStorage uniquement, sous des cles prefixees « geo. ». Chaque valeur
// porte une version de schema, et un stockage absent ou abime ne doit jamais
// empecher de jouer : on retombe alors sur les defauts, avec une memoire
// temporaire pour la session.

import { DEFAUTS } from './variantes.js';

const PREFIXE = 'geo.';
const VERSION = 1;

// Le repli : quand localStorage est refuse (navigation privee sur iOS, reglage
// de confidentialite), la partie en cours se joue quand meme. Elle ne survit
// simplement pas a la fermeture de l'onglet, et c'est tout.
function coffre() {
    try {
        const essai = `${PREFIXE}essai`;
        localStorage.setItem(essai, '1');
        localStorage.removeItem(essai);
        return localStorage;
    } catch {
        const memoire = new Map();
        return {
            getItem: c => memoire.get(c) ?? null,
            setItem: (c, v) => memoire.set(c, String(v)),
            removeItem: c => memoire.delete(c)
        };
    }
}

const magasin = globalThis.Passeport?.stockageJeu('geo') ?? coffre();

function lire(clef, defaut) {
    try {
        const brut = magasin.getItem(PREFIXE + clef);
        if (!brut) return defaut;
        const valeur = JSON.parse(brut);
        return migrer(clef, valeur) ?? defaut;
    } catch {
        return defaut;
    }
}

function ecrire(clef, valeur) {
    try {
        magasin.setItem(PREFIXE + clef, JSON.stringify({ ...valeur, v: VERSION }));
    } catch { /* stockage plein ou refuse : la partie continue */ }
}

// Les migrations s'appliquent par palier, selon la version d'origine. Il n'y en
// a pas encore : la place est prete, et le test qui la surveille aussi.
function migrer(clef, valeur) {
    if (!valeur || typeof valeur !== 'object') return null;
    return valeur;
}

// Le theme par defaut doit etre celui que :root porte dans themes.css, et le
// premier de la liste de themes.js. S'ils divergent, la page s'ouvre dans une
// palette puis bascule dans une autre sous les yeux du joueur — le clignotement
// que le script inline de index.html sert justement a eviter. Un test compare
// les trois.
export const THEME_PAR_DEFAUT = 'ecolier';

export const preferences = {
    lire: () => ({ ...DEFAUTS, theme: THEME_PAR_DEFAUT, sons: true, vibration: true, signes: false, ...lire('preferences', {}) }),
    ecrire: valeurs => ecrire('preferences', { ...preferences.lire(), ...valeurs })
};

export const partie = {
    lire: () => lire('partie', null),
    ecrire: valeur => ecrire('partie', valeur),
    effacer: () => { try { magasin.removeItem(`${PREFIXE}partie`); } catch { /* rien */ } }
};

export const souvenirs = {
    lire: () => lire('memoire', { fiches: {} }).fiches ?? {},
    ecrire: fiches => ecrire('memoire', { fiches }),
    effacer: () => { try { magasin.removeItem(`${PREFIXE}memoire`); } catch { /* rien */ } }
};

// Les palmares, ranges par signature de configuration : un dix sur dix en
// Decouverte ne concourt pas contre un dix sur dix en Expert.
export const stats = {
    lire: () => lire('stats', { parties: {}, serie: 0, meilleureSerie: 0, dernierJour: null, journal: [] }),

    noter({ signature, bilan, jour = null }) {
        const etat = stats.lire();
        const fiche = etat.parties[signature] ?? { jouees: 0, meilleur: 0, meilleureDuree: null, total: 0 };
        fiche.jouees++;
        fiche.total += bilan.score;
        if (bilan.score > fiche.meilleur
            || (bilan.score === fiche.meilleur && (fiche.meilleureDuree === null || bilan.duree < fiche.meilleureDuree))) {
            fiche.meilleur = bilan.score;
            fiche.meilleureDuree = bilan.duree;
        }
        etat.parties[signature] = fiche;

        if (jour) {
            // Seul le defi joue le jour meme compte pour la serie ; un lien
            // rouvert plus tard redonne la manche, hors serie.
            const hier = new Date(jour); hier.setDate(hier.getDate() - 1);
            const hierISO = `${hier.getFullYear()}-${String(hier.getMonth() + 1).padStart(2, '0')}-${String(hier.getDate()).padStart(2, '0')}`;
            if (etat.dernierJour !== jour) {
                etat.serie = etat.dernierJour === hierISO ? etat.serie + 1 : 1;
                etat.dernierJour = jour;
                etat.meilleureSerie = Math.max(etat.meilleureSerie ?? 0, etat.serie);
            }
            etat.journal = [{ jour, score: bilan.score, total: bilan.total, duree: bilan.duree }, ...(etat.journal ?? [])].slice(0, 30);
        }
        ecrire('stats', etat);
        return etat;
    },

    effacer: () => { try { magasin.removeItem(`${PREFIXE}stats`); } catch { /* rien */ } }
};

export const toutEffacer = () => { stats.effacer(); souvenirs.effacer(); partie.effacer(); };
