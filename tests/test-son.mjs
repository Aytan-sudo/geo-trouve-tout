// Le son : le plancher de 300 Hz, et rien d'autre a verifier ici.
//
// Compter les notes emises ne dit rien de ce qui arrive a l'oreille. Ce qui se
// verifie utilement en Node, c'est la seule chose qu'un ordinateur ne montre
// jamais : une note ecrite sous 300 Hz n'existe pas sur un telephone. Le reste
// — le deblocage au geste — se lit a la source, plus bas.

import { counter, lireSource } from './harness.mjs';
import { HAUTEURS } from '../js/son.js';

const { check, report } = counter();
const PLANCHER = 300;

console.log('\nLe plancher');
for (const [nom, valeur] of Object.entries(HAUTEURS)) {
    const notes = Array.isArray(valeur) ? valeur : [valeur];
    check(`« ${nom} » reste au-dessus de ${PLANCHER} Hz`,
        notes.every(f => f >= PLANCHER), `(${notes.join(', ')})`);
}

const toutes = Object.values(HAUTEURS).flat();
check('aucune hauteur ne descend sous le plancher', Math.min(...toutes) >= PLANCHER, `(${Math.min(...toutes)})`);
check('les hauteurs restent audibles', Math.max(...toutes) < 4000);

console.log('\nLes hauteurs fixes ecrites dans le code');
// Une note ecrite en dur ailleurs que dans la table echapperait au controle.
const source = lireSource('js/son.js');
const litterales = [...source.matchAll(/frequency\.\w+\(\s*(\d+)/g)].map(m => Number(m[1]));
check('aucune frequence en dur dans le code', litterales.every(f => f >= PLANCHER), litterales.join(','));

console.log('\nLe deblocage au geste');
check('le module expose une preparation', /export function preparerSon/.test(source));
const app = lireSource('js/app.js');
check('la preparation est branchee sur un geste d’activation',
    /addEventListener\('pointerdown', preparer/.test(app));
check('le contexte ne se cree pas au chargement',
    !/^\s*(const|let)\s+contexte\s*=\s*new/m.test(source));

report();
