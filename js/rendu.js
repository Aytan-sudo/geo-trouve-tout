// L'affichage de la question et de sa reponse.
//
// Ce module ne connait aucune regle : il recoit une question deja fabriquee, il
// la met a l'ecran ; il recoit un jugement, il le montre. La carte, elle, a son
// propre module — ici on ne s'occupe que de ce qui l'entoure.

import { suggestions } from './reponse.js';

const $ = id => document.getElementById(id);

export function creerRendu({ surChoix, surSuggestion }) {
    const elements = {
        pastilles: $('pastilles'), score: $('valeur-score'), chrono: $('valeur-chrono'),
        enonce: $('enonce'), choix: $('choix'), saisie: $('saisie'),
        texte: $('saisie-texte'), suggestions: $('suggestions'), consigne: $('consigne'),
        indice: $('indice'), verdict: $('verdict'), verdictTitre: $('verdict-titre'),
        verdictDetail: $('verdict-detail'), annonce: $('annonce'), mode: $('titre-mode'),
        aRevoir: $('a-revoir')
    };

    let saisieCourante = '';

    const api = {
        elements,

        // En manche, les pastilles sont le sujet : dix cases a remplir. En
        // marathon il n'y a pas de fin connue, alors elles deviennent une
        // trace — les dix dernieres reponses, qui defilent.
        pastilles(resultats, total, position) {
            elements.pastilles.textContent = '';
            const manche = Number.isFinite(total);
            const montres = manche ? resultats : resultats.slice(-10);
            const nombre = manche ? total : Math.min(Math.max(resultats.length + 1, 4), 10);
            const decalage = manche ? 0 : resultats.length - montres.length;
            for (let i = 0; i < nombre; i++) {
                const pastille = document.createElement('li');
                const resultat = montres[i];
                if (resultat) {
                    pastille.className = resultat.verdict === 'juste' ? 'juste'
                        : resultat.verdict === 'presque' ? 'presque' : 'faux';
                } else if (i + decalage === position) {
                    pastille.className = 'courante';
                }
                elements.pastilles.append(pastille);
            }
        },

        compteurs({ score, duree, vies = Infinity }) {
            elements.score.textContent = Number.isFinite(vies)
                ? `${score} ${'♥'.repeat(Math.max(vies, 0))}`
                : score;
            elements.chrono.textContent = duree;
        },

        mode(texte) { elements.mode.textContent = texte; },

        // Pose la question. `entite` sert aux enonces qui nomment le pays —
        // « Où est la France ? » et son article, parce qu'un jeu francais qui
        // ecrit « Où est France ? » perd d'un coup son serieux.
        question(question, entite, { saisieActive, aideSaisie, entites, invite }) {
            api.verdict(null);
            saisieCourante = '';
            // La liste de « Ma carte » n'a rien a faire sous une question : on
            // la retire ici plutot qu'a la sortie de cet ecran-la, pour qu'un
            // chemin oublie ne puisse pas la laisser derriere lui.
            api.aRevoir([]);
            elements.indice.hidden = !question.aide;
            if (question.aide) elements.indice.textContent = question.aide;

            if (question.sens === 'localiser') {
                // « Ou sont les Pays-Bas ? » : le verbe suit l'article, sans
                // quoi le jeu ecrit une faute a chaque pays pluriel.
                const verbe = entite?.article === 'les' ? 'sont' : 'est';
                elements.enonce.innerHTML = `Où ${verbe} <b>${avecArticle(entite)}</b> ?`;
                elements.choix.hidden = true;
                elements.choix.textContent = '';
                elements.saisie.hidden = true;
                elements.consigne.hidden = false;
                return;
            }

            elements.consigne.hidden = true;
            elements.enonce.textContent = question.enonce;

            if (saisieActive) {
                elements.choix.hidden = true;
                elements.choix.textContent = '';
                elements.saisie.hidden = false;
                api.saisie('', { aideSaisie, entites, invite });
                return;
            }

            elements.saisie.hidden = true;
            elements.choix.hidden = false;
            elements.choix.textContent = '';
            question.propositions.forEach((texte, rang) => {
                const bouton = document.createElement('button');
                bouton.type = 'button';
                bouton.textContent = texte;
                bouton.dataset.rang = rang;
                bouton.addEventListener('click', () => surChoix(texte, bouton));
                elements.choix.append(bouton);
            });
        },

        saisie(texte, { aideSaisie, entites, invite = 'Écrivez le nom…' }) {
            saisieCourante = texte;
            elements.texte.textContent = texte;
            elements.texte.dataset.invite = texte ? '' : invite;
            elements.suggestions.textContent = '';
            if (!aideSaisie) return;
            for (const entite of suggestions(texte, entites)) {
                const bouton = document.createElement('button');
                bouton.type = 'button';
                bouton.textContent = entite.nom;
                bouton.addEventListener('click', () => surSuggestion(entite.nom));
                const item = document.createElement('li');
                item.append(bouton);
                elements.suggestions.append(item);
            }
        },

        get texteSaisi() { return saisieCourante; },

        // Marque les boutons apres coup : le bon en vert, celui qu'on a touche
        // en rouge. Montrer la bonne reponse compte autant que sanctionner la
        // mauvaise — c'est la seule facon d'apprendre quelque chose d'une erreur.
        marquerChoix(bonne, donnee) {
            for (const bouton of elements.choix.querySelectorAll('button')) {
                bouton.disabled = true;
                if (bouton.textContent === bonne) bouton.classList.add('juste');
                else if (bouton.textContent === donnee) bouton.classList.add('faux');
            }
        },

        verdict(jugement, { correction = '', message = '' } = {}) {
            if (!jugement) { elements.verdict.hidden = true; return; }
            const titres = {
                juste: 'Juste', presque: 'Presque', piege: 'Pas tout à fait',
                confusion: 'Non', faux: 'Raté', vide: 'Temps écoulé'
            };
            elements.verdict.hidden = false;
            elements.verdict.className = `verdict ${jugement === 'juste' ? 'juste' : jugement === 'presque' ? 'presque' : 'faux'}`;
            elements.verdictTitre.textContent = titres[jugement] ?? 'Raté';
            elements.verdictDetail.textContent = message || correction;
            elements.annonce.textContent = `${titres[jugement] ?? ''}. ${message || correction}`;
        },

        legende(visible) { $('legende').hidden = !visible; },

        // La liste de ce qui reste a travailler. Elle a sa place sur l'ecran
        // « Ma carte » : sans elle, la carte dit qu'il reste du chemin sans
        // jamais dire lequel. Chaque pastille ramene la carte sur son pays.
        aRevoir(entites, surTouche = () => {}) {
            const liste = elements.aRevoir;
            liste.textContent = '';
            liste.hidden = entites.length === 0;
            for (const entite of entites) {
                const bouton = document.createElement('button');
                bouton.type = 'button';
                bouton.textContent = entite.nom;
                bouton.addEventListener('click', () => surTouche(entite.id));
                const item = document.createElement('li');
                item.append(bouton);
                liste.append(item);
            }
        },

        cacherReponse() {
            elements.choix.hidden = true;
            elements.saisie.hidden = true;
            elements.consigne.hidden = true;
            elements.indice.hidden = true;
            elements.aRevoir.hidden = true;
        }
    };

    return api;
}

// « la France », « l'Italie », « les Pays-Bas », « Cuba ». L'article est dans
// les donnees parce qu'aucune regle ne le devine : le Danemark et la Suede sont
// voisins et de genres differents.
export function avecArticle(entite) {
    if (!entite) return '';
    const article = entite.article ?? '';
    if (!article) return entite.nom;
    return article.endsWith("'") ? `${article}${entite.nom}` : `${article} ${entite.nom}`;
}
