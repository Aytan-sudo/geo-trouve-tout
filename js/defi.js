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

export const graineDuJour = iso => graineDepuisTexte(`geo-trouve-tout:${iso}`);

// Ce que l'adresse demande. Un lien de defi porte une date, un lien de partie
// libre porte une graine et sa configuration — jamais un resultat, jamais une
// solution.
export function lireAdresse(recherche = '') {
    const params = new URLSearchParams(recherche);
    const jour = params.get('jour');
    if (jour && /^\d{4}-\d{2}-\d{2}$/.test(jour)) {
        return { mode: 'jour', jour, config: { ...CONFIG_DU_JOUR }, graine: graineDuJour(jour) };
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

export const lienDuJour = (iso, base = 'https://aytan-sudo.github.io/geo-trouve-tout/') =>
    `${base}?jour=${iso}`;

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
