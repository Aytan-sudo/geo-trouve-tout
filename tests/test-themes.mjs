// Les palettes : completes, coherentes, et sans divergence entre les trois
// endroits qui connaissent la liste des themes.

import { counter, lireSource } from './harness.mjs';
import { THEMES, themeDe, themeSuivant } from '../js/themes.js';
import { THEME_PAR_DEFAUT } from '../js/stockage.js';

const { check, report } = counter();
const css = lireSource('css/themes.css');
const page = lireSource('index.html');

console.log('\nLa liste');
check('quatre a six palettes', THEMES.length >= 4 && THEMES.length <= 6, `(${THEMES.length})`);
check('des claires et des sombres', THEMES.some(t => t.couleur > '#888888') && THEMES.some(t => t.couleur < '#888888'));
check('les identifiants sont uniques', new Set(THEMES.map(t => t.id)).size === THEMES.length);
check('la rotation fait le tour', themeSuivant(THEMES.at(-1).id).id === THEMES[0].id);
check('un identifiant inconnu retombe sur le premier', themeDe('zorglub').id === THEMES[0].id);

console.log('\nLa concordance des trois listes');
// css/themes.css, js/themes.js et le script inline de index.html connaissent
// tous les trois la liste. C'est une redondance assumee — le script inline
// evite le clignotement au chargement — mais elle doit rester exacte.
for (const theme of THEMES) {
    check(`« ${theme.id} » est defini dans le CSS`, css.includes(`[data-theme="${theme.id}"]`));
    check(`« ${theme.id} » est connu du script inline`, new RegExp(`${theme.id}:\\s*'${theme.couleur}'`, 'i').test(page));
}
const inline = [...page.matchAll(/(\w+):\s*'(#[0-9a-f]{6})'/gi)].map(m => m[1]);
check('le script inline n’invente pas de theme',
    inline.every(id => THEMES.some(t => t.id === id)), inline.join(','));
check('le theme par defaut est le premier de la liste', THEME_PAR_DEFAUT === THEMES[0].id);
check('le theme par defaut est celui de :root',
    css.indexOf(':root,') < css.indexOf(`[data-theme="${THEMES[0].id}"]`)
    && css.slice(css.indexOf(':root,'), css.indexOf('{')).includes(THEMES[0].id));

console.log('\nLes palettes completes');
// Une variable oubliee ne plante pas : elle laisse une couleur claire au milieu
// d'un theme sombre. On compare donc chaque palette a celle de reference.
const bloc = id => {
    const debut = css.indexOf(`[data-theme="${id}"]`);
    return css.slice(debut, css.indexOf('}', debut));
};
const variables = texte => new Set([...texte.matchAll(/(--[\w-]+):/g)].map(m => m[1]));
const reference = variables(bloc(THEMES[0].id));
check('la palette de reference est fournie', reference.size >= 20, `(${reference.size})`);
for (const theme of THEMES.slice(1)) {
    const manquantes = [...reference].filter(v => !variables(bloc(theme.id)).has(v));
    check(`« ${theme.id} » definit toute la palette`, manquantes.length === 0, manquantes.join(','));
}

console.log('\nLes couleurs restent dans themes.css');
for (const feuille of ['css/carte.css', 'css/interface.css']) {
    const texte = lireSource(feuille);
    const codes = [...texte.matchAll(/#[0-9a-f]{3,8}\b/gi)].map(m => m[0]);
    check(`${feuille} n’ecrit aucune couleur en dur`, codes.length <= 1, codes.join(','));
}

report();
