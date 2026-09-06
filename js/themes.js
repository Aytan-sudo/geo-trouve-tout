// La liste des themes et leur ordre, rien d'autre.
//
// Les couleurs vivent dans css/themes.css, seule source de verite : ce module
// ne connait que des identifiants, un libelle et la couleur de la barre
// d'adresse du telephone — la seule qu'un navigateur exige en JavaScript.

export const THEMES = [
    { id: 'ecolier', libelle: 'Écolier', couleur: '#f4f6f2' },
    { id: 'atlas', libelle: 'Atlas', couleur: '#f6f1e4' },
    { id: 'marine', libelle: 'Marine', couleur: '#0e1b2a' },
    { id: 'encre', libelle: 'Encre', couleur: '#15171d' },
    { id: 'craie', libelle: 'Craie', couleur: '#1b2420' }
];

export const themeDe = id => THEMES.find(theme => theme.id === id) ?? THEMES[0];

export const themeSuivant = id => THEMES[(THEMES.findIndex(theme => theme.id === id) + 1) % THEMES.length];

export function appliquer(id) {
    const theme = themeDe(id);
    document.documentElement.dataset.theme = theme.id;
    const meta = document.getElementById('couleur-barre');
    if (meta) meta.content = theme.couleur;
    return theme;
}
