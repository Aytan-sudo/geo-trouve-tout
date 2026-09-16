# Géo Trouve-Tout

Un planisphère muet s’affiche, un pays s’allume. Vous le nommez — en choisissant
parmi quatre propositions, ou en l’écrivant vous-même. Jouable au doigt, hors
ligne, sans serveur ni dépendance.

Six cartes : **le monde**, **l’Europe**, les **101 départements** et les
**18 régions** de France, et les **fleuves** — ceux de France, ceux du monde. Ce
qui vaut pour un pays vaut pour un département et pour un fleuve : le jeu change
de carte, jamais de règle.

## Version 1.4.5 — Passeport 1.7.0

Module commun du passeport 1.7.0 : 2048 rejoint le thème Nombres, Snake ouvre le
thème Aventure, Motamorphose le thème Mots, et Dames, Diamants, Laser & Miroirs
et Untangle rejoignent le thème Logique. Rien ne change dans le jeu.

## Version 1.4.4 — Passeport 1.6.0

Module commun du passeport 1.6.0 : Polyominos et Mosaïcomino rejoignent le thème
Logique. Rien ne change dans le jeu.

## Version 1.4.3 — Passeport 1.5.0

Module commun du passeport 1.5.0 : L’Architecte et Solitaire rejoignent le thème
Logique, et les jeux raccordés plus tard entrent d’office dans les profils. Rien
ne change dans le jeu.

## Version 1.4.2 — Passeport 1.4.0

Module commun du passeport 1.4.0, qui raccorde Démineur et Slitherlink au thème
Logique. Rien ne change dans le jeu.

## Version 1.4.1 — Passeport 1.3.0

Module commun du passeport 1.3.0 (style sobre et objectif facultatif pour les
profils). Rien ne change dans le jeu.

## Version 1.4.0 — Une manche réussie, un tampon

Le tampon Géographie tombe aussi quand une partie est réussie, même avant dix
réponses (des questions expirées ont pu en prendre la place) : une manche à
6 sur 10 au moins — le seuil du son de victoire —, ou une série de dix en
marathon. Dix réponses essayées suffisent toujours. Passeport commun 1.2.0.

## Version 1.3.2 — Passeport 1.1.0

Module commun du passeport 1.1.0, qui raccorde SUTOM au thème Mots. Rien ne
change dans le jeu.

## Version 1.3.1 — Passeport plus robuste

Module commun du passeport 1.0.1 : une donnée abîmée n’empêche plus l’export ni
l’ouverture des autres profils, et le jeu continue de fonctionner quand le hub
raccorde de nouveaux jeux avant sa propre mise à jour.

## Version 1.3.0 — Le passeport commun

Depuis le hub, choisir un enfant ouvre le jeu avec ses préférences, sa mémoire,
ses statistiques et sa reprise de partie propres. Dix réponses réellement
essayées donnent un tampon Géographie ; les erreurs comptent et les expirations
seules ne comptent pas. Le bandeau ramène au passeport et indique la validation.
Renommer le profil conserve les données. Une partie reprise conserve le nombre
de réponses du jour. Le mode invité garde les anciennes données, que l’administrateur
peut copier explicitement dans le hub. L’export du hub inclut ces données.
Les fichiers communs sont embarqués pour fonctionner hors ligne ; le service
worker ne purge plus les caches des autres jeux.

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

**Défi du jour** — dix questions tirées de la date, les mêmes pour tous, sans
serveur : le générateur refabrique la manche chez chacun. Série quotidienne,
résultat partageable en emojis. Le lien porte la date, jamais les réponses.

**Chaque carte a son défi**, et un défi ne porte que sur une carte : le monde le
matin, les départements le soir, mais jamais la Colombie et la Corrèze dans la
même série. La carte du défi se choisit dans « Nouvelle partie », et voyage dans
le lien de partage (`?jour=…&carte=…`).

## Les cartes

| Carte | Contenu | Questions propres |
|---|---|---|
| **Le monde** | les 197 pays | capitale |
| **L’Europe** | les 45 pays d’Europe | capitale |
| **Les départements** | les 101 départements | préfecture, **numéro** |
| **Les régions** | les 18 régions | chef-lieu |
| **Fleuves de France** | 34 cours d’eau | **embouchure** |
| **Fleuves du monde** | 54 cours d’eau | **embouchure** |

Les cartes se rangent par famille — *Le monde*, *La France*, *Les fleuves* —, et
le menu se choisit en deux temps : la famille, puis la carte. Les cinq départements et
régions d’outre-mer ont chacun leur **cartouche**, à sa propre échelle, comme
sur une carte d’atlas : les laisser à leur place vraie réduirait la métropole à
un timbre-poste.

Un département se nomme avec son numéro : les propositions, les corrections et
les listes disent **« Var (83) »**. C’est ainsi qu’on les nomme en France, et
l’afficher partout l’apprend sans jamais avoir à le demander — mais la question
du numéro reste un exercice à part, et à l’écrit « 83 » vaut « Var ».

Chaque carte porte ses mots. Le jeu écrit « Quel est ce pays ? », « Quel est ce
département ? », « Quelle est cette région ? » et « Quel est ce cours d’eau ? »
avec le même gabarit, rempli par le vocabulaire du fichier d’atlas — genre
compris. Elle porte aussi ses questions : le numéro n’est proposé que là où il
existe, l’embouchure aussi.

### Un fleuve est une ligne, pas une surface

C’est la seule différence que le moteur connaisse entre une carte de pays et une
carte de fleuves, et elle tient en quatre points. La géométrie est une suite de
points **ouverte** : la refermer joindrait l’embouchure à la source d’un trait
droit à travers le pays. Sa mesure est une **longueur**, pas une aire — une
ligne repliée sur elle-même en aurait une, et elle ne voudrait rien dire. Son
ancre est le **milieu du tracé**, là où une carte scolaire pose le nom. Et
puisqu’un doigt vise mal une ligne de trois pixels, chaque fleuve porte
par-dessus lui une **bande transparente de vingt-deux pixels** qui l’attrape sur
toute sa longueur — épaisseur en pixels d’écran, quel que soit le zoom.

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

**Nommer** ce qui est allumé. Le **trouver** sur la carte muette à partir de son
nom — la carte muette de l’école, et le sens le plus naturel au doigt. Donner sa
**capitale** — sa préfecture pour un département, son chef-lieu pour une région.
Donner son **numéro**, sur les départements : 35, c’est l’Ille-et-Vilaine, et le
clavier devient un pavé de chiffres (avec A et B, sans quoi la Corse-du-Sud
serait intapable). Dire **où il se jette**, sur les fleuves : la Loire va à
l’Atlantique, la Marne va à la Seine — c’est toute la différence entre un fleuve
et une rivière, et c’est la seule question du jeu à couper l’indice de
Découverte, parce que le bassin y répondrait. Ou tout cela en alternance, sans
prévenir.

À quoi s’ajoutent, dans le menu **Nouvelle partie** : la carte, le rythme
(manche de dix ou marathon à trois vies), et le chrono
(sans, ou dix secondes par question). Chaque combinaison a son propre palmarès :
un dix sur dix en Découverte ne concourt pas contre un dix sur dix en Expert.

Deux menus, deux rôles. **Nouvelle partie** (bouton « Partie libre », en bas)
choisit ce qu’on lance — défi du jour ou partie libre, et sous quels réglages.
Les **Options** règlent le jeu lui-même : thème, sons, vibration, aides. Régler
son niveau ne demande donc plus de traverser un écran d’options.

## Écrire un nom

Le clavier du système, sur iPhone, pousse la page vers le haut et masque
exactement ce qu’on regarde. Le jeu a donc le sien, en AZERTY.

La correction est faite pour des enfants sans être laxiste :

- accents, majuscules, traits d’union, apostrophes et articles sont ignorés —
  `etats unis` vaut `États-Unis`, `cote divoire` vaut `Côte d’Ivoire` ;
- les alias déclarés passent : `USA`, `Myanmar`, `RDC`, `Swaziland` ;
- le numéro d’un département répond pour son nom : `83` vaut `Var` ;
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

**Une carte dit ce qu’elle tolère.** Combien elle accepte de perdre sur ses
bords pour remplir l’écran, et jusqu’où le jeu se rapproche pour poser une
question. Sur le monde, la forme du pays est la réponse : on peut grossir tant
qu’on veut. Sur les départements, c’est la *position dans la France* qui répond —
un rectangle vert au milieu de rectangles verts n’apprend rien. Ces cartes-là
plafonnent donc leur cadrage, et l’épingle marque les plus petites. Le
pincement, lui, garde toute sa course.

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

**Le geste de la carte tient en une règle** : le point qui était sous les doigts
y reste, et suit le milieu des doigts s’il se déplace. Zoom et translation ne
sont pas deux gestes, c’en est un seul — celui qu’on connaît des cartes. Le
calcul est sorti du rendu pour se tester sans navigateur
(`apresPincement`, `tests/test-carte.mjs`) : c’est le seul morceau de
`carte.js` qui ne touche pas au DOM, et c’est aussi celui qui a le plus coûté.

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
js/carte.js        rendu SVG, cadrage, pincement, ancres, toucher
js/rendu.js        énoncé, propositions, verdict
js/entree.js       gestes, clavier maison, raccourcis
js/hasard.js       le hasard reproductible
js/stockage.js     préférences, reprise, stats, migrations
js/variantes.js    réglages, sens, mots de chaque carte
js/themes.js       la liste des thèmes
js/defi.js         défi du jour et partage
js/son.js          synthèse WebAudio
js/ui.js           dialogues et compteurs
```

## Les données

- **Natural Earth 1:50m** (domaine public) pour les contours des pays, et pour
  les pays voisins qui servent de fond aux cartes françaises.
- **france-geojson** (Grégoire David, Licence Ouverte) pour les départements et
  les régions, outre-mer compris.
- **Natural Earth rivers** (domaine public) pour les tracés : le 1:50m pour le
  planisphère, le 1:10m *plus* son supplément européen pour la France — le
  fond mondial n’y connaît que cinq cours d’eau français.
- **Les noms français, les capitales, les articles, les alias et les rangs de
  notoriété sont écrits et relus à la main**, dans `scripts/pays.mjs`. Ce n’est
  pas du zèle : le champ `NAME_FR` de Natural Earth est académique, et ses
  capitales sont en réalité les plus grosses villes — on y lit Lagos pour le
  Nigeria, Shanghai pour la Chine, Abidjan pour la Côte d’Ivoire. Dans un jeu de
  géographie, la faute la plus probable n’est pas une erreur de code : c’est une
  capitale fausse enseignée à un enfant. Il en va de même pour les 101
  préfectures et les 18 chefs-lieux, écrits dans `scripts/france.mjs`.
  Les 34 + 54 cours d’eau, leur bassin et leur embouchure sont écrits de même
  dans `scripts/fleuves.mjs`, et **chaque tracé a été relu un par un** contre
  ses coordonnées de source et d’embouchure : la source étiquette « Conie » un
  tracé qui est le Loir, « Aire » un tracé qui finit à l’embouchure de l’Oise.
  Ceux-là ne sont pas dans le jeu.
  `tests/test-atlas.mjs` garde ce contenu — identifiants uniques, ancres dans le
  cadre, contours non vides, aucun alias ambigu, capitales présentes, numéros
  uniques, cartouches qui contiennent bien ce qu’ils annoncent, pas un piège
  qui doublerait une bonne réponse, et, sur les cartes de fleuves, aucun tracé
  refermé ni coupé en morceaux épars.

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
