---
tags: [what-if, bugs, debug, three-js, ffmpeg]
aliases: [Bugs What if, Correctifs What if]
créé: 2026-11-24
---

# Pièges et correctifs

Retour à [[00 - Carte du projet What if]] · Contrôle : [[14 - Contrôle qualité]]

## three.js et décors
| Symptôme | Cause | Correctif |
|---|---|---|
| Toute la scène tourne au lieu d'un objet | `scene.add(x)` renvoie la **scène**, pas `x` : `scene.add(x).rotation.y = …` fait tourner la scène | Créer l'objet, le régler, puis l'ajouter. |
| Les bras rentrent dans le corps | Le signe de l'écart (rotation z) est inversé entre bras gauche et bras droit | Écart positif à gauche, négatif à droite. |
| Rectangles sombres dans l'image | Occlusion ambiante `GTAOPass` avec le rendu logiciel | `ao: false`. |
| La tour Eiffel disparaît | Plan lointain de la caméra à 600 m | `far` réglé par plan (3 500 m pour les vues de Paris). |
| Joints du zinc invisibles | Géométrie maison sans coordonnées de texture | Calculer des UV : `((x + z) × 0,6, y × 0,6)`. |
| Rayures qui clignotent sur une carte | Deux surfaces presque au même niveau (z-fighting) | Écarter le calque : +0,65 au-dessus, contour à +0,75. |
| Cadran du thermomètre invisible | Plan derrière son propre boîtier | Cadran à +0,03, boîtier à +0,012. |
| Plafond tout blanc | Lumière ponctuelle du téléphone trop proche d'un plafond bas | Spot depuis le téléphone, dirigé vers la tête. |
| Image délavée en plein jour | Halo de soleil additif géant, soleil et bloom trop forts | Voir la recette de [[09 - Lumière et post-traitement]]. |
| Disques blancs devant la bouche | Particules de souffle trop grosses et trop opaques | Effet supprimé. |
| Texte d'enseigne coupé au bord | Texte plus large que la texture | `signTex` réduit la police si le texte dépasse 94 % de la largeur. |
| Parapluie qui s'envole | Accroché à l'avant-bras, emporté par le balancement de la marche | Accroché au torse, `armSwing: 0`. |

## Rendu
| Symptôme | Cause | Correctif |
|---|---|---|
| `TimeoutError` à la première image, puis plus rien pour ce processus | Capture plus lente que 30 s quand plusieurs rendus se partagent le processeur | `screenshot({ timeout: 0 })`. |
| « Unexpected token 'export' », plan « FAILED to build » | Un commentaire `//` inséré au milieu d'une ligne a mis en commentaire la fin d'une boucle | `node --check` sur une copie `.mjs` avant chaque rendu. |
| Page qui ne charge plus | Serveur web arrêté après un redémarrage de la machine | Relancer `python3 -m http.server 8765 --bind 127.0.0.1`. |
| « Error opening output file … Invalid argument » | Processus tué volontairement au début d'un plan | Sans conséquence. |

## Scripts de modification
- Un script Python qui applique plusieurs remplacements avec des `assert` **s'arrête au premier échec** : aucun des remplacements suivants n'est appliqué. Vérifier le message, corriger la chaîne attendue (ici `z 4.2` au lieu de `4.4`), relancer.
- Après chaque série de modifications : `node --check`, puis `preview.js` sur les plans touchés.

## Texte
| Symptôme | Correctif |
|---|---|
| « 50 » en fin de ligne, « °C ? » à la ligne suivante | Ajouter l'unité à la liste de `nb()`. |
| Mots orphelins, coupures au mauvais endroit | Couper à la main avec `\n` plutôt que `text-wrap: balance`. |

## Son
| Symptôme | Correctif |
|---|---|
| « operands could not be broadcast together (19200) (12000) » | Compléter le son le plus court avec des zéros avant de les additionner. |
| `np.arange` refuse un pas variable | Boucle `while` qui avance d'un pas recalculé à chaque battement. |
| Script qui plante sur une fonction inachevée | Finir ou supprimer la fonction. |

## Git
- Un `git push` bloqué : l'arrêter et relancer ; « Everything up-to-date » confirme que tout était déjà parti.
- Les vidéos finales pèsent environ 60 Mo : sous la limite de 100 Mo par fichier de GitHub grâce à l'encodage à 6 Mb/s.
