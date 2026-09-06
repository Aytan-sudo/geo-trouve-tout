// L'assemblage, et rien d'autre.
//
// Chaque module sait faire une chose ; celui-ci les branche ensemble et tient
// le fil de la partie en cours. Aucune regle du jeu n'est ecrite ici.

import { creerHasard, graineDepuisTexte } from './hasard.js';
import { charger, CATALOGUE, nomDAtlas } from './atlas.js';
import { creerCarte } from './carte.js';
import { creerRendu, avecArticle } from './rendu.js';
import { creerPartie, restaurer } from './partie.js';
import { composerManche, sacDe, fabriquer } from './questions.js';
import { creerMemoire, jourDe } from './memoire.js';
import { verifier, indexer, normaliser } from './reponse.js';
import { NIVEAUX, CHRONOS, RYTHMES, DEFAUTS, signature } from './variantes.js';
import { preferences, partie as partieRangee, souvenirs, stats, toutEffacer } from './stockage.js';
import { appliquer as appliquerTheme, themeSuivant } from './themes.js';
import { son, vibrer, preparerSon, activerSon } from './son.js';
import { gestesCarte, creerClavier, raccourcis, interdireDoubleTap } from './entree.js';
import * as ui from './ui.js';
import {
    dateISO, lireAdresse, graineDuJour, CONFIG_DU_JOUR,
    texteDePartage, lienDuJour, lienLibre, duree as formaterDuree
} from './defi.js';

const $ = id => document.getElementById(id);
const VERSION = '1.0.0';

const etat = {
    reglages: preferences.lire(),
    atlas: null,
    carte: null,
    partie: null,
    memoire: creerMemoire(souvenirs.lire()),
    index: null,
    sac: [],
    mode: 'jour',
    jour: dateISO(),
    graine: 0,
    attenteSuivant: false,
    progression: false,
    minuterie: null
};

const rendu = creerRendu({
    surChoix: texte => repondre(texte),
    surSuggestion: nom => repondre(nom)
});

// ---------------------------------------------------------------- la partie

function juger(question, donnee) {
    const entite = etat.atlas.parId.get(question.cible);
    if (donnee === null || donnee === undefined || donnee === '') {
        return { verdict: 'vide', correction: reponseAttendue(question, entite) };
    }
    if (question.sens === 'localiser') {
        return donnee === question.cible
            ? { verdict: 'juste' }
            : { verdict: 'faux', correction: avecArticle(entite), touche: donnee };
    }
    if (question.propositions.length) {
        return normaliser(donnee) === normaliser(question.reponse)
            ? { verdict: 'juste' }
            : { verdict: 'faux', correction: question.reponse };
    }
    if (question.sens === 'capitale') {
        return normaliser(donnee) === normaliser(entite.capitale)
            ? { verdict: 'juste' }
            : { verdict: 'faux', correction: entite.capitale };
    }
    return verifier(donnee, entite, { index: etat.index, pieges: etat.atlas.pieges ?? [] });
}

const reponseAttendue = (question, entite) =>
    question.sens === 'capitale' ? entite.capitale : entite.nom;

function nouvellePartie({ mode = 'libre', jour = null, graine = null, cibles = null, reprise = null } = {}) {
    arreterMinuterie();
    etat.mode = mode;
    etat.jour = jour ?? dateISO();
    const config = mode === 'jour' ? { ...CONFIG_DU_JOUR } : configCourante();
    etat.graine = graine ?? graineDepuisTexte(`libre:${Date.now()}`);

    const hasard = creerHasard(etat.graine);
    etat.sac = sacDe(etat.atlas, config);
    const poids = (mode === 'jour' || etat.reglages.memoire === false)
        ? null
        : entite => etat.memoire.poidsDe(entite, jourDe());

    // En manche, tout le parcours est tire d'un coup : c'est ce qui rend le
    // defi du jour identique pour tout le monde. En marathon, la question
    // suivante se fabrique a la demande — la partie n'a pas de fin connue.
    let file = [];
    if (cibles) {
        file = cibles.map(id => fabriquer(etat.atlas.parId.get(id), etat.sac, config, hasard));
    } else if (RYTHMES[config.rythme].questions !== Infinity) {
        file = composerManche(etat.atlas, config, hasard, { nombre: RYTHMES[config.rythme].questions, poids });
    }

    // En reprenant une partie, les pays deja poses ne doivent pas revenir : la
    // file de la manche est refabriquee a l'identique par la graine, mais le
    // marathon, lui, tire au fil de l'eau.
    const dejaVues = new Set(reprise?.resultats?.map(r => r.cible) ?? []);
    const prochaine = position => {
        if (file[position]) { dejaVues.add(file[position].cible); return file[position]; }
        const restants = etat.sac.filter(e => !dejaVues.has(e.id));
        if (!restants.length) return null;
        const [cible] = poids
            ? composerManche({ ...etat.atlas, entites: restants }, config, hasard, { nombre: 1, poids }).map(q => etat.atlas.parId.get(q.cible))
            : [hasard.choisir(restants)];
        dejaVues.add(cible.id);
        return fabriquer(cible, etat.sac, config, hasard);
    };

    etat.partie = reprise
        ? restaurer(reprise, { prochaine, juger, maintenant: performance.now() })
        : creerPartie({ config, prochaine, juger, maintenant: performance.now() });
    if (!reprise) etat.partie.commencer();
    etat.attenteSuivant = false;
    quitterProgression();
    rendu.mode(mode === 'jour' ? `Défi du ${etat.jour.split('-').reverse().join('/')}` : nomDAtlas(config.atlas));
    marquerNavigation();
    afficherQuestion();
    demarrerMinuterie();
    ranger();
}

function afficherQuestion() {
    const partie = etat.partie;
    const question = partie.etat.question;
    if (!question) return terminer();

    const entite = etat.atlas.parId.get(question.cible);
    const saisieActive = question.sens !== 'localiser' && question.propositions.length === 0;
    rendu.question(question, entite, {
        saisieActive,
        aideSaisie: etat.reglages.aideSaisie !== false && etat.reglages.niveau !== 'expert',
        entites: etat.sac
    });
    rendu.pastilles(partie.etat.resultats, RYTHMES[partie.etat.config.rythme].questions, partie.etat.resultats.length);
    rendu.compteurs({
        score: partie.score(),
        duree: formaterDuree(Math.round(partie.etat.duree / 1000)),
        vies: partie.etat.vies
    });

    etat.carte.effacerMarques();
    if (question.sens === 'localiser') {
        etat.carte.montrerTout();
    } else {
        etat.carte.montrer(question.cible, { epingle: Boolean(entite.minuscule) || etat.reglages.signes });
        // Avec aide : on se rapproche du pays. Sans aide : on ne grossit pas,
        // mais on l'amene au centre — sinon la carte rognee peut le laisser
        // hors du cadre, et la question devient injouable.
        if (question.zoom) etat.carte.cadrerSur(question.cible);
        else etat.carte.centrerSur(question.cible);
    }
    $('verdict-suivant').hidden = true;
}

function repondre(donnee) {
    if (etat.attenteSuivant || !etat.partie || etat.partie.etat.finie) return;
    const question = etat.partie.etat.question;
    if (!question) return;

    // Le chrono envoie null : c'est une absence de reponse, pas une erreur, et
    // la partie sait faire la difference.
    const resultat = donnee === null
        ? etat.partie.expirer(performance.now())
        : etat.partie.repondre(donnee, performance.now());
    if (!resultat) return;

    const entite = etat.atlas.parId.get(question.cible);
    if (question.propositions.length) rendu.marquerChoix(question.reponse, String(donnee));

    // Le pays cherche passe au vert dans tous les cas : c'etait la bonne
    // reponse, et la montrer vaut mieux que la punir. Ce qui vire au rouge,
    // c'est ce que le joueur a repondu a la place.
    etat.carte.effacerMarques();
    if (question.sens === 'localiser' && !resultat.juste && resultat.touche) {
        etat.carte.marquer(resultat.touche, 'faux');
    }
    etat.carte.marquer(question.cible, 'juste');
    // Apres une erreur, on montre ou etait le pays, meme aux niveaux sans aide :
    // c'est le moment ou l'on apprend quelque chose.
    if (!resultat.juste || question.zoom) etat.carte.cadrerSur(question.cible);

    const detail = resultat.verdict === 'juste' ? ''
        : resultat.message || `C’était ${question.sens === 'capitale' ? resultat.correction : avecArticle(entite)}.`;
    rendu.verdict(resultat.verdict, { correction: detail, message: resultat.message && `${resultat.message} C’était ${avecArticle(entite)}.` });

    if (etat.reglages.sons !== false) {
        if (resultat.verdict === 'juste') son.juste();
        else if (resultat.verdict === 'presque') son.presque();
        else son.faux();
    }
    if (etat.reglages.vibration !== false) vibrer(resultat.juste ? 12 : [22, 40, 22]);

    // Le defi du jour ne se laisse pas guider par la memoire — il doit rester
    // le meme pour tout le monde — mais ce qu'on y rate s'apprend comme le
    // reste : la fiche du pays est mise a jour dans les deux modes.
    etat.memoire.noter(question.cible, resultat.juste, jourDe());
    souvenirs.ecrire(etat.memoire.serialiser());

    rendu.pastilles(etat.partie.etat.resultats, RYTHMES[etat.partie.etat.config.rythme].questions, etat.partie.etat.resultats.length);
    rendu.compteurs({
        score: etat.partie.score(),
        duree: formaterDuree(Math.round(etat.partie.etat.duree / 1000)),
        vies: etat.partie.etat.vies
    });
    ranger();

    // Une bonne reponse enchaine toute seule ; une mauvaise attend, le temps de
    // lire ce qu'il fallait repondre.
    etat.attenteSuivant = true;
    if (resultat.juste) {
        setTimeout(() => { etat.attenteSuivant = false; suite(); }, 800);
    } else {
        $('verdict-suivant').hidden = false;
        $('verdict-suivant').focus?.();
    }
}

function suite() {
    etat.attenteSuivant = false;
    if (etat.partie.etat.finie) return terminer();
    afficherQuestion();
}

function terminer() {
    arreterMinuterie();
    const bilan = etat.partie.bilan();
    const config = etat.partie.etat.config;
    if (etat.reglages.sons !== false) son.fin(bilan.score >= bilan.total * 0.6);
    stats.noter({
        signature: signature(config),
        bilan,
        jour: etat.mode === 'jour' && etat.jour === dateISO() ? etat.jour : null
    });
    partieRangee.effacer();
    rendu.cacherReponse();
    rendu.verdict(null);
    ui.montrerFin({
        bilan,
        config,
        nomsRates: bilan.rates.map(id => etat.atlas.parId.get(id)?.nom ?? id),
        defi: etat.mode === 'jour' ? etat.jour : null
    });
}

// ------------------------------------------------------------------ chrono

function demarrerMinuterie() {
    arreterMinuterie();
    etat.minuterie = setInterval(() => {
        if (!etat.partie || etat.partie.etat.finie) return;
        const secondes = Math.round(etat.partie.horloge(performance.now()) / 1000);
        rendu.compteurs({
            score: etat.partie.score(),
            duree: formaterDuree(secondes),
            vies: etat.partie.etat.vies
        });

        const limite = CHRONOS[etat.partie.etat.config.chrono]?.secondes ?? 0;
        if (limite && !etat.attenteSuivant) {
            const passees = secondes - (etat.partie.etat.resultats.length * limite);
            if (passees >= limite) repondre(null);
        }
    }, 250);
}

const arreterMinuterie = () => { if (etat.minuterie) clearInterval(etat.minuterie); etat.minuterie = null; };

// Une partie chronometree se met en pause quand l'application passe a
// l'arriere-plan : sinon le temps d'un appel telephonique compte comme du temps
// de reflexion.
document.addEventListener('visibilitychange', () => {
    if (document.hidden) { arreterMinuterie(); return; }
    etat.partie?.reprendreHorloge(performance.now());
    if (etat.partie && !etat.partie.etat.finie) demarrerMinuterie();
});

// ------------------------------------------------------------- ma carte

function montrerProgression() {
    etat.progression = true;
    document.body.dataset.ecran = 'progression';
    arreterMinuterie();
    etat.carte.effacerMarques();
    etat.carte.recentrer();
    etat.carte.colorier(id => etat.memoire.niveauDe(id));
    rendu.cacherReponse();
    rendu.verdict(null);
    rendu.legende(true);
    const compte = etat.memoire.resume(etat.atlas.entites);
    rendu.elements.enonce.textContent = `${compte.acquis} pays acquis, ${compte.hesitant} en cours, ${compte.inconnu} jamais vus.`;
    rendu.elements.enonce.hidden = false;

    // Ce qu'il reste a travailler, du moins su au mieux su. Toucher un nom
    // ramene la carte dessus : c'est la revision sans partie.
    const aRevoir = etat.atlas.entites
        .filter(entite => etat.memoire.niveauDe(entite.id) === 'hesitant')
        .sort((a, b) => etat.memoire.maitriseDe(a.id) - etat.memoire.maitriseDe(b.id))
        .slice(0, 30);
    rendu.aRevoir(aRevoir, id => { annoncerPays(id); });
    rendu.mode('Ma carte');
    marquerNavigation();
}

function quitterProgression() {
    if (!etat.progression) return;
    etat.progression = false;
    delete document.body.dataset.ecran;
    etat.carte.decolorier();
    rendu.legende(false);
}

function marquerNavigation() {
    const courant = etat.progression ? 'nav-progression' : etat.mode === 'jour' ? 'nav-jour' : 'nav-libre';
    for (const id of ['nav-jour', 'nav-libre', 'nav-progression']) {
        $(id).setAttribute('aria-current', String(id === courant));
    }
}

// ------------------------------------------------------------- persistance

function ranger() {
    if (!etat.partie || etat.partie.etat.finie) return;
    partieRangee.ecrire({
        ...etat.partie.serialiser(),
        mode: etat.mode, jour: etat.jour, graine: etat.graine
    });
}

const configCourante = () => ({
    atlas: etat.reglages.atlas ?? DEFAUTS.atlas,
    niveau: etat.reglages.niveau ?? DEFAUTS.niveau,
    sens: etat.reglages.sens ?? DEFAUTS.sens,
    rythme: etat.reglages.rythme ?? DEFAUTS.rythme,
    chrono: etat.reglages.chrono ?? DEFAUTS.chrono
});

// ------------------------------------------------------------- demarrage

async function chargerAtlas(id) {
    etat.atlas = await charger(id);
    etat.index = indexer(etat.atlas.entites);
    // La scene prend le rapport de la carte, corrige du peu qu'on accepte de
    // rogner (css/interface.css). Sans cela un planisphere flotte au milieu
    // d'un grand rectangle vide sur un telephone tenu debout.
    document.documentElement.style.setProperty('--ratio-carte', String(etat.atlas.ratio));
    etat.carte = creerCarte($('carte'), etat.atlas);
    gestesCarte(etat.carte.svg, etat.carte, {
        surAppui: (x, y) => {
            const id = etat.carte.auPoint(x, y);
            if (!id) return;
            if (etat.progression) { annoncerPays(id); return; }
            if (etat.partie?.etat.question?.sens === 'localiser') repondre(id);
        }
    });
}

function annoncerPays(id) {
    const entite = etat.atlas.parId.get(id);
    if (!entite) return;
    const niveau = { acquis: 'acquis', hesitant: 'à revoir', inconnu: 'jamais vu' }[etat.memoire.niveauDe(id)];
    rendu.elements.enonce.textContent = `${entite.nom}${entite.capitale ? ` · ${entite.capitale}` : ''} — ${niveau}`;
    etat.carte.cadrerSur(id);
}

async function demarrer() {
    appliquerTheme(etat.reglages.theme);
    document.documentElement.dataset.signes = etat.reglages.signes ? '1' : '0';
    activerSon(etat.reglages.sons !== false);
    $('son-basculer').setAttribute('aria-pressed', String(etat.reglages.sons !== false));
    $('version').textContent = `Géo Trouve-Tout ${VERSION}`;
    ui.brancherDialogues();

    const adresse = lireAdresse(location.search);
    const atlasVoulu = adresse?.config?.atlas ?? etat.reglages.atlas ?? DEFAUTS.atlas;
    await chargerAtlas(CATALOGUE.some(a => a.id === atlasVoulu) ? atlasVoulu : DEFAUTS.atlas);

    interdireDoubleTap(document.body);
    brancherBoutons();

    if (adresse?.mode === 'jour') {
        nouvellePartie({ mode: 'jour', jour: adresse.jour, graine: adresse.graine });
    } else if (adresse?.mode === 'libre') {
        etat.reglages = { ...etat.reglages, ...adresse.config };
        nouvellePartie({ mode: 'libre', graine: adresse.graine });
    } else {
        // Fermer l'onglet ne coute rien : la manche en cours se reprend ou elle
        // s'est arretee. Sauf si c'est le defi d'hier — celui-la est passe.
        const rangee = partieRangee.lire();
        const reprenable = rangee?.config && rangee.resultats?.length
            && (rangee.mode !== 'jour' || rangee.jour === dateISO())
            && rangee.config.atlas === etat.atlas.id;
        if (reprenable) {
            etat.reglages = { ...etat.reglages, ...rangee.config };
            nouvellePartie({
                mode: rangee.mode, jour: rangee.jour, graine: rangee.graine, reprise: rangee
            });
        } else {
            partieRangee.effacer();
            nouvellePartie({ mode: 'jour', jour: dateISO(), graine: graineDuJour(dateISO()) });
        }
    }
}

function brancherBoutons() {
    const options = ui.creerOptions({
        preferences: etat.reglages,
        surChangement: async valeurs => {
            etat.reglages = { ...etat.reglages, ...valeurs };
            preferences.ecrire(valeurs);
            if (valeurs.theme) appliquerTheme(valeurs.theme);
            if ('signes' in valeurs) document.documentElement.dataset.signes = valeurs.signes ? '1' : '0';
            if ('sons' in valeurs) {
                activerSon(valeurs.sons);
                $('son-basculer').setAttribute('aria-pressed', String(valeurs.sons));
            }
            if (valeurs.atlas && valeurs.atlas !== etat.atlas.id) await chargerAtlas(valeurs.atlas);
            options.montrer({ ...etat.reglages, ...configCourante() });
        },
        surJouer: () => nouvellePartie({ mode: 'libre' })
    });

    $('options-ouvrir').addEventListener('click', () => options.montrer({ ...etat.reglages, ...configCourante() }));
    $('aide-ouvrir').addEventListener('click', () => ui.ouvrir($('dialogue-aide')));
    $('stats-ouvrir').addEventListener('click', () => {
        const compte = etat.memoire.resume(etat.atlas.entites);
        ui.montrerStats({ stats: stats.lire(), acquis: compte.acquis, total: compte.total });
    });
    $('theme-basculer').addEventListener('click', () => {
        const theme = themeSuivant(etat.reglages.theme).id;
        etat.reglages.theme = theme;
        preferences.ecrire({ theme });
        appliquerTheme(theme);
    });
    $('son-basculer').addEventListener('click', evenement => {
        const actif = evenement.currentTarget.getAttribute('aria-pressed') !== 'true';
        evenement.currentTarget.setAttribute('aria-pressed', String(actif));
        etat.reglages.sons = actif;
        preferences.ecrire({ sons: actif });
        activerSon(actif);
    });

    $('action-recentrer').addEventListener('click', () => etat.carte.recentrer());
    $('verdict-suivant').addEventListener('click', suite);
    $('nav-jour').addEventListener('click', () => nouvellePartie({ mode: 'jour', jour: dateISO(), graine: graineDuJour(dateISO()) }));
    $('nav-libre').addEventListener('click', () => nouvellePartie({ mode: 'libre' }));
    $('nav-progression').addEventListener('click', montrerProgression);

    $('fin-rejouer').addEventListener('click', () => {
        $('dialogue-fin').close();
        nouvellePartie({ mode: etat.mode === 'jour' ? 'libre' : etat.mode });
    });
    $('fin-rejouer-rates').addEventListener('click', () => {
        const rates = etat.partie.bilan().rates;
        $('dialogue-fin').close();
        nouvellePartie({ mode: 'libre', cibles: rates });
    });
    $('fin-partager').addEventListener('click', () => {
        const bilan = etat.partie.bilan();
        const texte = texteDePartage(
            { ...bilan, resultats: etat.partie.etat.resultats },
            {
                jour: etat.mode === 'jour' ? etat.jour : dateISO(),
                lien: etat.mode === 'jour' ? lienDuJour(etat.jour) : lienLibre(String(etat.graine), etat.partie.etat.config)
            }
        );
        ui.partager(texte, message => { rendu.elements.annonce.textContent = message; });
    });
    $('effacer-stats').addEventListener('click', () => {
        toutEffacer();
        etat.memoire.oublier();
        $('dialogue-stats').close();
    });

    creerClavier($('clavier'), {
        surLettre: lettre => saisir(rendu.texteSaisi + lettre),
        surEffacer: () => saisir(rendu.texteSaisi.slice(0, -1)),
        surValider: () => rendu.texteSaisi && repondre(rendu.texteSaisi)
    });

    raccourcis({
        choisir: rang => {
            const boutons = rendu.elements.choix.querySelectorAll('button');
            if (!boutons[rang] || boutons[rang].disabled) return false;
            boutons[rang].click();
            return true;
        },
        lettre: touche => {
            if (rendu.elements.saisie.hidden) return false;
            saisir(rendu.texteSaisi + touche);
            return true;
        },
        valider: () => {
            if (!$('verdict-suivant').hidden) { suite(); return; }
            if (!rendu.elements.saisie.hidden && rendu.texteSaisi) repondre(rendu.texteSaisi);
        },
        effacer: () => { if (!rendu.elements.saisie.hidden) saisir(rendu.texteSaisi.slice(0, -1)); },
        nouvelle: () => nouvellePartie({ mode: 'libre' }),
        relancer: () => nouvellePartie({ mode: etat.mode, jour: etat.jour, graine: etat.graine }),
        theme: () => $('theme-basculer').click(),
        aide: () => ui.ouvrir($('dialogue-aide')),
        echapper: () => { for (const d of document.querySelectorAll('dialog[open]')) d.close(); }
    });

    // Le contexte audio se prepare au premier contact, avant que le jeu n'ait
    // une note a demander : iOS ne l'autorise qu'a ce moment-la.
    const preparer = () => { preparerSon(); document.removeEventListener('pointerdown', preparer); };
    document.addEventListener('pointerdown', preparer, { once: true });
}

function saisir(texte) {
    rendu.saisie(texte.slice(0, 40), {
        aideSaisie: etat.reglages.aideSaisie !== false && etat.reglages.niveau !== 'expert',
        entites: etat.sac
    });
    if (etat.reglages.sons !== false) son.touche();
}

demarrer();

// Le service worker : reseau d'abord, cache en secours. Une mise a jour
// publiee arrive donc sans manoeuvre du joueur.
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { /* hors ligne, tant pis */ }));
}
