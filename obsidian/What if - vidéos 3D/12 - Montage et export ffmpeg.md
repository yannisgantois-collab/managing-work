---
tags: [what-if, ffmpeg, export, loudnorm, h264]
aliases: [Export What if, assemble.py]
créé: 2026-11-24
---

# Montage et export ffmpeg

Retour à [[00 - Carte du projet What if]] · Son : [[11 - Bande-son procédurale]]

## 1. Un MP4 par plan
`render-video.js` envoie chaque capture JPEG dans un ffmpeg ouvert :
```bash
ffmpeg -f image2pipe -framerate 30 -c:v mjpeg -i - -c:v libx264 -preset medium -crf 17 -pix_fmt yuv420p -r 30 segments/P07.mp4
```
CRF 17 : presque sans perte, pour ne pas dégrader l'image avant l'encodage final.

## 2. L'assemblage (`assemble.py`)
```bash
DATA=projets/canicule/shots.json SEG=projets/canicule/segments WAV=projets/canicule/soundtrack.wav \
  python3 assemble.py ../what-if-canicule/video/et-si-paris-atteignait-50-degres.mp4
```
1. Vérifie que les 19 segments existent et pèsent plus de 10 ko.
2. Les met bout à bout sans réencoder (`-f concat -c copy`) : possible parce qu'ils ont tous les mêmes réglages.
3. **Son en deux passes** : `loudnorm` mesure d'abord, puis corrige avec les mesures (`I=-14`, `TP=-1.5`, `LRA=11`, `linear=true`). −14 LUFS est le niveau habituel des réseaux sociaux.
4. **Vidéo en deux passes** à 6 Mb/s (`-maxrate 9M -bufsize 12M -preset slow -profile:v high -level 4.1`), AAC 192 kb/s à 48 kHz, `-shortest`, `-movflags +faststart` (lecture immédiate en ligne).

> [!info] Pourquoi 6 Mb/s
> Environ 60 Mo pour 78,5 s : sous la limite de 100 Mo de GitHub et largement assez pour TikTok, qui réencode de toute façon.

## 3. Vérifier le fichier final
```bash
ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames,width,height -of csv=p=0 video.mp4
```
```bash
ffmpeg -hide_banner -i video.mp4 -af loudnorm=print_format=summary -f null - 2>&1 | grep "Input Integrated"
```
```bash
ffmpeg -ss 41.5 -i video.mp4 -frames:v 1 controle.jpg
```
```bash
ffmpeg -i video.mp4 -vf "fps=1/4,scale=216:-1,tile=5x4" -frames:v 1 planche.jpg
```
Attendu : 2 355 images, 1080 × 1920, environ −14 LUFS. La planche (une image toutes les 4 s) permet de relire toute la vidéo d'un coup d'œil.
