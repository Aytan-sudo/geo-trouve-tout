// Les verifications structurelles : celles qui attrapent les fautes qui ne
// levent aucune erreur.
//
// Un identifiant renomme dans la page et pas dans le code donne un bouton mort,
// pas une exception. Un fichier oublie dans la coquille du service worker donne
// un jeu qui marche en ligne et se casse dans le metro. Une version qui diverge
// donne un numero affiche qui ment. Rien de tout cela ne se voit en jouant cinq
// minutes sur un ordinateur.

import { readdirSync, statSync } from 'node:fs';
import { counter, lireSource } from './harness.mjs';

const { check, report } = counter();
const page = lireSource('index.html');
const paquet = JSON.parse(lireSource('package.json'));
const sw = lireSource('sw.js');

const racine = new URL('../', import.meta.url);
const fichiers = dossier => {
    const chemins = [];
    for (const nom of readdirSync(new URL(dossier, racine))) {
        const relatif = `${dossier}${nom}`;
        if (statSync(new URL(relatif, racine)).isDirectory()) chemins.push(...fichiers(`${relatif}/`));
        else if (!nom.startsWith('.')) chemins.push(relatif);
    }
    return chemins;
};

console.log('\nLes identifiants cherches par le code');
const sources = fichiers('js/').filter(f => f.endsWith('.js'));
const idsDeLaPage = new Set([...page.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
const manquants = new Set();
for (const fichier of sources) {
    const texte = lireSource(fichier);
    for (const trouve of texte.matchAll(/getElementById\('([^']+)'\)/g)) {
        if (!idsDeLaPage.has(trouve[1])) manquants.add(`${trouve[1]} (${fichier})`);
    }
    for (const trouve of texte.matchAll(/\$\('([^']+)'\)/g)) {
        if (!idsDeLaPage.has(trouve[1])) manquants.add(`${trouve[1]} (${fichier})`);
    }
}
check('chaque identifiant cherche existe dans la page', manquants.size === 0, [...manquants].join(', '));

console.log('\nLa coquille du service worker');
const aServir = fichiers('js/').concat(fichiers('css/'), fichiers('data/'), fichiers('assets/'))
    .filter(f => !f.endsWith('.map'));
const oublies = aServir.filter(f => !sw.includes(f));
check('le service worker liste tous les fichiers', oublies.length === 0, oublies.join(', '));
check('la page et le manifeste sont dans la coquille',
    sw.includes('index.html') && sw.includes('manifest.webmanifest'));
check('le service worker sert le reseau d’abord', /fetch\(requete\)\s*\n\s*\.then/.test(sw));
check('il prend la main a l’installation', sw.includes('skipWaiting'));
check('il reclame les clients a l’activation', sw.includes('clients.claim'));
check('il purge les anciens caches', sw.includes('caches.delete'));

console.log('\nLa version, aux trois endroits');
const versionSw = sw.match(/const CACHE = 'geo-trouve-tout-([\d.]+)'/)?.[1];
const versionApp = lireSource('js/app.js').match(/const VERSION = '([\d.]+)'/)?.[1];
check('le cache porte la version de package.json', versionSw === paquet.version, `${versionSw} / ${paquet.version}`);
check('l’interface affiche la version de package.json', versionApp === paquet.version, `${versionApp} / ${paquet.version}`);
check('la page reserve la ligne de version', page.includes('id="version"'));

console.log('\nLa tete de page');
check('la langue est declaree', page.includes('<html lang="fr">'));
check('le viewport couvre l’encoche', page.includes('viewport-fit=cover'));
check('le zoom du navigateur est neutralise', page.includes('user-scalable=no'));
check('la largeur suit l’appareil', page.includes('width=device-width'));
check('l’icone iOS est en PNG', /apple-touch-icon" href="assets\/icon-180\.png"/.test(page));
check('la barre d’adresse suit le theme', page.includes('id="couleur-barre"'));
check('le manifeste est lie', page.includes('rel="manifest"'));
check('les chemins restent relatifs', !/(href|src)="\.\//.test(page));
check('le module d’entree est differe en module', page.includes('<script type="module" src="js/app.js">'));

console.log('\nLe manifeste');
const manifeste = JSON.parse(lireSource('manifest.webmanifest'));
for (const clef of ['name', 'short_name', 'description', 'display', 'start_url', 'orientation', 'theme_color', 'background_color']) {
    check(`le manifeste declare « ${clef} »`, Boolean(manifeste[clef]));
}
check('le manifeste s’installe en plein ecran', manifeste.display === 'standalone');
for (const taille of ['192x192', '512x512']) {
    check(`le manifeste porte une icone ${taille}`, manifeste.icons.some(i => i.sizes === taille && i.type === 'image/png'));
}

console.log('\nLe piege de l’attribut hidden');
// `display: flex` sur une classe bat `hidden` : sans une regle explicite, tout
// element cache qui porte aussi une classe avec un display reste visible.
const interface_ = lireSource('css/interface.css');
check('une regle rend l’attribut hidden inconditionnel', /\[hidden\]\s*\{[^}]*display:\s*none\s*!important/.test(interface_));
const cachesAuDepart = [...page.matchAll(/<(\w+)[^>]*\bhidden\b/g)].length;
check('la page compte des elements caches au depart', cachesAuDepart >= 3, `(${cachesAuDepart})`);

console.log('\nLes exemptions de cible tactile');
// Un conteneur qui echappe a la regle des 44 px doit dire pourquoi. Sans raison
// ecrite, l'exemption n'en est pas une.
const exemptions = [...page.matchAll(/data-cible-libre="([^"]*)"/g)].map(m => m[1]);
check('chaque exemption porte sa raison', exemptions.every(raison => raison.trim().length > 20), exemptions.join(' | '));

console.log('\nLes scripts npm');
for (const script of ['test', 'check', 'serve']) {
    check(`« npm run ${script} » existe`, Boolean(paquet.scripts[script]));
}
const testes = [...paquet.scripts.test.matchAll(/tests\/([\w-]+\.mjs)/g)].map(m => m[1]);
const surLeDisque = readdirSync(new URL('tests/', racine)).filter(f => f.startsWith('test-'));
check('tous les tests du dossier sont lances',
    surLeDisque.every(f => testes.includes(f)), surLeDisque.filter(f => !testes.includes(f)).join(', '));
const verifies = [...paquet.scripts.check.matchAll(/(js\/[\w-]+\.js|sw\.js)/g)].map(m => m[1]);
check('« npm run check » couvre tous les modules',
    sources.concat('sw.js').every(f => verifies.includes(f)),
    sources.concat('sw.js').filter(f => !verifies.includes(f)).join(', '));
check('aucune dependance de production', !paquet.dependencies);

report();
