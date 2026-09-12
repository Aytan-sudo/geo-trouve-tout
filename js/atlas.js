// Le chargement des cartes.
//
// Un atlas est un fichier autonome : ses contours sont deja projetes, deja mis
// a l'echelle de son viewBox. Le navigateur n'a donc aucune trigonometrie a
// faire — il pose des chemins SVG et c'est tout. Les fichiers sont fabriques
// par scripts/atlas.mjs, hors ligne, et commites.

// Les cartes se rangent par famille. C'est ce que le menu du depart montre en
// premier — on choisit d'abord un sujet, puis sa carte — et c'est ce qui permet
// d'en ajouter sans allonger une liste plate : les fleuves ou les continents
// seront une famille de plus, pas une ligne de plus dans un menu deroulant.
export const FAMILLES = [
    { id: 'monde', nom: 'Le monde', emoji: '🌍', resume: 'Les pays de la planète' },
    { id: 'france', nom: 'La France', emoji: '🇫🇷', resume: 'Départements et régions' },
    { id: 'fleuves', nom: 'Les fleuves', emoji: '🌊', resume: 'Les cours d’eau, et où ils se jettent' }
];

// Le nom d'une carte doit se suffire a lui-meme : il se relit seul au palmares,
// loin de la famille qui l'avait introduit. « La France » y designerait deux
// cartes a la fois.
export const CATALOGUE = [
    { id: 'monde-pays', famille: 'monde', nom: 'Le monde', sousTitre: 'Les 197 pays', emoji: '🌍' },
    { id: 'europe-pays', famille: 'monde', nom: 'L’Europe', sousTitre: 'Les 45 pays d’Europe', emoji: '🇪🇺' },
    { id: 'france-departements', famille: 'france', nom: 'Les départements', sousTitre: 'Les 101 départements, leurs préfectures et leurs numéros', emoji: '🏛️' },
    { id: 'france-regions', famille: 'france', nom: 'Les régions', sousTitre: 'Les 18 régions et leurs chefs-lieux', emoji: '🗺️' },
    { id: 'france-fleuves', famille: 'fleuves', nom: 'Fleuves de France', sousTitre: 'Trente-quatre cours d’eau, leur bassin et leur embouchure', emoji: '🏞️' },
    { id: 'monde-fleuves', famille: 'fleuves', nom: 'Fleuves du monde', sousTitre: 'Cinquante-quatre fleuves, de l’Amazone à la Léna', emoji: '🌊' }
];

const charges = new Map();

export async function charger(id) {
    if (charges.has(id)) return charges.get(id);
    const promesse = fetch(`data/${id}.json`)
        .then(reponse => {
            if (!reponse.ok) throw new Error(`atlas ${id} : ${reponse.status}`);
            return reponse.json();
        })
        .then(atlas => {
            atlas.parId = new Map(atlas.entites.map(entite => [entite.id, entite]));
            const [, , largeur, hauteur] = atlas.viewBox.split(' ').map(Number);
            atlas.largeur = largeur;
            atlas.hauteur = hauteur;
            atlas.ratio = largeur / hauteur;
            // Deux valeurs que tout atlas porte desormais ; les defauts gardent
            // le comportement du monde si un fichier ancien les ignore.
            atlas.couverture = atlas.couverture ?? 1.55;
            atlas.mots = atlas.mots ?? {};
            atlas.cartouches = atlas.cartouches ?? [];
            return atlas;
        });
    charges.set(id, promesse);
    return promesse;
}

export const ficheDAtlas = id => CATALOGUE.find(a => a.id === id);
export const nomDAtlas = id => ficheDAtlas(id)?.nom ?? id;
export const familleDe = id => ficheDAtlas(id)?.famille ?? FAMILLES[0].id;
export const cartesDe = famille => CATALOGUE.filter(a => a.famille === famille);
export const ficheDeFamille = id => FAMILLES.find(f => f.id === id) ?? FAMILLES[0];
