---
tags: [what-if, qualite, checklist]
aliases: [Checklist What if, QA What if]
créé: 2026-11-24
---

# Contrôle qualité

Retour à [[00 - Carte du projet What if]] · Les 16 défauts d'écriture : [[01 - Écrire un What if]] · Bugs connus : [[15 - Pièges et correctifs]]

On contrôle **deux fois** : sur les images fixes du storyboard (avant toute animation), puis sur chaque segment animé (première image, milieu, dernière image), et enfin sur la vidéo complète.

## Le texte
- [ ] Sous-titre sur 2 lignes au plus, coupé sur un groupe de sens, sans mot orphelin.
- [ ] Jamais de coupure entre un nombre et son unité (`50 °C`, `14 802`, `6 h 30`).
- [ ] Le même chiffre partout : compteur, sous-titre, décor (croix de pharmacie, écran, panneau).
- [ ] L'étiquette du compteur dit ce qu'elle mesure.
- [ ] Chaque chiffre réel a une source dans `shots.json` ; les chiffres inventés sont listés comme tels.

## L'image
- [ ] Rien d'important sous le compteur, le sous-titre ou l'interface TikTok (bord droit, bas).
- [ ] Les textes du décor sont lisibles, complets, sans faute.
- [ ] Les personnages principaux sont identiques d'un plan à l'autre (même fiche).
- [ ] Le décor raconte la phrase : s'il est question de camions sur une route, il faut une route et des camions qui roulent.
- [ ] Pas d'image délavée, pas de rectangle sombre, pas de rayures (z-fighting), pas d'objet caché derrière un autre par erreur.

## L'animation
- [ ] Au moins un mouvement de caméra, un être vivant qui bouge, un élément du décor animé.
- [ ] Le sujet reste dans le cadre du début à la fin du mouvement de caméra.
- [ ] Rien ne traverse rien : porte fermée, piétons, murs.
- [ ] Les accessoires suivent le personnage (parapluie, oreiller, téléphone).
- [ ] Personne n'est coupé par le bord de l'image sans raison.

## Le son
- [ ] Les événements tombent sur l'image (tonnerre sur l'éclair, bip quand la croix affiche 50).
- [ ] La musique suit le récit (tension, silence au pic, relâchement, espoir).
- [ ] Environ −14 LUFS, pas de saturation.

## Le fichier
- [ ] 2 355 images, 1080 × 1920, 30 images par seconde, 78,5 s.
- [ ] Moins de 100 Mo (limite de GitHub), lecture immédiate (`+faststart`).
- [ ] Planche contact relue de bout en bout (voir [[12 - Montage et export ffmpeg]]).

## Ce que les contrôles ont attrapé
| Épisode | Défaut | Correction |
|---|---|---|
| 1 | P05 : deux maisons seulement, pas de route, pas de camions (retour de l'utilisateur) | Vraie ferme avec tracteur, route et camions-citernes qui roulent. |
| 2 | Personnages et ville trop statiques (retour de l'utilisateur) | Respiration, regards, marche, gestes, ville qui s'éteint bloc par bloc. |
| 2 | « @ton compte » sur la carte de fin | Pseudo rendu optionnel. |
| 2 | Le compteur cachait Jeanne au dernier plan | Cadrage décalé et léger recul. |
| 2 | Souffles froids rendus comme des disques blancs | Effet supprimé. |
| 2 | Voiture qui roulait dans les piétons, objet qui traversait une porte fermée, passant caché derrière la file, piéton hors cadre | Trajectoires et départs revus. |
| 3 | Plans de jour délavés | Recette « plein jour » de [[09 - Lumière et post-traitement]]. |
| 3 | Titre coupé « 50 / °C ? » | `°C` ajouté aux unités insécables. |
| 3 | Thermomètre mural caché par son propre boîtier | Cadran avancé devant le boîtier. |
| 3 | Rayures sur la carte de chaleur | Calque posé plus haut. |
| 3 | Plafond surexposé par la lumière du téléphone | Spot dirigé vers le visage. |
| 3 | Parapluie qui s'envolait pendant la marche | Fixé au torse. |
| 3 | Affiche de l'école sous le sous-titre | Affiche remontée, caméra qui avance dessus. |
| 3 | Voisine coupée en haut de l'image | Placée au premier étage. |
| 3 | Panneau « EAU 28 °C » sorti du cadre par le panoramique | Panoramique inversé. |
