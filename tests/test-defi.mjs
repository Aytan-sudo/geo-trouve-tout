// Le defi du jour, les liens et le partage.

import { counter } from './harness.mjs';
import { dateISO, dateFrancaise, graineDuJour, lireAdresse, lienDuJour, lienLibre, texteDePartage, duree, CONFIG_DU_JOUR, configDuJour } from '../js/defi.js';
import { creerHasard } from '../js/hasard.js';
import { composerManche } from '../js/questions.js';
import { preparer } from './harness.mjs';

const { check, report } = counter();

console.log('\nLes dates');
check('la date s’ecrit en ISO', dateISO(new Date(2026, 8, 6)) === '2026-09-06');
check('les mois se remplissent de zeros', dateISO(new Date(2026, 0, 3)) === '2026-01-03');
check('la date se lit a la francaise', dateFrancaise('2026-09-06') === '06/09/2026');

console.log('\nLa graine');
check('un jour donne toujours la meme graine', graineDuJour('2026-09-06') === graineDuJour('2026-09-06'));
check('deux jours voisins donnent des graines eloignees',
    Math.abs(graineDuJour('2026-09-06') - graineDuJour('2026-09-07')) > 1000);
const suite = jour => {
    const hasard = creerHasard(graineDuJour(jour));
    return Array.from({ length: 5 }, () => hasard.entier(200)).join(',');
};
check('le meme jour rejoue la meme suite', suite('2026-09-06') === suite('2026-09-06'));
check('deux jours ne partagent pas leur suite', suite('2026-09-06') !== suite('2026-09-07'));

console.log('\nUn defi par carte, jamais deux cartes dans un defi');
// La regle : un defi porte sur une categorie et une seule. Deux cartes le meme
// jour donnent deux manches differentes, et aucune ne va piocher chez l'autre.
check('chaque carte a sa propre graine',
    graineDuJour('2026-09-07', 'france-departements') !== graineDuJour('2026-09-07'));
check('la graine du monde n’a pas bouge',
    graineDuJour('2026-09-07') === graineDuJour('2026-09-07', 'monde-pays'));
check('la meme carte redonne la meme graine',
    graineDuJour('2026-09-07', 'france-regions') === graineDuJour('2026-09-07', 'france-regions'));
check('la configuration du defi ne change que d’atlas', (() => {
    const jour = configDuJour('france-departements');
    return jour.atlas === 'france-departements'
        && jour.niveau === CONFIG_DU_JOUR.niveau && jour.sens === CONFIG_DU_JOUR.sens
        && jour.rythme === CONFIG_DU_JOUR.rythme && jour.chrono === CONFIG_DU_JOUR.chrono;
})());

for (const id of ['monde-pays', 'france-departements', 'france-regions']) {
    const atlas = preparer(id);
    const config = configDuJour(id);
    const manche = composerManche(atlas, config, creerHasard(graineDuJour('2026-09-07', id)), { nombre: 10 });
    const connus = new Set(atlas.entites.map(e => e.id));
    check(`le defi de « ${atlas.nom} » tient dans sa carte`,
        manche.length === 10 && manche.every(q => connus.has(q.cible)));
    const rejoue = composerManche(atlas, config, creerHasard(graineDuJour('2026-09-07', id)), { nombre: 10 });
    check(`le defi de « ${atlas.nom} » se rejoue a l’identique`,
        manche.map(q => q.cible).join() === rejoue.map(q => q.cible).join());
}

console.log('\nL’adresse');
const jour = lireAdresse('?jour=2026-09-06');
check('un lien de jour est reconnu', jour?.mode === 'jour' && jour.jour === '2026-09-06');
check('un lien de jour impose la configuration canonique',
    jour.config.niveau === CONFIG_DU_JOUR.niveau && jour.config.atlas === CONFIG_DU_JOUR.atlas);
check('une date mal formee est ignoree', lireAdresse('?jour=hier') === null);
const jourFrance = lireAdresse('?jour=2026-09-06&carte=france-departements');
check('un lien de defi porte sa carte', jourFrance.config.atlas === 'france-departements');
check('un lien de defi prend la graine de sa carte',
    jourFrance.graine === graineDuJour('2026-09-06', 'france-departements'));
check('une carte inconnue retombe sur le monde',
    lireAdresse('?jour=2026-09-06&carte=mars', ['monde-pays']).config.atlas === CONFIG_DU_JOUR.atlas);
const libre = lireAdresse('?seed=abc&niveau=expert&atlas=europe-pays');
check('un lien libre est reconnu', libre?.mode === 'libre');
check('un lien libre porte sa configuration', libre.config.niveau === 'expert' && libre.config.atlas === 'europe-pays');
check('une adresse vide ne dit rien', lireAdresse('') === null);

console.log('\nLes liens');
check('le lien du jour porte la date', lienDuJour('2026-09-06').endsWith('?jour=2026-09-06'));
check('le lien du monde reste celui d’avant', !lienDuJour('2026-09-06').includes('carte='));
check('le lien d’une autre carte la porte',
    lienDuJour('2026-09-06', 'france-regions').endsWith('?jour=2026-09-06&carte=france-regions'));
const lien = lienLibre('abc', { atlas: 'europe-pays', niveau: 'expert', sens: 'nommer', rythme: 'manche', chrono: 'sans' });
check('le lien libre porte la graine', lien.includes('seed=abc'));
check('le lien libre porte ce qui change', lien.includes('niveau=expert') && lien.includes('atlas=europe-pays'));
check('le lien libre tait les valeurs par defaut', !lien.includes('sens=nommer'));
check('aucun lien ne porte de resultat', !lien.includes('score') && !lienDuJour('2026-09-06').includes('score'));

console.log('\nLe partage');
const texte = texteDePartage({
    resultats: [{ verdict: 'juste' }, { verdict: 'faux' }, { verdict: 'presque' }],
    score: 2, total: 3, duree: 72
}, { jour: '2026-09-06', lien: lienDuJour('2026-09-06') });
check('le texte porte la date', texte.includes('06/09/2026'));
check('le texte porte le score', texte.includes('2/3'));
check('le texte porte le temps', texte.includes('1:12'));
check('le texte trace la manche', texte.includes('🟩🟥🟨'));
check('le texte porte le lien', texte.includes('?jour=2026-09-06'));
check('le texte ne nomme aucun pays', !/[A-Z][a-z]+e\b/.test(texte.split('\n')[2]));

console.log('\nLes durees');
check('une minute pleine', duree(60) === '1:00');
check('les secondes se remplissent', duree(65) === '1:05');
check('zero seconde', duree(0) === '0:00');

report();
