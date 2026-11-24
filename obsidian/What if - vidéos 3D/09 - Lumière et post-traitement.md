---
tags: [what-if, lumiere, post-traitement, shader, three-js]
aliases: [Post-traitement What if, finish, HeatShader]
créé: 2026-11-24
---

# Lumière et post-traitement

Retour à [[00 - Carte du projet What if]] · Outils : [[05 - Boîte à outils 3D lib.js]]

## Base commune (`makeStage`)
- Tons `ACESFilmicToneMapping`, ombres `PCFSoftShadowMap`.
- Lumière d'ambiance : `RoomEnvironment` passé dans un `PMREMGenerator`. On règle `scene.environmentIntensity` par décor : **0,02** pour une carte de nuit, **0,28** en plein jour.

## La chaîne `finish()`
Ordre des passes : `RenderPass` → `GTAOPass` (option `ao`) → **ondulation de chaleur** (`heat`) → `BokehPass` (`dof`) → `UnrealBloomPass` (`bloom`) → `OutputPass` → `FinishShader` (vignette, grain, relèvement des noirs `lift`, saturation `sat`).

Valeurs par défaut : `bloom [0.45, 0.6, 0.85]` (force, rayon, seuil), `ao: true`, `vig 0.35`, `grain 0.03`, `lift [0, 0, 0]`, `sat 1.0`, `dof: null`, `heat: 0`. Chaque cadrage peut les remplacer dans ses options (voir [[08 - Caméras et cadrage 9-16]]).

> [!warning] Occlusion ambiante
> Le `GTAOPass` dessinait des **rectangles sombres** dans plusieurs plans avec le rendu logiciel. On le coupe (`ao: false`) presque partout ; les ombres douces et l'éclairage d'ambiance suffisent.

- Profondeur de champ : `dof: { focus, aperture, maxblur: 0.008 }`, à réserver aux gros plans (téléphone, thermomètre).
- Grain : sa graine change à chaque image (`seed = (i × 0,137) mod 1`), sinon il reste figé et ressemble à une tache sur l'objectif.

## L'ondulation de chaleur (épisode 3)
Un shader qui décale les pixels horizontalement par deux sinusoïdes, surtout dans le bas de l'image (là où l'air chaud monte du sol) :
```glsl
float w = smoothstep(0.95, 0.2, uv.y);                       // fort en bas, nul en haut
float n = sin(uv.y * 140.0 + time * 7.0) * 0.6 + sin(uv.y * 63.0 - time * 4.3 + uv.x * 9.0) * 0.4;
float m = sin(uv.x * 90.0 + time * 5.1 + uv.y * 30.0);
uv.x += n * amp * w;  uv.y += m * amp * 0.45 * w;
```
`video.html` met à jour `time` à chaque image. Réglage par plan : 0,0005 dans la chambre, 0,0012 à 0,0016 pour les rues et les toits, **0,0022 à 0,0024** pour les rails brûlants et le pic à 50 °C. Au-delà, l'image paraît floue plutôt que chaude.

## Recettes d'éclairage
> [!tip] Plein jour caniculaire sans image délavée
> Premier essai raté : un énorme halo de soleil additif, un soleil trop fort et beaucoup de bloom rendaient toute l'image blanche. Réglage final :
> - soleil `2.2`, ciel/sol (`hemi`) environ `0.42`, ambiance `0.28` ;
> - ciel en dégradé, bleu voilé en haut vers blanc chaud à l'horizon ;
> - disque solaire : noyau à 0,9 d'opacité, halo 1,7 fois plus grand à 0,12 seulement ;
> - bloom `[0.22, 0.4, 0.95]` : seuls le soleil et les reflets brillent ;
> - brouillard repoussé, brume de poussière très légère (opacité ≈ 0,025).

> [!tip] Nuit
> Peu de lumière d'ambiance, fenêtres émissives (`E()`), halos (`glow`) pour les lampadaires, scintillement (`flick`) pour les télés et les bougies. Les cartes de nuit : ambiance 0,02, villes en points émissifs.

> [!tip] Lumières de détail
> - Téléphone dans le noir : un **spot** depuis l'écran, orienté vers la position de la tête, plutôt qu'une lumière ponctuelle qui surexposait le plafond bas.
> - Éclair (P13) : un trait en zigzag (`THREE.Line` de 14 points) et un grand halo, en **deux éclats** (de 1,2 à 1,45 s, puis de 1,55 à 1,65 s) pendant lesquels la lumière principale passe de 0,9 à 3,9. Le tonnerre est posé à `T('P13') + 1.22` dans la bande-son.
> - Rayon de soleil par le vasistas : `spot` + `shaft` (cône additif) + poussière qui flotte dedans.
