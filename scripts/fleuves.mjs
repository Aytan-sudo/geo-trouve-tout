// Les cours d'eau : ceux de France, ceux du monde, et ou chacun se jette.
//
// Meme regle que pour les pays et les departements — la geometrie vient d'une
// source ouverte, le contenu s'ecrit a la main. Une embouchure fausse ne leve
// aucune erreur : le jeu tourne, et il enseigne une betise.
//
//   article    forme les enonces : « Trouve la Loire », « Trouve le Rhone »,
//              « Trouve l'Adour », « Trouve les Gaves ».
//   embouchure est la reponse a « ou se jette-t-il ? ». Pour un fleuve c'est
//              une mer, pour une riviere le cours d'eau qui la recoit. C'est
//              exactement ce qui separe les deux mots, et c'est la lecon.
//   bassin     (France) ou continent (monde) sert d'indice en Decouverte et de
//              vivier de pieges en Ecolier — le role que tient le continent
//              pour les pays. Il ne dit jamais l'embouchure : sur la question
//              de l'embouchure, js/questions.js coupe l'indice.
//   rang       est la notoriete vue d'une ecole francaise, de 1 (a savoir) a
//              4 (pointu) : c'est lui qui decoupe les niveaux.
//   traces     nomme les lignes a rassembler dans la source. Natural Earth
//              decoupe un fleuve en troncons, et change de nom en route : le
//              Rhone s'y appelle « Rhone » puis « Rhne », le Mekong devient
//              « Lancang » en Chine, le Yangtse porte quatre noms sur son
//              parcours. Un fleuve du jeu est donc la reunion de plusieurs.
//   cadre      [lon0, lat0, lon1, lat1], quand un nom ne suffit pas : deux
//              rivieres du monde s'appellent Colorado, l'une dans les Rocheuses
//              et l'autre en Patagonie. Sans ce garde-fou, le jeu dessinerait
//              les deux et demanderait laquelle est la bonne.

// ---------------------------------------------------------------- la France

// Douze fleuves — ils finissent dans la mer — et vingt-deux rivieres, qui
// finissent dans un autre cours d'eau. Les melanger est voulu : un sac de douze
// laisserait la Decouverte tourner en rond, et surtout la difference entre les
// deux mots ne s'apprend qu'en les voyant cote a cote.
export const FLEUVES_FRANCE = {
    // ---------- le bassin de la Seine ----------
    seine: {
        nom: 'Seine', article: 'la', embouchure: 'la Manche',
        bassin: 'Bassin de la Seine', rang: 1, traces: ['Seine']
    },
    marne: {
        nom: 'Marne', article: 'la', embouchure: 'la Seine',
        bassin: 'Bassin de la Seine', rang: 1, traces: ['Marne']
    },
    yonne: {
        nom: 'Yonne', article: "l'", embouchure: 'la Seine',
        bassin: 'Bassin de la Seine', rang: 2, traces: ['Yonne']
    },
    aube: {
        nom: 'Aube', article: "l'", embouchure: 'la Seine',
        bassin: 'Bassin de la Seine', rang: 3, traces: ['Aube']
    },
    eure: {
        nom: 'Eure', article: "l'", embouchure: 'la Seine',
        bassin: 'Bassin de la Seine', rang: 3, traces: ['Eure']
    },

    // ---------- le bassin de la Loire ----------
    // La Sarthe et la Mayenne en font partie : elles forment la Maine, qui
    // rejoint la Loire a Angers apres douze kilometres.
    loire: {
        nom: 'Loire', article: 'la', embouchure: 'l’océan Atlantique',
        bassin: 'Bassin de la Loire', rang: 1, traces: ['Loire']
    },
    allier: {
        nom: 'Allier', article: "l'", embouchure: 'la Loire',
        bassin: 'Bassin de la Loire', rang: 1, traces: ['Allier']
    },
    cher: {
        nom: 'Cher', article: 'le', embouchure: 'la Loire',
        bassin: 'Bassin de la Loire', rang: 1, traces: ['Cher']
    },
    vienne: {
        nom: 'Vienne', article: 'la', embouchure: 'la Loire',
        bassin: 'Bassin de la Loire', rang: 1, traces: ['Vienne']
    },
    creuse: {
        nom: 'Creuse', article: 'la', embouchure: 'la Vienne',
        bassin: 'Bassin de la Loire', rang: 3, traces: ['Creuse']
    },
    sarthe: {
        nom: 'Sarthe', article: 'la', embouchure: 'la Maine',
        bassin: 'Bassin de la Loire', rang: 3, traces: ['Sarthe']
    },
    mayenne: {
        nom: 'Mayenne', article: 'la', embouchure: 'la Maine',
        bassin: 'Bassin de la Loire', rang: 3, traces: ['Mayenne']
    },

    // ---------- le bassin de la Garonne ----------
    // La Dordogne rejoint la Garonne au bec d'Ambes : ensemble elles forment
    // l'estuaire de la Gironde, qui n'est pas un fleuve — c'est le piege le
    // plus frequent, et il est explique plus bas.
    garonne: {
        nom: 'Garonne', article: 'la', embouchure: 'l’océan Atlantique',
        bassin: 'Bassin de la Garonne', rang: 1, traces: ['Garonne']
    },
    dordogne: {
        nom: 'Dordogne', article: 'la', embouchure: 'la Garonne',
        bassin: 'Bassin de la Garonne', rang: 1, traces: ['Dordogne']
    },
    lot: {
        nom: 'Lot', article: 'le', embouchure: 'la Garonne',
        bassin: 'Bassin de la Garonne', rang: 2, traces: ['Lot']
    },
    tarn: {
        nom: 'Tarn', article: 'le', embouchure: 'la Garonne',
        bassin: 'Bassin de la Garonne', rang: 2, traces: ['Tarn']
    },
    ariege: {
        nom: 'Ariège', article: "l'", embouchure: 'la Garonne',
        bassin: 'Bassin de la Garonne', rang: 3, traces: ['Ariège']
    },
    aveyron: {
        nom: 'Aveyron', article: "l'", embouchure: 'le Tarn',
        bassin: 'Bassin de la Garonne', rang: 4, traces: ['Aveyron']
    },

    // ---------- le bassin du Rhône ----------
    rhone: {
        nom: 'Rhône', article: 'le', embouchure: 'la mer Méditerranée',
        bassin: 'Bassin du Rhône', rang: 1,
        // « Rhne » n'est pas une coquille du jeu : c'est le nom tel que la
        // source le porte pour la traversee du Leman, accent perdu en route.
        traces: ['Rhône', 'Rhne']
    },
    saone: {
        nom: 'Saône', article: 'la', embouchure: 'le Rhône',
        bassin: 'Bassin du Rhône', rang: 1, traces: ['Saône', 'Sane']
    },
    doubs: {
        nom: 'Doubs', article: 'le', embouchure: 'la Saône',
        bassin: 'Bassin du Rhône', rang: 2, traces: ['Doubs']
    },
    durance: {
        nom: 'Durance', article: 'la', embouchure: 'le Rhône',
        bassin: 'Bassin du Rhône', rang: 1, traces: ['Durance']
    },

    // ---------- le bassin du Rhin ----------
    rhin: {
        nom: 'Rhin', article: 'le', embouchure: 'la mer du Nord',
        bassin: 'Bassin du Rhin', rang: 1, alias: ['Rhein'],
        traces: ['Rhin', 'Rhine', 'Rhein']
    },
    moselle: {
        nom: 'Moselle', article: 'la', embouchure: 'le Rhin',
        bassin: 'Bassin du Rhin', rang: 2, traces: ['Mosel']
    },
    ill: {
        nom: 'Ill', article: "l'", embouchure: 'le Rhin',
        bassin: 'Bassin du Rhin', rang: 3, traces: ['Ill']
    },
    sarre: {
        nom: 'Sarre', article: 'la', embouchure: 'la Moselle',
        bassin: 'Bassin du Rhin', rang: 4, traces: ['Sarre']
    },

    // ---------- les fleuves du Nord ----------
    // La Meuse et l'Escaut naissent en France et finissent aux Pays-Bas : ce
    // sont bien des fleuves francais, meme si leur embouchure ne l'est pas.
    somme: {
        nom: 'Somme', article: 'la', embouchure: 'la Manche',
        bassin: 'Fleuves du Nord', rang: 1, traces: ['Somme']
    },
    meuse: {
        nom: 'Meuse', article: 'la', embouchure: 'la mer du Nord',
        bassin: 'Fleuves du Nord', rang: 2, alias: ['Maas'], traces: ['Maas']
    },
    escaut: {
        nom: 'Escaut', article: "l'", embouchure: 'la mer du Nord',
        bassin: 'Fleuves du Nord', rang: 3, alias: ['Schelde'], traces: ['Schelde']
    },

    // ---------- les fleuves de l'Ouest et du Midi ----------
    charente: {
        nom: 'Charente', article: 'la', embouchure: 'l’océan Atlantique',
        bassin: 'Fleuves de l’Ouest et du Midi', rang: 2, traces: ['Charente']
    },
    adour: {
        nom: 'Adour', article: "l'", embouchure: 'l’océan Atlantique',
        bassin: 'Fleuves de l’Ouest et du Midi', rang: 2, traces: ['Adour']
    },
    vilaine: {
        nom: 'Vilaine', article: 'la', embouchure: 'l’océan Atlantique',
        bassin: 'Fleuves de l’Ouest et du Midi', rang: 3, traces: ['Vilaine']
    },
    aude: {
        nom: 'Aude', article: "l'", embouchure: 'la mer Méditerranée',
        bassin: 'Fleuves de l’Ouest et du Midi', rang: 3, traces: ['Aude']
    },
    gavedepau: {
        nom: 'Gave de Pau', article: 'le', embouchure: 'l’Adour',
        bassin: 'Fleuves de l’Ouest et du Midi', rang: 4, traces: ['Gave de Pau']
    }
};

// ----------------------------------------------------------------- le monde

// Les noms sont ceux qu'une ecole francaise emploie ; les alias acceptent ceux
// qu'on lit sur une carte etrangere ou dans un manuel plus ancien.
export const FLEUVES_MONDE = {
    // ---------- Europe ----------
    'm-seine': {
        nom: 'Seine', article: 'la', embouchure: 'la Manche',
        continent: 'Europe', rang: 1, traces: ['Seine']
    },
    'm-loire': {
        nom: 'Loire', article: 'la', embouchure: 'l’océan Atlantique',
        continent: 'Europe', rang: 1, traces: ['Loire']
    },
    'm-rhone': {
        nom: 'Rhône', article: 'le', embouchure: 'la mer Méditerranée',
        continent: 'Europe', rang: 1, traces: ['Rhône', 'Rhne']
    },
    'm-rhin': {
        nom: 'Rhin', article: 'le', embouchure: 'la mer du Nord',
        continent: 'Europe', rang: 1, alias: ['Rhein'], traces: ['Rhin', 'Rhine', 'Rhein']
    },
    'm-danube': {
        nom: 'Danube', article: 'le', embouchure: 'la mer Noire',
        continent: 'Europe', rang: 1, traces: ['Danube', 'Donau']
    },
    'm-volga': {
        nom: 'Volga', article: 'la', embouchure: 'la mer Caspienne',
        continent: 'Europe', rang: 2, traces: ['Volga']
    },
    'm-tamise': {
        nom: 'Tamise', article: 'la', embouchure: 'la mer du Nord',
        continent: 'Europe', rang: 2, alias: ['Thames'], traces: ['Thames']
    },
    'm-po': {
        nom: 'Pô', article: 'le', embouchure: 'la mer Adriatique',
        continent: 'Europe', rang: 2, traces: ['Po']
    },
    'm-ebre': {
        nom: 'Èbre', article: "l'", embouchure: 'la mer Méditerranée',
        continent: 'Europe', rang: 3, alias: ['Ebro'], traces: ['Ebro']
    },
    'm-tage': {
        nom: 'Tage', article: 'le', embouchure: 'l’océan Atlantique',
        continent: 'Europe', rang: 3, alias: ['Tejo', 'Tajo'], traces: ['Tejo', 'Tajo']
    },
    'm-douro': {
        nom: 'Douro', article: 'le', embouchure: 'l’océan Atlantique',
        continent: 'Europe', rang: 3, alias: ['Duero'], traces: ['Duero']
    },
    'm-elbe': {
        nom: 'Elbe', article: "l'", embouchure: 'la mer du Nord',
        continent: 'Europe', rang: 3, traces: ['Elbe']
    },
    'm-vistule': {
        nom: 'Vistule', article: 'la', embouchure: 'la mer Baltique',
        continent: 'Europe', rang: 3, alias: ['Wisła', 'Vistula'], traces: ['Vistula']
    },
    'm-dniepr': {
        nom: 'Dniepr', article: 'le', embouchure: 'la mer Noire',
        continent: 'Europe', rang: 4, alias: ['Dnipro', 'Dnieper'], traces: ['Dnipro', 'Dnepre']
    },
    'm-oder': {
        nom: 'Oder', article: "l'", embouchure: 'la mer Baltique',
        continent: 'Europe', rang: 4, alias: ['Odra'], traces: ['Oder']
    },
    'm-don': {
        nom: 'Don', article: 'le', embouchure: 'la mer d’Azov',
        continent: 'Europe', rang: 4, traces: ['Don']
    },

    // ---------- Asie ----------
    'm-yangtse': {
        nom: 'Yangtsé', article: 'le', embouchure: 'la mer de Chine orientale',
        continent: 'Asie', rang: 1, alias: ['Yang-Tsé-Kiang', 'Chang Jiang', 'fleuve Bleu'],
        traces: ['Yangtze', 'Chang Jiang', 'Jinsha', 'Tongtian', 'Tuotuo']
    },
    'm-gange': {
        nom: 'Gange', article: 'le', embouchure: 'le golfe du Bengale',
        continent: 'Asie', rang: 1, alias: ['Ganges'], traces: ['Ganges']
    },
    'm-mekong': {
        nom: 'Mékong', article: 'le', embouchure: 'la mer de Chine méridionale',
        continent: 'Asie', rang: 2, traces: ['Mekong', 'Lancang']
    },
    'm-indus': {
        nom: 'Indus', article: "l'", embouchure: 'la mer d’Arabie',
        continent: 'Asie', rang: 2, traces: ['Indus']
    },
    'm-huanghe': {
        nom: 'Huang He', article: 'le', embouchure: 'la mer Jaune',
        continent: 'Asie', rang: 2, alias: ['fleuve Jaune', 'Houang-Ho', 'Huang'],
        traces: ['Huang']
    },
    'm-euphrate': {
        nom: 'Euphrate', article: "l'", embouchure: 'le golfe Persique',
        continent: 'Asie', rang: 2, alias: ['Euphrates', 'Al Furat'],
        traces: ['Euphrates', 'Al Furat', 'Firat']
    },
    'm-tigre': {
        nom: 'Tigre', article: 'le', embouchure: 'le golfe Persique',
        continent: 'Asie', rang: 2, alias: ['Tigris'], traces: ['Tigris', 'Dicle']
    },
    'm-ob': {
        nom: 'Ob', article: "l'", embouchure: 'l’océan Arctique',
        continent: 'Asie', rang: 3, traces: ['Ob']
    },
    'm-lena': {
        nom: 'Léna', article: 'la', embouchure: 'l’océan Arctique',
        continent: 'Asie', rang: 3, alias: ['Lena'], traces: ['Lena']
    },
    'm-ienissei': {
        nom: 'Ienisseï', article: "l'", embouchure: 'l’océan Arctique',
        continent: 'Asie', rang: 3, alias: ['Yenisseï', 'Yenisey'],
        traces: ['Yenisey', 'Verkhniy Yenisey']
    },
    'm-amour': {
        nom: 'Amour', article: "l'", embouchure: 'l’océan Pacifique',
        continent: 'Asie', rang: 3, alias: ['Amur'], traces: ['Amur', 'Heilong Jiang']
    },
    'm-brahmapoutre': {
        nom: 'Brahmapoutre', article: 'le', embouchure: 'le golfe du Bengale',
        continent: 'Asie', rang: 3, alias: ['Brahmaputra'],
        traces: ['Brahmaputra', 'Yarlung', 'Dihang']
    },
    'm-irrawaddy': {
        nom: 'Irrawaddy', article: "l'", embouchure: 'la mer d’Andaman',
        continent: 'Asie', rang: 4, alias: ['Ayeyarwady'], traces: ['Ayeyarwady']
    },
    'm-amoudaria': {
        nom: 'Amou-Daria', article: "l'", embouchure: 'la mer d’Aral',
        continent: 'Asie', rang: 4, alias: ['Amu Darya'], traces: ['Amu  Darya']
    },
    'm-kolyma': {
        nom: 'Kolyma', article: 'la', embouchure: 'l’océan Arctique',
        continent: 'Asie', rang: 4, traces: ['Kolyma']
    },

    // ---------- Afrique ----------
    'm-nil': {
        nom: 'Nil', article: 'le', embouchure: 'la mer Méditerranée',
        continent: 'Afrique', rang: 1, alias: ['Nile'],
        // Le Nil change quatre fois de nom entre le lac Victoria et Khartoum.
        traces: ['Nile', 'El Bahr el Abyad', 'Bahr el Jebel', 'Albert Nile', 'Victoria Nile']
    },
    'm-congo': {
        nom: 'Congo', article: 'le', embouchure: 'l’océan Atlantique',
        continent: 'Afrique', rang: 1, traces: ['Congo', 'Lualaba']
    },
    'm-niger': {
        nom: 'Niger', article: 'le', embouchure: 'le golfe de Guinée',
        continent: 'Afrique', rang: 1, traces: ['Niger']
    },
    'm-zambeze': {
        nom: 'Zambèze', article: 'le', embouchure: 'l’océan Indien',
        continent: 'Afrique', rang: 2, alias: ['Zambezi'], traces: ['Zambezi']
    },
    'm-senegal': {
        nom: 'Sénégal', article: 'le', embouchure: 'l’océan Atlantique',
        continent: 'Afrique', rang: 3, traces: ['Sénégal']
    },
    'm-orange': {
        nom: 'Orange', article: "l'", embouchure: 'l’océan Atlantique',
        continent: 'Afrique', rang: 3, traces: ['Orange']
    },
    'm-limpopo': {
        nom: 'Limpopo', article: 'le', embouchure: 'l’océan Indien',
        continent: 'Afrique', rang: 4, traces: ['Limpopo']
    },
    'm-volta': {
        nom: 'Volta', article: 'la', embouchure: 'le golfe de Guinée',
        continent: 'Afrique', rang: 4, traces: ['Volta']
    },

    // ---------- Amérique du Nord ----------
    'm-mississippi': {
        nom: 'Mississippi', article: 'le', embouchure: 'le golfe du Mexique',
        continent: 'Amérique du Nord', rang: 1, traces: ['Mississippi']
    },
    'm-missouri': {
        nom: 'Missouri', article: 'le', embouchure: 'le Mississippi',
        continent: 'Amérique du Nord', rang: 2, traces: ['Missouri']
    },
    'm-colorado': {
        nom: 'Colorado', article: 'le', embouchure: 'le golfe de Californie',
        continent: 'Amérique du Nord', rang: 2,
        // Un autre Colorado coule en Patagonie : le cadre garde celui-ci.
        traces: ['Colorado'], cadre: [-120, 28, -100, 45]
    },
    'm-mackenzie': {
        nom: 'Mackenzie', article: 'le', embouchure: 'l’océan Arctique',
        continent: 'Amérique du Nord', rang: 3, traces: ['Mackenzie']
    },
    'm-yukon': {
        nom: 'Yukon', article: 'le', embouchure: 'la mer de Béring',
        continent: 'Amérique du Nord', rang: 3, traces: ['Yukon']
    },
    'm-riogrande': {
        nom: 'Rio Grande', article: 'le', embouchure: 'le golfe du Mexique',
        continent: 'Amérique du Nord', rang: 3, traces: ['Rio Grande']
    },
    'm-ohio': {
        nom: 'Ohio', article: "l'", embouchure: 'le Mississippi',
        continent: 'Amérique du Nord', rang: 4, traces: ['Ohio']
    },
    'm-columbia': {
        nom: 'Columbia', article: 'le', embouchure: 'l’océan Pacifique',
        continent: 'Amérique du Nord', rang: 4, traces: ['Columbia']
    },

    // ---------- Amérique du Sud ----------
    'm-amazone': {
        nom: 'Amazone', article: "l'", embouchure: 'l’océan Atlantique',
        continent: 'Amérique du Sud', rang: 1, alias: ['Amazonas'],
        traces: ['Amazonas', 'Marañón']
    },
    'm-parana': {
        nom: 'Paraná', article: 'le', embouchure: 'l’océan Atlantique',
        continent: 'Amérique du Sud', rang: 2, traces: ['Paraná']
    },
    'm-orenoque': {
        nom: 'Orénoque', article: "l'", embouchure: 'l’océan Atlantique',
        continent: 'Amérique du Sud', rang: 2, alias: ['Orinoco'], traces: ['Orinoco']
    },
    'm-saofrancisco': {
        nom: 'São Francisco', article: 'le', embouchure: 'l’océan Atlantique',
        continent: 'Amérique du Sud', rang: 4, traces: ['São  Francisco']
    },
    'm-tocantins': {
        nom: 'Tocantins', article: 'le', embouchure: 'l’océan Atlantique',
        continent: 'Amérique du Sud', rang: 4, traces: ['Tocantins']
    },

    // ---------- Océanie ----------
    // L'embouchure du Murray donne lieu a deux reponses selon les pays :
    // « ocean Austral » pour les Australiens, « ocean Indien » pour l'Office
    // hydrographique international — et pour les manuels francais, qu'on suit.
    'm-murray': {
        nom: 'Murray', article: 'le', embouchure: 'l’océan Indien',
        continent: 'Océanie', rang: 3, traces: ['Murray']
    },
    'm-darling': {
        nom: 'Darling', article: 'le', embouchure: 'le Murray',
        continent: 'Océanie', rang: 4, traces: ['Darling']
    }
};

// Les confusions qui valent une explication plutot qu'un « raté ». Les autres —
// confondre la Meuse et la Moselle, le Mississippi et le Missouri — sont
// reperees toutes seules : les deux entites sont sur la carte, et js/reponse.js
// nomme celle qu'on a designee.
export const PIEGES_FLEUVES = [
    {
        saisie: 'gironde', pour: ['garonne', 'dordogne'],
        message: 'La Gironde est l’estuaire où la Garonne et la Dordogne se rejoignent — pas un fleuve.'
    },
    {
        saisie: 'loir', pour: ['loire'],
        message: 'Le Loir, sans « e », est un autre cours d’eau : un affluent de la Sarthe.'
    },
    {
        saisie: 'maine', pour: ['sarthe', 'mayenne'],
        message: 'La Maine, c’est ce que la Sarthe et la Mayenne forment ensemble sur douze kilomètres.'
    },
    {
        saisie: 'amazonie', pour: ['m-amazone'],
        message: 'L’Amazonie est la forêt ; le fleuve qui la traverse est l’Amazone.'
    },
    {
        saisie: 'nil bleu', pour: ['m-nil'],
        message: 'Le Nil Bleu est l’une des deux branches : elle rejoint le Nil Blanc à Khartoum.'
    },
    {
        saisie: 'nil blanc', pour: ['m-nil'],
        message: 'Le Nil Blanc est l’une des deux branches : elle rejoint le Nil Bleu à Khartoum.'
    },
    {
        saisie: 'mer morte', pour: ['m-tigre', 'm-euphrate'],
        message: 'La mer Morte est un lac salé, et aucun de ces deux fleuves ne s’y jette.'
    }
];
