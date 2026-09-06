// Le chargement des cartes.
//
// Un atlas est un fichier autonome : ses contours sont deja projetes, deja mis
// a l'echelle de son viewBox. Le navigateur n'a donc aucune trigonometrie a
// faire — il pose des chemins SVG et c'est tout. Les fichiers sont fabriques
// par scripts/atlas.mjs, hors ligne, et commites.

export const CATALOGUE = [
    { id: 'monde-pays', nom: 'Le monde', sousTitre: 'Les 197 pays', emoji: '🌍' },
    { id: 'europe-pays', nom: 'L’Europe', sousTitre: 'Les 45 pays d’Europe', emoji: '🇪🇺' }
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
            return atlas;
        });
    charges.set(id, promesse);
    return promesse;
}

export const nomDAtlas = id => CATALOGUE.find(a => a.id === id)?.nom ?? id;
