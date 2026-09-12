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
import { FLEUVES_FRANCE, FLEUVES_MONDE, PIEGES_FLEUVES } from './fleuves.mjs';
import { PROJECTIONS } from './projection.mjs';
import {
    simplifier, aireAnneau, longueur, boite, ancre, ancreLigne, chemin, trait, couper, couperLigne
} from './geometrie.mjs';

const CACHE = new URL('cache/', import.meta.url);
const DATA = new URL('../data/', import.meta.url);

const SOURCES = {
    pays50: 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson',
    // france-geojson (Gregoire David), Licence Ouverte. Les fichiers « avec
    // outre-mer » sont les seuls a porter les cinq DROM.
    'departements-om': 'https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements-avec-outre-mer.geojson',
    'regions-om': 'https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/regions-avec-outre-mer.geojson',
    // Natural Earth, domaine public. Le 50m suffit au planisphere ; la France
    // demande le 10m, et meme lui ignore la moitie de ses rivieres — le
    // supplement europeen porte l'Adour, la Charente, la Somme, la Vilaine.
    fleuves50: 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_rivers_lake_centerlines.geojson',
    fleuves10: 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_rivers_lake_centerlines.geojson',
    'fleuves-europe': 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_rivers_europe.geojson'
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

// Un cours d'eau se dit « il » : le mot qui le designe est masculin, et les
// deux cartes de fleuves partagent donc tout sauf leur groupe — le bassin en
// France, le continent sur le planisphere.
const MOTS_FLEUVES = {
    entite: 'cours d’eau', entites: 'cours d’eau', unEntite: 'un cours d’eau',
    leEntite: 'le cours d’eau', ceEntite: 'ce cours d’eau', quelEst: 'Quel est',
    leLa: 'le', ilEntite: 'il',
    embouchure: 'embouchure', sonEmbouchure: 'son embouchure',
    acquis: 'acquis', jamaisVus: 'jamais vus'
};
const MOTS_FLEUVES_FRANCE = {
    ...MOTS_FLEUVES,
    groupe: 'bassin', leGroupe: 'le bassin', duGroupe: 'du même bassin'
};
const MOTS_FLEUVES_MONDE = {
    ...MOTS_FLEUVES,
    groupe: 'continent', leGroupe: 'le continent', duGroupe: 'du même continent'
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
    },
    // Les deux cartes de traces. Rien n'y est nouveau sauf `lignes` : le reste
    // de ce fichier ne sait pas qu'il fabrique un fleuve plutot qu'un pays.
    'france-fleuves': {
        nom: 'Les fleuves de France',
        sources: ['fleuves10', 'fleuves-europe'],
        lignes: true,
        contenu: FLEUVES_FRANCE,
        pieges: PIEGES_FLEUVES,
        groupe: fiche => fiche.bassin,
        mots: MOTS_FLEUVES_FRANCE,
        projection: 'lambert',
        options: { lat1: 44, lat2: 49, lat0: 46.5, lon0: 3 },
        largeur: 3000,
        tolerance: 0.8,
        marge: 0.02,
        // Le cadre suit la vue de pres, et c'est voulu. Le Rhin continue
        // jusqu'a Rotterdam, la Meuse jusqu'a la mer du Nord : les laisser
        // courir hors de l'ecran gonflerait leur boite, et le jeu cadrerait la
        // question du Rhin sur un point situe en Allemagne. On les coupe donc
        // au bord — la coupe se voit a peine, et ce qui reste est ce qui compte.
        cadre: [-5.7, 41.0, 8.7, 51.4],
        vue: [-5.4, 41.2, 8.4, 51.2],
        decor: { source: 'pays50', cadre: [-10, 39, 14, 54] },
        // Le trace d'un fleuve est fin : on peut s'en approcher, mais sa place
        // dans le pays reste ce qui le designe.
        couverture: 1.1,
        zoomCadrage: 4
    },
    'monde-fleuves': {
        nom: 'Les fleuves du monde',
        sources: ['fleuves50'],
        lignes: true,
        contenu: FLEUVES_MONDE,
        pieges: PIEGES_FLEUVES,
        groupe: fiche => fiche.continent,
        mots: MOTS_FLEUVES_MONDE,
        projection: 'equal-earth',
        largeur: 4000,
        // Le meme grain que le planisphere des pays : ici tous les pays sont du
        // decor, et un grain plus fin doublerait le fichier pour un fond de
        // carte que personne ne regarde de pres.
        tolerance: 4,
        // Le cadre du planisphere, pas celui des fleuves : sans lui la carte se
        // refermerait sur le dernier trace, et les continents deborderaient.
        vue: [-180, -56, 180, 83],
        decor: { source: 'pays50', exclus: ['ATA'] },
        couverture: 1.55,
        zoomCadrage: 8
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

// Un atlas lit une source ou plusieurs : les fleuves de France demandent le
// fond mondial et le supplement europeen, et rien ne distingue leurs entites
// une fois lues.
async function sourcesDe(config) {
    const noms = config.sources ?? [config.source];
    const lots = await Promise.all(noms.map(source));
    return lots.flatMap(lot => lot.features);
}

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

// Ce qui separe une carte de traces d'une carte de surfaces — et rien d'autre.
// Le reste du fichier projette, pose, simplifie et ecrit sans savoir laquelle
// des deux il tient en main.
//
// Une partie voyage partout sous la meme forme : un tableau de suites de
// points. Un polygone est la liste de ses anneaux, une ligne une liste d'un
// seul element. C'est ce qui permet a `projeterGroupes` et a `poser` de servir
// aux deux sans une ligne de plus.
const SURFACES = {
    // Un polygone coupe reste un polygone : zero ou une partie en sortie.
    parties: geometrie => (geometrie.type === 'Polygon' ? [geometrie.coordinates] : geometrie.coordinates),
    cadrer: (polygone, cadre) => {
        if (!cadre) return [polygone];
        const coupes = polygone.map(anneau => couper(anneau, cadre)).filter(a => a.length >= 3);
        return coupes.length ? [coupes] : [];
    },
    mesure: partie => aireAnneau(partie[0]),
    ancre: partie => ancre(partie),
    encoder: chemin,
    // L'etendue du plus gros morceau : celle de toutes les iles enverrait la
    // France cadrer la Polynesie.
    etendue: (parties, principale) => boite([principale[0]]),
    seuilPetit: config => (config.largeur / (config.seuilMinuscule ?? 200)) ** 2,
    seuilIlot: config => config.tolerance * config.tolerance * 0.6,
    champTaille: 'aire'
};
const TRACES = {
    parties: geometrie => (geometrie.type === 'LineString'
        ? [[geometrie.coordinates]]
        : geometrie.coordinates.map(ligne => [ligne])),
    // Une ligne coupee se rend en plusieurs : un fleuve qui sort du cadre et y
    // revient donne deux traces, et c'est ce qu'il faut dessiner.
    cadrer: ([ligne], cadre) => couperLigne(ligne, cadre).map(l => [l]),
    mesure: partie => longueur(partie[0]),
    ancre: partie => ancreLigne(partie),
    encoder: trait,
    // Tous les troncons, eux : le plus long de la Loire ne couvre que sa
    // moitie basse, et cadrer dessus perdrait la source.
    etendue: parties => boite(parties.flat()),
    seuilPetit: config => config.largeur / (config.seuilMinuscule ?? 30),
    // Le seuil d'un trace est bien plus bas que celui d'un ilot, et il le faut.
    // Une ile minuscule qu'on jette ne manque a personne ; un troncon court,
    // lui, peut etre le morceau qui relie deux moities d'un fleuve. La Volga
    // arrive en seize troncons dont dix font moins de cent kilometres, et les
    // jeter la coupait en deux au milieu de la Russie. On ne jette donc que ce
    // qui est plus court que le grain de la simplification — des echardes
    // laissees par la coupe au cadre, invisibles par construction.
    seuilIlot: config => config.tolerance,
    champTaille: 'longueur'
};

// Tout point d'une partie tombe-t-il dans ce cadre en degres ? Sert aux fleuves
// homonymes : deux rivieres du monde s'appellent Colorado.
const touche = (partie, [l0, p0, l1, p1]) =>
    partie.flat().some(([lon, lat]) => lon >= l0 && lon <= l1 && lat >= p0 && lat <= p1);

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

// Un trace se reconnait a son nom, et un fleuve en porte plusieurs le long de
// son cours. On ne lit que `name` et `name_fr` : la source range aussi des noms
// dans une vingtaine de champs de langue, et c'est par la qu'arrivent les
// fausses reconnaissances — l'Arc y porte « Isere » en nom alternatif.
function clefParTrace(table) {
    const index = new Map();
    for (const [id, fiche] of Object.entries(table)) {
        for (const nom of fiche.traces ?? []) index.set(nom, id);
    }
    return props => index.get(props.name_fr) ?? index.get(props.name) ?? null;
}

async function fabriquer(id) {
    const config = ATLAS[id];
    const table = config.contenu;
    const geo = config.lignes ? TRACES : SURFACES;
    const features = await sourcesDe(config);
    const projeter = PROJECTIONS[config.projection];
    const options = config.options ?? {};
    const cartouches = config.cartouches ?? [];
    const dansUnCartouche = new Map();
    for (const [rang, cartouche] of cartouches.entries()) {
        for (const code of cartouche.ids) dansUnCartouche.set(code, rang);
    }
    const clef = config.lignes ? clefParTrace(table) : config.clef;

    // 1. Lire les sources. Chaque entite part dans son propre repere : le
    //    dessin principal dans la projection de l'atlas, chaque cartouche dans
    //    une projection locale, centree sur lui.
    //
    //    Une entite peut arriver en plusieurs features — un fleuve change de
    //    nom en route, et la source le coupe a chaque frontiere. On les
    //    rassemble ici : au-dela, la Loire est une entite comme une autre.
    const principaux = new Map();
    const parCartouche = cartouches.map(() => new Map());
    for (const feature of features) {
        const code = clef(feature.properties);
        if (code === null || code === undefined) continue;
        if (config.exclus?.includes(code)) continue;
        const jouable = code in table && (config.retenir?.(code) ?? true);
        // Sur une carte de traces, ce qui n'est pas jouable n'est pas non plus
        // du decor : une ligne versee dans le decor y serait remplie comme un
        // pays. Le fond de carte vient de `decor`, et de lui seul.
        if (!jouable && config.lignes) continue;
        const rang = dansUnCartouche.get(code);
        const fiche = table[code];
        const decoupes = geo.parties(feature.geometry)
            .filter(partie => !fiche?.cadre || touche(partie, fiche.cadre))
            .flatMap(partie => geo.cadrer(partie, rang === undefined ? config.cadre : null));
        if (!decoupes.length) continue;
        const ou = rang === undefined ? principaux : parCartouche[rang];
        const groupes = rang === undefined
            ? projeterGroupes(decoupes, projeter, options)
            : projeterGroupes(decoupes, PROJECTIONS.plate, cartouches[rang].centre);
        const entite = ou.get(code) ?? { code, jouable, props: feature.properties, groupes: [] };
        entite.groupes.push(...groupes);
        ou.set(code, entite);
    }

    // 2. L'etendue du dessin principal, ou celle que l'atlas impose.
    let [bx0, by0, bx1, by1] = boite([...principaux.values()].flatMap(e => e.groupes.flat()));
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
    for (const e of principaux.values()) e.groupes = e.groupes.map(p => p.map(a => a.map(vers)));

    const cases = cartouches.map((cartouche, rang) => {
        const haut = hauteur / cartouches.length;
        const marge = Math.min(colonne, haut) * MARGE_CARTOUCHE;
        const boiteCase = [marge, rang * haut + marge, colonne - marge, (rang + 1) * haut - marge];
        const dedans = [...parCartouche[rang].values()];
        const poseur = poser(dedans.flatMap(e => e.groupes.flat()), boiteCase);
        for (const e of dedans) e.groupes = e.groupes.map(poly => poly.map(a => a.map(poseur)));
        return { nom: cartouche.nom, ids: cartouche.ids, boite: boiteCase.map(Math.round) };
    });

    const retenus = [...principaux.values(), ...parCartouche.flatMap(c => [...c.values()])];

    // 4. Simplifier, jeter les morceaux invisibles — les ilots d'un pays, les
    //    bouts de trace qu'une coupe a laisses au ras du cadre.
    const seuilIlot = geo.seuilIlot(config);
    for (const e of retenus) {
        e.groupes = e.groupes.map(poly => poly.map(suite => simplifier(suite, config.tolerance)));
        const gardes = e.groupes.filter(poly => geo.mesure(poly) >= seuilIlot);
        // Une entite entierement faite de morceaux minuscules garde son plus
        // gros : mieux vaut un point pour Nauru qu'un trou dans le Pacifique.
        e.groupes = gardes.length ? gardes
            : [e.groupes.sort((a, b) => geo.mesure(b) - geo.mesure(a))[0]];
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
            // Le decor est toujours une surface, meme sur une carte de traces :
            // c'est le fond de pays sur lequel les fleuves se lisent.
            for (const poly of SURFACES.parties(feature.geometry)) {
                for (const anneau of SURFACES.cadrer(poly, config.decor.cadre).flat()) {
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
    const seuilMinuscule = geo.seuilPetit(config);

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
        const principal = e.groupes.reduce((a, b) => (geo.mesure(b) > geo.mesure(a) ? b : a));
        const [x0, y0, x1, y1] = geo.etendue(e.groupes, principal);
        const taille = e.groupes.reduce((somme, poly) => somme + geo.mesure(poly), 0);
        entites.push({
            id: e.code,
            nom: fiche.nom,
            article: fiche.article,
            ...(fiche.alias ? { alias: fiche.alias } : {}),
            ...(fiche.capitale || fiche.prefecture ? { capitale: fiche.capitale ?? fiche.prefecture } : {}),
            ...(fiche.embouchure ? { embouchure: fiche.embouchure } : {}),
            ...(config.numero ? { numero: e.code } : {}),
            // Ce qui se dessine au trait le dit lui-meme : css/carte.css coupe
            // le remplissage sur cette classe, et js/carte.js pose par-dessus
            // la bande transparente qui rend la ligne touchable au doigt.
            ...(config.lignes ? { trait: 1 } : {}),
            rang: fiche.rang,
            groupe: config.groupe ? config.groupe(fiche, e.props) : fiche.region,
            ancre: geo.ancre(principal).map(Math.round),
            boite: [x0, y0, x1, y1].map(Math.round),
            [geo.champTaille]: Math.round(taille),
            ...(taille < seuilMinuscule ? { minuscule: 1 } : {}),
            d: geo.encoder(e.groupes.flat()) || losange(geo.ancre(principal))
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
