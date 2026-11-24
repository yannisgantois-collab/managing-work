---
tags: [what-if, moc, video, three-js, tiktok]
aliases: [What if, Carte What if, Vidéos What if]
créé: 2026-11-24
---

# Carte du projet « What if »

Des vidéos verticales (9:16, 1080 × 1920, 78,5 s) dans le style des « What if » de TikTok : une hypothèse, ses conséquences en cascade, puis un retour au réel chiffré. Tout est fabriqué **par du code, sans service payant ni carte graphique** : décors et personnages en 3D (three.js dans Chromium sans écran), textes en HTML, bande-son synthétisée en Python, montage avec ffmpeg.

> [!info] Où est le code
> Dépôt GitHub `yannisgantois-collab/managing-work`, branche `claude/zen-fermi-drgfl2`.
> - `outil-what-if/` : l'outil complet (et `MODE-EMPLOI.md`).
> - `what-if-agriculteurs/`, `what-if-coupure/`, `what-if-canicule/` : storyboards, images et vidéos finales.

## Les trois épisodes
- [[Épisode 1 - Agriculteurs]] : « Et si tous les agriculteurs de France arrêtaient demain ? »
- [[Épisode 2 - Coupure d'électricité]] : « Et si la France entière perdait l'électricité pendant une semaine ? »
- [[Épisode 3 - Paris à 50 degrés]] : « Et si Paris atteignait 50 °C ? »

## Écrire
- [[01 - Écrire un What if]] : structure en 3 actes, 19 plans, compteur, chute réelle, les 16 défauts à éviter.
- [[02 - Vérifier les faits et citer les sources]]

## Fabriquer
- [[03 - Chaîne de production]] : du `shots.json` au MP4.
- [[04 - Rendu 3D sans carte graphique]]
- [[05 - Boîte à outils 3D lib.js]]
- [[06 - Personnages et animation]]
- [[07 - Catalogue des décors]]
- [[08 - Caméras et cadrage 9-16]]
- [[09 - Lumière et post-traitement]]
- [[10 - Textes à l'écran et typographie]]
- [[11 - Bande-son procédurale]]
- [[12 - Montage et export ffmpeg]]
- [[13 - Rendu en parallèle et reprises]]

## Vérifier et dépanner
- [[14 - Contrôle qualité]] : la liste de ce qu'on regarde à chaque plan.
- [[15 - Pièges et correctifs]] : tous les bugs rencontrés et leur solution.
- [[16 - Commandes utiles]]
- [[17 - Idées et prochaines étapes]]

## En une phrase par étape
1. Écrire le scénario et les sources dans `projets/<nom>/shots.json`.
2. Construire les décors (`scenes3.js` par exemple) et leurs cadrages.
3. Rendre les 19 images fixes, monter la page du storyboard, la faire valider.
4. Ajouter les animations (`anim3.js`, `ctx.anim` dans les décors), vérifier début / milieu / fin de chaque plan.
5. Rendre les 2 355 images en parallèle (environ une heure sur 4 cœurs).
6. Composer la bande-son synchronisée (`synth3.py`).
7. Assembler : concaténation, son normalisé à −14 LUFS, H.264 en deux passes.
8. Contrôler chaque plan, refaire ceux qui ont un défaut, puis envoyer.
