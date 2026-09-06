// Ce qui dure d'une question a l'autre : le fil de la manche, le score, les
// vies, l'historique des reponses.
//
// Aucune horloge ici non plus. Le temps entre par la porte — `maintenant` est
// un parametre — ce qui permet de tester une partie chronometree en Node, et de
// mettre la partie en pause quand l'application passe a l'arriere-plan sans que
// le moteur ait a le savoir.

import { RYTHMES } from './variantes.js';
import { compteJuste } from './reponse.js';

export function creerPartie({ config, prochaine, juger, maintenant = 0 }) {
    const rythme = RYTHMES[config.rythme];
    const etat = {
        config,
        resultats: [],
        vies: rythme.vies,
        serie: 0,
        meilleureSerie: 0,
        debut: maintenant,
        duree: 0,
        finie: false,
        question: null
    };

    // Le temps de jeu s'accumule par tranches : une partie reprise demain ne
    // doit pas afficher vingt heures.
    let dernierTop = maintenant;

    const avancer = () => {
        etat.question = etat.resultats.length >= rythme.questions || etat.vies <= 0
            ? null
            : prochaine(etat.resultats.length);
        if (!etat.question) etat.finie = true;
        return etat.question;
    };

    return {
        etat,
        commencer: () => avancer(),

        horloge(instant) {
            if (!etat.finie) etat.duree += Math.max(0, instant - dernierTop);
            dernierTop = instant;
            return etat.duree;
        },

        // La pause de l'arriere-plan : on repart du nouvel instant sans compter
        // le temps passe ailleurs.
        reprendreHorloge(instant) { dernierTop = instant; },

        repondre(donnee, instant = dernierTop, impose = null) {
            if (etat.finie || !etat.question) return null;
            this.horloge(instant);
            const jugement = impose ?? juger(etat.question, donnee);
            const juste = compteJuste(jugement.verdict);

            etat.resultats.push({
                cible: etat.question.cible,
                sens: etat.question.sens,
                verdict: jugement.verdict,
                donnee: typeof donnee === 'string' ? donnee : String(donnee ?? ''),
                attendue: etat.question.reponse
            });
            if (juste) {
                etat.serie++;
                etat.meilleureSerie = Math.max(etat.meilleureSerie, etat.serie);
            } else {
                etat.serie = 0;
                etat.vies--;
            }
            const suivante = avancer();
            return { ...jugement, juste, termine: etat.finie, suivante };
        },

        // Le temps est ecoule. Ce n'est pas une reponse fausse, c'est une
        // absence de reponse : le verdict est pose ici plutot que soumis au
        // juge, qui n'aurait rien a juger.
        expirer(instant = dernierTop) {
            const attendue = etat.question?.reponse ?? '';
            return this.repondre(null, instant, { verdict: 'vide', correction: attendue });
        },

        score: () => etat.resultats.filter(r => compteJuste(r.verdict)).length,
        rates: () => etat.resultats.filter(r => !compteJuste(r.verdict)).map(r => r.cible),

        bilan() {
            const justes = this.score();
            return {
                score: justes,
                total: etat.resultats.length,
                duree: Math.round(etat.duree / 1000),
                serie: etat.meilleureSerie,
                rates: this.rates(),
                parfait: justes === etat.resultats.length && etat.resultats.length > 0
            };
        },

        // Ce qu'on range pour reprendre la partie a la reouverture. Les
        // questions deja posees ne sont pas rejouees : c'est leur resultat qui
        // compte, et le tirage se refabrique a partir de la graine.
        serialiser: () => ({
            v: 1,
            config: etat.config,
            resultats: etat.resultats,
            vies: etat.vies === Infinity ? null : etat.vies,
            serie: etat.serie,
            meilleureSerie: etat.meilleureSerie,
            duree: etat.duree
        })
    };
}

export function restaurer(sauvegarde, { prochaine, juger, maintenant = 0 }) {
    const partie = creerPartie({ config: sauvegarde.config, prochaine, juger, maintenant });
    partie.etat.resultats = sauvegarde.resultats ?? [];
    partie.etat.vies = sauvegarde.vies ?? Infinity;
    partie.etat.serie = sauvegarde.serie ?? 0;
    partie.etat.meilleureSerie = sauvegarde.meilleureSerie ?? 0;
    partie.etat.duree = sauvegarde.duree ?? 0;
    partie.commencer();
    return partie;
}
