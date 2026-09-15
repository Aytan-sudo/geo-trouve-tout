// L'assemblage, et rien d'autre.
//
// Chaque module sait faire une chose ; celui-ci les branche ensemble et tient
// le fil de la partie en cours. Aucune regle du jeu n'est ecrite ici.

import { creerHasard, graineDepuisTexte } from './hasard.js';
import { charger, CATALOGUE, nomDAtlas, familleDe, cartesDe } from './atlas.js';
import { creerCarte } from './carte.js';
import { creerRendu, avecArticle } from './rendu.js';
import { creerPartie, restaurer } from './partie.js';
import { composerManche, sacDe, fabriquer } from './questions.js';
import { creerMemoire, jourDe } from './memoire.js';
import { verifier, indexer, normaliser } from './reponse.js';
import { NIVEAUX, CHRONOS, RYTHMES, SENS, DEFAUTS, signature, sensDe, sensAlternes, nomAffiche, texte as motsDe } from './variantes.js';
import { preferences, partie as partieRangee, souvenirs, stats, toutEffacer } from './stockage.js';
import { appliquer as appliquerTheme, themeSuivant } from './themes.js';
import { son, vibrer, preparerSon, activerSon } from './son.js';
import { gestesCarte, creerClavier, raccourcis, interdireDoubleTap } from './entree.js';
import * as ui from './ui.js';
import {
    dateISO, lireAdresse, graineDuJour, CONFIG_DU_JOUR, configDuJour,
    texteDePartage, lienDuJour, lienLibre, duree as formaterDuree
} from './defi.js';

const $ = id => document.getElementById(id);
const VERSION = '1.4.3';

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
    passeportProgression: { jour: dateISO(), reponses: 0 },
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
    // Les sens qui demandent un champ de l'entite — la capitale, le numero,
    // l'embouchure — se corrigent tous de la meme facon : on compare a ce
    // champ, et il n'y a rien a interpreter. Seul le numero a sa convention.
    const exige = SENS[question.sens]?.exige;
    if (exige) {
        // « 1 » vaut « 01 » : le zero de tete est une convention d'ecriture,
        // pas une connaissance. « 2A » et « 2B », eux, comptent a la lettre.
        const propre = question.sens === 'numero'
            ? v => normaliser(v).replace(/^0+(?=\w)/, '')
            : normaliser;
        return propre(donnee) === propre(entite[exige])
            ? { verdict: 'juste' }
            : { verdict: 'faux', correction: entite[exige] };
    }
    return verifier(donnee, entite, { index: etat.index, pieges: etat.atlas.pieges ?? [] });
}

const reponseAttendue = (question, entite) =>
    SENS[question.sens]?.exige ? entite[SENS[question.sens].exige] : nomAffiche(entite);

function nouvellePartie({ mode = 'libre', jour = null, graine = null, cibles = null, reprise = null } = {}) {
    arreterMinuterie();
    etat.passeportProgression = reprise?.passeportProgression ?? { jour: dateISO(), reponses: 0 };
    etat.mode = mode;
    etat.jour = jour ?? dateISO();
    // La configuration dit la carte reellement en jeu, pas celle qu'un reglage
    // souhaite : c'est elle qui signe le palmares. Et un sens que la carte ne
    // sait pas poser — le numero d'un pays — retombe sur « nommer » : un
    // reglage garde d'une autre carte ne doit pas vider le sac.
    const config = mode === 'jour'
        ? { ...configDuJour(etat.atlas.id) }
        : { ...configCourante(), atlas: etat.atlas.id };
    if (!sensDe(etat.atlas).includes(config.sens)) config.sens = DEFAUTS.sens;
    etat.graine = graine ?? graineDepuisTexte(`libre:${Date.now()}`);

    const hasard = creerHasard(etat.graine);
    etat.sac = sacDe(etat.atlas, config);
    const poids = (mode === 'jour' || etat.reglages.memoire === false)
        ? null
        : entite => etat.memoire.poidsDe(entite, jourDe());

    // En manche, tout le parcours est tire d'un coup : c'est ce qui rend le
    // defi du jour identique pour tout le monde. En marathon, la question
    // suivante se fabrique a la demande — la partie n'a pas de fin connue.
    const motsEtSens = { mots: etat.atlas.mots, alternes: sensAlternes(etat.atlas) };
    let file = [];
    if (cibles) {
        file = cibles.map(id => fabriquer(etat.atlas.parId.get(id), etat.sac, config, hasard, motsEtSens));
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
        return fabriquer(cible, etat.sac, config, hasard, motsEtSens);
    };

    etat.partie = reprise
        ? restaurer(reprise, { prochaine, juger, maintenant: performance.now() })
        : creerPartie({ config, prochaine, juger, maintenant: performance.now() });
    if (!reprise) etat.partie.commencer();
    etat.attenteSuivant = false;
    quitterProgression();
    rendu.mode(titreDuMode(mode, config.atlas));
    marquerNavigation();
    afficherQuestion();
    demarrerMinuterie();
    ranger();
}

// Une partie se joue sur la carte de son mode. Le defi du jour est le monde,
// toujours — sans cette garantie, un joueur qui a choisi l'Europe dans ses
// reglages jouerait un « defi du jour » compose en Europe, donc different de
// celui de tout le monde, et range au palmares sous le nom du monde.
//
// Rejouer les rates fait exception : ces pays viennent de la carte en cours, et
// c'est sur elle qu'on les revoit.
async function lancer(options = {}) {
    const voulu = options.cibles
        ? etat.atlas.id
        : (options.mode === 'jour' ? carteDuJour() : configCourante().atlas);
    if (voulu !== etat.atlas?.id) await chargerAtlas(voulu);
    nouvellePartie(options);
}

// Ce que la barre du haut annonce. Le defi du monde garde sa date entiere ;
// pour les autres cartes, c'est la carte qui distingue le defi du jour — il y
// en a un par categorie, et jamais un qui les melange.
const titreDuMode = (mode, atlas) => {
    if (mode !== 'jour') return nomDAtlas(atlas);
    return atlas === CONFIG_DU_JOUR.atlas
        ? `Défi du ${etat.jour.split('-').reverse().join('/')}`
        : `Défi du jour · ${nomDAtlas(atlas)}`;
};

function afficherQuestion() {
    const partie = etat.partie;
    const question = partie.etat.question;
    if (!question) return terminer();

    const entite = etat.atlas.parId.get(question.cible);
    const saisieActive = question.sens !== 'localiser' && question.propositions.length === 0;
    if (saisieActive) clavier(question.sens === 'numero' ? 'chiffres' : 'lettres');
    rendu.question(question, entite, {
        saisieActive,
        aideSaisie: aideDeSaisie(question),
        entites: etat.sac,
        invite: inviteDe(question),
        consigne: consigneDe()
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

    // Les expirations sans réponse ne donnent pas de tampon. Chaque nouvelle
    // journée repart de zéro, même si la manche a commencé la veille.
    if (donnee !== null && donnee !== undefined && String(donnee).trim()) {
        if (etat.passeportProgression.jour !== dateISO()) etat.passeportProgression = { jour: dateISO(), reponses: 0 };
        etat.passeportProgression.reponses++;
        globalThis.Passeport?.noter('geo-trouve-tout', etat.passeportProgression.reponses);
    }

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
        // Le nom se redonne avec son article — et le numero aussi, puisque
        // « le Var (83) » le porte deja. Tout le reste est la reponse elle-meme.
        : resultat.message || `C’était ${nomme(question.sens) ? avecArticle(entite) : resultat.correction}.`;
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
    // Une manche réussie (6 sur 10 au moins, le seuil du son de victoire) ou une
    // série de dix en marathon donnent le tampon, même avant dix réponses : des
    // questions expirées ont pu en prendre la place.
    const reussie = config.rythme === 'marathon' ? bilan.serie >= 10 : bilan.total > 0 && bilan.score >= bilan.total * 0.6;
    if (reussie) globalThis.Passeport?.noter('geo-trouve-tout', etat.passeportProgression.reponses, true);
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
        nomsRates: bilan.rates.map(id => nomAffiche(etat.atlas.parId.get(id)) || id),
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
    // « 18 régions acquises », « 197 pays acquis » : l'accord voyage avec les
    // mots de la carte, comme le reste des enonces.
    rendu.elements.enonce.textContent = motsDe(
        `${compte.acquis} {entites} {acquis}, ${compte.hesitant} en cours, ${compte.inconnu} {jamaisVus}.`,
        etat.atlas.mots);
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
    // Les pastilles de pays restaient sous la partie suivante, ou elles
    // debordaient de l'ecran : elles appartiennent a cet ecran-la, elles s'en
    // vont avec lui.
    rendu.aRevoir([]);
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
        mode: etat.mode, jour: etat.jour, graine: etat.graine, passeportProgression: etat.passeportProgression
    });
}

// La carte du defi du jour se choisit comme le reste, et se retient. Elle est
// separee de la carte des parties libres : on peut travailler ses departements
// en libre et garder le defi du monde.
const carteDuJour = () => {
    const voulue = etat.reglages.carteDuJour ?? CONFIG_DU_JOUR.atlas;
    return CATALOGUE.some(c => c.id === voulue) ? voulue : CONFIG_DU_JOUR.atlas;
};

// Les deux sens qui redonnent le nom de l'entite : celui qui le demande, et
// celui du numero — « le Var (83) » porte les deux d'un coup.
const nomme = sens => sens === 'nommer' || sens === 'numero';

// L'aide a la saisie propose des noms d'entites : elle n'a rien a dire d'un
// numero ni d'une embouchure, et l'Expert s'en passe par definition.
const aideDeSaisie = question =>
    etat.reglages.aideSaisie !== false
    && etat.reglages.niveau !== 'expert'
    && !SENS[question.sens]?.exige;

const configCourante = () => ({
    atlas: etat.reglages.atlas ?? DEFAUTS.atlas,
    niveau: etat.reglages.niveau ?? DEFAUTS.niveau,
    sens: etat.reglages.sens ?? DEFAUTS.sens,
    rythme: etat.reglages.rythme ?? DEFAUTS.rythme,
    chrono: etat.reglages.chrono ?? DEFAUTS.chrono
});

// ------------------------------------------------------------- demarrage

// Ce que le menu sait dire d'une carte sans la jouer : combien d'entites elle
// porte, quels sens elle peut poser, dans quels mots. Le fichier est charge une
// fois et garde — c'est aussi ce qui rend « Commencer » instantane.
const apercus = new Map();

const retenirApercu = atlas => {
    apercus.set(atlas.id, {
        total: atlas.entites.length,
        sens: sensDe(atlas),
        mots: atlas.mots,
        sac: config => sacDe(atlas, config).length
    });
    return apercus.get(atlas.id);
};

async function apercuDe(id) {
    return apercus.get(id) ?? retenirApercu(await charger(id));
}

async function chargerAtlas(id) {
    etat.atlas = await charger(id);
    // Une carte ouverte est une carte connue : le palmares et les menus
    // pourront la nommer dans ses propres mots sans la relire.
    retenirApercu(etat.atlas);
    etat.index = indexer(etat.atlas.entites);
    // La scene prend le rapport de la carte, corrige de ce que cette carte-la
    // accepte de perdre sur ses bords. Sans cela un planisphere flotte au milieu
    // d'un grand rectangle vide sur un telephone tenu debout — et la colonne de
    // cartouches de la France se ferait rogner.
    document.documentElement.style.setProperty('--ratio-carte', String(etat.atlas.ratio));
    document.documentElement.style.setProperty('--couverture', String(etat.atlas.couverture));
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
    rendu.elements.enonce.textContent = [nomAffiche(entite), entite.capitale, `— ${niveau}`]
        .filter(Boolean).join(' · ').replace(' · —', ' —');
    etat.carte.cadrerSur(id);
}

// Le bouton de la barre dit ce qu'il fait : « Son » quand il joue, « Muet »
// quand il se tait. Un glyphe barre tout seul se lit mal a la volee.
function marquerSon(actif) {
    $('son-basculer').setAttribute('aria-pressed', String(actif));
    $('etiquette-son').textContent = actif ? 'Son' : 'Muet';
    activerSon(actif);
}

async function demarrer() {
    appliquerTheme(etat.reglages.theme);
    document.documentElement.dataset.signes = etat.reglages.signes ? '1' : '0';
    marquerSon(etat.reglages.sons !== false);
    $('version').textContent = `Géo Trouve-Tout ${VERSION}`;
    ui.brancherDialogues();

    const adresse = lireAdresse(location.search, CATALOGUE.map(c => c.id));
    // Un lien de defi impose sa carte, et la retient : rouvrir le jeu ensuite
    // repropose le defi qu'on vient de jouer.
    if (adresse?.mode === 'jour') etat.reglages.carteDuJour = adresse.config.atlas;
    const atlasVoulu = adresse?.config?.atlas ?? etat.reglages.atlas ?? DEFAUTS.atlas;
    await chargerAtlas(CATALOGUE.some(a => a.id === atlasVoulu) ? atlasVoulu : DEFAUTS.atlas);

    interdireDoubleTap(document.body);
    brancherBoutons();

    if (adresse?.mode === 'jour') {
        await lancer({ mode: 'jour', jour: adresse.jour, graine: adresse.graine });
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
            await lancer({ mode: 'jour', jour: dateISO(), graine: graineDuJour(dateISO(), carteDuJour()) });
        }
    }
}

function brancherBoutons() {
    // Un seul chemin pour changer un reglage, d'ou qu'il vienne — une case des
    // Options, un menu du depart, un bouton de la barre. Il range, il applique,
    // et il repeint les deux menus pour qu'aucun ne mente sur l'etat courant.
    const appliquerReglages = valeurs => {
        etat.reglages = { ...etat.reglages, ...valeurs };
        preferences.ecrire(valeurs);
        if (valeurs.theme) appliquerTheme(valeurs.theme);
        if ('signes' in valeurs) document.documentElement.dataset.signes = valeurs.signes ? '1' : '0';
        if ('sons' in valeurs) marquerSon(valeurs.sons);
        // La carte, elle, ne change pas sous la partie en cours : elle est
        // chargee au depart de la suivante. Changer de carte en plein jeu
        // laissait le planisphere d'Europe sous une question sur la Colombie.
        // Son fichier, en revanche, est lu tout de suite : le menu a besoin de
        // savoir combien elle porte d'entites et quels sens elle sait poser.
        peindreMenus();
        if (valeurs.atlas || valeurs.carteDuJour) preparerCartes();
    };

    const vueDesReglages = () => ({
        ...etat.reglages, ...configCourante(),
        carteDuJour: carteDuJour(),
        mots: apercus.get(configCourante().atlas)?.mots
    });

    const peindreMenus = () => {
        const vue = vueDesReglages();
        options.peindre(vue);
        menuPartie.peindre(vue);
    };

    // Les deux cartes en vue — celle des parties libres, celle du defi — sont
    // lues des que le menu s'ouvre, puis le menu se repeint avec leurs vrais
    // decomptes.
    const preparerCartes = async () => {
        const avant = apercus.size;
        await Promise.all([configCourante().atlas, carteDuJour()].map(id => apercuDe(id).catch(() => null)));
        if (apercus.size !== avant) peindreMenus();
    };

    const options = ui.creerOptions({
        surChangement: appliquerReglages,
        surPartie: () => ouvrirMenu(etat.mode === 'jour' ? 'jour' : 'libre')
    });

    const menuPartie = ui.creerMenuPartie({
        surChangement: appliquerReglages,
        apercu: id => apercus.get(id),
        surCommencer: mode => mode === 'jour'
            ? lancer({ mode: 'jour', jour: dateISO(), graine: graineDuJour(dateISO(), carteDuJour()) })
            : lancer({ mode: 'libre' })
    });

    const ouvrirMenu = modeVoulu => {
        menuPartie.montrer(vueDesReglages(), modeVoulu);
        preparerCartes();
    };

    $('options-ouvrir').addEventListener('click', () => options.montrer(vueDesReglages()));
    $('aide-ouvrir').addEventListener('click', () => ui.ouvrir($('dialogue-aide')));
    $('stats-ouvrir').addEventListener('click', () => {
        const compte = etat.memoire.resume(etat.atlas.entites);
        ui.montrerStats({
            stats: stats.lire(), acquis: compte.acquis, total: compte.total,
            motsDe: id => apercus.get(id)?.mots
        });
    });
    $('theme-basculer').addEventListener('click',
        () => appliquerReglages({ theme: themeSuivant(etat.reglages.theme).id }));
    $('son-basculer').addEventListener('click', evenement =>
        appliquerReglages({ sons: evenement.currentTarget.getAttribute('aria-pressed') !== 'true' }));

    $('action-recentrer').addEventListener('click', () => etat.carte.recentrer());
    $('verdict-suivant').addEventListener('click', suite);
    $('nav-jour').addEventListener('click', () => lancer({ mode: 'jour', jour: dateISO(), graine: graineDuJour(dateISO(), carteDuJour()) }));
    // On ne lance plus une partie libre en aveugle : le menu montre d'abord ce
    // qu'elle sera, et c'est lui qui la commence.
    $('nav-libre').addEventListener('click', () => ouvrirMenu('libre'));
    $('nav-progression').addEventListener('click', montrerProgression);

    $('fin-rejouer').addEventListener('click', () => {
        $('dialogue-fin').close();
        lancer({ mode: etat.mode === 'jour' ? 'libre' : etat.mode });
    });
    $('fin-rejouer-rates').addEventListener('click', () => {
        const rates = etat.partie.bilan().rates;
        $('dialogue-fin').close();
        lancer({ mode: 'libre', cibles: rates });
    });
    $('fin-partager').addEventListener('click', () => {
        const bilan = etat.partie.bilan();
        const config = etat.partie.etat.config;
        const texte = texteDePartage(
            { ...bilan, resultats: etat.partie.etat.resultats },
            {
                jour: etat.mode === 'jour' ? etat.jour : dateISO(),
                titre: config.atlas === CONFIG_DU_JOUR.atlas
                    ? 'Géo Trouve-Tout'
                    : `Géo Trouve-Tout · ${nomDAtlas(config.atlas)}`,
                lien: etat.mode === 'jour'
                    ? lienDuJour(etat.jour, config.atlas)
                    : lienLibre(String(etat.graine), config)
            }
        );
        ui.partager(texte, message => { rendu.elements.annonce.textContent = message; });
    });
    $('effacer-stats').addEventListener('click', () => {
        toutEffacer();
        etat.memoire.oublier();
        $('dialogue-stats').close();
    });

    clavier('lettres');

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
        nouvelle: () => lancer({ mode: 'libre' }),
        relancer: () => lancer({ mode: etat.mode, jour: etat.jour, graine: etat.graine }),
        theme: () => $('theme-basculer').click(),
        aide: () => ui.ouvrir($('dialogue-aide')),
        echapper: () => { for (const d of document.querySelectorAll('dialog[open]')) d.close(); }
    });

    // Le contexte audio se prepare au premier contact, avant que le jeu n'ait
    // une note a demander : iOS ne l'autorise qu'a ce moment-la.
    const preparer = () => { preparerSon(); document.removeEventListener('pointerdown', preparer); };
    document.addEventListener('pointerdown', preparer, { once: true });
}

// Le clavier maison change de disposition avec la question : les lettres pour
// un nom, un pave de chiffres pour un numero de departement — avec A et B, sans
// quoi la Corse-du-Sud serait intapable.
let dispositionClavier = null;
function clavier(disposition) {
    if (disposition === dispositionClavier) return;
    dispositionClavier = disposition;
    creerClavier($('clavier'), {
        surLettre: lettre => saisir(rendu.texteSaisi + lettre),
        surEffacer: () => saisir(rendu.texteSaisi.slice(0, -1)),
        surValider: () => rendu.texteSaisi && repondre(rendu.texteSaisi)
    }, disposition);
}

// Ce qu'on lit dans le champ vide. Un sens qui demande autre chose qu'un nom
// dit lui-meme ce qu'il attend — sans quoi la question de l'embouchure
// invitait a « écrire le nom ».
const inviteDe = question => SENS[question.sens]?.invite ?? 'Écrivez le nom…';

// « Touchez le pays sur la carte », « Touchez le cours d’eau sur la carte ». Le
// mot vient de l'atlas, comme les enonces : c'etait la derniere phrase du jeu a
// tenir pour acquis qu'on y cherchait un pays.
const consigneDe = () => motsDe('Touchez {leEntite} sur la carte.', etat.atlas?.mots);

function saisir(texte) {
    const question = etat.partie?.etat.question ?? {};
    rendu.saisie(texte.slice(0, 40), {
        aideSaisie: aideDeSaisie(question),
        entites: etat.sac,
        invite: inviteDe(question)
    });
    if (etat.reglages.sons !== false) son.touche();
}

demarrer();

// Le service worker : reseau d'abord, cache en secours. Une mise a jour
// publiee arrive donc sans manoeuvre du joueur.
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { /* hors ligne, tant pis */ }));
}
