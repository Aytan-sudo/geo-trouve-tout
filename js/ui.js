// Les dialogues, les compteurs et les poignees sur le document.
//
// Rien ici ne decide quoi que ce soit du jeu : ce module remplit des ecrans a
// partir de ce qu'on lui donne, et previent quand on a touche un bouton.

import { NIVEAUX, SENS, RYTHMES, CHRONOS, libelleConfiguration } from './variantes.js';
import { CATALOGUE, nomDAtlas } from './atlas.js';
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

function remplir(select, table, valeur) {
    select.textContent = '';
    for (const [id, fiche] of Object.entries(table)) {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = fiche.libelle;
        select.append(option);
    }
    select.value = valeur;
}

export function creerOptions({ preferences, surChangement, surJouer }) {
    const dialogue = $('dialogue-options');
    const champs = {
        atlas: $('choix-atlas'), niveau: $('choix-niveau'), sens: $('choix-sens'),
        rythme: $('choix-rythme'), chrono: $('choix-chrono')
    };

    champs.atlas.textContent = '';
    for (const carte of CATALOGUE) {
        const option = document.createElement('option');
        option.value = carte.id;
        option.textContent = `${carte.emoji} ${carte.nom}`;
        champs.atlas.append(option);
    }

    const api = {
        dialogue,

        montrer(etat) {
            champs.atlas.value = etat.atlas;
            remplir(champs.niveau, NIVEAUX, etat.niveau);
            remplir(champs.sens, SENS, etat.sens);
            remplir(champs.rythme, RYTHMES, etat.rythme);
            remplir(champs.chrono, CHRONOS, etat.chrono);
            $('explication-niveau').textContent = NIVEAUX[etat.niveau].resume;
            $('explication-sens').textContent = SENS[etat.sens].resume;

            for (const [clef, champ] of Object.entries({ sons: $('option-sons'), vibration: $('option-vibration'), signes: $('option-signes'), aideSaisie: $('option-aide-saisie'), memoire: $('option-memoire') })) {
                champ.checked = etat[clef] !== false;
            }

            const themes = $('choix-theme');
            themes.textContent = '';
            for (const theme of THEMES) {
                const bouton = document.createElement('button');
                bouton.type = 'button';
                bouton.textContent = theme.libelle;
                bouton.setAttribute('aria-pressed', String(theme.id === etat.theme));
                bouton.addEventListener('click', () => surChangement({ theme: theme.id }));
                themes.append(bouton);
            }
            ouvrir(dialogue);
        }
    };

    for (const [clef, champ] of Object.entries(champs)) {
        champ.addEventListener('change', () => surChangement({ [clef]: champ.value }));
    }
    for (const [clef, id] of Object.entries({ sons: 'option-sons', vibration: 'option-vibration', signes: 'option-signes', aideSaisie: 'option-aide-saisie', memoire: 'option-memoire' })) {
        $(id).addEventListener('change', evenement => surChangement({ [clef]: evenement.target.checked }));
    }
    $('options-jouer').addEventListener('click', () => { dialogue.close(); surJouer(); });
    return api;
}

export function montrerStats({ stats, acquis, total }) {
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
        nom.textContent = libelleConfiguration({ atlas, niveau, sens, rythme, chrono }, nomDAtlas(atlas));
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
