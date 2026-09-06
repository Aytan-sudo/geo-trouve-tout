// La fabrique de questions : determinisme, distracteurs, sacs de tirage.

import { counter, preparer } from './harness.mjs';
import { creerHasard, graineDepuisTexte } from '../js/hasard.js';
import { composerManche, sacDe, fabriquer, distracteurs, choisirCibles } from '../js/questions.js';
import { NIVEAUX, sensDe, nomAffiche } from '../js/variantes.js';

const { check, report } = counter();
const atlas = preparer('monde-pays');
const graine = () => creerHasard(graineDepuisTexte('2026-09-06'));

console.log('\nLes sacs');
const tailles = {};
for (const niveau of Object.keys(NIVEAUX)) {
    tailles[niveau] = sacDe(atlas, { niveau, sens: 'nommer' }).length;
}
check('Decouverte est le plus petit sac', tailles.decouverte < tailles.ecolier);
check('Ecolier est plus petit que Voyageur', tailles.ecolier < tailles.voyageur);
check('Voyageur prend toute la carte', tailles.voyageur === atlas.entites.length);
check('Decouverte tient entre 30 et 70 pays', tailles.decouverte >= 30 && tailles.decouverte <= 70, `(${tailles.decouverte})`);
check('le sac « capitale » ecarte les pays sans capitale',
    sacDe(atlas, { niveau: 'voyageur', sens: 'capitale' }).every(e => e.capitale));

console.log('\nDeterminisme');
const a = composerManche(atlas, { niveau: 'ecolier', sens: 'nommer' }, graine());
const b = composerManche(atlas, { niveau: 'ecolier', sens: 'nommer' }, graine());
check('meme graine, meme manche', JSON.stringify(a) === JSON.stringify(b));
const c = composerManche(atlas, { niveau: 'ecolier', sens: 'nommer' }, creerHasard(graineDepuisTexte('2026-09-07')));
check('graine differente, manche differente', JSON.stringify(a) !== JSON.stringify(c));
check('une manche fait dix questions', a.length === 10);

console.log('\nUne manche bien formee');
check('aucun pays ne revient deux fois', new Set(a.map(q => q.cible)).size === a.length);
for (const question of a) {
    const entite = atlas.parId.get(question.cible);
    if (!check(`${entite?.nom ?? question.cible} : quatre propositions`, question.propositions.length === 4)) break;
}
check('la bonne reponse est toujours proposee',
    a.every(q => q.propositions.includes(q.reponse)));
check('les propositions sont distinctes',
    a.every(q => new Set(q.propositions).size === q.propositions.length));
check('la bonne reponse ne tombe pas toujours a la meme place',
    new Set(a.map(q => q.propositions.indexOf(q.reponse))).size > 1);

console.log('\nLes distracteurs');
const sac = sacDe(atlas, { niveau: 'voyageur', sens: 'nommer' });
const france = atlas.parId.get('FRA');
const voisins = distracteurs(france, sac, 3, graine(), 'voisins');
check('« voisins » choisit des pays proches',
    voisins.every(e => Math.hypot(e.ancre[0] - france.ancre[0], e.ancre[1] - france.ancre[1]) < atlas.largeur / 6),
    voisins.map(e => e.nom).join(','));
const lointains = distracteurs(france, sac, 3, graine(), 'lointains');
check('« lointains » sort du groupe', lointains.every(e => e.groupe !== france.groupe),
    lointains.map(e => e.nom).join(','));
const memeCoin = distracteurs(france, sac, 3, graine(), 'groupe');
check('« groupe » reste en Europe', memeCoin.every(e => e.groupe === france.groupe),
    memeCoin.map(e => e.nom).join(','));
check('un distracteur n’est jamais la reponse',
    [...voisins, ...lointains, ...memeCoin].every(e => e.id !== 'FRA'));

console.log('\nLe poids de revision');
// Un poids ecrasant sur un seul pays doit le faire sortir a tous les coups :
// c'est le mecanisme qui ramene les pays rates.
const force = choisirCibles(sac, 5, graine(), e => e.id === 'MNG' ? 100000 : 0.0001);
check('un poids ecrasant fait sortir le pays', force[0].id === 'MNG');
check('le tirage pondere ne repete pas', new Set(force.map(e => e.id)).size === 5);

console.log('\nLes sens');
const localiser = fabriquer(france, sac, { niveau: 'voyageur', sens: 'localiser' }, graine());
check('« localiser » n’offre pas de propositions', localiser.propositions.length === 0);
const expert = fabriquer(france, sac, { niveau: 'expert', sens: 'nommer' }, graine());
check('« expert » n’offre pas de propositions', expert.propositions.length === 0);
const capitale = fabriquer(france, sac, { niveau: 'ecolier', sens: 'capitale' }, graine());
check('« capitale » attend Paris', capitale.reponse === 'Paris');
check('« capitale » propose des capitales', capitale.propositions.length === 4 && capitale.propositions.includes('Paris'));

console.log('\nLes aides');
const facile = fabriquer(france, sac, { niveau: 'decouverte', sens: 'nommer' }, graine());
check('Decouverte donne le groupe', facile.aide === 'Europe');
check('Voyageur ne donne rien', fabriquer(france, sac, { niveau: 'voyageur', sens: 'nommer' }, graine()).aide === null);
const monaco = atlas.parId.get('MCO');
check('un micro-Etat declenche le zoom quel que soit le niveau',
    fabriquer(monaco, sac, { niveau: 'voyageur', sens: 'nommer' }, graine()).zoom === true);

console.log('\nAucune question sans reponse');
// Le sac d'un sens donne ecarte deja les entites qui n'ont pas la reponse. Mais
// « en alternance » garde tout le monde : Israel n'a pas de capitale
// consensuelle, et la question tombait alors sans reponse, avec un bouton vide
// parmi les quatre.
const sansCapitale = atlas.entites.find(e => !e.capitale);
const rabattue = fabriquer(sansCapitale, sac, { niveau: 'ecolier', sens: 'capitale' }, graine());
check(`${sansCapitale.nom} n’est pas interroge sur sa capitale`, rabattue.sens === 'nommer');
check('la question rabattue a une reponse', rabattue.reponse === sansCapitale.nom);
check('aucune proposition vide', rabattue.propositions.every(p => typeof p === 'string' && p.length));
const longue = composerManche(atlas, { niveau: 'voyageur', sens: 'alterne' }, graine(), { nombre: 60 });
check('une longue alternance ne pose jamais de question sans reponse',
    longue.every(q => q.sens === 'localiser'
        || (typeof q.reponse === 'string' && q.reponse.length
            && q.propositions.every(p => typeof p === 'string' && p.length))));

console.log('\nLes cartes francaises');
const departements = preparer('france-departements');
const regions = preparer('france-regions');

check('les departements offrent le numero', sensDe(departements).includes('numero'));
check('les regions n’offrent pas de numero', !sensDe(regions).includes('numero'));
check('le monde n’offre pas de numero', !sensDe(atlas).includes('numero'));
check('toute carte sait nommer et localiser',
    [atlas, departements, regions].every(a => ['nommer', 'localiser'].every(s => sensDe(a).includes(s))));

const ille = departements.parId.get('35');
const numero = fabriquer(ille, sacDe(departements, { niveau: 'voyageur', sens: 'numero' }),
    { niveau: 'voyageur', sens: 'numero' }, graine(), { mots: departements.mots });
check('« numero » attend 35', numero.reponse === '35');
check('« numero » propose des numeros', numero.propositions.length === 4
    && numero.propositions.every(p => /^(\d{2,3}|2[AB])$/.test(p)), numero.propositions.join(','));
check('« numero » pose la question en francais', numero.enonce === 'Quel est son numéro ?');

const prefecture = fabriquer(ille, sacDe(departements, { niveau: 'ecolier', sens: 'capitale' }),
    { niveau: 'ecolier', sens: 'capitale' }, graine(), { mots: departements.mots });
check('la prefecture d’Ille-et-Vilaine est Rennes', prefecture.reponse === 'Rennes');
check('l’enonce prend les mots de la carte', prefecture.enonce === 'Quelle est sa préfecture ?');

const bretagne = regions.parId.get('53');
const chefLieu = fabriquer(bretagne, sacDe(regions, { niveau: 'ecolier', sens: 'capitale' }),
    { niveau: 'ecolier', sens: 'capitale' }, graine(), { mots: regions.mots });
check('une region demande son chef-lieu', chefLieu.enonce === 'Quel est son chef-lieu ?');
check('l’enonce d’une region s’accorde',
    fabriquer(bretagne, [], { niveau: 'expert', sens: 'nommer' }, graine(), { mots: regions.mots })
        .enonce === 'Quelle est cette région ?');

console.log('\nLe numero dans le nom');
// « Var (83) » : le numero s'affiche avec le nom, mais seulement la ou c'est
// un nom qu'on demande. Les propositions de capitales sont des villes, celles
// de numeros sont des numeros — y coller un numero de plus n'aurait aucun sens.
const varr = departements.parId.get('83');
check('le nom affiche porte le numero', nomAffiche(varr) === 'Var (83)');
check('un pays n’a pas de numero a afficher', nomAffiche(atlas.parId.get('FRA')) === 'France');
check('nomAffiche supporte l’absence d’entite', nomAffiche(undefined) === '');

const nomme = fabriquer(varr, sacDe(departements, { niveau: 'voyageur', sens: 'nommer' }),
    { niveau: 'voyageur', sens: 'nommer' }, graine(), { mots: departements.mots });
check('« nommer » propose des noms numerotes',
    nomme.reponse === 'Var (83)' && nomme.propositions.every(p => /\(\d{2,3}|\(2[AB]\)/.test(p)),
    nomme.propositions.join(' | '));
const toulon = fabriquer(varr, sacDe(departements, { niveau: 'voyageur', sens: 'capitale' }),
    { niveau: 'voyageur', sens: 'capitale' }, graine(), { mots: departements.mots });
check('« préfecture » propose des villes, sans numero',
    toulon.reponse === 'Toulon' && toulon.propositions.every(p => !p.includes('(')),
    toulon.propositions.join(' | '));
const numero83 = fabriquer(varr, sacDe(departements, { niveau: 'voyageur', sens: 'numero' }),
    { niveau: 'voyageur', sens: 'numero' }, graine(), { mots: departements.mots });
check('« numero » propose des numeros nus',
    numero83.reponse === '83' && numero83.propositions.every(p => !p.includes('(')),
    numero83.propositions.join(' | '));

console.log('\nUne manche ne melange jamais deux cartes');
// C'est la regle du defi du jour : une categorie, et une seule. Le sac vient
// d'un atlas, donc la manche aussi — on le verifie sur chaque carte, dans
// chaque sens, plutot que de s'en remettre a la lecture du code.
for (const carte of [atlas, departements, regions]) {
    const connus = new Set(carte.entites.map(e => e.id));
    let melange = null;
    for (const sens of sensDe(carte)) {
        for (const niveau of ['decouverte', 'voyageur']) {
            const manche = composerManche(carte, { niveau, sens }, graine(), { nombre: 10 });
            const intrus = manche.find(q => !connus.has(q.cible));
            if (intrus) melange = `${sens}/${niveau} : ${intrus.cible}`;
        }
    }
    check(`« ${carte.nom} » ne pose que ses propres entites`, melange === null, melange ?? '');
}

// Et l'alternance ne va pas chercher un sens que la carte ne sait pas poser.
const alternees = composerManche(atlas, { niveau: 'voyageur', sens: 'alterne' }, graine(), { nombre: 30 });
check('« alterne » n’invente pas de sens sur le monde',
    alternees.every(q => sensDe(atlas).includes(q.sens)),
    [...new Set(alternees.map(q => q.sens))].join(','));
const alterneesFrance = composerManche(departements, { niveau: 'voyageur', sens: 'alterne' }, graine(), { nombre: 40 });
check('« alterne » utilise le numero sur les departements',
    alterneesFrance.some(q => q.sens === 'numero'));

report();
