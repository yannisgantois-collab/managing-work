---
tags: [what-if, typographie, sous-titres, css]
aliases: [Typographie What if, Sous-titres, nb()]
créé: 2026-11-24
---

# Textes à l'écran et typographie

Retour à [[00 - Carte du projet What if]] · Zones de l'écran : [[08 - Caméras et cadrage 9-16]]

## Principe
Les textes ne sont **pas** dans la 3D : ce sont des éléments HTML posés par-dessus, toujours nets en 1080 × 1920, même quand la 3D est calculée à 75 %. Toutes les tailles s'expriment en unités `--u` (1/1080 de la largeur), par exemple `calc(54*var(--u))`.

## Les éléments
| Élément | Position | Police |
|---|---|---|
| Titre (P01) | centré, à 25 % du haut, 840 u de large | Newsreader 500, 80 u |
| Compteur, étiquette | à gauche (76 u), à 44,5 % du haut | Inter 600, 23 u, lettres espacées 0,2 em |
| Compteur, valeur | sous l'étiquette | Newsreader 500, 90 u, chiffres tabulaires |
| Compteur, ligne de temps | sous la valeur | Inter 600, 21 u |
| Sous-titre | 70 u du bord, 860 u de large, à 63 % du haut | Newsreader italique 500, 54 u, interligne 1,2 |
| Carte de fin | plein écran, fond `#101113` | titre Newsreader 68 u, texte IBM Plex Mono 26 u, appel à l'action 30 u souligné |

- Derrière le compteur et le sous-titre : un **dégradé radial sombre** discret (opacité 0,42) plutôt qu'un bandeau. Le texte reste lisible sur un ciel blanc sans cacher l'image.
- Chiffres **tabulaires** (`font-variant-numeric: tabular-nums`) : le compteur qui défile ne tremble pas.
- Le sous-titre apparaît à 0,12 s, en fondu de 0,22 s, en montant de 8 px. La flèche de la carte de fin oscille de 7 px.
- Le pseudo du compte en fin de vidéo est **optionnel** : il ne s'affiche que si `handle` est rempli dans `shots.json` (le « @ton compte » a été retiré à la demande).

## Règles du français à l'écran
La fonction `nb()` de `video.html` corrige automatiquement :
```js
const nb = (s) => s
  .replace(/ ([?!:;»])/g, ' $1')            // espace insécable avant ? ! : ; »
  .replace(/« /g, '« ')                     // et après «
  .replace(/(\d) (\d{3})/g, '$1 $2')        // espace fine insécable des milliers : 14 802
  .replace(/(\d) (?=(?:h|heures?|min|minutes?|jours?|ans|%|°C)(?![\p{L}\d]))/gu, '$1 ') // 50 °C, 3 jours
  .replace(/(\d h) (\d)/g, '$1 $2');   // 6 h 30 reste groupé
```
> [!warning] Le titre coupé « 50 / °C ? »
> Avant d'ajouter `°C` à la liste des unités, le titre se coupait entre le nombre et l'unité. Toute nouvelle unité utilisée dans un épisode (km, MW, litres…) doit être ajoutée à cette expression.

- Virgule décimale : « 49,4 °C », jamais « 49.4 ».
- Le compteur : étiquette en capitales (« TEMPÉRATURE À PARIS »), valeur en chiffres, ligne de temps en capitales (« JOUR 4 · 16:00 »).

## Écrire un bon sous-titre
- **2 lignes au maximum**, 860 px par ligne, environ **17 caractères par seconde** de lecture : un plan de 4 s porte au plus 65 à 70 caractères.
- Couper les lignes **à la main** avec `\n` dans `shots.json`. `text-wrap: balance` produisait des coupures laides et des mots orphelins.
- Couper après une virgule ou entre deux groupes de sens, jamais entre un article et son nom, ni entre un nombre et son unité.
- Une seule idée par plan ; le chiffre fort va dans le compteur, pas dans la phrase.

> [!example] Bon et mauvais découpage
> Mauvais : « Les rails chauffent jusqu'à 60 / °C. Les trains doivent / ralentir. »
> Bon (plan P04 de l'épisode 3) : « Les rails chauffent jusqu'à 60 °C.\nLes trains doivent ralentir. »
