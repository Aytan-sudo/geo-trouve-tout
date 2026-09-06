// Les dialogues, les compteurs et les poignees sur le document.
//
// Rien ici ne decide quoi que ce soit du jeu : ce module remplit des ecrans a
// partir de ce qu'on lui donne, et previent quand on a touche un bouton.

import { NIVEAUX, SENS, RYTHMES, CHRONOS, DEFAUTS, libelleConfiguration, texte } from './variantes.js';
import { FAMILLES, nomDAtlas, ficheDAtlas, familleDe, cartesDe } from './atlas.js';
import { THEMES } from './themes.js';
import { dateFrancaise, duree } from './defi.js';

const $ = id => document.getElementById(id);

export function ouvrir(dialogue) {
    if (!dialogue.open) dialogue.showModal();
}

export function brancherDialogues() {
    for (const dialogue of document.querySelectorAll('dialog')) {
        for (const bouton of dialogue.querySelectorAll('[data-fermer]')) {
            bouton.addEventListener('click', () => dialogue.close());
        }
        // Toucher le voile ferme. `dialog` ne le fait pas seul, et la feuille
        // occupe tout l'interieur : un clic qui atteint le dialogue lui-meme
        // vient donc forcement du fond.
        dialogue.addEventListener('click', evenement => {
            if (evenement.target === dialogue) dialogue.close();
        });
    }
}

function remplir(select, table, valeur, mots, garder = null) {
    select.textContent = '';
    for (const [id, fiche] of Object.entries(table)) {
        if (garder && !garder.includes(id)) continue;
        const option = document.createElement('option');
        option.value = id;
        option.textContent = texte(fiche.libelle, mots);
        select.append(option);
    }
    select.value = valeur;
    // Un reglage garde d'une autre carte — le numero d'un departement, sur le
    // monde — n'existe plus dans la liste : le select tomberait a vide et
    // n'enverrait jamais de « change ». On le ramene au premier choix.
    if (!select.value) select.value = select.options[0]?.value ?? '';
}

// Une rangee de pastilles a choisir. Elle sert aux themes, aux familles de
// cartes et aux cartes : meme forme, meme comportement, un seul endroit.
function pastilles(hote, choix, actif, surChoix) {
    hote.textContent = '';
    for (const { id, libelle, titre } of choix) {
        const bouton = document.createElement('button');
        bouton.type = 'button';
        bouton.textContent = libelle;
        if (titre) bouton.title = titre;
        bouton.setAttribute('aria-pressed', String(id === actif));
        bouton.addEventListener('click', () => surChoix(id));
        hote.append(bouton);
    }
}

// Les Options reglent le jeu — le theme, les sensations — et rien de plus.
// Le type de partie a son propre menu ci-dessous : melanger les deux, c'etait
// demander de traverser un formulaire pour changer de niveau.
export function creerOptions({ surChangement, surPartie }) {
    const dialogue = $('dialogue-options');
    const cases = {
        sons: 'option-sons', vibration: 'option-vibration', signes: 'option-signes',
        aideSaisie: 'option-aide-saisie', memoire: 'option-memoire'
    };

    const api = {
        dialogue,

        peindre(etat) {
            for (const [clef, id] of Object.entries(cases)) $(id).checked = etat[clef] !== false;
            $('resume-partie').textContent = libelleConfiguration(etat, nomDAtlas(etat.atlas), etat.mots);
            pastilles($('choix-theme'), THEMES.map(t => ({ id: t.id, libelle: t.libelle })),
                etat.theme, theme => surChangement({ theme }));
        },

        montrer(etat) { api.peindre(etat); ouvrir(dialogue); }
    };

    for (const [clef, id] of Object.entries(cases)) {
        $(id).addEventListener('change', evenement => surChangement({ [clef]: evenement.target.checked }));
    }
    $('options-partie').addEventListener('click', () => { dialogue.close(); surPartie(); });
    return api;
}

// Le menu du depart : quelle partie on commence, sur quelle carte, et sous
// quels reglages. C'est le seul endroit qui lance une partie.
//
// Les cartes s'y choisissent en deux temps — la famille, puis la carte — pour
// que la liste ne s'allonge pas indefiniment : les fleuves et les continents
// seront une pastille de plus dans la premiere rangee, pas une ligne de plus
// dans un menu deroulant.
//
// Le defi du jour a lui aussi sa carte, et c'est voulu : un defi porte sur une
// categorie et une seule. Le monde le matin, les departements le soir, jamais
// les deux dans la meme manche.
export function creerMenuPartie({ surChangement, surCommencer, apercu }) {
    const dialogue = $('dialogue-partie');
    const champs = {
        niveau: $('choix-niveau'), sens: $('choix-sens'),
        rythme: $('choix-rythme'), chrono: $('choix-chrono')
    };
    const modes = { jour: $('mode-jour'), libre: $('mode-libre') };

    let mode = 'libre';
    let dernier = {};

    // La carte que ce mode-la utilise, et le reglage qui la retient.
    const clefCarte = () => (mode === 'jour' ? 'carteDuJour' : 'atlas');
    const carteDe = etat => etat[clefCarte()] ?? DEFAUTS.atlas;

    const api = {
        dialogue,
        get mode() { return mode; },

        peindre(etat = dernier) {
            dernier = etat;
            const carte = carteDe(etat);
            const vue = apercu?.(carte);
            const mots = vue?.mots ?? {};

            for (const [clef, bouton] of Object.entries(modes)) {
                bouton.setAttribute('aria-pressed', String(clef === mode));
            }

            pastilles($('choix-famille'), FAMILLES.map(f => ({ id: f.id, libelle: `${f.emoji} ${f.nom}`, titre: f.resume })),
                familleDe(carte), famille => surChangement({ [clefCarte()]: cartesDe(famille)[0].id }));
            pastilles($('choix-carte'), cartesDe(familleDe(carte)).map(c => ({ id: c.id, libelle: c.nom, titre: c.sousTitre })),
                carte, id => surChangement({ [clefCarte()]: id }));
            $('titre-carte').textContent = mode === 'jour' ? 'La carte du défi' : 'La carte';
            // La carte du defi dit ses propres mots : « Dix départements, les
            // mêmes pour tout le monde ». Un defi porte sur une categorie, et
            // la phrase le montre avant meme de commencer.
            $('resume-jour').textContent = texte(
                'Dix {entites}, les mêmes pour tout le monde aujourd’hui.',
                apercu?.(etat.carteDuJour ?? DEFAUTS.atlas)?.mots);
            $('explication-carte').textContent = ficheDAtlas(carte)?.sousTitre ?? '';

            remplir(champs.niveau, NIVEAUX, etat.niveau, mots);
            remplir(champs.sens, SENS, etat.sens, mots, vue?.sens);
            remplir(champs.rythme, RYTHMES, etat.rythme, mots);
            remplir(champs.chrono, CHRONOS, etat.chrono, mots);
            // Le niveau se dit en nombre d'entites de cette carte-la : « Écolier
            // — 71 départements sur 101 » vaut mieux qu'une phrase generale.
            const sac = vue?.sac?.({ ...etat, sens: champs.sens.value });
            $('explication-niveau').textContent = [
                texte(NIVEAUX[champs.niveau.value]?.resume, mots),
                sac ? `${sac} ${texte('{entites}', mots)} sur ${vue.total}` : ''
            ].filter(Boolean).join(' — ');
            $('explication-sens').textContent = texte(SENS[champs.sens.value]?.resume, mots);
            $('explication-rythme').textContent = RYTHMES[champs.rythme.value]?.resume ?? '';
            $('explication-chrono').textContent = CHRONOS[champs.chrono.value]?.resume ?? '';

            // Le defi du jour est le meme pour tout le monde : ses reglages ne
            // se discutent pas, alors on les retire de la vue. Sa carte, si.
            $('reglages-libre').hidden = mode !== 'libre';
            $('partie-commencer').textContent = mode === 'jour' ? 'Jouer le défi' : 'Commencer';
        },

        montrer(etat, modeVoulu = mode) {
            mode = modeVoulu;
            api.peindre(etat);
            ouvrir(dialogue);
        }
    };

    for (const [clef, champ] of Object.entries(champs)) {
        champ.addEventListener('change', () => surChangement({ [clef]: champ.value }));
    }
    for (const [clef, bouton] of Object.entries(modes)) {
        bouton.addEventListener('click', () => { mode = clef; api.peindre(); });
    }
    $('partie-commencer').addEventListener('click', () => { dialogue.close(); surCommencer(mode); });
    return api;
}

// `motsDe` rend le vocabulaire d'une carte quand elle est deja chargee : le
// palmares nomme alors « Nommer la préfecture » plutot que « Nommer la
// capitale ». Une carte jamais ouverte reste dite dans les mots du monde.
export function montrerStats({ stats, acquis, total, motsDe = () => undefined }) {
    $('stat-serie').textContent = stats.serie ?? 0;
    $('stat-record-serie').textContent = stats.meilleureSerie ?? 0;
    $('stat-acquis').textContent = `${acquis}/${total}`;

    const palmares = $('palmares');
    palmares.textContent = '';
    const entrees = Object.entries(stats.parties ?? {});
    $('palmares-vide').hidden = entrees.length > 0;
    for (const [signature, fiche] of entrees.sort((a, b) => b[1].jouees - a[1].jouees)) {
        const [atlas, niveau, sens, rythme, chrono] = signature.split('·');
        const item = document.createElement('li');
        const nom = document.createElement('span');
        nom.textContent = libelleConfiguration({ atlas, niveau, sens, rythme, chrono }, nomDAtlas(atlas), motsDe?.(atlas));
        const valeur = document.createElement('b');
        valeur.textContent = fiche.meilleureDuree
            ? `${fiche.meilleur} · ${duree(fiche.meilleureDuree)}`
            : String(fiche.meilleur);
        item.append(nom, valeur);
        palmares.append(item);
    }

    const historique = $('historique');
    historique.textContent = '';
    const journal = stats.journal ?? [];
    $('historique-vide').hidden = journal.length > 0;
    for (const ligne of journal.slice(0, 12)) {
        const item = document.createElement('li');
        const jour = document.createElement('span');
        jour.textContent = dateFrancaise(ligne.jour);
        const valeur = document.createElement('b');
        valeur.textContent = `${ligne.score}/${ligne.total} · ${duree(ligne.duree)}`;
        item.append(jour, valeur);
        historique.append(item);
    }
    ouvrir($('dialogue-stats'));
}

export function montrerFin({ bilan, config, nomsRates, defi }) {
    $('fin-score').textContent = `${bilan.score}/${bilan.total}`;
    $('fin-duree').textContent = duree(bilan.duree);
    $('fin-serie').textContent = bilan.serie;

    const [titre, detail] = bilan.parfait
        ? ['Sans faute.', 'Toute la manche, du premier au dernier.']
        : bilan.score >= bilan.total * 0.7
            ? ['Bien joué.', 'Les pays manqués reviendront bientôt.']
            : ['Il reste du chemin.', 'Ceux-là reviendront vite : c’est le principe.'];
    $('fin-legende').textContent = defi ? `Défi du ${dateFrancaise(defi)}` : 'Manche terminée';
    $('fin-titre').textContent = `${bilan.score} sur ${bilan.total}`;
    $('fin-verdict-titre').textContent = titre;
    $('fin-verdict-detail').textContent = detail;

    const liste = $('fin-rates');
    liste.textContent = '';
    $('fin-rates-titre').hidden = nomsRates.length === 0;
    $('fin-rejouer-rates').hidden = nomsRates.length === 0;
    for (const nom of nomsRates) {
        const item = document.createElement('li');
        item.textContent = nom;
        liste.append(item);
    }
    ouvrir($('dialogue-fin'));
}

// Le partage : presse-papier quand il existe, feuille de partage du systeme
// quand elle existe, et une invite a copier a la main si les deux manquent.
export async function partager(texte, annonce) {
    try {
        if (navigator.share) { await navigator.share({ text: texte }); return; }
        await navigator.clipboard.writeText(texte);
        annonce('Résultat copié.');
    } catch {
        annonce('Copie impossible sur cet appareil.');
    }
}
