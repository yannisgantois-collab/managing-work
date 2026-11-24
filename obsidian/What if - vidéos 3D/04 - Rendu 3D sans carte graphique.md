---
tags: [what-if, three-js, playwright, chromium, rendu]
aliases: [Rendu headless, three.js headless]
créé: 2026-11-24
---

# Rendu 3D sans carte graphique

Retour à [[00 - Carte du projet What if]] · Voir [[03 - Chaîne de production]]

## Le montage technique
- **three.js r170** dans une page HTML, chargé par une `importmap` depuis `node_modules`.
- La page est servie localement : `python3 -m http.server 8765 --bind 127.0.0.1` (à relancer si la machine redémarre).
- **Playwright** pilote Chromium sans écran avec le rendu logiciel :
  `--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`.
- Polices locales via `@fontsource` (Newsreader, Inter, IBM Plex Mono), chargées avec `document.fonts.load` avant le rendu.

## Le moteur de rendu (`makeStage`)
- `WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })` pour pouvoir capturer l'image.
- Ombres douces (`PCFSoftShadowMap`), tons `ACESFilmicToneMapping`.
- Éclairage d'ambiance par `RoomEnvironment` passé dans un `PMREMGenerator` ; son intensité (`scene.environmentIntensity`) se règle par décor (0,02 pour une carte de nuit, 0,28 en plein jour).

## Rendu image par image (`video.html`)
- La page expose `window.frame(i)` : calcule le temps `t = i / 30`, place la caméra (`CAMANIM`), anime le décor (`objAnim` → `ctx.anim`), met à jour le compteur (`hudValue`), l'apparition du sous-titre, la graine du grain, le temps de l'ondulation de chaleur, puis rend.
- `render-video.js` appelle `frame(i)`, fait une capture JPEG (qualité 93) et l'envoie dans un ffmpeg ouvert (`image2pipe`, libx264, CRF 17) : un MP4 par plan.
- **Échelle 0,75** : la 3D est calculée en 810 × 1440 puis agrandie, tandis que les textes HTML restent nets en 1080 × 1920.

> [!info] Temps de calcul (4 cœurs, sans GPU)
> 3 à 7 s par image selon le décor et le nombre de rendus en parallèle. 2 355 images ≈ une heure avec 4 processus. Une image fixe du storyboard : 3 à 6 s.

> [!warning] Délai de capture
> Avec plusieurs rendus en parallèle, la première image d'un décor (compilation des shaders, ombres) peut dépasser 30 s : `page.screenshot` échoue et tout le reste de la liste du processus est perdu. Correctif : `p.screenshot({ type: 'jpeg', quality: 93, timeout: 0 })`.

## Test de syntaxe sans navigateur
Un décor est un module ES : `node --check` sur une copie `.mjs` attrape une erreur de syntaxe avant de lancer un long rendu (les imports ne sont pas chargés, seule la syntaxe est vérifiée). Voir l'incident « Unexpected token export » dans [[15 - Pièges et correctifs]].

## Aperçu rapide
`DATA=… node preview.js P03,P07` rend la première image, celle du milieu et la dernière de chaque plan en 270 px : idéal pour vérifier une animation avant de lancer 120 images.
