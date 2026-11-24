---
tags: [what-if, three-js, lib, api]
aliases: [lib.js, Boîte à outils 3D]
créé: 2026-11-24
---

# Boîte à outils 3D (`lib.js`)

Retour à [[00 - Carte du projet What if]] · Personnages : [[06 - Personnages et animation]] · Lumière : [[09 - Lumière et post-traitement]]

## Hasard reproductible
`seed(n)`, `rnd()`, `rr(a, b)`, `pick(tableau)` : générateur pseudo-aléatoire à graine. Avec la même graine, un décor est identique à chaque image et à chaque rendu (indispensable pour une vidéo image par image).

## Matériaux et formes
| Fonction | Usage |
|---|---|
| `M(couleur, rugosité, métal)` | Matériau standard. |
| `E(couleur, intensité)` | Matériau émissif (écrans, ampoules, gyrophares). |
| `glass(couleur, opacité)` | Verre transparent. |
| `mesh(geo, mat, x, y, z)` | Objet avec ombres. |
| `box`, `rbox` (arrondi), `cyl`, `sph`, `cap` (capsule) | Formes de base positionnées. |
| `ground(taille, mat, y)` | Sol horizontal. |
| `instanced(geo, mat, n, fn)` | Des centaines d'objets identiques en un seul appel (traverses de voie : 1 100). |

## Textures dessinées par code
- `canvasTex(w, h, dessin, répétition)` : texture à partir d'un canevas 2D.
- `noiseTex(couleur, variation, …)` : bruit pour bitume, herbe, ballast, moquette.
- `signTex(lignes, { bg, fg, font, size, … })` : enseignes et pancartes. **Réduit le texte s'il dépasse** (mesure `measureText`, 94 % de la largeur) : plus de mot coupé au bord.
- `roundTex()` : disque flou pour particules et halos.

## Lumières et effets
- `sun(scene, { pos, target, intensity, size, far })` : soleil avec ombres.
- `hemi(scene, ciel, sol, intensité)`, `point(…)`, `spot(…)`.
- `shaft(…)` : faux rayon de lumière (cône additif).
- `dust(n, boîte, couleur, taille, opacité)` : poussière, brume, vapeur, gouttes.
- `glow(couleur, taille, x, y, z, opacité)` : halo (lampadaire, soleil, papillon de nuit).
- `finish({ renderer, scene, camera, W, H, bloom, ao, dof, vig, grain, lift, sat, heat })` : post-traitement, voir [[09 - Lumière et post-traitement]].
- `cam(W, H, fov, pos, look)` : caméra.

## Objets prêts à l'emploi
`person`, `randPerson`, `cow`, `tractor`, `truck`, `farmhouse`, `shed`, `tree`, `bareTree`, `hedgeRow`, `haussmann`. Les épisodes 2 et 3 ajoutent dans leurs fichiers de décors : `car`, `building` (immeuble à toit de zinc), `bird` et `flock`, `cloud`, `acUnit`, `bike`, `ambulance`, `tower` (tour de refroidissement), `pharmacyCross`. Voir [[07 - Catalogue des décors]].

## Animation
- `animPerson(perso, t, options)` : respiration, regard, marche, salut, parole, boisson.
- `flick(t, graine)` : scintillement naturel (bougie, télé, lampadaire).

> [!tip] Immeuble parisien crédible
> Un `building` de l'épisode 3 : boîte avec texture de façade (fenêtres hautes, balcons en fer aux 2e et 5e étages, boutiques au rez-de-chaussée), corniche, **mansarde en zinc à deux pentes** (géométrie `frustum` à deux étages), lucarnes, souches de cheminée avec pots en terre cuite. Pour voir les joints du zinc, la géométrie maison doit avoir des coordonnées de texture : `uv = ((x + z) × 0,6, y × 0,6)`.
