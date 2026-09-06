// Le defi du jour et le partage.
//
// Le meme parcours pour tout le monde, sans serveur : la date locale devient
// une graine, et le tirage se refabrique a l'identique chez chaque joueur.
// Limite assumee — l'horloge de la machine fait foi. Se tricher soi-meme est
// possible, et sans interet.

import { graineDepuisTexte } from './hasard.js';
import { DEFAUTS } from './variantes.js';

export const dateISO = (date = new Date()) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const dateFrancaise = iso => iso.split('-').reverse().join('/');

// La configuration du defi est figee : c'est ce qui rend les scores
// comparables. Les variantes se jouent en partie libre, avec leurs propres
// records.
export const CONFIG_DU_JOUR = {
    atlas: 'monde-pays', niveau: 'ecolier', sens: 'nommer',
    rythme: 'manche', chrono: 'sans', aideSaisie: true
};

// Un defi porte sur une carte, et une seule.
//
// C'est la regle : une manche ne melange jamais deux categories. On ne demande
// pas la Colombie et la Corrèze dans la meme serie — ni le meme jour a deux
// joueurs qui ont choisi la meme carte. Chaque carte a donc son defi, tire de
// la date ET de son identifiant, et la configuration ne change que d'atlas.
export const configDuJour = (atlas = CONFIG_DU_JOUR.atlas) => ({ ...CONFIG_DU_JOUR, atlas });

// La graine du monde reste celle d'avant : le defi publie hier doit se rejouer
// a l'identique. Les autres cartes ajoutent leur nom au sel.
export const graineDuJour = (iso, atlas = CONFIG_DU_JOUR.atlas) =>
    graineDepuisTexte(atlas === CONFIG_DU_JOUR.atlas
        ? `geo-trouve-tout:${iso}`
        : `geo-trouve-tout:${iso}:${atlas}`);

// Ce que l'adresse demande. Un lien de defi porte une date, un lien de partie
// libre porte une graine et sa configuration — jamais un resultat, jamais une
// solution.
export function lireAdresse(recherche = '', cartes = null) {
    const params = new URLSearchParams(recherche);
    const jour = params.get('jour');
    if (jour && /^\d{4}-\d{2}-\d{2}$/.test(jour)) {
        // La carte du defi voyage avec la date. Une carte inconnue — un lien
        // d'une version future, une adresse bricolee — retombe sur le monde
        // plutot que de ne rien ouvrir.
        const voulue = params.get('carte');
        const atlas = voulue && (!cartes || cartes.includes(voulue)) ? voulue : CONFIG_DU_JOUR.atlas;
        return { mode: 'jour', jour, config: configDuJour(atlas), graine: graineDuJour(jour, atlas) };
    }
    const graine = params.get('seed');
    if (graine) {
        const config = { ...DEFAUTS };
        for (const clef of ['atlas', 'niveau', 'sens', 'rythme', 'chrono']) {
            const valeur = params.get(clef);
            if (valeur) config[clef] = valeur;
        }
        return { mode: 'libre', graine: graineDepuisTexte(graine), etiquette: graine, config };
    }
    return null;
}

export const lienDuJour = (iso, atlas = CONFIG_DU_JOUR.atlas, base = 'https://aytan-sudo.github.io/geo-trouve-tout/') =>
    atlas === CONFIG_DU_JOUR.atlas ? `${base}?jour=${iso}` : `${base}?jour=${iso}&carte=${atlas}`;

export function lienLibre(etiquette, config, base = 'https://aytan-sudo.github.io/geo-trouve-tout/') {
    const params = new URLSearchParams({ seed: etiquette });
    for (const clef of ['atlas', 'niveau', 'sens', 'rythme', 'chrono']) {
        if (config[clef] && config[clef] !== DEFAUTS[clef]) params.set(clef, config[clef]);
    }
    return `${base}?${params}`;
}

const SIGNES = { juste: '🟩', presque: '🟨', piege: '🟧', confusion: '🟥', faux: '🟥', vide: '⬜' };

export const duree = secondes =>
    `${Math.floor(secondes / 60)}:${String(secondes % 60).padStart(2, '0')}`;

// Le texte partage : le resultat en une ligne, la trace de la manche, le lien.
// Le lien porte la date et rien d'autre — surtout pas les reponses.
export function texteDePartage({ resultats, score, total, duree: secondes }, { jour, titre = 'Géo Trouve-Tout', lien }) {
    const trace = resultats.map(r => SIGNES[r.verdict] ?? '🟥').join('');
    return [
        `${titre} ${dateFrancaise(jour)}`,
        `${score}/${total} en ${duree(secondes)}`,
        trace,
        lien
    ].join('\n');
}
