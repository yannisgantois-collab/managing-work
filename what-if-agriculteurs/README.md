# What if : « Et si tous les agriculteurs de France arrêtaient demain ? »

- `storyboard/index.html` : storyboard en 19 plans (78,5 s, 9:16), défauts corrigés, charte, sources.
- `storyboard/frames/` : images des plans, rendues en 3D (720 × 1280) avec les textes à l'écran.
- `rendu-3d/` : le code qui produit ces images (three.js dans Chromium sans écran).

Re-générer les images puis la page :

```bash
cd rendu-3d && npm install three@0.170.0 @fontsource/newsreader@5.1.0 @fontsource/ibm-plex-mono@5.1.0 @fontsource/inter@5.1.0
python3 -m http.server 8765 --bind 127.0.0.1 &
node render-all.js 720 "" 1 frames
python3 build_page.py ../storyboard
```

Le scénario (sous-titres, compteurs, son, caméra) est dans `rendu-3d/shots.json`.
