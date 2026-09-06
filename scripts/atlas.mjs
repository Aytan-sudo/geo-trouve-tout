// Fabrique les cartes du jeu. Se lance a la main, son resultat est commite.
//
//   npm run atlas                        refait tous les atlas
//   npm run atlas -- france-departements n'en refait qu'un
//
// Les sources sont telechargees une fois dans scripts/cache/ (ignore par git).
// Le jeu publie, lui, ne connait que data/*.json : pas de reseau, pas de
// projection a l'execution, pas de dependance.
//
// Un atlas dit quatre choses : ou il prend sa geometrie, comment il la
// projette, qui y est jouable, et quels mots le decrivent (« pays » ou
// « departement », « capitale » ou « prefecture »). Le moteur du jeu ne connait
// que le fichier produit — ajouter une carte ne demande donc pas d'y toucher.

import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { PAYS, CONTINENTS, PIEGES } from './pays.mjs';
import { DEPARTEMENTS, REGIONS, PIEGES_DEPARTEMENTS, PIEGES_REGIONS } from './france.mjs';
import { PROJECTIONS } from './projection.mjs';
import { simplifier, aireAnneau, boite, ancre, chemin, couper } from './geometrie.mjs';

const CACHE = new URL('cache/', import.meta.url);
const DATA = new URL('../data/', import.meta.url);

const SOURCES = {
    pays50: 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson',
    // france-geojson (Gregoire David), Licence Ouverte. Les fichiers « avec
    // outre-mer » sont les seuls a porter les cinq DROM.
    'departements-om': 'https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements-avec-outre-mer.geojson',
    'regions-om': 'https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/regions-avec-outre-mer.geojson'
};

// Les mots de chaque famille de cartes. Ils voyagent dans le fichier d'atlas et
// remplissent les enonces : le moteur ecrit « Quel est ce {entite} ? » sans
// savoir s'il parle d'un pays ou d'un departement.
// Le genre voyage avec les mots : sans lui le jeu ecrirait « Quel est cette
// region ? ». `quelEst` s'accorde avec l'entite, `quelEstChef` avec son
// chef-lieu — les deux ne sont pas du meme genre.
const MOTS_PAYS = {
    entite: 'pays', entites: 'pays', unEntite: 'un pays', leEntite: 'le pays',
    ceEntite: 'ce pays', quelEst: 'Quel est', leLa: 'le',
    chef: 'capitale', laChef: 'la capitale', saChef: 'sa capitale', quelEstChef: 'Quelle est',
    groupe: 'continent', leGroupe: 'le continent', duGroupe: 'du même continent',
    acquis: 'acquis', jamaisVus: 'jamais vus'
};
const MOTS_DEPARTEMENTS = {
    entite: 'département', entites: 'départements', unEntite: 'un département', leEntite: 'le département',
    ceEntite: 'ce département', quelEst: 'Quel est', leLa: 'le',
    chef: 'préfecture', laChef: 'la préfecture', saChef: 'sa préfecture', quelEstChef: 'Quelle est',
    groupe: 'région', leGroupe: 'la région', duGroupe: 'de la même région',
    acquis: 'acquis', jamaisVus: 'jamais vus'
};
const MOTS_REGIONS = {
    entite: 'région', entites: 'régions', unEntite: 'une région', leEntite: 'la région',
    ceEntite: 'cette région', quelEst: 'Quelle est', leLa: 'la',
    chef: 'chef-lieu', laChef: 'le chef-lieu', saChef: 'son chef-lieu', quelEstChef: 'Quel est',
    groupe: 'ensemble', leGroupe: 'l’ensemble', duGroupe: 'du même ensemble',
    acquis: 'acquises', jamaisVus: 'jamais vues'
};

// Les cinq DROM, chacun dans son cartouche. Ils sont a huit mille kilometres de
// la metropole : les laisser a leur place vraie reduirait la France a un
// timbre-poste. Chacun est donc projete pour lui-meme et pose dans une case, a
// sa propre echelle — comme le fait tout atlas scolaire.
const CARTOUCHES_FRANCE = [
    { nom: 'Guadeloupe', codes: { departements: ['971'], regions: ['01'] }, centre: { lon0: -61.5, lat0: 16.2 } },
    { nom: 'Martinique', codes: { departements: ['972'], regions: ['02'] }, centre: { lon0: -61.0, lat0: 14.65 } },
    { nom: 'Guyane', codes: { departements: ['973'], regions: ['03'] }, centre: { lon0: -53.2, lat0: 4.0 } },
    { nom: 'La Réunion', codes: { departements: ['974'], regions: ['04'] }, centre: { lon0: 55.5, lat0: -21.1 } },
    { nom: 'Mayotte', codes: { departements: ['976'], regions: ['06'] }, centre: { lon0: 45.15, lat0: -12.8 } }
];

const cartouchesDe = clef => CARTOUCHES_FRANCE.map(c => ({
    nom: c.nom, ids: c.codes[clef], centre: c.centre
}));

// Chaque atlas dit ce qu'il cadre, comment il projette, et qui y est jouable.
const ATLAS = {
    'monde-pays': {
        nom: 'Le monde',
        source: 'pays50',
        clef: p => codePays(p),
        contenu: PAYS,
        pieges: PIEGES,
        groupe: (fiche, props) => CONTINENTS[props.CONTINENT] ?? props.CONTINENT,
        mots: MOTS_PAYS,
        projection: 'equal-earth',
        largeur: 4000,
        tolerance: 4,            // aire de triangle, en unites de viewBox
        // L'Antarctique sort du cadre : aucun pays a y trouver, et il coutait un
        // quart de la hauteur — cher paye sur un telephone tenu debout.
        exclus: ['ATA'],
        cadre: null,
        vue: null,
        couverture: 1.55
    },
    'europe-pays': {
        nom: 'L’Europe',
        source: 'pays50',
        clef: p => codePays(p),
        contenu: PAYS,
        retenir: code => EUROPE.has(code),
        pieges: PIEGES,
        groupe: (fiche, props) => CONTINENTS[props.CONTINENT] ?? props.CONTINENT,
        mots: MOTS_PAYS,
        projection: 'lambert',
        options: { lat1: 40, lat2: 64, lat0: 52, lon0: 15 },
        largeur: 3000,
        tolerance: 1.5,
        // On decoupe large et on cadre serre : la coupe franche de la Russie
        // tombe ainsi hors de l'ecran au lieu de barrer la carte en diagonale.
        cadre: [-45, 25, 80, 80],
        vue: [-26, 33, 46, 71],
        couverture: 1.55
    },
    'france-departements': {
        nom: 'Les départements',
        source: 'departements-om',
        clef: p => p.code,
        contenu: DEPARTEMENTS,
        pieges: PIEGES_DEPARTEMENTS,
        numero: true,
        mots: MOTS_DEPARTEMENTS,
        projection: 'lambert',
        options: { lat1: 44, lat2: 49, lat0: 46.5, lon0: 3 },
        largeur: 3000,
        tolerance: 1,
        seuilMinuscule: 150,
        marge: 0.015,
        cartouches: cartouchesDe('departements'),
        // Les voisins en fond de carte : sans eux la France flotte dans le
        // vide, et l'on perd le repere qui aide justement a la lire.
        decor: { source: 'pays50', cadre: [-9, 40, 13, 54], exclus: ['FRA'] },
        // Sa colonne de cartouches ne doit pas sortir du cadre : cette carte ne
        // se laisse pas rogner. Et l'on ne s'y approche pas trop : sur une
        // carte administrative, c'est la place dans le pays qui fait la
        // reponse, pas la forme du departement.
        couverture: 1.02,
        zoomCadrage: 1.5
    },
    'france-regions': {
        nom: 'Les régions',
        source: 'regions-om',
        clef: p => p.code,
        contenu: REGIONS,
        pieges: PIEGES_REGIONS,
        mots: MOTS_REGIONS,
        projection: 'lambert',
        options: { lat1: 44, lat2: 49, lat0: 46.5, lon0: 3 },
        largeur: 3000,
        tolerance: 1,
        marge: 0.015,
        cartouches: cartouchesDe('regions'),
        decor: { source: 'pays50', cadre: [-9, 40, 13, 54], exclus: ['FRA'] },
        couverture: 1.02,
        zoomCadrage: 1.35
    }
};

const EUROPE = new Set([
    'FRA', 'DEU', 'ESP', 'ITA', 'PRT', 'GBR', 'IRL', 'BEL', 'NLD', 'LUX', 'CHE', 'AUT',
    'POL', 'CZE', 'DNK', 'NOR', 'SWE', 'FIN', 'ISL', 'GRC', 'UKR', 'HRV', 'HUN', 'ROU',
    'BGR', 'SRB', 'SVK', 'SVN', 'BIH', 'ALB', 'BLR', 'MCO', 'EST', 'LVA', 'LTU', 'MDA',
    'MKD', 'MNE', 'XKX', 'MLT', 'AND', 'VAT', 'SMR', 'LIE', 'RUS'
]);

// La colonne des cartouches, en part de la largeur totale, et la marge laissee
// autour de chaque forme dans sa case.
const PART_CARTOUCHES = 0.26;
const MARGE_CARTOUCHE = 0.1;

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
const codePays = p => ALIAS_CODE[p.ADM0_A3] ?? p.ADM0_A3;

function polygones(geometrie) {
    return geometrie.type === 'Polygon' ? [geometrie.coordinates] : geometrie.coordinates;
}

// Ramene un polygone au cadre de l'atlas. Rend null s'il n'en reste rien.
function cadrer(polygone, cadre) {
    if (!cadre) return polygone;
    const coupes = polygone.map(anneau => couper(anneau, cadre)).filter(a => a.length >= 3);
    return coupes.length ? coupes : null;
}

const projeterGroupes = (groupes, projeter, options) =>
    groupes.map(poly => poly.map(anneau => anneau.map(p => projeter(p, options))));

// Le tour de la boite d'une vue, echantillonne : une projection conique courbe
// les paralleles, et projeter les quatre coins mentirait sur l'etendue.
function contourDe([l0, p0, l1, p1]) {
    const contour = [];
    for (let t = 0; t <= 1.0001; t += 1 / 60) {
        contour.push([l0 + (l1 - l0) * t, p0], [l0 + (l1 - l0) * t, p1],
            [l0, p0 + (p1 - p0) * t], [l1, p0 + (p1 - p0) * t]);
    }
    return contour;
}

// Pose un dessin dans une case : mise a l'echelle pour y tenir, puis centrage.
// C'est toute la mecanique d'un cartouche.
function poser(anneaux, [cx0, cy0, cx1, cy1]) {
    const [x0, y0, x1, y1] = boite(anneaux);
    const echelle = Math.min((cx1 - cx0) / Math.max(x1 - x0, 1e-9), (cy1 - cy0) / Math.max(y1 - y0, 1e-9));
    const dx = cx0 + ((cx1 - cx0) - (x1 - x0) * echelle) / 2 - x0 * echelle;
    const dy = cy0 + ((cy1 - cy0) - (y1 - y0) * echelle) / 2 - y0 * echelle;
    return ([x, y]) => [x * echelle + dx, y * echelle + dy];
}

async function fabriquer(id) {
    const config = ATLAS[id];
    const table = config.contenu;
    const brut = await source(config.source);
    const projeter = PROJECTIONS[config.projection];
    const options = config.options ?? {};
    const cartouches = config.cartouches ?? [];
    const dansUnCartouche = new Map();
    for (const [rang, cartouche] of cartouches.entries()) {
        for (const code of cartouche.ids) dansUnCartouche.set(code, rang);
    }

    // 1. Lire la source. Chaque entite part dans son propre repere : le dessin
    //    principal dans la projection de l'atlas, chaque cartouche dans une
    //    projection locale, centree sur lui.
    const principaux = [];
    const parCartouche = cartouches.map(() => []);
    for (const feature of brut.features) {
        const code = config.clef(feature.properties);
        if (config.exclus?.includes(code)) continue;
        const jouable = code in table && (config.retenir?.(code) ?? true);
        const rang = dansUnCartouche.get(code);
        const decoupes = polygones(feature.geometry)
            .map(poly => cadrer(poly, rang === undefined ? config.cadre : null))
            .filter(Boolean);
        if (!decoupes.length) continue;
        const entite = { code, jouable, props: feature.properties };
        if (rang === undefined) {
            entite.groupes = projeterGroupes(decoupes, projeter, options);
            principaux.push(entite);
        } else {
            entite.groupes = projeterGroupes(decoupes, PROJECTIONS.plate, cartouches[rang].centre);
            parCartouche[rang].push(entite);
        }
    }

    // 2. L'etendue du dessin principal, ou celle que l'atlas impose.
    let [bx0, by0, bx1, by1] = boite(principaux.flatMap(e => e.groupes.flat()));
    if (config.vue) [bx0, by0, bx1, by1] = boite([contourDe(config.vue).map(p => projeter(p, options))]);

    // 3. Poser : la colonne des cartouches a gauche, le dessin principal a
    //    droite de ce qu'elle laisse.
    const colonne = cartouches.length ? Math.round(config.largeur * PART_CARTOUCHES) : 0;
    const largeurPrincipale = config.largeur - colonne;
    // Une carte cadree au ras de son sujet colle la Corse au bord de l'ecran.
    // Les atlas du monde n'en demandent pas — leurs bords sont deja de l'ocean.
    const marge = Math.round(largeurPrincipale * (config.marge ?? 0));
    const echelle = (largeurPrincipale - 2 * marge) / (bx1 - bx0);
    const hauteur = Math.round((by1 - by0) * echelle + 2 * marge);
    const vers = ([x, y]) => [(x - bx0) * echelle + colonne + marge, (y - by0) * echelle + marge];
    for (const e of principaux) e.groupes = e.groupes.map(poly => poly.map(a => a.map(vers)));

    const cases = cartouches.map((cartouche, rang) => {
        const haut = hauteur / cartouches.length;
        const marge = Math.min(colonne, haut) * MARGE_CARTOUCHE;
        const boiteCase = [marge, rang * haut + marge, colonne - marge, (rang + 1) * haut - marge];
        const dedans = parCartouche[rang];
        const poseur = poser(dedans.flatMap(e => e.groupes.flat()), boiteCase);
        for (const e of dedans) e.groupes = e.groupes.map(poly => poly.map(a => a.map(poseur)));
        return { nom: cartouche.nom, ids: cartouche.ids, boite: boiteCase.map(Math.round) };
    });

    const retenus = [...principaux, ...parCartouche.flat()];

    // 4. Simplifier, jeter les ilots invisibles.
    const seuilIlot = config.tolerance * config.tolerance * 0.6;
    for (const e of retenus) {
        e.groupes = e.groupes.map(poly => poly.map(anneau => simplifier(anneau, config.tolerance)));
        const gardes = e.groupes.filter(poly => aireAnneau(poly[0]) >= seuilIlot);
        // Une entite entierement faite d'ilots minuscules garde son plus gros :
        // mieux vaut un point pour Nauru qu'un trou dans le Pacifique.
        e.groupes = gardes.length ? gardes
            : [e.groupes.sort((a, b) => aireAnneau(b[0]) - aireAnneau(a[0]))[0]];
    }

    // 5. Le decor : ce qui n'est pas jouable, plus le fond de carte optionnel.
    //    Il est coupe au dessin principal pour ne pas deborder sur la colonne.
    const decor = [];
    for (const e of retenus) if (!e.jouable) decor.push(...e.groupes.flat());
    if (config.decor) {
        const fond = await source(config.decor.source);
        const cadreDecor = [colonne, 0, config.largeur, hauteur];
        for (const feature of fond.features) {
            if (config.decor.exclus?.includes(codePays(feature.properties))) continue;
            for (const poly of polygones(feature.geometry)) {
                const coupe = cadrer(poly, config.decor.cadre);
                if (!coupe) continue;
                for (const anneau of coupe) {
                    const pose = simplifier(anneau.map(p => vers(projeter(p, options))), config.tolerance);
                    const dedans = couper(pose, cadreDecor);
                    if (dedans.length >= 3) decor.push(dedans);
                }
            }
        }
    }

    // 6. Ecrire les entites jouables.
    // Sous ce seuil, une entite occupe moins de deux pixels sur un telephone :
    // Malte, Nauru, Paris. Le fichier garde sa forme exacte, et signale au
    // rendu qu'il faudra une epingle pour la trouver.
    const seuilMinuscule = (config.largeur / (config.seuilMinuscule ?? 200)) ** 2;

    // Nauru fait vingt et un kilometres carres : a l'echelle du monde, son
    // contour se replie sur un seul point et disparait a l'arrondi. L'entite
    // serait alors invisible ET intouchable. On lui pose donc un losange
    // minimal sur son ancre, comme une carte scolaire pose un point sur Monaco.
    const rayonMinimal = config.largeur / 320;
    const losange = ([x, y]) => chemin([[
        [x - rayonMinimal, y], [x, y - rayonMinimal],
        [x + rayonMinimal, y], [x, y + rayonMinimal], [x - rayonMinimal, y]
    ]]);

    const entites = [];
    for (const e of retenus) {
        if (!e.jouable) continue;
        const fiche = table[e.code];
        const principal = e.groupes.reduce((a, b) => aireAnneau(b[0]) > aireAnneau(a[0]) ? b : a);
        const [x0, y0, x1, y1] = boite([principal[0]]);
        const aire = e.groupes.reduce((somme, poly) => somme + aireAnneau(poly[0]), 0);
        entites.push({
            id: e.code,
            nom: fiche.nom,
            article: fiche.article,
            ...(fiche.alias ? { alias: fiche.alias } : {}),
            ...(fiche.capitale || fiche.prefecture ? { capitale: fiche.capitale ?? fiche.prefecture } : {}),
            ...(config.numero ? { numero: e.code } : {}),
            rang: fiche.rang,
            groupe: config.groupe ? config.groupe(fiche, e.props) : fiche.region,
            ancre: ancre(principal).map(Math.round),
            boite: [x0, y0, x1, y1].map(Math.round),
            aire: Math.round(aire),
            ...(aire < seuilMinuscule ? { minuscule: 1 } : {}),
            d: chemin(e.groupes.flat()) || losange(ancre(principal))
        });
    }
    const orphelins = Object.keys(table)
        .filter(code => (config.retenir?.(code) ?? true) && !entites.some(e => e.id === code));

    entites.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));

    // Les confusions classiques — « Angleterre » pour le Royaume-Uni, « Corse »
    // pour l'un de ses deux departements — voyagent avec la carte : sans elles,
    // js/reponse.js repond « raté » la ou il pouvait expliquer. On ne garde que
    // celles qui designent une entite presente ici.
    const presents = new Set(entites.map(e => e.id));
    const pieges = (config.pieges ?? [])
        .map(piege => ({ ...piege, pour: piege.pour.filter(code => presents.has(code)) }))
        .filter(piege => piege.pour.length);

    const atlas = {
        id,
        nom: config.nom,
        projection: config.projection,
        viewBox: `0 0 ${config.largeur} ${hauteur}`,
        couverture: config.couverture,
        ...(config.zoomCadrage ? { zoomCadrage: config.zoomCadrage } : {}),
        mots: config.mots,
        pieges,
        ...(cases.length ? { cartouches: cases } : {}),
        entites,
        decor: chemin(decor)
    };
    await writeFile(new URL(`${id}.json`, DATA), JSON.stringify(atlas));
    const poids = JSON.stringify(atlas).length;
    console.log(`  ${id} : ${entites.length} entités, décor ${decor.length} anneaux, ${(poids / 1024).toFixed(0)} Ko, viewBox ${atlas.viewBox}`);
    if (cases.length) console.log(`  ${cases.length} cartouches : ${cases.map(c => c.nom).join(', ')}`);
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
