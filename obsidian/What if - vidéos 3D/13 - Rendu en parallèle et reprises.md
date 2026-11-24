---
tags: [what-if, rendu, parallele, workflow]
aliases: [Rendu parallèle What if, Reprises]
créé: 2026-11-24
---

# Rendu en parallèle et reprises

Retour à [[00 - Carte du projet What if]] · Rendu : [[04 - Rendu 3D sans carte graphique]]

## Répartir le travail
Une machine à 4 cœurs sans carte graphique rend 2 355 images en une heure environ avec **4 ou 5 processus** en parallèle, chacun avec sa liste de plans :
```bash
DATA=projets/canicule/shots.json OUT=projets/canicule/segments node render-video.js P03,P11,P12,P01 0.75 > log1.txt 2>&1 &
DATA=projets/canicule/shots.json OUT=projets/canicule/segments node render-video.js P13,P04,P05,P06 0.75 > log2.txt 2>&1 &
```
- Équilibrer par **coût**, pas par nombre de plans : les rues et les toits pleins d'immeubles coûtent deux fois plus cher qu'une chambre ou une carte.
- Mettre les plans les plus lourds en tête de liste.
- Chaque processus écrit une ligne `P07 done 120 frames 512.3s` : suivre les journaux pour savoir où on en est.

## Refaire un plan sans tout casser
1. Corriger le décor ou l'animation, vérifier avec `node --check` puis `preview.js`.
2. Rendre le plan corrigé dans un **dossier à part** (`OUT=…/segments_b`), pour ne jamais confondre l'ancienne et la nouvelle version.
3. Comparer (`cmp`), regarder, puis copier dans `segments/` et relancer seulement `assemble.py`.

> [!tip] Arrêter un processus devenu inutile
> Si un plan est déjà refait ailleurs, on peut tuer le processus au début de ce plan. ffmpeg affiche alors « Error opening output file … Invalid argument » : sans conséquence, le segment n'a simplement pas été écrit.

> [!warning] Après un redémarrage de la machine
> Le petit serveur web (`python3 -m http.server 8765`) s'arrête : le relancer avant tout rendu. Les segments déjà écrits restent valables ; `assemble.py` refuse un segment absent ou de moins de 10 ko.

## Ordre de travail qui a fait gagner du temps
1. Images fixes du storyboard (rapides) et validation.
2. Aperçu début / milieu / fin de chaque plan animé (`preview.js`).
3. Rendu complet en parallèle.
4. Pendant ce temps : écrire la bande-son, préparer les textes de livraison.
5. Contrôle de chaque segment dès qu'il sort, reprise immédiate des défauts.
