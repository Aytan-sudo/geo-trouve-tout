// Le fil de la manche : score, vies, chrono, reprise.

import { counter } from './harness.mjs';
import { creerPartie, restaurer } from '../js/partie.js';

const { check, report } = counter();

// Un jeu de questions ecrit a la main : dix pays, dont on connait la reponse.
const questions = Array.from({ length: 10 }, (_, i) => ({
    sens: 'nommer', cible: `P${i}`, enonce: 'Quel est ce pays ?',
    reponse: `Pays ${i}`, propositions: [`Pays ${i}`, 'Autre'], aide: null, zoom: false
}));

const juger = (question, donnee) =>
    donnee === question.reponse ? { verdict: 'juste' } : { verdict: 'faux', correction: question.reponse };

const nouvelle = (rythme = 'manche') => creerPartie({
    config: { atlas: 'monde-pays', niveau: 'ecolier', sens: 'nommer', rythme, chrono: 'sans' },
    prochaine: position => questions[position] ?? null,
    juger,
    maintenant: 0
});

console.log('\nUne manche complete');
const partie = nouvelle();
partie.commencer();
check('la premiere question est posee', partie.etat.question.cible === 'P0');
for (let i = 0; i < 10; i++) partie.repondre(i < 7 ? `Pays ${i}` : 'faux', (i + 1) * 1000);
check('la manche est finie', partie.etat.finie);
check('le score compte les justes', partie.score() === 7);
check('les rates sont listes', partie.rates().join(',') === 'P7,P8,P9');
check('le bilan tient debout', partie.bilan().total === 10 && partie.bilan().duree === 10);
check('une manche imparfaite n’est pas parfaite', partie.bilan().parfait === false);

console.log('\nLes series');
const serie = nouvelle();
serie.commencer();
for (let i = 0; i < 5; i++) serie.repondre(`Pays ${i}`, i * 100);
serie.repondre('faux', 600);
serie.repondre('Pays 6', 700);
check('la serie se remet a zero apres une erreur', serie.etat.serie === 1);
check('la meilleure serie est retenue', serie.etat.meilleureSerie === 5);

console.log('\nLe marathon');
const marathon = nouvelle('marathon');
marathon.commencer();
marathon.repondre('faux', 0);
check('une vie perdue ne finit pas la partie', !marathon.etat.finie && marathon.etat.vies === 2);
marathon.repondre('faux', 100);
marathon.repondre('faux', 200);
check('trois erreurs finissent la partie', marathon.etat.finie);
check('le marathon compte les questions posees', marathon.bilan().total === 3);

console.log('\nLe temps');
const chrono = nouvelle();
chrono.commencer();
chrono.horloge(5000);
check('le temps s’accumule', chrono.etat.duree === 5000);
// L'application part a l'arriere-plan pendant une heure, puis revient.
chrono.reprendreHorloge(3605000);
chrono.horloge(3606000);
check('le temps de l’arriere-plan ne compte pas', chrono.etat.duree === 6000);

console.log('\nLa reprise');
const avant = nouvelle();
avant.commencer();
avant.repondre('Pays 0', 1000);
avant.repondre('faux', 2000);
const sauvegarde = avant.serialiser();
const apres = restaurer(sauvegarde, { prochaine: position => questions[position] ?? null, juger, maintenant: 0 });
check('le score survit a la reprise', apres.score() === 1);
check('la partie reprend a la bonne question', apres.etat.question.cible === 'P2');
check('la duree survit', apres.etat.duree === 2000);

console.log('\nLe temps ecoule');
const expire = nouvelle();
expire.commencer();
expire.expirer(1000);
check('une question expiree compte comme manquee', expire.etat.resultats[0].verdict === 'vide');
check('elle n’ajoute pas au score', expire.score() === 0);

console.log('\nGarde-fous');
const finie = nouvelle();
finie.commencer();
for (let i = 0; i < 10; i++) finie.repondre('faux', i * 10);
check('repondre apres la fin ne fait rien', finie.repondre('Pays 0', 999) === null);
check('le nombre de reponses reste dix', finie.etat.resultats.length === 10);

report();
