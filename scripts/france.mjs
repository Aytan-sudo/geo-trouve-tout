// Le contenu francais : departements, regions, prefectures, articles, notoriete.
//
// Meme regle que pour les pays (scripts/pays.mjs) : la geometrie vient d'une
// source ouverte, le contenu s'ecrit a la main. Une prefecture fausse ne leve
// aucune erreur — le jeu tourne, et il enseigne une betise. Les valeurs
// delicates portent donc leur commentaire.
//
//   article    forme les enonces : « Trouve le Cantal », « Trouve la Corrèze »,
//              « Trouve l'Ain », « Trouve les Vosges », « Trouve Paris ».
//   prefecture est le chef-lieu du departement. C'est la question « capitale »
//              du mode France, et le mot change avec la carte.
//   rang       est la notoriete vue d'une ecole francaise, de 1 (a savoir) a
//              4 (pointu) : c'est lui qui decoupe les niveaux.
//   region     sert d'indice en Decouverte et de vivier de pieges en Ecolier,
//              exactement comme le continent pour les pays.

export const DEPARTEMENTS = {
    // ---------- Auvergne-Rhône-Alpes ----------
    '01': { nom: 'Ain', article: "l'", prefecture: 'Bourg-en-Bresse', region: 'Auvergne-Rhône-Alpes', rang: 2 },
    '03': { nom: 'Allier', article: "l'", prefecture: 'Moulins', region: 'Auvergne-Rhône-Alpes', rang: 2 },
    '07': { nom: 'Ardèche', article: "l'", prefecture: 'Privas', region: 'Auvergne-Rhône-Alpes', rang: 3 },
    '15': { nom: 'Cantal', article: 'le', prefecture: 'Aurillac', region: 'Auvergne-Rhône-Alpes', rang: 3 },
    '26': { nom: 'Drôme', article: 'la', prefecture: 'Valence', region: 'Auvergne-Rhône-Alpes', rang: 2 },
    '38': { nom: 'Isère', article: "l'", prefecture: 'Grenoble', region: 'Auvergne-Rhône-Alpes', rang: 1 },
    '42': { nom: 'Loire', article: 'la', prefecture: 'Saint-Étienne', region: 'Auvergne-Rhône-Alpes', rang: 2 },
    '43': { nom: 'Haute-Loire', article: 'la', prefecture: 'Le Puy-en-Velay', region: 'Auvergne-Rhône-Alpes', rang: 3 },
    '63': { nom: 'Puy-de-Dôme', article: 'le', prefecture: 'Clermont-Ferrand', region: 'Auvergne-Rhône-Alpes', rang: 1 },
    '69': { nom: 'Rhône', article: 'le', prefecture: 'Lyon', region: 'Auvergne-Rhône-Alpes', rang: 1 },
    '73': { nom: 'Savoie', article: 'la', prefecture: 'Chambéry', region: 'Auvergne-Rhône-Alpes', rang: 1 },
    '74': { nom: 'Haute-Savoie', article: 'la', prefecture: 'Annecy', region: 'Auvergne-Rhône-Alpes', rang: 1 },

    // ---------- Bourgogne-Franche-Comté ----------
    '21': { nom: 'Côte-d’Or', article: 'la', prefecture: 'Dijon', region: 'Bourgogne-Franche-Comté', rang: 2 },
    '25': { nom: 'Doubs', article: 'le', prefecture: 'Besançon', region: 'Bourgogne-Franche-Comté', rang: 2 },
    '39': { nom: 'Jura', article: 'le', prefecture: 'Lons-le-Saunier', region: 'Bourgogne-Franche-Comté', rang: 3 },
    '58': { nom: 'Nièvre', article: 'la', prefecture: 'Nevers', region: 'Bourgogne-Franche-Comté', rang: 3 },
    '70': { nom: 'Haute-Saône', article: 'la', prefecture: 'Vesoul', region: 'Bourgogne-Franche-Comté', rang: 4 },
    '71': { nom: 'Saône-et-Loire', article: 'la', prefecture: 'Mâcon', region: 'Bourgogne-Franche-Comté', rang: 2 },
    '89': { nom: 'Yonne', article: "l'", prefecture: 'Auxerre', region: 'Bourgogne-Franche-Comté', rang: 3 },
    '90': { nom: 'Territoire de Belfort', article: 'le', prefecture: 'Belfort', region: 'Bourgogne-Franche-Comté', rang: 3, alias: ['Belfort'] },

    // ---------- Bretagne ----------
    '22': { nom: 'Côtes-d’Armor', article: 'les', prefecture: 'Saint-Brieuc', region: 'Bretagne', rang: 2 },
    '29': { nom: 'Finistère', article: 'le', prefecture: 'Quimper', region: 'Bretagne', rang: 1 },
    '35': { nom: 'Ille-et-Vilaine', article: "l'", prefecture: 'Rennes', region: 'Bretagne', rang: 1 },
    '56': { nom: 'Morbihan', article: 'le', prefecture: 'Vannes', region: 'Bretagne', rang: 1 },

    // ---------- Centre-Val de Loire ----------
    '18': { nom: 'Cher', article: 'le', prefecture: 'Bourges', region: 'Centre-Val de Loire', rang: 3 },
    '28': { nom: 'Eure-et-Loir', article: "l'", prefecture: 'Chartres', region: 'Centre-Val de Loire', rang: 2 },
    '36': { nom: 'Indre', article: "l'", prefecture: 'Châteauroux', region: 'Centre-Val de Loire', rang: 3 },
    '37': { nom: 'Indre-et-Loire', article: "l'", prefecture: 'Tours', region: 'Centre-Val de Loire', rang: 2 },
    '41': { nom: 'Loir-et-Cher', article: 'le', prefecture: 'Blois', region: 'Centre-Val de Loire', rang: 3 },
    '45': { nom: 'Loiret', article: 'le', prefecture: 'Orléans', region: 'Centre-Val de Loire', rang: 2 },

    // ---------- Corse ----------
    '2A': { nom: 'Corse-du-Sud', article: 'la', prefecture: 'Ajaccio', region: 'Corse', rang: 1 },
    '2B': { nom: 'Haute-Corse', article: 'la', prefecture: 'Bastia', region: 'Corse', rang: 1 },

    // ---------- Grand Est ----------
    '08': { nom: 'Ardennes', article: 'les', prefecture: 'Charleville-Mézières', region: 'Grand Est', rang: 3 },
    '10': { nom: 'Aube', article: "l'", prefecture: 'Troyes', region: 'Grand Est', rang: 3 },
    '51': { nom: 'Marne', article: 'la', prefecture: 'Châlons-en-Champagne', region: 'Grand Est', rang: 2 },
    '52': { nom: 'Haute-Marne', article: 'la', prefecture: 'Chaumont', region: 'Grand Est', rang: 4 },
    '54': { nom: 'Meurthe-et-Moselle', article: 'la', prefecture: 'Nancy', region: 'Grand Est', rang: 2 },
    '55': { nom: 'Meuse', article: 'la', prefecture: 'Bar-le-Duc', region: 'Grand Est', rang: 4 },
    '57': { nom: 'Moselle', article: 'la', prefecture: 'Metz', region: 'Grand Est', rang: 2 },
    '67': { nom: 'Bas-Rhin', article: 'le', prefecture: 'Strasbourg', region: 'Grand Est', rang: 1 },
    '68': { nom: 'Haut-Rhin', article: 'le', prefecture: 'Colmar', region: 'Grand Est', rang: 2 },
    '88': { nom: 'Vosges', article: 'les', prefecture: 'Épinal', region: 'Grand Est', rang: 2 },

    // ---------- Hauts-de-France ----------
    '02': { nom: 'Aisne', article: "l'", prefecture: 'Laon', region: 'Hauts-de-France', rang: 3 },
    '59': { nom: 'Nord', article: 'le', prefecture: 'Lille', region: 'Hauts-de-France', rang: 1 },
    '60': { nom: 'Oise', article: "l'", prefecture: 'Beauvais', region: 'Hauts-de-France', rang: 2 },
    '62': { nom: 'Pas-de-Calais', article: 'le', prefecture: 'Arras', region: 'Hauts-de-France', rang: 1 },
    '80': { nom: 'Somme', article: 'la', prefecture: 'Amiens', region: 'Hauts-de-France', rang: 2 },

    // ---------- Île-de-France ----------
    '75': { nom: 'Paris', article: '', prefecture: 'Paris', region: 'Île-de-France', rang: 1 },
    '77': { nom: 'Seine-et-Marne', article: 'la', prefecture: 'Melun', region: 'Île-de-France', rang: 2 },
    '78': { nom: 'Yvelines', article: 'les', prefecture: 'Versailles', region: 'Île-de-France', rang: 2 },
    '91': { nom: 'Essonne', article: "l'", prefecture: 'Évry-Courcouronnes', region: 'Île-de-France', rang: 2, alias: ['Évry'] },
    '92': { nom: 'Hauts-de-Seine', article: 'les', prefecture: 'Nanterre', region: 'Île-de-France', rang: 2 },
    '93': { nom: 'Seine-Saint-Denis', article: 'la', prefecture: 'Bobigny', region: 'Île-de-France', rang: 2 },
    '94': { nom: 'Val-de-Marne', article: 'le', prefecture: 'Créteil', region: 'Île-de-France', rang: 2 },
    // Le chef-lieu du Val-d'Oise est a Cergy depuis 2018 ; la prefecture s'est
    // longtemps dite « Pontoise », et l'agglomeration « Cergy-Pontoise ». Les
    // trois reponses passent.
    '95': { nom: 'Val-d’Oise', article: 'le', prefecture: 'Cergy', region: 'Île-de-France', rang: 2 },

    // ---------- Normandie ----------
    '14': { nom: 'Calvados', article: 'le', prefecture: 'Caen', region: 'Normandie', rang: 1 },
    '27': { nom: 'Eure', article: "l'", prefecture: 'Évreux', region: 'Normandie', rang: 2 },
    '50': { nom: 'Manche', article: 'la', prefecture: 'Saint-Lô', region: 'Normandie', rang: 2 },
    '61': { nom: 'Orne', article: "l'", prefecture: 'Alençon', region: 'Normandie', rang: 3 },
    '76': { nom: 'Seine-Maritime', article: 'la', prefecture: 'Rouen', region: 'Normandie', rang: 1 },

    // ---------- Nouvelle-Aquitaine ----------
    '16': { nom: 'Charente', article: 'la', prefecture: 'Angoulême', region: 'Nouvelle-Aquitaine', rang: 3 },
    '17': { nom: 'Charente-Maritime', article: 'la', prefecture: 'La Rochelle', region: 'Nouvelle-Aquitaine', rang: 2 },
    '19': { nom: 'Corrèze', article: 'la', prefecture: 'Tulle', region: 'Nouvelle-Aquitaine', rang: 3 },
    '23': { nom: 'Creuse', article: 'la', prefecture: 'Guéret', region: 'Nouvelle-Aquitaine', rang: 4 },
    '24': { nom: 'Dordogne', article: 'la', prefecture: 'Périgueux', region: 'Nouvelle-Aquitaine', rang: 2 },
    '33': { nom: 'Gironde', article: 'la', prefecture: 'Bordeaux', region: 'Nouvelle-Aquitaine', rang: 1 },
    '40': { nom: 'Landes', article: 'les', prefecture: 'Mont-de-Marsan', region: 'Nouvelle-Aquitaine', rang: 2 },
    '47': { nom: 'Lot-et-Garonne', article: 'le', prefecture: 'Agen', region: 'Nouvelle-Aquitaine', rang: 3 },
    '64': { nom: 'Pyrénées-Atlantiques', article: 'les', prefecture: 'Pau', region: 'Nouvelle-Aquitaine', rang: 1 },
    '79': { nom: 'Deux-Sèvres', article: 'les', prefecture: 'Niort', region: 'Nouvelle-Aquitaine', rang: 3 },
    '86': { nom: 'Vienne', article: 'la', prefecture: 'Poitiers', region: 'Nouvelle-Aquitaine', rang: 2 },
    '87': { nom: 'Haute-Vienne', article: 'la', prefecture: 'Limoges', region: 'Nouvelle-Aquitaine', rang: 2 },

    // ---------- Occitanie ----------
    '09': { nom: 'Ariège', article: "l'", prefecture: 'Foix', region: 'Occitanie', rang: 3 },
    '11': { nom: 'Aude', article: "l'", prefecture: 'Carcassonne', region: 'Occitanie', rang: 2 },
    '12': { nom: 'Aveyron', article: "l'", prefecture: 'Rodez', region: 'Occitanie', rang: 3 },
    '30': { nom: 'Gard', article: 'le', prefecture: 'Nîmes', region: 'Occitanie', rang: 1 },
    '31': { nom: 'Haute-Garonne', article: 'la', prefecture: 'Toulouse', region: 'Occitanie', rang: 1 },
    '32': { nom: 'Gers', article: 'le', prefecture: 'Auch', region: 'Occitanie', rang: 3 },
    '34': { nom: 'Hérault', article: "l'", prefecture: 'Montpellier', region: 'Occitanie', rang: 1 },
    '46': { nom: 'Lot', article: 'le', prefecture: 'Cahors', region: 'Occitanie', rang: 3 },
    '48': { nom: 'Lozère', article: 'la', prefecture: 'Mende', region: 'Occitanie', rang: 3 },
    '65': { nom: 'Hautes-Pyrénées', article: 'les', prefecture: 'Tarbes', region: 'Occitanie', rang: 3 },
    '66': { nom: 'Pyrénées-Orientales', article: 'les', prefecture: 'Perpignan', region: 'Occitanie', rang: 2 },
    '81': { nom: 'Tarn', article: 'le', prefecture: 'Albi', region: 'Occitanie', rang: 2 },
    '82': { nom: 'Tarn-et-Garonne', article: 'le', prefecture: 'Montauban', region: 'Occitanie', rang: 3 },

    // ---------- Pays de la Loire ----------
    '44': { nom: 'Loire-Atlantique', article: 'la', prefecture: 'Nantes', region: 'Pays de la Loire', rang: 1 },
    '49': { nom: 'Maine-et-Loire', article: 'le', prefecture: 'Angers', region: 'Pays de la Loire', rang: 2 },
    '53': { nom: 'Mayenne', article: 'la', prefecture: 'Laval', region: 'Pays de la Loire', rang: 3 },
    '72': { nom: 'Sarthe', article: 'la', prefecture: 'Le Mans', region: 'Pays de la Loire', rang: 2 },
    '85': { nom: 'Vendée', article: 'la', prefecture: 'La Roche-sur-Yon', region: 'Pays de la Loire', rang: 2 },

    // ---------- Provence-Alpes-Côte d'Azur ----------
    '04': { nom: 'Alpes-de-Haute-Provence', article: 'les', prefecture: 'Digne-les-Bains', region: 'Provence-Alpes-Côte d’Azur', rang: 2 },
    '05': { nom: 'Hautes-Alpes', article: 'les', prefecture: 'Gap', region: 'Provence-Alpes-Côte d’Azur', rang: 2 },
    '06': { nom: 'Alpes-Maritimes', article: 'les', prefecture: 'Nice', region: 'Provence-Alpes-Côte d’Azur', rang: 1 },
    '13': { nom: 'Bouches-du-Rhône', article: 'les', prefecture: 'Marseille', region: 'Provence-Alpes-Côte d’Azur', rang: 1 },
    '83': { nom: 'Var', article: 'le', prefecture: 'Toulon', region: 'Provence-Alpes-Côte d’Azur', rang: 1 },
    '84': { nom: 'Vaucluse', article: 'le', prefecture: 'Avignon', region: 'Provence-Alpes-Côte d’Azur', rang: 1 },

    // ---------- Outre-mer ----------
    // Chacun est a la fois departement et region : ils portent le meme nom dans
    // les deux atlas, et c'est normal.
    '971': { nom: 'Guadeloupe', article: 'la', prefecture: 'Basse-Terre', region: 'Outre-mer', rang: 1 },
    '972': { nom: 'Martinique', article: 'la', prefecture: 'Fort-de-France', region: 'Outre-mer', rang: 1 },
    '973': { nom: 'Guyane', article: 'la', prefecture: 'Cayenne', region: 'Outre-mer', rang: 1 },
    '974': { nom: 'La Réunion', article: '', prefecture: 'Saint-Denis', region: 'Outre-mer', rang: 1, alias: ['Réunion'] },
    '976': { nom: 'Mayotte', article: '', prefecture: 'Mamoudzou', region: 'Outre-mer', rang: 1 }
};

// Les regions de 2016, celles de la carte d'aujourd'hui. Leur code est le code
// INSEE : c'est lui que porte la source geographique.
export const REGIONS = {
    '84': { nom: 'Auvergne-Rhône-Alpes', article: "l'", prefecture: 'Lyon', region: 'France métropolitaine', rang: 1 },
    '27': { nom: 'Bourgogne-Franche-Comté', article: 'la', prefecture: 'Dijon', region: 'France métropolitaine', rang: 2 },
    '53': { nom: 'Bretagne', article: 'la', prefecture: 'Rennes', region: 'France métropolitaine', rang: 1 },
    '24': { nom: 'Centre-Val de Loire', article: 'le', prefecture: 'Orléans', region: 'France métropolitaine', rang: 2 },
    '94': { nom: 'Corse', article: 'la', prefecture: 'Ajaccio', region: 'France métropolitaine', rang: 1 },
    '44': { nom: 'Grand Est', article: 'le', prefecture: 'Strasbourg', region: 'France métropolitaine', rang: 1 },
    '32': { nom: 'Hauts-de-France', article: 'les', prefecture: 'Lille', region: 'France métropolitaine', rang: 1 },
    '11': { nom: 'Île-de-France', article: "l'", prefecture: 'Paris', region: 'France métropolitaine', rang: 1 },
    '28': { nom: 'Normandie', article: 'la', prefecture: 'Rouen', region: 'France métropolitaine', rang: 1 },
    '75': { nom: 'Nouvelle-Aquitaine', article: 'la', prefecture: 'Bordeaux', region: 'France métropolitaine', rang: 1 },
    '76': { nom: 'Occitanie', article: "l'", prefecture: 'Toulouse', region: 'France métropolitaine', rang: 1 },
    '52': { nom: 'Pays de la Loire', article: 'les', prefecture: 'Nantes', region: 'France métropolitaine', rang: 2 },
    '93': { nom: 'Provence-Alpes-Côte d’Azur', article: 'la', prefecture: 'Marseille', region: 'France métropolitaine', rang: 1, alias: ['PACA'] },
    '01': { nom: 'Guadeloupe', article: 'la', prefecture: 'Basse-Terre', region: 'Outre-mer', rang: 2 },
    '02': { nom: 'Martinique', article: 'la', prefecture: 'Fort-de-France', region: 'Outre-mer', rang: 2 },
    '03': { nom: 'Guyane', article: 'la', prefecture: 'Cayenne', region: 'Outre-mer', rang: 2 },
    '04': { nom: 'La Réunion', article: '', prefecture: 'Saint-Denis', region: 'Outre-mer', rang: 2, alias: ['Réunion'] },
    '06': { nom: 'Mayotte', article: '', prefecture: 'Mamoudzou', region: 'Outre-mer', rang: 2 }
};

// Ce qu'un joueur ecrit a la place, et pourquoi c'est refuse. Meme role que les
// pieges de scripts/pays.mjs : dire ce qui manque plutot que « raté ».
//
// Les deux tables sont separees parce que les codes ne le sont pas : « 27 » est
// l'Eure chez les departements et la Bourgogne-Franche-Comte chez les regions.
// Une table commune designerait donc la mauvaise entite d'un atlas a l'autre.
export const PIEGES_DEPARTEMENTS = [
    { saisie: 'corse', pour: ['2A', '2B'], message: 'La Corse a deux départements : la Corse-du-Sud et la Haute-Corse.' },
    { saisie: 'savoies', pour: ['73', '74'], message: 'Il y en a deux : la Savoie et la Haute-Savoie.' },
    { saisie: 'normandie', pour: ['14', '27', '50', '61', '76'], message: 'La Normandie est une région, pas un département.' },
    { saisie: 'bretagne', pour: ['22', '29', '35', '56'], message: 'La Bretagne est une région, pas un département.' },
    { saisie: 'alsace', pour: ['67', '68'], message: 'L’Alsace, c’est le Bas-Rhin et le Haut-Rhin.' },
    { saisie: 'provence', pour: ['13', '83', '84', '04', '05', '06'], message: 'La Provence est une région, pas un département.' },
    { saisie: 'ile de france', pour: ['75', '77', '78', '91', '92', '93', '94', '95'], message: 'L’Île-de-France est une région : elle compte huit départements.' },
    { saisie: 'pontoise', pour: ['95'], message: 'La préfecture du Val-d’Oise a quitté Pontoise pour Cergy.' },
    { saisie: 'cergy pontoise', pour: ['95'], message: 'Cergy-Pontoise est l’agglomération ; la préfecture est à Cergy.' }
];

// Les regions d'avant 2016. C'est la confusion la plus frequente, et la plus
// interessante a expliquer : la carte a change, pas la geographie.
export const PIEGES_REGIONS = [
    { saisie: 'aquitaine', pour: ['75'], message: 'L’Aquitaine, le Limousin et Poitou-Charentes forment la Nouvelle-Aquitaine depuis 2016.' },
    { saisie: 'limousin', pour: ['75'], message: 'Le Limousin a rejoint la Nouvelle-Aquitaine en 2016.' },
    { saisie: 'poitou charentes', pour: ['75'], message: 'Poitou-Charentes a rejoint la Nouvelle-Aquitaine en 2016.' },
    { saisie: 'rhone alpes', pour: ['84'], message: 'Rhône-Alpes et l’Auvergne n’en font plus qu’une depuis 2016.' },
    { saisie: 'auvergne', pour: ['84'], message: 'L’Auvergne a fusionné avec Rhône-Alpes en 2016.' },
    { saisie: 'languedoc roussillon', pour: ['76'], message: 'Le Languedoc-Roussillon et Midi-Pyrénées forment l’Occitanie depuis 2016.' },
    { saisie: 'midi pyrenees', pour: ['76'], message: 'Midi-Pyrénées et le Languedoc-Roussillon forment l’Occitanie depuis 2016.' },
    { saisie: 'nord pas de calais', pour: ['32'], message: 'Le Nord-Pas-de-Calais et la Picardie forment les Hauts-de-France depuis 2016.' },
    { saisie: 'picardie', pour: ['32'], message: 'La Picardie a rejoint les Hauts-de-France en 2016.' },
    { saisie: 'alsace', pour: ['44'], message: 'L’Alsace, la Lorraine et la Champagne-Ardenne forment le Grand Est depuis 2016.' },
    { saisie: 'lorraine', pour: ['44'], message: 'La Lorraine a rejoint le Grand Est en 2016.' },
    { saisie: 'champagne ardenne', pour: ['44'], message: 'La Champagne-Ardenne a rejoint le Grand Est en 2016.' },
    { saisie: 'bourgogne', pour: ['27'], message: 'La Bourgogne et la Franche-Comté n’en font plus qu’une depuis 2016.' },
    { saisie: 'franche comte', pour: ['27'], message: 'La Franche-Comté a fusionné avec la Bourgogne en 2016.' },
    { saisie: 'basse normandie', pour: ['28'], message: 'Les deux Normandies n’en font plus qu’une depuis 2016.' },
    { saisie: 'haute normandie', pour: ['28'], message: 'Les deux Normandies n’en font plus qu’une depuis 2016.' }
];
