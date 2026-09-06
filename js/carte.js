// La carte : le seul module qui dessine.
//
// SVG plutot que canvas, pour trois raisons qui se cumulent. Le toucher est
// gratuit — l'evenement arrive sur le pays touche, sans calcul de collision.
// Les couleurs restent dans css/themes.css, ou la convention veut qu'elles
// soient. Et chaque pays peut porter son propre libelle accessible.
//
// Le zoom n'anime pas le viewBox mais la transformation d'un groupe : le
// navigateur la traite comme une composition, ce qui reste fluide sur un
// telephone avec deux cents contours a l'ecran.

const NS = 'http://www.w3.org/2000/svg';
const ZOOM_MAX = 14;
const COUVERTURE_DEFAUT = 1.55;

const balise = (nom, attributs = {}) => {
    const noeud = document.createElementNS(NS, nom);
    for (const [clef, valeur] of Object.entries(attributs)) noeud.setAttribute(clef, valeur);
    return noeud;
};

export function creerCarte(hote, atlas, { surTouche = null } = {}) {
    hote.textContent = '';
    const svg = balise('svg', {
        viewBox: atlas.viewBox,
        class: 'planisphere',
        role: 'img',
        'aria-label': `Carte : ${atlas.nom}`,
        preserveAspectRatio: 'xMidYMid meet'
    });

    const vue = balise('g', { class: 'vue' });
    vue.append(balise('rect', {
        class: 'mer', x: -atlas.largeur, y: -atlas.hauteur,
        width: atlas.largeur * 3, height: atlas.hauteur * 3
    }));
    if (atlas.decor) vue.append(balise('path', { class: 'decor', d: atlas.decor }));

    // Les cartouches : la Guadeloupe et la Reunion sont a huit mille kilometres
    // de la metropole, chacune dans sa case et a sa propre echelle. Le cadre est
    // dessine, jamais le nom — l'ecrire donnerait la reponse.
    for (const cartouche of atlas.cartouches ?? []) {
        const [x0, y0, x1, y1] = cartouche.boite;
        vue.append(balise('rect', {
            class: 'cartouche', x: x0, y: y0, width: x1 - x0, height: y1 - y0,
            rx: 8, 'aria-hidden': 'true'
        }));
    }

    const pays = balise('g', { class: 'pays' });
    const noeuds = new Map();
    for (const entite of atlas.entites) {
        const chemin = balise('path', { class: 'pays-forme', d: entite.d, 'data-id': entite.id });
        noeuds.set(entite.id, chemin);
        pays.append(chemin);
    }
    vue.append(pays);
    svg.append(vue);

    // Les marqueurs vivent hors du groupe zoome : leurs positions sont
    // recalculees a la main pour qu'une epingle garde la meme taille a
    // l'ecran, quel que soit le grossissement. C'est aussi ce qui rend Malte
    // touchable au doigt sans agrandir Malte.
    const marqueurs = balise('g', { class: 'marqueurs' });
    svg.append(marqueurs);
    hote.append(svg);

    // L'echelle de base : celle qui remplit la boite d'affichage.
    //
    // Un planisphere fait deux fois plus large que haut ; la zone de jeu d'un
    // telephone tenu debout fait l'inverse. A echelle 1 la carte flotte au
    // milieu d'un grand rectangle vide, et a couverture pleine elle perdrait
    // l'Asie hors du cadre. Deux mesures se repondent donc : la boite prend
    // elle-meme le rapport de la carte (css, --ratio-scene), et ce qui reste de
    // vide est comble ici — jamais plus que ce plafond, qui borne la coupe aux
    // bords vides du Pacifique.
    // Ce que la carte accepte de perdre sur les bords pour remplir la boite.
    // Le monde tolere qu'on lui rogne le Pacifique ; la France, dont la colonne
    // de cartouches touche le bord gauche, ne tolere presque rien. Chaque atlas
    // porte donc sa valeur, et css/interface.css lit la meme par une variable.
    const COUVERTURE_MAX = atlas.couverture ?? COUVERTURE_DEFAUT;

    // Jusqu'ou la carte se rapproche d'elle-meme pour poser une question.
    //
    // Sur le monde, la forme du pays est la reponse : on peut grossir autant
    // qu'on veut. Sur les departements, c'est la POSITION dans la France qui
    // repond — un rectangle vert au milieu de rectangles verts n'apprend rien.
    // Ces cartes-la plafonnent donc leur cadrage, et l'epingle marque les plus
    // petites. Le pincement, lui, garde toute sa course.
    const ZOOM_CADRAGE = atlas.zoomCadrage ?? ZOOM_MAX;
    const couverture = () => {
        const boite = svg.getBoundingClientRect();
        if (!boite.width || !boite.height) return 1;
        const tenir = Math.min(boite.width / atlas.largeur, boite.height / atlas.hauteur);
        const remplir = Math.max(boite.width / atlas.largeur, boite.height / atlas.hauteur);
        return Math.min(remplir / tenir, COUVERTURE_MAX);
    };

    let echelle = 1, dx = 0, dy = 0;
    let cible = null, epingles = [];
    let anime = true;

    const appliquer = () => {
        vue.setAttribute('transform', `translate(${dx} ${dy}) scale(${echelle})`);
        placerMarqueurs();
    };

    // Empeche la carte de partir hors champ : on autorise juste un debord de
    // dix pour cent, assez pour approcher un bord sans le coller.
    const brider = () => {
        const marge = 0.1;
        const limiteX = atlas.largeur * (echelle - 1) + atlas.largeur * marge;
        const limiteY = atlas.hauteur * (echelle - 1) + atlas.hauteur * marge;
        dx = Math.min(atlas.largeur * marge, Math.max(-limiteX, dx));
        dy = Math.min(atlas.hauteur * marge, Math.max(-limiteY, dy));
    };

    // Un pixel d'ecran, en unites de carte : le rapport que
    // preserveAspectRatio="meet" applique au viewBox.
    const facteurEcran = () => {
        const boite = svg.getBoundingClientRect();
        if (!boite.width || !boite.height) return 1;
        return Math.min(boite.width / atlas.largeur, boite.height / atlas.hauteur) || 1;
    };

    function placerMarqueurs() {
        if (!epingles.length) return;
        // Les rayons des epingles sont ecrits en pixels d'ecran ; le groupe
        // compense donc l'echelle du viewBox. Sans cette compensation, une
        // epingle de rayon 7 sur un planisphere de 4000 de large mesure un
        // pixel et demi sur un telephone — et le micro-Etat qu'elle designe
        // reste introuvable, ce qu'elle etait justement la pour eviter.
        const taille = 1 / facteurEcran();
        for (const { noeud, ancre } of epingles) {
            noeud.setAttribute('transform',
                `translate(${ancre[0] * echelle + dx} ${ancre[1] * echelle + dy}) scale(${taille})`);
        }
    }

    function cadrer(entite, { part = 0.34, anime: doux = true } = {}) {
        anime = doux;
        svg.classList.toggle('sans-transition', !doux);
        if (!entite) {
            echelle = couverture();
            dx = atlas.largeur / 2 - (atlas.largeur / 2) * echelle;
            dy = atlas.hauteur / 2 - (atlas.hauteur / 2) * echelle;
            appliquer();
            return;
        }
        const [x0, y0, x1, y1] = entite.boite;
        const large = Math.max(x1 - x0, atlas.largeur / 400);
        const haut = Math.max(y1 - y0, atlas.hauteur / 400);
        echelle = Math.min(ZOOM_CADRAGE, Math.max(couverture(),
            Math.min(atlas.largeur * part / large, atlas.hauteur * part / haut)));
        dx = atlas.largeur / 2 - ((x0 + x1) / 2) * echelle;
        dy = atlas.hauteur / 2 - ((y0 + y1) / 2) * echelle;
        brider();
        appliquer();
    }

    const api = {
        svg,
        atlas,

        // Met un pays en avant. `revele` sert a montrer la bonne reponse apres
        // coup, dans une autre couleur que la question elle-meme.
        montrer(id, { epingle = true, classe = 'cible' } = {}) {
            api.effacerMarques();
            cible = id;
            const noeud = noeuds.get(id);
            if (!noeud) return;
            noeud.classList.add(classe);
            noeud.parentNode.append(noeud);            // au premier plan
            const entite = atlas.parId.get(id);
            if (epingle && entite) api.epingler(entite, classe);
        },

        epingler(entite, classe = 'cible') {
            const groupe = balise('g', { class: `epingle ${classe}` });
            // En pixels d'ecran : placerMarqueurs() compense l'echelle du viewBox.
            groupe.append(balise('circle', { class: 'epingle-halo', r: 20 }));
            groupe.append(balise('circle', { class: 'epingle-point', r: 6 }));
            marqueurs.append(groupe);
            epingles.push({ noeud: groupe, ancre: entite.ancre });
            placerMarqueurs();
        },

        effacerMarques() {
            for (const noeud of noeuds.values()) noeud.classList.remove('cible', 'juste', 'faux', 'indice');
            marqueurs.textContent = '';
            epingles = [];
            cible = null;
        },

        marquer(id, classe) {
            const noeud = noeuds.get(id);
            if (noeud) { noeud.classList.add(classe); noeud.parentNode.append(noeud); }
            const entite = atlas.parId.get(id);
            if (entite?.minuscule) api.epingler(entite, classe);
        },

        cadrerSur(id, options) { cadrer(id ? atlas.parId.get(id) : null, options); },
        recentrer(options) { cadrer(null, options); },

        // Amener un pays au milieu sans grossir.
        //
        // Necessaire des que la carte est rognee : aux niveaux sans aide, la
        // cible ne doit pas etre agrandie — mais elle ne doit pas non plus se
        // trouver hors du cadre, ce qui la rendrait introuvable sans que le
        // joueur sache seulement qu'il faut chercher ailleurs.
        centrerSur(id, { anime: doux = true } = {}) {
            const entite = atlas.parId.get(id);
            if (!entite) return api.recentrer({ anime: doux });
            anime = doux;
            svg.classList.toggle('sans-transition', !doux);
            echelle = couverture();
            dx = atlas.largeur / 2 - entite.ancre[0] * echelle;
            dy = atlas.hauteur / 2 - entite.ancre[1] * echelle;
            brider();
            appliquer();
        },

        // Toute la carte, sans rognage : le mode ou l'on cherche un pays a
        // l'aveugle ne peut pas se permettre d'en cacher un morceau.
        montrerTout({ anime: doux = true } = {}) {
            anime = doux;
            svg.classList.toggle('sans-transition', !doux);
            echelle = 1;
            dx = 0;
            dy = 0;
            appliquer();
        },

        // L'ecran « Ma carte » : chaque pays prend la couleur de ce que le
        // joueur en sait. C'est le seul moment ou toute la carte est coloree.
        colorier(niveauDe) {
            svg.classList.add('progression');
            for (const [id, noeud] of noeuds) {
                noeud.classList.remove('acquis', 'hesitant', 'inconnu');
                noeud.classList.add(niveauDe(id));
            }
        },

        decolorier() {
            svg.classList.remove('progression');
            for (const noeud of noeuds.values()) noeud.classList.remove('acquis', 'hesitant', 'inconnu');
        },

        // Le pays sous le doigt. Les micro-Etats ont besoin d'aide : sous un
        // certain grossissement, on cherche l'ancre la plus proche dans un
        // rayon confortable plutot que le contour exact, sans quoi Monaco
        // resterait intouchable.
        auPoint(x, y) {
            const point = api.versCarte(x, y);
            const direct = document.elementFromPoint(x, y)?.closest('[data-id]');
            const rayon = 22 / (echelle * (svg.getBoundingClientRect().width / atlas.largeur));
            let proche = null, meilleure = rayon * rayon;
            for (const entite of atlas.entites) {
                if (!entite.minuscule) continue;
                const d = (entite.ancre[0] - point.x) ** 2 + (entite.ancre[1] - point.y) ** 2;
                if (d < meilleure) { meilleure = d; proche = entite.id; }
            }
            return proche ?? direct?.dataset.id ?? null;
        },

        // Coordonnees ecran vers coordonnees de la carte.
        versCarte(x, y) {
            const boite = svg.getBoundingClientRect();
            const facteur = Math.min(boite.width / atlas.largeur, boite.height / atlas.hauteur);
            const bordX = (boite.width - atlas.largeur * facteur) / 2;
            const bordY = (boite.height - atlas.hauteur * facteur) / 2;
            return {
                x: ((x - boite.left - bordX) / facteur - dx) / echelle,
                y: ((y - boite.top - bordY) / facteur - dy) / echelle
            };
        },

        deplacer(deltaX, deltaY) {
            const facteur = facteurEcran();
            dx += deltaX / facteur; dy += deltaY / facteur;
            brider(); svg.classList.add('sans-transition'); appliquer();
        },

        zoomer(facteur, centreX, centreY) {
            const avant = api.versCarte(centreX, centreY);
            echelle = Math.min(ZOOM_MAX, Math.max(couverture(), echelle * facteur));
            dx = atlas.largeur / 2 - avant.x * echelle;
            dy = atlas.hauteur / 2 - avant.y * echelle;
            brider(); svg.classList.add('sans-transition'); appliquer();
        },

        get echelle() { return echelle; },
        get cible() { return cible; }
    };

    if (surTouche) {
        svg.addEventListener('click', evenement => {
            const id = api.auPoint(evenement.clientX, evenement.clientY);
            if (id) surTouche(id, evenement);
        });
    }

    // La boite change de taille sans que la fenetre bouge — le clavier maison
    // apparait, la zone de reponse grandit. Un observateur suffit, et il attrape
    // aussi la rotation de l'ecran.
    const surRedimension = () => { if (echelle <= couverture() * 1.02) cadrer(null, { anime: false }); };
    globalThis.ResizeObserver
        ? new ResizeObserver(surRedimension).observe(hote)
        : globalThis.addEventListener?.('resize', surRedimension);

    cadrer(null, { anime: false });
    return api;
}
