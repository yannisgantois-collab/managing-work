# What if : « Et si tous les agriculteurs de France arrêtaient demain ? »

- `storyboard/index.html` : storyboard en 19 plans (78,5 s, 9:16), défauts corrigés, charte, sources.
- `storyboard/frames/` : images des plans, rendues en 3D (720 × 1280) avec les textes à l'écran.
- `video/` : la vidéo finale (1080 × 1920, 30 i/s, 78,5 s, son stéréo à −14 LUFS).
- `rendu-3d/` : le code qui produit les images et la vidéo (three.js dans Chromium sans écran, ffmpeg).

Re-générer les images puis la page :

```bash
cd rendu-3d && npm install three@0.170.0 @fontsource/newsreader@5.1.0 @fontsource/ibm-plex-mono@5.1.0 @fontsource/inter@5.1.0
python3 -m http.server 8765 --bind 127.0.0.1 &
node render-all.js 720 "" 1 frames
python3 build_page.py ../storyboard
```

Re-générer la vidéo (compter environ une heure de calcul sur 4 cœurs sans carte graphique) :

```bash
cd rendu-3d && node render-video.js P01,P02,P03,P04,P05,P06,P07,P08,P09,P10,P11,P12,P13,P14,P15,P16,P17,P18,P19 0.75
python3 synth.py soundtrack.wav
python3 assemble.py ../video/et-si-les-agriculteurs-arretaient.mp4
```

Le scénario (sous-titres, compteurs, son, caméra) est dans `rendu-3d/shots.json`, les mouvements de caméra et les animations dans `rendu-3d/anim.js`, la bande-son dans `rendu-3d/synth.py`.
