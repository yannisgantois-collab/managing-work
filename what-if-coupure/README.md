# What if : « Et si la France entière perdait l’électricité pendant une semaine ? »

- `storyboard/index.html` : storyboard en 19 plans (78,5 s, 9:16), défauts corrigés, charte, sources.
- `storyboard/frames/` : images des plans, rendues en 3D (720 × 1280) avec les textes à l’écran.
- `video/` : la vidéo finale (1080 × 1920, 30 i/s, 78,5 s, son stéréo à −14 LUFS), avec les personnages et la ville animés : Paris qui s’éteint en vague, Jeanne qui respire et tourne la tête, un piéton éclairé par son téléphone, des lampes de téléphone dans le métro, une file devant l’épicerie, un homme qui revient avec son jerrican vide, une infirmière à la lampe frontale, des bougies aux fenêtres, la porte qui s’ouvre sur Yanis, un policier et des piétons au carrefour espagnol, les cartes qui s’éteignent ville par ville.

Le code est dans `../outil-what-if/` (projet `projets/coupure`) ; `outil-what-if.zip` en est une copie prête à télécharger, avec les deux épisodes et le mode d’emploi. Re-générer la vidéo (environ une heure sur 4 cœurs sans carte graphique) :

```bash
cd ../outil-what-if
python3 -m http.server 8765 --bind 127.0.0.1 &
DATA=projets/coupure/shots.json OUT=projets/coupure/segments node render-video.js P01,P02,P03,P04,P05,P06,P07,P08,P09,P10,P11,P12,P13,P14,P15,P16,P17,P18,P19 0.75
python3 synth2.py projets/coupure/soundtrack.wav projets/coupure/shots.json
DATA=projets/coupure/shots.json SEG=projets/coupure/segments WAV=projets/coupure/soundtrack.wav python3 assemble.py ../what-if-coupure/video/et-si-la-france-perdait-l-electricite.mp4
```

Le scénario (sous-titres, compteurs, son, caméra) est dans `projets/coupure/shots.json`, les mouvements de caméra et les compteurs dans `anim2.js`, les décors animés dans `scenes2.js`, la bande-son dans `synth2.py`.
