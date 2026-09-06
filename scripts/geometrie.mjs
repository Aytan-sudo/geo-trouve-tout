// Simplification, mesures et encodage des contours.
//
// Tout se passe apres projection, en unites de viewBox : une tolerance parle
// donc en pixels de carte, pas en degres — ce qui evite le defaut classique des
// simplifications en lon/lat, ou un meme seuil rabote dix fois plus pres des
// poles qu'a l'equateur.

// Visvalingam-Whyatt : on retire le point dont le triangle avec ses voisins est
// le plus plat, et on recommence. Contrairement a Douglas-Peucker, la forme
// generale se degrade doucement — un littoral reste un littoral.
export function simplifier(anneau, seuil) {
    if (anneau.length <= 5) return anneau;
    const points = anneau.map(p => p.slice());
    const aire = (a, b, c) => Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1])) / 2;

    let vivants = points.map((_, i) => i);
    while (vivants.length > 5) {
        let pire = -1, pireAire = Infinity;
        for (let k = 1; k < vivants.length - 1; k++) {
            const a = aire(points[vivants[k - 1]], points[vivants[k]], points[vivants[k + 1]]);
            if (a < pireAire) { pireAire = a; pire = k; }
        }
        if (pireAire > seuil) break;
        vivants.splice(pire, 1);
    }
    return vivants.map(i => points[i]);
}

export function aireAnneau(anneau) {
    let somme = 0;
    for (let i = 0, j = anneau.length - 1; i < anneau.length; j = i++) {
        somme += (anneau[j][0] * anneau[i][1]) - (anneau[i][0] * anneau[j][1]);
    }
    return Math.abs(somme) / 2;
}

export function boite(anneaux) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const anneau of anneaux) for (const [x, y] of anneau) {
        if (x < x0) x0 = x; if (x > x1) x1 = x;
        if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    return [x0, y0, x1, y1];
}

function dansAnneau([x, y], anneau) {
    let dedans = false;
    for (let i = 0, j = anneau.length - 1; i < anneau.length; j = i++) {
        const [xi, yi] = anneau[i], [xj, yj] = anneau[j];
        if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) dedans = !dedans;
    }
    return dedans;
}

// L'ancre : le point ou poser l'epingle et le libelle.
//
// Le centroide ne convient pas — celui de la Croatie tombe en Bosnie, celui de
// l'Indonesie dans la mer. On cherche donc le point interieur le plus loin de
// tout bord, par balayage puis raffinement local. C'est un polylabel du pauvre,
// suffisant a cette echelle et sans dependance.
export function ancre(anneaux) {
    const exterieur = anneaux[0];
    const [x0, y0, x1, y1] = boite([exterieur]);
    const distanceAuBord = p => {
        let d = Infinity;
        for (const anneau of anneaux) {
            for (let i = 0, j = anneau.length - 1; i < anneau.length; j = i++) {
                d = Math.min(d, distancePointSegment(p, anneau[j], anneau[i]));
            }
        }
        return dansAnneau(p, exterieur) && anneaux.slice(1).every(t => !dansAnneau(p, t)) ? d : -d;
    };

    let meilleur = null, meilleureNote = -Infinity;
    const pas = Math.max((x1 - x0), (y1 - y0)) / 24 || 1;
    for (let x = x0 + pas / 2; x < x1; x += pas) {
        for (let y = y0 + pas / 2; y < y1; y += pas) {
            const note = distanceAuBord([x, y]);
            if (note > meilleureNote) { meilleureNote = note; meilleur = [x, y]; }
        }
    }
    if (!meilleur) return [(x0 + x1) / 2, (y0 + y1) / 2];

    let rayon = pas;
    for (let tour = 0; tour < 6; tour++) {
        rayon /= 2;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
            const p = [meilleur[0] + dx * rayon, meilleur[1] + dy * rayon];
            const note = distanceAuBord(p);
            if (note > meilleureNote) { meilleureNote = note; meilleur = p; }
        }
    }
    return meilleur;
}

function distancePointSegment([px, py], [ax, ay], [bx, by]) {
    const dx = bx - ax, dy = by - ay;
    const l2 = dx * dx + dy * dy;
    const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2));
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

// Encodage en attribut `d`. Un seul « M » absolu par anneau, puis des « l »
// relatifs : les deltas tiennent sur un ou deux chiffres la ou les coordonnees
// absolues en demandent quatre. Sur un planisphere entier, c'est la moitie du
// fichier.
export function chemin(anneaux) {
    const morceaux = [];
    for (const anneau of anneaux) {
        if (anneau.length < 3) continue;
        let px = Math.round(anneau[0][0]), py = Math.round(anneau[0][1]);
        const suite = [];
        for (let i = 1; i < anneau.length; i++) {
            const x = Math.round(anneau[i][0]), y = Math.round(anneau[i][1]);
            const dx = x - px, dy = y - py;
            if (dx === 0 && dy === 0) continue;
            suite.push(dx, dy);
            px = x; py = y;      // on suit la position emise, pas la position reelle :
        }                        // sinon les arrondis derivent le long du littoral
        if (suite.length < 6) continue;
        morceaux.push(`M${Math.round(anneau[0][0])} ${Math.round(anneau[0][1])}l${nombres(suite)}z`);
    }
    return morceaux.join('');
}

// « 12 -4 -3 -1 » s'ecrit « 12-4-3-1 » : le signe moins separe deja les nombres.
// Un planisphere y gagne un bon dixieme de son poids, sans rien perdre.
function nombres(liste) {
    let sortie = '';
    for (const n of liste) {
        if (sortie && n >= 0) sortie += ' ';
        sortie += n;
    }
    return sortie;
}

// Decoupe d'un anneau par une boite (Sutherland-Hodgman).
//
// Filtrer les polygones qui « touchent » le cadre ne suffit pas : une carte
// d'Europe garderait alors la Russie jusqu'au Pacifique, et son viewBox avec.
// On coupe donc pour de bon, bord par bord.
export function couper(anneau, [x0, y0, x1, y1]) {
    const bords = [
        p => p[0] >= x0, p => p[0] <= x1,
        p => p[1] >= y0, p => p[1] <= y1
    ];
    const intersections = [
        (a, b) => croisement(a, b, 0, x0), (a, b) => croisement(a, b, 0, x1),
        (a, b) => croisement(a, b, 1, y0), (a, b) => croisement(a, b, 1, y1)
    ];
    let sortie = anneau;
    for (let b = 0; b < 4 && sortie.length; b++) {
        const dedans = bords[b], couperA = intersections[b];
        const suivant = [];
        for (let i = 0; i < sortie.length; i++) {
            const courant = sortie[i], precedent = sortie[(i - 1 + sortie.length) % sortie.length];
            if (dedans(courant)) {
                if (!dedans(precedent)) suivant.push(couperA(precedent, courant));
                suivant.push(courant);
            } else if (dedans(precedent)) {
                suivant.push(couperA(precedent, courant));
            }
        }
        sortie = suivant;
    }
    return sortie;
}

function croisement(a, b, axe, valeur) {
    const t = (valeur - a[axe]) / (b[axe] - a[axe]);
    return axe === 0
        ? [valeur, a[1] + t * (b[1] - a[1])]
        : [a[0] + t * (b[0] - a[0]), valeur];
}
