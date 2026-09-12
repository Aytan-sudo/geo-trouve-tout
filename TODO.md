# Géo Trouve-Tout — la suite

Journal de bord du jeu. Ce qui est fait est en haut, ce qui reste en bas, et
chaque entrée dit assez pour être reprise dans six mois sans relire le code.

État au 12 septembre 2026 : **1.2.0**, 555 vérifications vertes, vérificateur
iOS au vert sur iPhone 15 et iPhone SE.

---

## 1.2.0 — Les fleuves

Deux cartes de plus, et une famille de plus dans le menu : **34 cours d'eau de
France**, **54 dans le monde**. Le pari de 1.1.0 tient — une carte de fleuves
n'a demandé aucune ligne de moteur. Les énoncés, les sens offerts, le sac de
tirage, le défi du jour, « Ma carte » : tout est venu des tables.

**Ce qui a vraiment changé**, et c'est peu :

- **Une ligne n'est pas une surface**, et `scripts/atlas.mjs` le dit désormais
  en un seul endroit — `SURFACES` et `TRACES`, cinq fonctions chacun. Le reste
  du fichier projette, pose, simplifie et écrit sans savoir lequel des deux il
  tient. Les quatre atlas d'avant sont ressortis **octet pour octet
  identiques** de ce remaniement : c'est ainsi qu'on sait qu'il n'a rien cassé.
- Quatre différences, pas une de plus. Le tracé est **ouvert** (`trait()`, à
  côté de `chemin()` : le refermer joindrait l'embouchure à la source d'un trait
  droit). Sa mesure est une **longueur**. Son ancre est le **milieu du tracé**
  (`ancreLigne`). Et sa découpe au cadre est un **Liang-Barsky segment par
  segment** (`couperLigne`) : Sutherland-Hodgman referme ce qu'il coupe, et le
  Rhin, qui sort du cadre et y revient, en serait ressorti avec un raccourci le
  long du bord.
- **Le doigt.** Un fleuve fait trois pixels de large ; on n'en attrape pas un au
  doigt. Chaque tracé porte donc au-dessus de lui une bande transparente de
  vingt-deux pixels (`pays-touche`, `pointer-events: stroke`). Les épaisseurs
  sont en **pixels d'écran** (`vector-effect: non-scaling-stroke`) : sans cela,
  trois unités sur un planisphère large de quatre mille font un tiers de pixel
  sur un téléphone — dessiné, et invisible.
- L'aimantation sur l'ancre, elle, est **coupée pour les tracés**. Elle sert aux
  micro-États ; sur une ligne, elle ferait répondre « Seine » à un doigt posé
  sur l'embouchure de la Loire, si le milieu de la Seine se trouvait plus près.
  La bande de touche, elle, répond juste sur toute la longueur.
- **« Où se jette-t-il ? »** est un sens de plus dans la table. Il coupe
  l'indice de Découverte (`sansIndiceGroupe`) : le bassin de la Loire
  répondrait à la question posée sur le Cher — le même scrupule qui tient la
  question du numéro à l'écart de « Var (83) ».
- **Deux propositions identiques étaient possibles**, et personne ne l'avait vu
  parce qu'aucune carte n'en produisait : le Cher et l'Allier se jettent tous
  les deux dans la Loire. Quatre boutons dont deux identiques, l'un juste et
  l'autre faux, ne sont plus une question. `fabriquer()` ne garde que des
  libellés distincts, et complète chez les voisins les plus proches **sans
  retirer au sort** — un tirage de plus décalerait toute la manche, et le défi
  du jour cesserait d'être le même pour tout le monde.
- `juger()` ne connaît plus les sens un par un : tout sens qui `exige` un champ
  se corrige en comparant à ce champ. La capitale, le numéro et l'embouchure
  sont passés de trois branches à une.
- « Touchez **le pays** sur la carte » était la dernière phrase du jeu à tenir
  pour acquis qu'on y cherchait un pays. L'invite du clavier maison vient elle
  aussi de la table des sens, maintenant : la question de l'embouchure invitait
  à « écrire le nom ».
- **L'aide à la saisie** (la dette décrite plus bas) se coupe désormais sur tout
  sens qui demande un champ, et non sur le seul numéro. Elle propose des noms
  d'entités : en mode capitales, elle offrait des noms de pays à qui cherche une
  ville. Le code dort toujours — aucun niveau ne l'active — mais il est juste le
  jour où il se réveillera.

**Le bug que la capture a montré et qu'aucun test ne voyait.** La Volga était
dessinée coupée en deux au milieu de la Russie. Le seuil qui jette les îlots
invisibles jetait aussi les **tronçons de liaison** : la source la livre en
seize morceaux dont dix font moins de cent kilomètres, et ce sont eux qui la
relient. Un îlot minuscule qu'on jette ne manque à personne ; un tronçon court,
si. Seuil abaissé au grain de la simplification, et `tests/test-atlas.mjs`
mesure maintenant la distance de chaque tronçon au reste de son fleuve —
vérifié en remettant le bug, qui le fait bien échouer.

**Le contenu s'écrit à la main, et il a fallu le relire un par un.** Natural
Earth étiquette « Conie » un tracé qui est en réalité le Loir, « Aire » un tracé
qui finit à l'embouchure de l'Oise, « Arc » un tracé qui devient l'Isère. Aucun
de ceux-là n'est dans le jeu : mieux vaut un fleuve manquant qu'un fleuve faux.
Chaque tracé retenu a été vérifié contre ses coordonnées de source et
d'embouchure. Le Colorado, lui, porte un cadre : il y en a deux dans le monde,
un dans les Rocheuses et un en Patagonie.

Reste ouvert sur les fleuves :

- [ ] **L'Isère, l'Oise, l'Ain, l'Orne, l'Hérault, le Var** sont absents de
      Natural Earth, à quelque résolution que ce soit. Une source hydrographique
      française (SANDRE, ou l'IGN) les donnerait. À rouvrir si le manque se
      remarque à l'usage.
- [ ] **Le Paraná se dessine en Y**, parce que la source étiquette « Paraná » le
      Paraguay qui le rejoint. Ce n'est pas faux — c'est le confluent — mais
      cela se lit comme un fleuve doublé.
- [ ] Le rang de notoriété, encore un jugement. Treize cours d'eau français en
      Découverte : à revoir après avoir vu un enfant jouer.

## 1.1.2 — le pincement partait en vrille

Rapporté par les joueurs : « dézoomer ou zoomer part en vrille, c'est difficile
à stabiliser, on s'attend au fonctionnement de Google Maps ». Ils avaient
raison, et l'intuition « c'est pris comme une translation en même temps que le
zoom » désignait exactement la faute.

`zoomer()` reposait l'ancre du pincement **au milieu du planisphère** :

```js
dx = atlas.largeur / 2 - avant.x * echelle;   // le centre du viewBox, pas les doigts
```

Autrement dit, à chaque événement, ce qui se trouvait entre les doigts était
projeté au centre de la carte. Mesuré sur iPhone 15 : **189 px de dérive
horizontale pour un seul pas de pincement** sur un écran large de 393 — et un
pincement réel en produit une soixantaine par seconde. L'expression était juste,
le repère faux ; rien n'en paraissait à la lecture.

- `pincer(facteur, depuis, vers)` remplace `zoomer()` : le point sous le milieu
  des doigts y reste, et **suit ce milieu s'il se déplace**. Écarter grossit,
  glisser déplace, et les deux ensemble font un seul geste — celui des cartes
  qu'on connaît. Dérive mesurée après correction : 0 px, y compris sur quarante
  pas d'affilée.
- **La molette suit la course** au lieu d'avancer par pas fixe de 1,16 : un cran
  de souris grossit d'un cinquième, un glissement de trackpad par petites
  touches. Un trackpad envoie des dizaines d'événements par seconde, et le pas
  fixe faisait bondir la carte à chaque impulsion.
- Le calcul est sorti du rendu (`apresPincement`, exporté par `js/carte.js`)
  pour se tester **sans navigateur** : `tests/test-carte.mjs` vérifie que
  l'ancre ne bouge pas, qu'elle suit la translation, qu'elle tient aux deux
  bornes de grossissement, et — nommément — qu'elle ne saute plus au centre.

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

- **`scripts/cache/`** garde le GeoJSON source, ignoré par git : 2,9 Mo pour les
  pays, 10 Mo de plus depuis les fleuves (le 1:10m mondial et son supplément
  européen). Le script les retélécharge tout seuls s'ils manquent.
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
