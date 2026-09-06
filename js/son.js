// Synthese WebAudio : aucun fichier audio, quelques oscillateurs et c'est tout.
//
// Deux pieges, tous deux invisibles depuis un ordinateur — ils ne levent aucune
// erreur, le son part simplement sans arriver :
//
//   Le plancher de 300 Hz. Un haut-parleur de telephone ne restitue a peu pres
//   rien en dessous, et l'oreille y est de surcroit moins sensible a faible
//   volume. Toute l'echelle du jeu vit donc au-dessus. tests/test-son.mjs garde
//   ce plancher.
//
//   Le deblocage au geste. iOS ne laisse demarrer un contexte audio que depuis
//   un evenement d'activation. Le contexte se prepare donc au premier contact,
//   avant que le jeu n'ait une note a demander.

let contexte;
let actif = true;

function audio() {
    if (contexte) return contexte;
    const AudioContext = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (AudioContext) contexte = new AudioContext();
    return contexte;
}

// A appeler depuis un pointerdown ou un keydown, une seule fois : c'est le seul
// moment ou iOS accepte de creer un contexte qui ne restera pas suspendu.
export function preparerSon() {
    const moteur = audio();
    if (moteur?.state === 'suspended') moteur.resume?.();
}

export const activerSon = valeur => { actif = valeur; };

function note(frequence, { duree = 0.1, volume = 0.035, delai = 0, forme = 'triangle', vers = null } = {}) {
    if (!actif) return;
    const moteur = audio();
    if (!moteur) return;
    if (moteur.state === 'suspended') moteur.resume?.();

    const debut = moteur.currentTime + delai;
    const oscillateur = moteur.createOscillator();
    const gain = moteur.createGain();

    oscillateur.type = forme;
    oscillateur.frequency.setValueAtTime(frequence, debut);
    if (vers) oscillateur.frequency.exponentialRampToValueAtTime(vers, debut + duree);

    gain.gain.setValueAtTime(0.0001, debut);
    gain.gain.exponentialRampToValueAtTime(volume, debut + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, debut + duree);

    oscillateur.connect(gain).connect(moteur.destination);
    oscillateur.start(debut);
    oscillateur.stop(debut + duree + 0.03);
}

// Toutes les hauteurs du jeu, nommees. Le test les parcourt : aucune ne doit
// descendre sous 300 Hz.
export const HAUTEURS = {
    touche: 440,
    juste: 587,          // re 5
    justeHaut: 880,      // l'octave, en echo
    presque: 494,
    faux: 349,           // fa 4 — le plus grave du jeu, et deja au-dessus du plancher
    fauxBas: 311,
    fin: [523, 659, 784, 1047],
    perdu: [440, 392, 330]
};

export const son = {
    touche: () => note(HAUTEURS.touche, { duree: 0.05, volume: 0.02, forme: 'sine' }),

    juste() {
        note(HAUTEURS.juste, { duree: 0.11 });
        note(HAUTEURS.justeHaut, { duree: 0.13, delai: 0.07, volume: 0.026 });
    },

    presque: () => note(HAUTEURS.presque, { duree: 0.14, vers: HAUTEURS.juste, volume: 0.03 }),

    // Grave « pour le jeu », jamais grave « pour l'oreille » : le glissando
    // descend de 349 a 311 Hz et s'arrete la.
    faux: () => note(HAUTEURS.faux, { duree: 0.2, vers: HAUTEURS.fauxBas, forme: 'sawtooth', volume: 0.025 }),

    fin(reussi = true) {
        const echelle = reussi ? HAUTEURS.fin : HAUTEURS.perdu;
        echelle.forEach((frequence, rang) => note(frequence, { duree: 0.16, delai: rang * 0.09, volume: 0.03 }));
    }
};

export function vibrer(motif) {
    try { navigator.vibrate?.(motif); } catch { /* sans importance */ }
}
