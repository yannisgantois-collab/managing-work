# What if : « Et si Paris atteignait 50 °C ? »

- `storyboard/index.html` : storyboard en 19 plans (78,5 s, 9:16), défauts corrigés, charte, sources.
- `storyboard/frames/` : images des plans, rendues en 3D (720 × 1280) avec les textes à l’écran.
- `video/` : la vidéo finale (1080 × 1920, 30 i/s, 78,5 s, son stéréo à −14 LUFS), animée dans chaque plan : l’air qui ondule au-dessus du bitume, les oiseaux, les grues, Inès qui s’évente puis lève les bras sous la pluie, les passants et le bus, la croix de pharmacie qui passe à 50 °C, les corbeaux qui s’envolent devant le train, les panaches des centrales, le drapeau et l’affiche de l’école, les ventilateurs des climatiseurs et le livreur à vélo, l’avion et les télés la nuit, l’arrosage et les papillons de nuit au parc, l’ambulance et la voisine à sa fenêtre, l’éclair de l’orage, les écrans de la salle de crise, les ondes de chaleur sur les cartes, le ballon et la fontaine de la cour oasis.

Le code est dans `../outil-what-if/` (projet `projets/canicule`, décors dans `scenes3.js`, mouvements et compteurs dans `anim3.js`). Re-générer le script puis les images et la page :

```bash
cd ../outil-what-if
python3 projets/canicule/ecrire_script.py
python3 -m http.server 8765 --bind 127.0.0.1 &
DATA=projets/canicule/shots.json node render-all.js 720 "" 1 projets/canicule/frames
python3 build_page.py ../what-if-canicule/storyboard projets/canicule/shots.json projets/canicule/frames
```

Re-générer la vidéo (environ une heure sur 4 cœurs sans carte graphique) :

```bash
DATA=projets/canicule/shots.json OUT=projets/canicule/segments node render-video.js P01,P02,P03,P04,P05,P06,P07,P08,P09,P10,P11,P12,P13,P14,P15,P16,P17,P18,P19 0.75
python3 synth3.py projets/canicule/soundtrack.wav projets/canicule/shots.json
DATA=projets/canicule/shots.json SEG=projets/canicule/segments WAV=projets/canicule/soundtrack.wav python3 assemble.py ../what-if-canicule/video/et-si-paris-atteignait-50-degres.mp4
```
