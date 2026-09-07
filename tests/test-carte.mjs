// Le geste de la carte : pincer, glisser, et ne pas partir en vrille.
//
// Le calcul du pincement est sorti du module de rendu pour tenir ici, sans
// navigateur. C'est le seul morceau de js/carte.js qui ne touche pas au DOM, et
// c'est aussi celui qui a le plus couté : la version publiée en 1.1.1 reposait
// l'ancre au milieu du planisphère, si bien qu'un pincement excentré projetait
// la carte à l'autre bout de l'écran, cent quatre-vingts pixels par événement.
// Rien n'en paraissait dans le code — l'expression était juste, le repère faux.

import { counter } from './harness.mjs';
import { apresPincement } from '../js/carte.js';

const { check, report } = counter();

// Où tombe, en unités de viewBox, le point de carte `p` sous une vue donnée.
const surEcran = (p, { dx, dy, echelle }) => ({ x: p.x * echelle + dx, y: p.y * echelle + dy });
const sousLePoint = (u, { dx, dy, echelle }) => ({ x: (u.x - dx) / echelle, y: (u.y - dy) / echelle });
const proche = (a, b, marge = 1e-9) => Math.abs(a - b) < marge;

const vue0 = { dx: -1100, dy: -489, echelle: 1.55 };
const CADRE = { min: 1, max: 14 };

console.log('\nL’ancre ne bouge pas');
// La règle du geste : ce qui était sous les doigts y reste.
for (const depuis of [{ x: 400, y: 300 }, { x: 3600, y: 1500 }, { x: 2000, y: 889 }]) {
    const point = sousLePoint(depuis, vue0);
    for (const facteur of [1.25, 0.8, 2, 1 / 3]) {
        const vue = apresPincement(vue0, { facteur, depuis, ...CADRE });
        const ou = surEcran(point, vue);
        check(`×${facteur} en (${depuis.x}, ${depuis.y}) : le point ne bouge pas`,
            proche(ou.x, depuis.x, 1e-6) && proche(ou.y, depuis.y, 1e-6),
            `→ (${ou.x.toFixed(1)}, ${ou.y.toFixed(1)})`);
    }
}

console.log('\nLa vrille de 1.1.1 ne revient pas');
// Le symptôme exact du bug : l'ancre était reposée au centre du viewBox.
const excentre = { x: 500, y: 400 };
const vueBug = apresPincement(vue0, { facteur: 1.25, depuis: excentre, ...CADRE });
const ouBug = surEcran(sousLePoint(excentre, vue0), vueBug);
check('l’ancre ne saute pas au centre de la carte',
    !proche(ouBug.x, 2000, 1) && proche(ouBug.x, excentre.x, 1e-6), `→ ${ouBug.x.toFixed(1)}`);

console.log('\nZoom et translation sont un seul geste');
const depuis = { x: 800, y: 600 };
const vers = { x: 1400, y: 900 };
const point = sousLePoint(depuis, vue0);
const ensemble = apresPincement(vue0, { facteur: 1.4, depuis, vers, ...CADRE });
const arrivee = surEcran(point, ensemble);
check('le point suit le milieu des doigts',
    proche(arrivee.x, vers.x, 1e-6) && proche(arrivee.y, vers.y, 1e-6),
    `→ (${arrivee.x.toFixed(1)}, ${arrivee.y.toFixed(1)})`);
check('le grossissement est celui des doigts', proche(ensemble.echelle, vue0.echelle * 1.4, 1e-9));

const glisse = apresPincement(vue0, { facteur: 1, depuis, vers, ...CADRE });
check('sans écartement, c’est une translation pure',
    proche(glisse.dx, vue0.dx + 600) && proche(glisse.dy, vue0.dy + 300) && proche(glisse.echelle, vue0.echelle));

console.log('\nLes bornes');
const trop = apresPincement(vue0, { facteur: 100, depuis, ...CADRE });
check('le grossissement plafonne', proche(trop.echelle, 14));
check('l’ancre tient même au plafond',
    proche(surEcran(sousLePoint(depuis, vue0), trop).x, depuis.x, 1e-6));
const plancher = apresPincement({ dx: 0, dy: 0, echelle: 1.2 }, { facteur: 0.1, depuis, min: 1.55, max: 14 });
check('le rétrécissement bute sur la couverture', proche(plancher.echelle, 1.55));
check('l’ancre tient même au plancher',
    proche(surEcran(sousLePoint(depuis, { dx: 0, dy: 0, echelle: 1.2 }), plancher).x, depuis.x, 1e-6));

console.log('\nQuarante pas d’affilée');
// Un vrai pincement, c'est une soixantaine d'événements par seconde. La dérive
// ne doit pas s'accumuler : c'est ce qui rendait le geste impossible à tenir.
let vue = { ...vue0 };
const ancre = { x: 1200, y: 700 };
const suivi = sousLePoint(ancre, vue);
for (let i = 0; i < 40; i++) vue = apresPincement(vue, { facteur: 1.03, depuis: ancre, ...CADRE });
const fin = surEcran(suivi, vue);
check('quarante pas, aucune dérive',
    proche(fin.x, ancre.x, 1e-6) && proche(fin.y, ancre.y, 1e-6),
    `→ (${fin.x.toFixed(3)}, ${fin.y.toFixed(3)})`);
check('quarante pas, le grossissement s’accumule', vue.echelle > vue0.echelle * 3);

report();
