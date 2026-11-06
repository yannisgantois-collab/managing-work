# Outil « What if » : mode d'emploi

Chaîne complète : scénario → images 3D → vidéo 9:16 sous-titrée → bande-son → MP4 prêt pour TikTok.
Tout tourne en local, sans service payant (three.js dans Chromium sans écran + ffmpeg + Python).

## Installation (une fois)
- Node.js 18+, Python 3 avec numpy, ffmpeg.
- `npm install three@0.170.0 @fontsource/newsreader@5.1.0 @fontsource/ibm-plex-mono@5.1.0 @fontsource/inter@5.1.0 playwright`
- `npx playwright install chromium`

Puis, dans ce dossier, lancer le petit serveur local (à laisser ouvert) :
`python3 -m http.server 8765 --bind 127.0.0.1`

## Les fichiers et leur rôle
| Fichier | À modifier pour un nouveau What if ? | Rôle |
|---|---|---|
| `shots.json` | **Oui, toujours** | Le scénario : titre, compte, et pour chaque plan la durée, le décor, la caméra, le compteur, le sous-titre, l'action, le son. |
| `scenes.js` | Oui si nouveaux décors | Les décors 3D (`SETS`) et les cadrages (`CAMS`). Personnages, vaches, tracteurs, maisons, immeubles, arbres sont réutilisables via `lib.js`. |
| `anim.js`, `anim2.js` | Oui | Mouvements de caméra par plan (`CAMANIM`), objets animés (`objAnim`), compteurs qui défilent (`hudValue`). Le projet choisit son module avec `"anim"` dans `shots.json` (`anim.js` par défaut). |
| `synth.py`, `synth2.py` | Oui | Bande-son synchronisée sur les temps de `shots.json` (ambiances, réveil, piano, clics). `synth2.py` est celle de l'épisode 2. |
| `lib.js` | Rarement | Boîte à outils 3D : personnage `person()`, `cow()`, `tractor()`, `truck()`, `farmhouse()`, `haussmann()`, lumières, post-traitement. |
| `render.html`, `video.html` | Rarement | Mise en page des textes (compteur, sous-titres, carton final) : polices, tailles, zones de sécurité TikTok. |
| `render-all.js` | Non | Images fixes du storyboard. |
| `build_page.py` | Textes de la page | Page HTML du storyboard (défauts, sources). |
| `render-video.js`, `assemble.py` | Non | Rendu image par image puis montage final. |

## Plusieurs projets
Chaque What if a son dossier dans `projets/<nom>/` avec son `shots.json` (scénario, et section `page` pour les textes du storyboard : accroche, sources, corrections). Déjà présents : `projets/agriculteurs` (épisode 1), `projets/coupure` (épisode 2) et `projets/canicule` (épisode 3, dont le script est généré par `projets/canicule/ecrire_script.py`). Choisir le projet avec la variable `DATA` :

```bash
DATA=projets/coupure/shots.json node render-all.js 720 "" 1 projets/coupure/frames
python3 build_page.py ../what-if-coupure/storyboard projets/coupure/shots.json projets/coupure/frames
DATA=projets/coupure/shots.json OUT=projets/coupure/segments node render-video.js P01,P02,P03 0.75
python3 synth2.py projets/coupure/soundtrack.wav projets/coupure/shots.json
DATA=projets/coupure/shots.json SEG=projets/coupure/segments WAV=projets/coupure/soundtrack.wav python3 assemble.py ../what-if-coupure/video/ma-video.mp4
```

Décors : `scenes.js` (épisode 1 : chambre, stabulation, bocage, supermarché, halle, étal, boulangerie ou épicerie, distribution alimentaire, blé, parc, friche, portail, vallée) `scenes2.js` (épisode 2 : Paris vu d'une fenêtre avec la tour Eiffel, salon, carrefour de nuit ou rue espagnole, métro, téléphone, cuisine, station-service, hôpital, cartes de nuit Ibérie et France) et `scenes3.js` (épisode 3 : toits en zinc de midi, de nuit ou sous l'orage, chambre de bonne, rue haussmannienne avec croix de pharmacie, voie ferrée, centrale nucléaire, école fermée ou « cour oasis », façade à climatiseurs, parc la nuit, salle de crise, cartes de chaleur de la France). Un plan peut demander une caméra plus profonde avec `far` / `near` dans son cadrage.

## Les commandes
1. Storyboard (images fixes, rapide) : `node render-all.js 720 "" 1 frames` puis `python3 build_page.py ../storyboard`
2. Aperçu des animations (début / milieu / fin de chaque plan) : `node preview.js`
3. Rendu vidéo (long : ~1 h 20 pour 78 s sur 4 cœurs sans carte graphique, beaucoup moins avec un GPU) :
   `node render-video.js P01,P02,...,P19 0.75` (on peut lancer 2 ou 3 commandes en parallèle avec des listes de plans différentes)
4. Bande-son : `python3 synth.py soundtrack.wav`
5. Montage final : `python3 assemble.py ../video/ma-video.mp4`

Pour refaire un seul plan : modifier, relancer `render-video.js P05 0.75`, puis `assemble.py`.

## Faire un nouveau What if
1. Écrire le scénario dans `shots.json` (garder `set` / `cam` existants pour réutiliser les décors).
2. Pour un nouveau décor : ajouter une fonction dans `scenes.js`, l'enregistrer dans `SETS`, ajouter son cadrage `'decor:camera'` dans `CAMS`.
3. Animer les plans dans `anim.js`, adapter `synth.py`.
4. Storyboard → vérifier → rendu vidéo → montage.

## Animer les personnages et les décors
- `person({ ..., shorts: true, sleeves: false })` habille un personnage pour l'été (short, débardeur).
- `animPerson(perso, t, options)` (dans `lib.js`) anime un personnage créé par `person()` : respiration et regard par défaut, plus `walk` (pas par seconde), `stride`, `wave` (salut), `talk` (parle avec les mains), `sip` (boit), `nod`, `look`, `sway`, et `phase` pour décaler les personnages entre eux.
- Pour faire marcher quelqu'un : déplacer `perso.position` à chaque image et appeler `animPerson(perso, t, { walk: 1.4 })`.
- `flick(t, graine)` donne un scintillement naturel (bougies, néons qui grésillent, lampes torches).
- Dans `scenes2.js`, chaque décor range ses animations dans `ctx.anim` (une fonction `(t, durée, image)` par élément animé) : fenêtres qui s'éteignent en vague, porte qui s'ouvre, piétons, voitures, gouttes d'eau, bougies. C'est le modèle à suivre pour un nouveau décor.

## Pièges connus
- Sous-titres (`cap`) : `\n` force un retour à la ligne. Couper sur les groupes de sens et ne jamais laisser un mot seul sur la dernière ligne ; 860 px au plus par ligne (environ 38 caractères).
- L'occlusion ambiante (GTAO) peut laisser des rectangles sombres sur les grands sols plats : mettre `{ ao: false }` dans le cadrage concerné.
- Les nombres et textes visibles dans l'image viennent tous de `shots.json` : une seule source, pas de chiffres incohérents.
- Les panneaux écrits avec `signTex` réduisent leur texte s'il dépasse : plus de mot coupé au bord d'une enseigne.
- `handle` dans `shots.json` : le nom de compte affiché sur le carton final. Le laisser vide (`""`) pour ne rien afficher.
