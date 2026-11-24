---
tags: [what-if, commandes, memo]
aliases: [Commandes What if, Mémo What if]
créé: 2026-11-24
---

# Commandes utiles

Retour à [[00 - Carte du projet What if]] · Toutes les commandes se lancent depuis `outil-what-if/`. Exemple avec l'épisode 3 (`projets/canicule`).

## Installer (une fois)
```bash
npm install three@0.170.0 @fontsource/newsreader@5.1.0 @fontsource/ibm-plex-mono@5.1.0 @fontsource/inter@5.1.0 playwright
```
```bash
npx playwright install chromium
```
```bash
pip install numpy
```
ffmpeg doit être installé sur la machine.

## Servir les pages (à chaque session)
```bash
python3 -m http.server 8765 --bind 127.0.0.1
```

## Storyboard
```bash
DATA=projets/canicule/shots.json node render-all.js 720 "" 1 projets/canicule/frames
```
```bash
python3 build_page.py ../what-if-canicule/storyboard projets/canicule/shots.json projets/canicule/frames
```
Arguments de `render-all.js` : largeur, plans (vide = tous, sinon `P03,P07`), textes affichés (`1`) ou non (`0`), dossier de sortie.

## Aperçu des animations
```bash
DATA=projets/canicule/shots.json node preview.js P03,P07
```
Première image, milieu et fin de chaque plan, dans `prev/`.

## Vérifier la syntaxe d'un décor
```bash
cp scenes3.js /tmp/s3.mjs && node --check /tmp/s3.mjs && echo OK
```
L'extension `.mjs` fait lire le fichier comme un module (les `import` et `export` sont acceptés) ; `--check` ne fait que vérifier la syntaxe, sans charger les imports.

## Vidéo
```bash
DATA=projets/canicule/shots.json OUT=projets/canicule/segments node render-video.js P01,P02,P03 0.75
```
Arguments : plans, échelle de la 3D (0,75), et en option un nombre maximum d'images pour un test rapide.
```bash
grep -h " done " log*.txt
```

## Son et montage
```bash
python3 synth3.py projets/canicule/soundtrack.wav projets/canicule/shots.json
```
```bash
DATA=projets/canicule/shots.json SEG=projets/canicule/segments WAV=projets/canicule/soundtrack.wav python3 assemble.py ../what-if-canicule/video/et-si-paris-atteignait-50-degres.mp4
```

## Contrôles du fichier final
```bash
ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames,width,height -of csv=p=0 video.mp4
```
```bash
ffmpeg -hide_banner -i video.mp4 -af loudnorm=print_format=summary -f null - 2>&1 | grep "Input Integrated"
```
```bash
ffmpeg -i video.mp4 -vf "fps=1/4,scale=216:-1,tile=5x4" -frames:v 1 planche.jpg
```
