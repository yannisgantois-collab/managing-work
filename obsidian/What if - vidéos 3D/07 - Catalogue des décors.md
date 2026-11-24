---
tags: [what-if, decors, three-js]
aliases: [Décors What if, SETS]
créé: 2026-11-24
---

# Catalogue des décors

Retour à [[00 - Carte du projet What if]] · Cadrages : [[08 - Caméras et cadrage 9-16]]

Chaque décor est une fonction `decor(scene, { variant })` qui remplit la scène et renvoie `{ anim }`. Elle est enregistrée dans `SETS` (épisode 1), `SETS2` ou `SETS3`, et ses cadrages dans `CAMS…` sous la clé `'decor:variante'`.

## Épisode 1 (`scenes.js`)
`bedroom` (chambre d'Hélène, réveil), `barn` (stabulation, vaches, traite), `countryside` (ferme, route, tracteur, camions-citernes), `supermarket`, `market` (halle de gros), `stall` (étal), `bakery` (boulangerie ou épicerie « ESPÈCES UNIQUEMENT »), `foodbank`, `wheat`, `park`, `fallow` (friche), `gate`, `valley`.

## Épisode 2 (`scenes2.js`)
| Décor | Variantes | Points forts |
|---|---|---|
| `skyline` | `wave`, `candles`, `restore` | Paris vu d'une fenêtre ; chaque bloc a sa carte émissive, l'extinction balaie la ville d'est en ouest ; tour Eiffel scintillante ; bougies aux fenêtres. |
| `apartment` | `dark`, `cold`, `neighbor`, `restored` | Salon de Jeanne ; télé et lampe qui s'éteignent ; bougie ; porte qui s'ouvre sur Yanis. |
| `crossroads` | `night`, `day` | Carrefour bloqué de nuit (phares, piéton au téléphone) ; rue espagnole de jour (policier, piétons, voiture qui s'arrête avant le passage). |
| `metro` | | Rame arrêtée, lampes de téléphone. |
| `phone` | | Écran « Appel impossible · Aucun réseau mobile ». |
| `kitchen` | `tap`, `fridge` | Goutte qui tombe, lampe torche sur le frigo. |
| `station` | | Pompes « EN PANNE », homme au jerrican vide. |
| `hospital` | | Couloir sur groupe électrogène, infirmière à la lampe frontale. |
| `map` | `iberia`, `france` | Cartes de nuit construites depuis des contours en longitude/latitude ; les villes s'éteignent une par une. |

## Épisode 3 (`scenes3.js`)
| Décor | Variantes | Points forts |
|---|---|---|
| `roofs` | `noon`, `night`, `storm` | Mer de toits en zinc à joints debout, cheminées, dôme, grues qui pivotent ; oiseaux ; la nuit télés et avion ; orage avec pluie, éclair, nuages, vapeur. |
| `attic` | `day`, `night`, `rain` | Chambre de bonne sous la pente, vasistas, rayon de soleil, ventilateur, thermomètre mural, mouche ; Inès s'évente, lit son téléphone, lève les bras sous la pluie. |
| `street` | `pharmacy`, `peak`, `ambulance` | Rue haussmannienne, croix de pharmacie lumineuse qui alterne température et heure, bus, passants, brumisateur, ambulance et brancard, voisine à la fenêtre. |
| `rails` | `heat` | Voie de banlieue, caténaire, train qui avance au pas, panneau « 40 », corbeaux qui s'envolent. |
| `plant` | `river` | Tours de refroidissement (`LatheGeometry`), panaches, rivière basse et berges craquelées, panneau « EAU 28 °C ». |
| `school` | `closed`, `oasis` | Grille fermée avec affiche « ÉCOLE FERMÉE – CANICULE », drapeau qui flotte ; puis cour oasis avec arbres, enfants, ballon, fontaine. |
| `facade` | `ac` | Façade couverte de climatiseurs dont les pales tournent, livreur à vélo. |
| `park` | `night` | Pelouse où dorment des Parisiens, lampadaires, papillons de nuit, arrosage automatique. |
| `crisis` | `room` | Salle de crise : écrans « EXERCICE », « DÔME DE CHALEUR · PIC À 50 °C », courbe qui se dessine, carte qui pulse. |
| `heatmap` | `2003`, `record` | France vue de nuit avec une carte de chaleur dessinée sur canevas, ondes qui partent des villes, épingle plantée à Vérargues. |

> [!tip] Cartes géographiques
> Projection simple : `x = (lon − lon0) × cos(lat0) × k`, `z = −(lat − lat0) × k`. Le contour (`FRANCE`, `CORSICA`, `IBERIA`) est extrudé ; une `ShapeGeometry` posée au-dessus porte la texture de chaleur, avec des coordonnées de texture calculées depuis la boîte englobante. La poser **0,65 au-dessus** de la dalle pour éviter les rayures de z-fighting.

> [!tip] Écrans qui vivent
> Garder la texture canevas, redessiner dans la boucle d'animation (`tex.image.getContext('2d')`), puis `tex.needsUpdate = true`. Coût négligeable pour quelques écrans de 512 × 288.
