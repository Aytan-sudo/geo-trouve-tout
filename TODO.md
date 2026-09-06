# Géo Trouve-Tout — la suite

Journal de bord du jeu. Ce qui est fait est en haut, ce qui reste en bas, et
chaque entrée dit assez pour être reprise dans six mois sans relire le code.

État au 7 septembre 2026 : **1.1.1**, 453 vérifications vertes, vérificateur iOS
au vert sur iPhone 15 et iPhone SE.

---

## 1.1.1 — le numéro dans le nom

Un département se nomme avec son numéro. Les propositions, les corrections, la
liste des ratés et celle des pays à revoir disent désormais **« Var (83) »** —
c'est ainsi qu'on les nomme en France, et l'afficher partout l'apprend sans
jamais avoir à le demander.

- `nomAffiche()` (dans `js/variantes.js`) est le seul endroit qui décide, et
  les cartes sans numéro ne changent pas d'un caractère.
- La question du **numéro** reste un exercice à part : ses propositions sont des
  numéros nus, et celles des préfectures des villes. Coller un numéro à un
  numéro n'aurait aucun sens, et le faire sur la question du numéro donnerait la
  réponse.
- À l'écrit, **« 83 » vaut « Var »** : le numéro rejoint les libellés qui
  désignent une entité (`js/reponse.js`). Ce que le jeu affiche, il l'accepte.
  « 84 » reste une confusion, pas une faute de frappe — les numéros sont uniques
  et un test le garde.

## 1.1.0 — La France, et une carte n'est plus un cas particulier

Fait. Les 101 départements et les 18 régions, outre-mer compris.

- [x] **Départements** (101) et **régions** (18), contours `france-geojson`
      (Licence Ouverte), fichiers « avec outre-mer » — les seuls à porter les
      cinq DROM. Projection Lambert conique pour la métropole.
- [x] **Les DROM en cartouches.** Chacun est projeté pour lui-même en plate
      carrée corrigée du cosinus (un cône calé sur la métropole enverrait la
      Réunion à l'autre bout du plan), puis posé dans sa case, à sa propre
      échelle. La colonne occupe 26 % de la largeur, à gauche. Le cadre est
      dessiné, **jamais le nom** : l'écrire donnerait la réponse.
- [x] **Le contenu à la main** : noms, articles, préfectures, chefs-lieux,
      numéros, rangs de notoriété — `scripts/france.mjs`. Les rangs découpent
      31 / 71 / 97 / 101 départements selon le niveau.
- [x] **La question du numéro**, avec un pavé de chiffres qui porte A et B :
      sans eux, 2A et 2B seraient intapables. « 1 » vaut « 01 ».
- [x] `tests/test-atlas.mjs` étendu : numéros uniques et à deux chiffres,
      « 2A »/« 2B » distincts après normalisation, cartouches dans le cadre et
      qui contiennent bien ce qu'ils annoncent, mots complets, sacs jouables
      dans chaque sens à chaque niveau.

**Ce que l'ajout a changé dans le moteur**, et qui servira aux cartes
suivantes :

- **Chaque atlas porte ses mots** (`atlas.mots`) : « pays », « département »,
  « région », avec leur genre. Les énoncés sont des gabarits — « {quelEst}
  {ceEntite} ? » — remplis par la carte. C'est ce qui permet d'écrire
  « Quelle est cette région ? » sans une ligne de code de plus.
- **Chaque atlas déclare ses sens** : `exige` nomme le champ qu'une entité doit
  porter pour que la question ait une réponse. Le monde n'a pas de numéros, donc
  pas la question ; une carte de fleuves n'aura pas de chef-lieu.
- **Chaque atlas dit ce qu'il tolère** : `couverture` (ce qu'il accepte de perdre
  sur les bords) et `zoomCadrage` (jusqu'où le jeu se rapproche pour poser une
  question). La valeur dupliquée entre `js/carte.js` et `css/interface.css`,
  signalée ici en dette, **n'existe plus** : elle vient du fichier d'atlas et
  passe par une variable CSS.
- **`continent` est devenu `groupe`** : le continent d'un pays, la région d'un
  département. Distracteurs et indices n'ont pas changé de code.
- **Un défi du jour par carte.** La graine mêle la date et l'identifiant de la
  carte ; celle du monde est inchangée, pour que les défis publiés se rejouent.
  Une manche sort d'un seul sac, donc d'un seul atlas — `tests/test-questions.mjs`
  le vérifie carte par carte et sens par sens.
- **Une question sans réponse était possible.** En « alternance », le sac garde
  toutes les entités — c'est le principe — et le sens se tire ensuite. Israël et
  la Palestine, qui n'ont pas de capitale déclarée, tombaient donc parfois sur
  la question des capitales : bonne réponse `undefined`, un bouton vide parmi
  quatre. `fabriquer()` rabat maintenant sur le nom, et un test parcourt une
  longue alternance pour s'en assurer.
- **Les pièges servaient à rien.** La table de `scripts/pays.mjs` — « Angleterre »,
  « Hollande », « Congo » — n'était écrite dans aucun fichier d'atlas : le jeu
  ne l'a jamais lue. Elle y est maintenant, filtrée par carte, avec les régions
  d'avant 2016 pour la France (« Aquitaine », « Picardie », « Rhône-Alpes »…).
  Un test refuse désormais un piège mort ou muet.

Reste ouvert sur la France :

- [ ] Les **arrondissements** et les **cantons** : la source les a, le jeu ne
      les propose pas. À rouvrir seulement si quelqu'un les demande.
- [ ] Le rang de notoriété des départements est un jugement, comme celui des
      pays. 31 en Découverte : à revoir après avoir vu un enfant jouer.

## 1.0.1 — le premier retour de joueur

Quatre remarques, quatre corrections. Elles valent d'être notées : trois d'entre
elles ne levaient aucune erreur et ne se voyaient qu'à l'œil.

- **Le halo de l'épingle traversait l'écran en diagonale.** `transform-origin:
  center` sur un élément SVG ne désigne pas le centre de l'élément : sans
  `transform-box: fill-box`, le repère est la boîte du `viewBox`, donc le centre
  de la carte, à deux mille unités de là. Le halo ne battait pas, il glissait.
  Corrigé dans `css/carte.css`, et le battement perpétuel est devenu une seule
  ouverture qui se pose — il attirait l'œil pendant toute la question.
- **Les épingles étaient minuscules.** Leurs rayons sont écrits en pixels, mais
  le groupe vivait à l'échelle du `viewBox` : un rayon de 7 sur un planisphère
  large de 4000 faisait un point d'un pixel et demi sur un téléphone.
  `placerMarqueurs()` compense maintenant le rapport d'affichage — ce que le
  commentaire du fichier promettait déjà.
- **Les pastilles de « Ma carte » survivaient à la partie suivante** et
  débordaient sous les réponses. `rendu.question()` les retire désormais à
  chaque question, et `quitterProgression()` avec l'écran.
- **La barre du haut n'avait que des glyphes.** Ils se lisaient comme des
  décorations : ce sont maintenant des boutons avec surface, contour et nom
  (Règles, Thème, Options, Son / Muet).
- **Le type de partie a son propre menu.** Il était noyé dans les Options ;
  « Partie libre » ouvre à présent *Nouvelle partie*, qui montre les deux modes,
  les cinq réglages de la partie libre, et le bouton qui lance. Les Options ne
  gardent que le jeu lui-même — thème, sons, aides — et un renvoi vers ce menu.

- **Dix-sept pixels de défilement sur un écran qui ne défile pas.** La zone
  d'annonce des lecteurs d'écran (`.annonce`) est absolue mais n'avait pas de
  coordonnées : elle restait donc à sa place dans le flux, sous une page haute
  de 100 %. Un `top: 0; left: 0` suffit. Se voyait sur ordinateur (une barre de
  défilement), pas dans le vérificateur iOS, qui ne regarde que l'horizontale.

- **Deux bugs trouvés en chemin, dans la même mécanique.** Changer de carte en
  pleine partie remplaçait le planisphère sous la question en cours — on lisait
  « Quel est ce pays ? » devant l'Europe, avec la Colombie pour réponse. Et
  surtout : la carte des réglages servait aussi au **défi du jour**, si bien
  qu'un joueur ayant choisi l'Europe jouait un défi composé en Europe, différent
  de celui de tout le monde, et rangé au palmarès sous le nom du monde. La carte
  se charge désormais au départ d'une partie (`lancer()` dans `js/app.js`,
  jamais au changement de réglage), et la configuration enregistrée dit la carte
  réellement jouée.

  **Écart assumé avec la convention** (`convention.md`, §2 « Interface type »,
  qui met mode et difficulté dans les Options) : un joueur qui veut changer de
  niveau ne devrait pas traverser un formulaire de réglages. À rediscuter pour
  la collection si le cas se répète.

---

## À faire d'abord : ce que WebKit ne sait pas dire

Le vérificateur du dossier `OUTILS` tourne dans WebKit **sur macOS**. Cinq
points lui échappent, et aucun n'est vérifié à ce jour. Ils demandent un vrai
iPhone — simulateur ou téléphone :

- [ ] **Le son.** Il est écrit selon les deux règles de la convention (plancher
      à 311 Hz, contexte audio préparé au premier `pointerdown` dans `app.js`),
      et `tests/test-son.mjs` garde le plancher. Mais personne ne l'a entendu
      sur un haut-parleur de téléphone. C'est le point le plus probable de
      panne silencieuse — il a coûté trois versions à 2048.
- [ ] **L'installation sur l'écran d'accueil** et le mode `standalone` : le
      manifeste est complet, l'icône 180 est en PNG, rien ne le prouve.
- [ ] **La safe-area réelle** sous l'encoche et la barre d'accueil.
- [ ] **La barre Safari qui se rétracte** au défilement : la mise en page est en
      `height: 100%` avec `env(safe-area-inset-*)`, à confirmer en vrai.
- [ ] **La vibration** (`navigator.vibrate`) : sans effet sur iOS Safari à ce
      jour, l'option existe et ne coûte rien. À vérifier, et à documenter comme
      limite si elle reste muette.

---

## 1.2 — Les fleuves

*(Le travail d'infrastructure est fait : une famille de plus dans
`js/atlas.js`, un vocabulaire, un sens propre. Le reste est de la géométrie.)*

- [ ] **Fleuves de France** (~20) et **fleuves du monde** (~30). Source :
      Natural Earth `ne_50m_rivers_lake_centerlines`, domaine public.
- [ ] Le moteur ne fait **aucune** différence entre une carte de pays et une
      carte de fleuves. Ce qui change : la géométrie est une ligne, pas une
      surface. Prévoir un champ `trait: 1` sur l'entité, et dans `carte.css`
      un `fill: none; stroke: var(--cible); stroke-width: 3`.
- [ ] `scripts/geometrie.mjs` calcule des aires et des ancres de polygone :
      pour une ligne, l'ancre est le point milieu du tracé, et l'« aire » n'a
      pas de sens — c'est la longueur qui décide de `minuscule`.
- [ ] Le toucher d'une ligne fine est difficile au doigt : prévoir un tracé
      transparent plus épais par-dessus (`stroke-width: 14; stroke: transparent`),
      astuce SVG classique, à ajouter dans `creerCarte`.
- [ ] Question supplémentaire propre aux fleuves : « où se jette-t-il ? ».

## 1.3 — Les continents

- [ ] Afrique, Asie, Amériques, chacun son atlas, chacun sa projection conique.
      Le travail est le même que pour `europe-pays` : une entrée dans la table
      `ATLAS` de `scripts/atlas.mjs`, un cadre de découpe large, un cadre de
      vue serré, et la liste des pays retenus.
- [ ] Ajouter les entrées correspondantes dans `CATALOGUE` (`js/atlas.js`) —
      et ne pas oublier `sw.js`, dont un test vérifie l'exhaustivité.

---

## Idées gardées sous le coude

- **Le mode Explorer** — la carte muette qu'on interroge en touchant les pays,
  sans score ni chrono. La moitié existe déjà : `annoncerPays()` dans `app.js`
  le fait sur l'écran « Ma carte ». Il manque un vrai mode, avec le nom, la
  capitale et le continent affichés proprement.
- **Les drapeaux** : écartés en 1.0 (les emojis de drapeaux ne s'affichent pas
  sur Windows, et deux cents images contrediraient le reste). À rouvrir si on
  trouve un jeu de drapeaux en SVG assez léger et libre.
- **Les mers et océans**, les massifs montagneux : des atlas de points ou de
  zones, même moteur.
- **Une manche « révision pure »** qui ne tire que dans l'hésitant et le jamais
  vu, sans part de hasard.

## Dettes et points de vigilance

- **`scripts/cache/`** garde le GeoJSON source (2,9 Mo), ignoré par git. Le
  script le retélécharge tout seul s'il manque.
- **Les rangs de notoriété sont un jugement**, pas une donnée. 57 pays en rang 1
  est peut-être généreux pour « Découverte » : à revoir après avoir vu un enfant
  jouer.
- ~~`COUVERTURE_MAX` dupliqué entre `js/carte.js` et `css/interface.css`~~ :
  réglé en 1.1.0. Chaque atlas porte sa `couverture`, `js/app.js` la pose en
  variable CSS, et les deux lectures viennent de la même source.
- **L'option « Aide à la saisie » ne fait rien aujourd'hui.** Elle propose les
  noms qui commencent par ce qu'on tape — mais la saisie n'existe qu'en Expert,
  et l'aide s'y désactive volontairement. Elle attend donc un mode écrit à un
  niveau plus doux. À trancher : l'ouvrir à l'Expert (qui deviendrait beaucoup
  plus facile), ou la retirer des Options tant qu'aucun mode ne l'utilise.
- **Le mode « alterne »** n'a toujours pas été joué longuement par un humain :
  vérifier qu'enchaîner localiser, nommer et numéro ne désoriente pas. Le bug
  qu'il cachait — une question sans réponse sur les pays sans capitale — est
  réglé en 1.1.0.
- **Israël et la Palestine** n'ont pas de capitale déclarée et sortent du mode
  capitales. Si un jour le mode capitales devient le mode par défaut, vérifier
  que le sac reste assez grand.

## Publier une mise à jour

1. Bump la version aux **trois** endroits (`package.json`, `sw.js`, `js/app.js`)
   — un test le vérifie, et l'interface l'affiche au bas des Options.
2. `npm test` et `npm run check`.
3. `node ~/dev/python/Jeux_Pages/OUTILS/verifier-ios.mjs` — **et regarder la
   capture**, pas seulement le texte.
4. Une ligne au README si le changement se voit.
5. `git push` : la CI passe les tests, `pages.yml` déploie.
6. Si la description ou les tags changent :
   `node ~/dev/python/Jeux_Pages/HUB/ajouter-jeu.mjs`
