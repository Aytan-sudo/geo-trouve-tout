# Géo Trouve-Tout

Un planisphère muet s’affiche, un pays s’allume. Vous le nommez — en choisissant
parmi quatre propositions, ou en l’écrivant vous-même. Jouable au doigt, hors
ligne, sans serveur ni dépendance.

## La particularité : le jeu retient ce que vous ne savez pas

Un quiz de géographie qui tire au hasard vous repose éternellement les pays que
vous connaissez déjà. Ici, chaque pays porte une note de maîtrise. Une bonne
réponse comble la moitié du chemin qui reste, une erreur remet presque à zéro,
et le tirage pèse en faveur de ce que vous ratez et de ce que vous n’avez jamais
vu. Un pays acquis s’espace ; l’oubli le fait doucement remonter.

Le résultat se regarde dans **Ma carte** : le planisphère prend la couleur de ce
que vous savez — vert pour l’acquis, jaune pour l’hésitant, gris pour le jamais
vu. Ce qui reste pâle est exactement ce qu’il reste à apprendre, et la liste des
pays à revoir est dessous, à portée de doigt.

Le défi du jour fait exception : il reste le même pour tout le monde, donc il
ignore votre mémoire pour composer sa manche. Ce que vous y ratez s’apprend
comme le reste.

## Jouer

`https://aytan-sudo.github.io/geo-trouve-tout/`

Dix questions par manche. Une réponse juste enchaîne toute seule ; une erreur
attend, le temps de lire ce qu’il fallait répondre et de voir le pays passer au
vert sur la carte. En fin de manche, les pays manqués se rejouent d’un bouton.

Pincez pour zoomer, glissez pour vous promener, touchez la mire pour revoir la
carte entière.

**Défi du jour** — dix pays tirés de la date, les mêmes pour tous, sans serveur :
le générateur refabrique la manche chez chacun. Série quotidienne, résultat
partageable en emojis. Le lien porte la date, jamais les réponses.

## Les niveaux

Chaque pays porte un rang de notoriété, de 1 (ceux qu’une école française
attend) à 4 (les micro-États). Un niveau n’est donc pas un réglage vague, c’est
un sac de tirage.

| Niveau | Sac | Réponse | Aides |
|---|---|---|---|
| **Découverte** | les 57 pays les plus connus | 4 choix | continent affiché, zoom sur la région, propositions lointaines |
| **Écolier** | une centaine | 4 choix | zoom, propositions du même continent |
| **Voyageur** | tous | 4 choix | rien, et les voisins servent de pièges |
| **Expert** | tous | le nom à écrire | rien |

## Les modes de question

**Nommer** le pays allumé. Le **trouver** sur la carte muette à partir de son
nom — la carte muette de l’école, et le sens le plus naturel au doigt. Donner sa
**capitale**. Ou les trois en alternance, sans prévenir.

À quoi s’ajoutent, dans les Options : la carte (le monde ou l’Europe), le rythme
(manche de dix ou marathon à trois vies), et le chrono (sans, ou dix secondes
par question). Chaque combinaison a son propre palmarès : un dix sur dix en
Découverte ne concourt pas contre un dix sur dix en Expert.

## Écrire un nom

Le clavier du système, sur iPhone, pousse la page vers le haut et masque
exactement ce qu’on regarde. Le jeu a donc le sien, en AZERTY.

La correction est faite pour des enfants sans être laxiste :

- accents, majuscules, traits d’union, apostrophes et articles sont ignorés —
  `etats unis` vaut `États-Unis`, `cote divoire` vaut `Côte d’Ivoire` ;
- les alias déclarés passent : `USA`, `Myanmar`, `RDC`, `Swaziland` ;
- une lettre de travers passe aussi, et l’orthographe juste s’affiche ;
- **mais** écrire le nom d’un autre pays reste une erreur, même à une lettre
  près. L’Iran n’est pas l’Irak, la Gambie n’est pas la Zambie, l’Islande n’est
  pas l’Irlande. Un test parcourt la carte, trouve toutes les paires à une
  lettre, et vérifie qu’aucune ne passe pour l’autre.

## Sous le capot

**Les cartes sont fabriquées, pas calculées.** `scripts/atlas.mjs` télécharge
Natural Earth, projette, simplifie, quantifie et écrit `data/*.json`. Il tourne
à la main, son résultat est commité. Le jeu publié ne projette rien : ses
fichiers contiennent déjà des coordonnées d’écran, et le navigateur se contente
de poser des chemins SVG. C’est ce qui rend la carte gratuite sur un téléphone.

**Equal Earth plutôt que Mercator.** Les surfaces y sont justes. Apprendre la
géographie sur une carte où le Groenland fait la taille de l’Afrique, c’est
apprendre faux.

**SVG plutôt que canvas**, pour trois raisons qui se cumulent : le toucher est
gratuit (l’événement arrive sur le pays touché, sans calcul de collision), les
couleurs restent dans `css/themes.css` où la convention veut qu’elles soient, et
chaque pays peut porter son libellé accessible. Le zoom n’anime pas le `viewBox`
mais la transformation d’un groupe — le navigateur la traite comme une
composition, ce qui reste fluide avec deux cents contours à l’écran.

**Les micro-États.** Nauru fait vingt et un kilomètres carrés : à l’échelle du
monde, son contour se replie sur un point et disparaît à l’arrondi. Le pays
serait invisible *et* intouchable. Le script leur pose donc un losange minimal
sur leur ancre, comme une carte scolaire pose un point sur Monaco, et le jeu les
signale d’une épingle qui garde sa taille à l’écran quel que soit le zoom.

**La carte remplit sa boîte.** Un planisphère fait deux fois plus large que
haut ; l’écran d’un téléphone tenu debout fait l’inverse. Deux mesures se
répondent : la zone de jeu prend elle-même le rapport de la carte, et le peu de
vide qui reste est comblé par un grossissement plafonné — ce qui sort du cadre
est de l’océan. Aux niveaux sans aide, la cible n’est pas grossie mais elle est
amenée au centre : une carte rognée ne doit jamais laisser le pays cherché hors
du champ.

**Le noyau ne touche à rien.** `questions.js`, `reponse.js`, `memoire.js` et
`partie.js` ignorent le DOM, l’horloge et `Math.random` — le hasard entre par la
porte, à graine. Tout se teste en Node, et c’est ce qui rend possible le défi du
jour sans serveur.

```
js/app.js          assemblage, rien d'autre
js/atlas.js        chargement des cartes
js/questions.js    tirage, distracteurs, indices        ← noyau
js/reponse.js      normalisation, alias, tolérance      ← noyau
js/memoire.js      maîtrise par pays, poids de révision ← noyau
js/partie.js       manche, score, vies, chrono          ← noyau
js/carte.js        rendu SVG, zoom, ancres, toucher
js/rendu.js        énoncé, propositions, verdict
js/entree.js       gestes, clavier maison, raccourcis
js/hasard.js       le hasard reproductible
js/stockage.js     préférences, reprise, stats, migrations
js/variantes.js    tous les réglages, isolés
js/themes.js       la liste des thèmes
js/defi.js         défi du jour et partage
js/son.js          synthèse WebAudio
js/ui.js           dialogues et compteurs
```

## Les données

- **Natural Earth 1:50m** (domaine public) pour les contours.
- **Les noms français, les capitales, les articles, les alias et les rangs de
  notoriété sont écrits et relus à la main**, dans `scripts/pays.mjs`. Ce n’est
  pas du zèle : le champ `NAME_FR` de Natural Earth est académique, et ses
  capitales sont en réalité les plus grosses villes — on y lit Lagos pour le
  Nigeria, Shanghai pour la Chine, Abidjan pour la Côte d’Ivoire. Dans un jeu de
  géographie, la faute la plus probable n’est pas une erreur de code : c’est une
  capitale fausse enseignée à un enfant. `tests/test-atlas.mjs` garde ce
  contenu — identifiants uniques, ancres dans le cadre, contours non vides,
  aucun alias ambigu, capitales présentes.

Les frontières suivent Natural Earth et ne sont pas arbitrées ici. Israël et la
Palestine n’ont pas de capitale déclarée : ils restent jouables sur la carte et
sortent du mode capitales.

## Développer

```bash
npm run serve     # http://localhost:8773
npm test          # le noyau, les données, les cinq vérifications structurelles
npm run check     # node --check sur chaque module
npm run atlas     # refabrique data/*.json depuis Natural Earth
```

Le vérificateur iOS du dossier parent est le juge d’appel :

```bash
node ~/dev/python/Jeux_Pages/OUTILS/verifier-ios.mjs
```

## Ce qui n’est pas là

Pas de globe en trois dimensions, pas de tuiles raster, pas de fond de carte
téléchargé — aucun octet ne quitte la machine du joueur. Pas de drapeaux : les
emojis de drapeaux ne s’affichent pas sur Windows, et embarquer deux cents
images contredirait tout le reste. Pas de classement en ligne, pas de compte.

L’Antarctique n’est pas dessiné : aucun pays à y trouver, et il coûtait un quart
de la hauteur — cher payé sur un téléphone tenu debout.

Les fleuves, les départements français et les autres continents ne sont pas
encore là. Ils arriveront comme des atlas de plus : le moteur ne fait aucune
différence entre une carte de pays et une carte de fleuves — l’une se remplit,
l’autre se trace.
