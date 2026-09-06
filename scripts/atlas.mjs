// Fabrique les cartes du jeu. Se lance a la main, son resultat est commite.
//
//   npm run atlas            refait tous les atlas
//   npm run atlas -- europe  n'en refait qu'un
//
// Les sources sont telechargees une fois dans scripts/cache/ (ignore par git).
// Le jeu publie, lui, ne connait que data/*.json : pas de reseau, pas de
// projection a l'execution, pas de dependance.

import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { PAYS, CONTINENTS } from './pays.mjs';
import { PROJECTIONS } from './projection.mjs';
import { simplifier, aireAnneau, boite, ancre, chemin, couper } from './geometrie.mjs';

const CACHE = new URL('cache/', import.meta.url);
const DATA = new URL('../data/', import.meta.url);

const SOURCES = {
    pays50: 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson'
};

// Chaque atlas dit ce qu'il cadre, comment il projette, et qui y est jouable.
const ATLAS = {
    'monde-pays': {
        nom: 'Le monde',
        source: 'pays50',
        projection: 'equal-earth',
        largeur: 4000,
        tolerance: 4,            // aire de triangle, en unites de viewBox
        // L'Antarctique sort du cadre : aucun pays a y trouver, et il coutait un
        // quart de la hauteur — cher paye sur un telephone tenu debout.
        exclus: ['ATA'],
        cadre: null,
        vue: null,
        jouable: code => code in PAYS
    },
    'europe-pays': {
        nom: 'L’Europe',
        source: 'pays50',
        projection: 'lambert',
        options: { lat1: 40, lat2: 64, lat0: 52, lon0: 15 },
        largeur: 3000,
        tolerance: 1.5,
        // On decoupe large et on cadre serre : la coupe franche de la Russie
        // tombe ainsi hors de l'ecran au lieu de barrer la carte en diagonale.
        cadre: [-45, 25, 80, 80],
        vue: [-26, 33, 46, 71],
        jouable: code => code in PAYS && EUROPE.has(code)
    }
};

const EUROPE = new Set([
    'FRA', 'DEU', 'ESP', 'ITA', 'PRT', 'GBR', 'IRL', 'BEL', 'NLD', 'LUX', 'CHE', 'AUT',
    'POL', 'CZE', 'DNK', 'NOR', 'SWE', 'FIN', 'ISL', 'GRC', 'UKR', 'HRV', 'HUN', 'ROU',
    'BGR', 'SRB', 'SVK', 'SVN', 'BIH', 'ALB', 'BLR', 'MCO', 'EST', 'LVA', 'LTU', 'MDA',
    'MKD', 'MNE', 'XKX', 'MLT', 'AND', 'VAT', 'SMR', 'LIE', 'RUS'
]);

async function source(nom) {
    if (!existsSync(CACHE)) await mkdir(CACHE, { recursive: true });
    const fichier = new URL(`${nom}.geojson`, CACHE);
    if (!existsSync(fichier)) {
        process.stdout.write(`  téléchargement de ${nom}…`);
        const reponse = await fetch(SOURCES[nom]);
        if (!reponse.ok) throw new Error(`${SOURCES[nom]} : ${reponse.status}`);
        await writeFile(fichier, await reponse.text());
        process.stdout.write(' fait\n');
    }
    return JSON.parse(await readFile(fichier, 'utf8'));
}

// Natural Earth donne FRA a la France mais -99 a son ISO_A3 : c'est ADM0_A3 qui
// sert de cle, seul champ toujours renseigne. Trois entites y portent un code
// maison plutot que leur code ISO — on les ramene au notre.
const ALIAS_CODE = { KOS: 'XKX', PSX: 'PSE', SDS: 'SSD' };
const codeDe = p => ALIAS_CODE[p.ADM0_A3] ?? p.ADM0_A3;

function polygones(geometrie) {
    return geometrie.type === 'Polygon' ? [geometrie.coordinates] : geometrie.coordinates;
}

// Ramene un polygone au cadre de l'atlas. Rend null s'il n'en reste rien.
function cadrer(polygone, cadre) {
    if (!cadre) return polygone;
    const coupes = polygone.map(anneau => couper(anneau, cadre)).filter(a => a.length >= 3);
    return coupes.length ? coupes : null;
}

async function fabriquer(id) {
    const config = ATLAS[id];
    const brut = await source(config.source);
    const projeter = PROJECTIONS[config.projection];
    const options = config.options ?? {};

    // 1. Projeter tout ce qu'on garde, et mesurer l'etendue reelle.
    const retenus = [];
    for (const feature of brut.features) {
        const code = codeDe(feature.properties);
        if (config.exclus?.includes(code)) continue;
        const jouable = config.jouable(code);
        const groupes = polygones(feature.geometry)
            .map(poly => cadrer(poly, config.cadre))
            .filter(Boolean)
            .map(poly => poly.map(anneau => anneau.map(p => projeter(p, options))));
        if (!groupes.length) continue;
        retenus.push({ code, jouable, groupes, props: feature.properties });
    }

    // L'etendue du dessin, ou celle que l'atlas impose. Une projection conique
    // courbe les paralleles : on echantillonne le tour de la boite plutot que
    // d'en projeter les quatre coins.
    let [bx0, by0, bx1, by1] = boite(retenus.flatMap(e => e.groupes.flat()));
    if (config.vue) {
        const [l0, p0, l1, p1] = config.vue;
        const contour = [];
        for (let t = 0; t <= 1.0001; t += 1 / 60) {
            contour.push([l0 + (l1 - l0) * t, p0], [l0 + (l1 - l0) * t, p1],
                [l0, p0 + (p1 - p0) * t], [l1, p0 + (p1 - p0) * t]);
        }
        [bx0, by0, bx1, by1] = boite([contour.map(p => projeter(p, options))]);
    }
    const echelle = config.largeur / (bx1 - bx0);
    const hauteur = Math.round((by1 - by0) * echelle);
    const vers = ([x, y]) => [(x - bx0) * echelle, (y - by0) * echelle];

    // 2. Mettre a l'echelle, simplifier, jeter les ilots invisibles.
    const seuilIlot = config.tolerance * config.tolerance * 0.6;
    for (const e of retenus) {
        e.groupes = e.groupes.map(poly => poly.map(anneau => simplifier(anneau.map(vers), config.tolerance)));
        const gardes = e.groupes.filter(poly => aireAnneau(poly[0]) >= seuilIlot);
        // Un pays entierement fait d'ilots minuscules garde son plus gros : mieux
        // vaut un point pour Nauru qu'un trou dans le Pacifique.
        e.groupes = gardes.length ? gardes
            : [e.groupes.sort((a, b) => aireAnneau(b[0]) - aireAnneau(a[0]))[0]];
    }

    // 3. Ecrire les entites jouables, fondre le reste dans le decor.
    // Sous ce seuil, un pays occupe moins de deux pixels sur un telephone :
    // Malte, Nauru, les Seychelles. Le fichier garde leur forme exacte, et
    // signale au rendu qu'il faudra une epingle pour les trouver.
    const seuilMinuscule = (config.largeur / 200) ** 2;

    // Nauru fait vingt et un kilometres carres : a l'echelle du monde, son
    // contour se replie sur un seul point et disparait a l'arrondi. Le pays
    // serait alors invisible ET intouchable. On lui pose donc un losange
    // minimal sur son ancre, comme une carte scolaire pose un point sur Monaco.
    // Ces pays portent deja `minuscule`, et le jeu les signale d'une epingle.
    const rayonMinimal = config.largeur / 320;
    const losange = ([x, y]) => chemin([[
        [x - rayonMinimal, y], [x, y - rayonMinimal],
        [x + rayonMinimal, y], [x, y + rayonMinimal], [x - rayonMinimal, y]
    ]]);
    const entites = [];
    const decor = [];
    const orphelins = [];
    for (const e of retenus) {
        const anneaux = e.groupes.flat();
        if (!e.jouable) { decor.push(...anneaux); continue; }
        const fiche = PAYS[e.code];
        const principal = e.groupes.reduce((a, b) => aireAnneau(b[0]) > aireAnneau(a[0]) ? b : a);
        const [x0, y0, x1, y1] = boite([principal[0]]);
        const aire = e.groupes.reduce((somme, poly) => somme + aireAnneau(poly[0]), 0);
        entites.push({
            id: e.code,
            nom: fiche.nom,
            article: fiche.article,
            ...(fiche.alias ? { alias: fiche.alias } : {}),
            ...(fiche.capitale ? { capitale: fiche.capitale } : {}),
            rang: fiche.rang,
            continent: CONTINENTS[e.props.CONTINENT] ?? e.props.CONTINENT,
            ancre: ancre(principal).map(Math.round),
            boite: [x0, y0, x1, y1].map(Math.round),
            aire: Math.round(aire),
            ...(aire < seuilMinuscule ? { minuscule: 1 } : {}),
            d: chemin(anneaux) || losange(ancre(principal))
        });
    }
    for (const code of Object.keys(PAYS)) {
        if (config.jouable(code) && !entites.some(e => e.id === code)) orphelins.push(code);
    }

    entites.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
    const atlas = {
        id,
        nom: config.nom,
        projection: config.projection,
        viewBox: `0 0 ${config.largeur} ${hauteur}`,
        entites,
        decor: chemin(decor)
    };
    await writeFile(new URL(`${id}.json`, DATA), JSON.stringify(atlas));
    const poids = JSON.stringify(atlas).length;
    console.log(`  ${id} : ${entites.length} entités, décor ${decor.length} anneaux, ${(poids / 1024).toFixed(0)} Ko, viewBox ${atlas.viewBox}`);
    if (orphelins.length) console.log(`  ⚠ absents de la carte : ${orphelins.join(', ')}`);
    return atlas;
}

const demandes = process.argv.slice(2).filter(a => !a.startsWith('-'));
const liste = demandes.length ? demandes : Object.keys(ATLAS);
console.log('Fabrication des atlas');
for (const id of liste) {
    if (!ATLAS[id]) { console.error(`  atlas inconnu : ${id}`); process.exitCode = 1; continue; }
    await fabriquer(id);
}
