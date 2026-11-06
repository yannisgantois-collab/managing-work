# What if : « Et si Paris atteignait 50 °C ? »

- `storyboard/index.html` : storyboard en 19 plans (78,5 s, 9:16), défauts corrigés, charte, sources.
- `storyboard/frames/` : images des plans, rendues en 3D (720 × 1280) avec les textes à l’écran.

Le code est dans `../outil-what-if/` (projet `projets/canicule`, décors dans `scenes3.js`, mouvements et compteurs dans `anim3.js`). Re-générer le script puis les images et la page :

```bash
cd ../outil-what-if
python3 projets/canicule/ecrire_script.py
python3 -m http.server 8765 --bind 127.0.0.1 &
DATA=projets/canicule/shots.json node render-all.js 720 "" 1 projets/canicule/frames
python3 build_page.py ../what-if-canicule/storyboard projets/canicule/shots.json projets/canicule/frames
```

Pour la vidéo, même chaîne que l’épisode 2 (`render-video.js` puis `assemble.py`), avec une bande-son à écrire sur le modèle de `synth2.py`.
