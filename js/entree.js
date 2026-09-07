// Le doigt, la souris, le clavier.
//
// La carte se manipule au doigt : un doigt la deplace, deux la grossissent. Le
// reste du jeu est fait de boutons, qui n'ont besoin de personne. Le seul
// morceau delicat est le clavier maison, et il l'est pour une raison precise :
// le clavier du systeme, sur iPhone, pousse la page vers le haut et masque
// exactement ce qu'on regarde — la carte.

const DOUBLE_TAP = 350;
const CLIQUABLES = 'button, a, input, select, textarea, label, summary';

// `touch-action: manipulation` devrait suffire, et suffit partout ailleurs.
// Safari sur iPhone laisse passer le double-tap malgre tout : la page zoome au
// milieu d'une partie. On lui coupe le second appui d'une paire rapide, en
// laissant les boutons tranquilles — et sans jamais toucher au pincement.
export function interdireDoubleTap(cible) {
    let dernier = -Infinity;
    cible.addEventListener('touchend', evenement => {
        const maintenant = evenement.timeStamp;
        const rapproche = maintenant - dernier < DOUBLE_TAP;
        dernier = maintenant;
        if (!rapproche) return;
        if (evenement.touches?.length) return;
        if (evenement.target?.closest?.(CLIQUABLES)) return;
        evenement.preventDefault();
    }, { passive: false });
}

// Les gestes de la carte. Un glissement de moins de six pixels reste un appui :
// sans ce seuil, personne ne parvient a toucher le Luxembourg sans bouger.
export function gestesCarte(element, carte, { surAppui = null } = {}) {
    const doigts = new Map();
    let ecart0 = 0, bouge = false, depart = null, milieu0 = null;

    const centre = () => {
        const points = [...doigts.values()];
        return {
            x: points.reduce((s, p) => s + p.x, 0) / points.length,
            y: points.reduce((s, p) => s + p.y, 0) / points.length
        };
    };
    const ecart = () => {
        const [a, b] = [...doigts.values()];
        return Math.hypot(a.x - b.x, a.y - b.y);
    };

    element.addEventListener('pointerdown', evenement => {
        element.setPointerCapture?.(evenement.pointerId);
        doigts.set(evenement.pointerId, { x: evenement.clientX, y: evenement.clientY });
        if (doigts.size === 1) { bouge = false; depart = { x: evenement.clientX, y: evenement.clientY }; }
        if (doigts.size === 2) { ecart0 = ecart(); milieu0 = centre(); }
    });

    element.addEventListener('pointermove', evenement => {
        const doigt = doigts.get(evenement.pointerId);
        if (!doigt) return;
        const precedent = { ...doigt };
        doigt.x = evenement.clientX;
        doigt.y = evenement.clientY;

        if (doigts.size === 1) {
            if (!bouge && Math.hypot(evenement.clientX - depart.x, evenement.clientY - depart.y) < 6) return;
            bouge = true;
            carte.deplacer(evenement.clientX - precedent.x, evenement.clientY - precedent.y);
        } else if (doigts.size === 2 && ecart0 > 0) {
            // Un seul geste : ce qui etait sous le milieu des doigts y reste et
            // suit ce milieu. Ecarter grossit, glisser deplace, et les deux
            // ensemble font ce qu'on attend d'une carte.
            const maintenant = ecart();
            const milieu = centre();
            carte.pincer(maintenant / ecart0, milieu0 ?? milieu, milieu);
            ecart0 = maintenant;
            milieu0 = milieu;
            bouge = true;
        }
    });

    const lacher = evenement => {
        if (!doigts.has(evenement.pointerId)) return;
        const dernier = doigts.size === 1;
        doigts.delete(evenement.pointerId);
        if (dernier && !bouge && surAppui) surAppui(evenement.clientX, evenement.clientY);
        if (doigts.size < 2) { ecart0 = 0; milieu0 = null; }
    };
    element.addEventListener('pointerup', lacher);
    element.addEventListener('pointercancel', evenement => { doigts.delete(evenement.pointerId); });

    // La molette et le trackpad, pour qui joue au bureau. Le grossissement suit
    // la course : un cran de souris avance franchement, un glissement de
    // trackpad par petites touches. Le pas fixe d'avant faisait bondir la carte
    // a chaque impulsion, et un trackpad en envoie des dizaines par seconde.
    element.addEventListener('wheel', evenement => {
        evenement.preventDefault();
        const course = evenement.deltaMode === 1 ? evenement.deltaY * 16 : evenement.deltaY;
        const facteur = Math.exp(-Math.max(-120, Math.min(120, course)) / 400);
        carte.pincer(facteur, { x: evenement.clientX, y: evenement.clientY });
    }, { passive: false });
}

// Le clavier maison. AZERTY, parce que le jeu est francais et que les noms de
// pays le sont aussi. Dix touches par rangee font 440 px de large : la regle
// des 44 px ne peut pas tenir, l'exemption est declaree sur le conteneur dans
// index.html — comme le fait le clavier d'iOS lui-meme.
//
// Le pave de chiffres sert aux numeros de departement. Il porte A et B : sans
// eux, la Corse-du-Sud (2A) et la Haute-Corse (2B) seraient intapables.
const DISPOSITIONS = {
    lettres: { rangees: ['AZERTYUIOP', 'QSDFGHJKLM', 'WXCVBN'], derniere: ['espace'] },
    chiffres: { rangees: ['12345', '67890'], derniere: ['A', 'B'] }
};

export function creerClavier(hote, { surLettre, surEffacer, surValider }, disposition = 'lettres') {
    const plan = DISPOSITIONS[disposition] ?? DISPOSITIONS.lettres;
    hote.textContent = '';
    hote.dataset.disposition = disposition;
    for (const rangee of plan.rangees) {
        const ligne = document.createElement('div');
        ligne.className = 'rangee';
        for (const lettre of rangee) {
            const touche = document.createElement('button');
            touche.type = 'button';
            touche.className = 'touche';
            touche.textContent = lettre;
            touche.addEventListener('click', () => surLettre(lettre));
            ligne.append(touche);
        }
        hote.append(ligne);
    }

    // La derniere rangee melange les touches propres a la disposition — l'espace
    // des lettres, le A et le B des numeros corses — et les deux commandes.
    const derniere = document.createElement('div');
    derniere.className = 'rangee';
    const propres = plan.derniere.map(libelle => [
        libelle, libelle === 'espace' ? 'touche large' : 'touche',
        () => surLettre(libelle === 'espace' ? ' ' : libelle)
    ]);
    for (const [libelle, classe, action] of [
        ...propres, ['⌫', 'touche', surEffacer], ['Valider', 'touche valider', surValider]
    ]) {
        const touche = document.createElement('button');
        touche.type = 'button';
        touche.className = classe;
        touche.textContent = libelle;
        touche.addEventListener('click', action);
        derniere.append(touche);
    }
    hote.append(derniere);
}

// Les raccourcis physiques. `R` relance, jamais « reglages » : c'est la
// convention de la collection.
export function raccourcis(actions) {
    document.addEventListener('keydown', evenement => {
        if (evenement.metaKey || evenement.ctrlKey || evenement.altKey) return;
        const dansUnChamp = /^(input|textarea|select)$/i.test(evenement.target?.tagName ?? '');
        if (dansUnChamp) return;

        const touche = evenement.key;
        if (/^[1-9]$/.test(touche) && actions.choisir?.(Number(touche) - 1)) return;
        // `lettre` rend vrai quand elle a pris la touche pour elle — c'est-a-dire
        // quand une saisie est en cours. Sinon « n », « r » et « t » gardent leur
        // role de raccourci : sans ce retour, taper le nom d'un pays relancerait
        // la partie a la lettre « r ».
        // Les chiffres servent aussi a repondre — le numero d'un departement —
        // mais seulement quand aucune proposition ne les reclame : `choisir`
        // passe en premier, et rend faux quand il n'y a rien a choisir.
        if (touche.length === 1 && /[a-zà-ÿ0-9' -]/i.test(touche) && actions.lettre?.(touche)) return;

        const table = {
            Enter: actions.valider, Backspace: actions.effacer,
            n: actions.nouvelle, N: actions.nouvelle,
            r: actions.relancer, R: actions.relancer,
            t: actions.theme, T: actions.theme,
            '?': actions.aide, Escape: actions.echapper
        };
        const action = table[touche];
        if (action) { evenement.preventDefault(); action(); }
    });
}
