// Ce que le jeu retient de vous.
//
// C'est la particularite du jeu : un quiz de geographie qui tire au hasard vous
// repose eternellement les pays que vous savez deja. Ici, chaque pays porte une
// note de maitrise, et le tirage pese en faveur de ceux que vous ratez et de
// ceux que vous n'avez jamais vus. Au fil des parties, la carte de progression
// se colorie — et ce qui reste pale est exactement ce qu'il reste a apprendre.
//
// Le module est pur : il recoit un etat, il en rend un nouveau. Ni stockage, ni
// horloge — le jour courant est un parametre, ce qui rend la revision testable
// sans attendre demain.

// Une fiche tient en quatre nombres, pour que deux cents pays tiennent sans
// gene dans localStorage : [vues, justes, maitrise en centiemes, jour du dernier passage].
const VUES = 0, JUSTES = 1, MAITRISE = 2, JOUR = 3;

export const JOUR_ZERO = Date.UTC(2026, 0, 1);
export const jourDe = (date = new Date()) =>
    Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - JOUR_ZERO) / 86400000);

// Une reussite comble la moitie du chemin qui reste ; un echec ramene presque a
// zero. Trois bonnes reponses suffisent donc a acquerir un pays, mais une seule
// erreur le remet en revision — ce qui est le comportement voulu : on veut etre
// re-interroge sur ce qu'on vient de manquer.
const APRES_JUSTE = m => m + (1 - m) * 0.5;
const APRES_FAUX = m => m * 0.25;

export function creerMemoire(donnees = {}) {
    const fiches = new Map(Object.entries(donnees).map(([id, f]) => [id, f.slice()]));

    const fiche = id => fiches.get(id) ?? [0, 0, 0, -1];

    return {
        // L'etat, pret a etre range dans localStorage.
        serialiser: () => Object.fromEntries(fiches),

        noter(id, juste, jour = jourDe()) {
            const f = fiche(id).slice();
            f[VUES]++;
            if (juste) f[JUSTES]++;
            const m = f[MAITRISE] / 100;
            f[MAITRISE] = Math.round((juste ? APRES_JUSTE(m) : APRES_FAUX(m)) * 100);
            f[JOUR] = jour;
            fiches.set(id, f);
            return f;
        },

        maitriseDe: id => fiche(id)[MAITRISE] / 100,
        vuesDe: id => fiche(id)[VUES],

        // Trois etats, et pas un de plus : c'est ce qu'une carte peut montrer
        // d'un coup d'oeil, et ce qu'un enfant comprend sans legende.
        niveauDe(id) {
            const f = fiche(id);
            if (!f[VUES]) return 'inconnu';
            return f[MAITRISE] >= 70 && f[JUSTES] >= 2 ? 'acquis' : 'hesitant';
        },

        // Le poids de tirage. Un pays jamais vu passe devant un pays acquis,
        // un pays rate passe devant tout le monde, et l'oubli fait remonter
        // doucement ce qui n'a pas ete revu — sans jamais tomber a zero, pour
        // qu'une partie garde sa part d'imprevu.
        poidsDe(entite, jour = jourDe()) {
            const f = fiche(entite.id);
            if (!f[VUES]) return 6;
            const oubli = Math.min(1 + (jour - f[JOUR]) / 10, 3);
            return (1 + 8 * (1 - f[MAITRISE] / 100)) * oubli;
        },

        // Pour l'ecran « Ma carte ».
        resume(entites) {
            const compte = { acquis: 0, hesitant: 0, inconnu: 0 };
            for (const entite of entites) compte[this.niveauDe(entite.id)]++;
            return { ...compte, total: entites.length };
        },

        oublier() { fiches.clear(); }
    };
}
