// Le rangement : preferences, palmares, memoire, et surtout le repli quand
// localStorage est refuse.

import { counter } from './harness.mjs';

// Un faux localStorage, pose avant l'import du module : c'est lui qui decide au
// chargement s'il peut ecrire ou s'il lui faut une memoire temporaire.
const boite = new Map();
globalThis.localStorage = {
    getItem: c => boite.get(c) ?? null,
    setItem: (c, v) => boite.set(c, String(v)),
    removeItem: c => boite.delete(c)
};

const { preferences, partie, souvenirs, stats, toutEffacer } = await import('../js/stockage.js');
const { check, report } = counter();

console.log('\nLes prefixes');
preferences.ecrire({ theme: 'marine' });
const clefs = [...boite.keys()];
check('toutes les clefs sont prefixees', clefs.every(c => c.startsWith('geo.')), clefs.join(','));
check('la clef des preferences est nommee', clefs.includes('geo.preferences'));

console.log('\nLes preferences');
check('ce qui est ecrit se relit', preferences.lire().theme === 'marine');
check('les defauts comblent les trous', preferences.lire().niveau === 'ecolier');
preferences.ecrire({ sons: false });
check('une ecriture partielle garde le reste', preferences.lire().theme === 'marine' && preferences.lire().sons === false);
check('chaque valeur porte sa version', JSON.parse(boite.get('geo.preferences')).v === 1);

console.log('\nLa partie en cours');
partie.ecrire({ v: 1, resultats: [{ cible: 'FRA', verdict: 'juste' }] });
check('la partie se relit', partie.lire().resultats.length === 1);
partie.effacer();
check('la partie s’efface', partie.lire() === null);

console.log('\nLa memoire');
souvenirs.ecrire({ FRA: [3, 3, 88, 12] });
check('les fiches se relisent', souvenirs.lire().FRA[2] === 88);

console.log('\nLes palmares');
stats.noter({ signature: 'monde-pays·ecolier·nommer·manche·sans', bilan: { score: 7, total: 10, duree: 90 }, jour: '2026-09-06' });
stats.noter({ signature: 'monde-pays·ecolier·nommer·manche·sans', bilan: { score: 9, total: 10, duree: 80 }, jour: '2026-09-07' });
stats.noter({ signature: 'monde-pays·expert·nommer·manche·sans', bilan: { score: 4, total: 10, duree: 200 }, jour: null });
const etat = stats.lire();
check('chaque configuration a son palmares', Object.keys(etat.parties).length === 2);
check('le meilleur score est retenu', etat.parties['monde-pays·ecolier·nommer·manche·sans'].meilleur === 9);
check('les parties jouees se comptent', etat.parties['monde-pays·ecolier·nommer·manche·sans'].jouees === 2);
check('un score d’Expert ne pollue pas celui d’Ecolier',
    etat.parties['monde-pays·expert·nommer·manche·sans'].meilleur === 4);

console.log('\nLa serie quotidienne');
check('deux jours de suite font une serie de deux', etat.serie === 2);
check('la meilleure serie est gardee', etat.meilleureSerie === 2);
stats.noter({ signature: 'monde-pays·ecolier·nommer·manche·sans', bilan: { score: 5, total: 10, duree: 60 }, jour: '2026-09-20' });
check('un trou casse la serie', stats.lire().serie === 1);
check('la meilleure serie survit au trou', stats.lire().meilleureSerie === 2);
check('le journal garde les defis', stats.lire().journal.length === 3);
check('une partie libre n’entre pas au journal',
    stats.lire().journal.every(l => l.jour));

console.log('\nL’effacement');
toutEffacer();
check('tout part', stats.lire().serie === 0 && Object.keys(stats.lire().parties).length === 0);
check('les preferences restent', preferences.lire().theme === 'marine');

console.log('\nLe stockage abime');
boite.set('geo.stats', '{ceci n’est pas du JSON');
check('un contenu illisible retombe sur les defauts', stats.lire().serie === 0);
boite.set('geo.preferences', 'null');
check('une valeur nulle retombe sur les defauts', preferences.lire().theme === 'ecolier');

report();
