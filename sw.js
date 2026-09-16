// Reseau d'abord, cache en secours.
//
// Une mise a jour publiee arrive ainsi sans manoeuvre du joueur : le reseau
// repond, le cache se met a jour derriere. Hors ligne, le cache prend le relais
// et le jeu s'ouvre comme si de rien n'etait.
//
// Le nom du cache porte la version, exactement celle de package.json et celle
// affichee au bas des Options — un test compare les trois. Changer de version
// renomme le cache, donc purge l'ancien.
//
// Une precaution qui a coute cher ailleurs dans la collection : tous les jeux
// servent sur localhost pendant le developpement, et un service worker
// « cache d'abord » y sert alors ses propres fichiers aux autres jeux de la
// meme origine. Reseau d'abord evite cette confusion.

const CACHE = 'geo-trouve-tout-1.4.6';

const COQUILLE = [
    './',
    'commun/passeport.js',
    'commun/liaison.js',
    'commun/passeport.css',
    'index.html',
    'manifest.webmanifest',
    'css/themes.css',
    'css/carte.css',
    'css/interface.css',
    'js/app.js',
    'js/atlas.js',
    'js/carte.js',
    'js/defi.js',
    'js/entree.js',
    'js/hasard.js',
    'js/memoire.js',
    'js/partie.js',
    'js/questions.js',
    'js/rendu.js',
    'js/reponse.js',
    'js/son.js',
    'js/stockage.js',
    'js/themes.js',
    'js/ui.js',
    'js/variantes.js',
    'data/monde-pays.json',
    'data/europe-pays.json',
    'data/france-departements.json',
    'data/france-regions.json',
    'data/france-fleuves.json',
    'data/monde-fleuves.json',
    'assets/icon.svg',
    'assets/icon-180.png',
    'assets/icon-192.png',
    'assets/icon-512.png'
];

self.addEventListener('install', evenement => {
    evenement.waitUntil(
        caches.open(CACHE).then(cache => cache.addAll(COQUILLE)).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', evenement => {
    evenement.waitUntil(
        caches.keys()
            .then(noms => Promise.all(noms.filter(nom => nom.startsWith('geo-trouve-tout-') && nom !== CACHE).map(nom => caches.delete(nom))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', evenement => {
    const requete = evenement.request;
    if (requete.method !== 'GET' || new URL(requete.url).origin !== location.origin) return;

    evenement.respondWith(
        fetch(requete)
            .then(reponse => {
                const copie = reponse.clone();
                caches.open(CACHE).then(cache => cache.put(requete, copie)).catch(() => { /* cache plein */ });
                return reponse;
            })
            .catch(() => caches.match(requete).then(cache => cache ?? caches.match('index.html')))
    );
});
