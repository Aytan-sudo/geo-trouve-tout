// Les projections, appliquees une fois pour toutes a la fabrication.
//
// Le jeu publie ne projette rien : ses fichiers contiennent deja des
// coordonnees d'ecran. C'est ce qui rend le rendu gratuit sur un telephone —
// aucune trigonometrie entre le fichier et le pixel.

const RAD = Math.PI / 180;

// Equal Earth (Savric, Patterson & Jenny, 2018).
//
// Choisie contre Mercator pour une raison pedagogique : les surfaces y sont
// justes. Apprendre la geographie sur une carte ou le Groenland fait la taille
// de l'Afrique, c'est apprendre faux. Elle garde par ailleurs des continents
// reconnaissables, ce que les projections equivalentes ratent souvent.
const A1 = 1.340264, A2 = -0.081106, A3 = 0.000893, A4 = 0.003796;
const RACINE3_2 = Math.sqrt(3) / 2;

export function equalEarth([lon, lat]) {
    const theta = Math.asin(RACINE3_2 * Math.sin(lat * RAD));
    const t2 = theta * theta, t6 = t2 * t2 * t2;
    const x = lon * RAD * Math.cos(theta)
        / (RACINE3_2 * (A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2)));
    const y = theta * (A1 + A2 * t2 + t6 * (A3 + A4 * t2));
    return [x, -y];   // y descend a l'ecran
}

// Lambert conique conforme, pour la France metropolitaine (facon Lambert-93).
// Conforme et non equivalente : a l'echelle d'un pays la difference de surface
// est negligeable, et les formes departementales restent celles de l'atlas
// scolaire.
export function lambert93([lon, lat], { lat1 = 44, lat2 = 49, lat0 = 46.5, lon0 = 3 } = {}) {
    const p1 = lat1 * RAD, p2 = lat2 * RAD, p0 = lat0 * RAD;
    const n = Math.log(Math.cos(p1) / Math.cos(p2))
        / Math.log(Math.tan(Math.PI / 4 + p2 / 2) / Math.tan(Math.PI / 4 + p1 / 2));
    const F = Math.cos(p1) * Math.pow(Math.tan(Math.PI / 4 + p1 / 2), n) / n;
    const rho = r => F / Math.pow(Math.tan(Math.PI / 4 + r / 2), n);
    const t = n * ((lon - lon0) * RAD);
    return [rho(lat * RAD) * Math.sin(t), -(rho(p0) - rho(lat * RAD) * Math.cos(t))];
}

export const PROJECTIONS = { 'equal-earth': equalEarth, 'lambert': lambert93 };
