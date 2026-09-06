# Géo Trouve-Tout — la suite

Journal de bord du jeu. Ce qui est fait est en haut, ce qui reste en bas, et
chaque entrée dit assez pour être reprise dans six mois sans relire le code.

État au 6 septembre 2026 : **1.0.0 publiée**, 262 vérifications vertes,
vérificateur iOS au vert sur iPhone 15 et iPhone SE.

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

## 1.1 — La France

Le gros morceau du contenu scolaire, et la raison d'être du jeu pour un enfant
de CM.

- [ ] **Départements** (101) : contours IGN via `france-geojson`
      (https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements.geojson,
      Licence Ouverte — vérifié accessible le 6/09/2026). Trois questions
      possibles sur le même atlas : nommer, situer, donner le **numéro**, et la
      **préfecture**.
- [ ] **Régions** (18) et leurs chefs-lieux.
- [ ] **La projection est déjà écrite** : `scripts/projection.mjs` exporte
      `lambert93`, jamais utilisé pour l'instant. Paramètres par défaut calés
      sur la métropole (lat1 44, lat2 49, lat0 46.5, lon0 3).
- [ ] **Les DROM en cartouches** : c'est le vrai travail. La Guadeloupe et la
      Réunion ne peuvent pas rester à leur place sans réduire la métropole à un
      timbre-poste. Il faut projeter chaque DROM séparément puis le poser dans
      un encart, ce que `scripts/atlas.mjs` ne sait pas faire aujourd'hui —
      prévoir un champ `cartouches: [{ id, boite, echelle }]` dans le fichier
      d'atlas, et un cadre dessiné par `carte.js`.
- [ ] **Le contenu à la main**, comme pour les pays : noms, numéros,
      préfectures, rangs de notoriété. Un département n'a pas d'article
      (« Trouve le Cantal », « Trouve la Corrèze ») : le champ `article` existe
      déjà et sert aux énoncés.
- [ ] Étendre `tests/test-atlas.mjs` : le numéro doit être unique, la préfecture
      présente, et « 2A »/« 2B » doivent survivre à la normalisation.

## 1.2 — Les fleuves

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
- **`COUVERTURE_MAX` (1.55) dans `js/carte.js` et le `/ 1.55` de `.scene` dans
  `css/interface.css` doivent rester égaux.** C'est la seule valeur dupliquée
  du projet ; elle est commentée aux deux endroits.
- **Le mode « alterne »** existe dans `variantes.js` mais n'a jamais été joué
  longuement : vérifier qu'enchaîner localiser et nommer ne désoriente pas.
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
