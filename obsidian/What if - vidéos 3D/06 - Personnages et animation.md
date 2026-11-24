---
tags: [what-if, animation, personnages, three-js]
aliases: [animPerson, Personnages What if]
créé: 2026-11-24
---

# Personnages et animation

Retour à [[00 - Carte du projet What if]] · Outils : [[05 - Boîte à outils 3D lib.js]]

## Créer un personnage
```js
const INES = { skin: 0xb27c55, hair: 0x15100c, hairStyle: 'bun', top: 0xeadca0,
               sleeves: false, pants: 0x4d6c8f, shorts: true, shoes: 0xf0f0ee };
const ines = person({ ...INES, ...SIT, rsh: [-2.1, -0.15], rel: -1.25, mouth: 'open' });
```
- Options : `skin`, `hair`, `hairStyle` (`short`, `long`, `bun`, `bald`), `top`, `pants`, `shoes`, `sleeves`, `shorts`, `coat`, `hat` (`cap`, `beanie`), `eyes` (`open`, `closed`), `mouth` (`neutral`, `open`, `sad`), `h` (taille, 0,65 pour un enfant).
- Pose en radians : épaules `lsh`/`rsh` = [avant, écart], coudes `lel`/`rel`, hanches `lhip`/`rhip`, genoux `lkn`/`rkn`, `neck`, `spine`.
- Poses prêtes : `SIT` (assis), `WALK(phase)`.
- `randPerson({...})` : passant au hasard (peau, cheveux, vêtements).
- **Fiche unique** par personnage principal, réutilisée telle quelle dans chaque plan (défaut D04).

## Le squelette et `animPerson`
`person()` range ses articulations dans `perso.userData.rig` (`lHip`, `rHip`, `lKn`, `rKn`, `lSh`, `rSh`, `lEl`, `rEl`, `head`, `torso`, `hips`) avec leur pose de base. À chaque image, `animPerson` remet la pose de base puis ajoute :

| Option | Effet |
|---|---|
| `breath` | Respiration (torse). |
| `look`, `nod`, `sway` | Regard, hochement, balancement. |
| `walk` (pas par seconde), `stride`, `armSwing` | Cycle de marche (hanches, genoux, bras, rebond). `armSwing: 0` garde les bras fixes (porter un parapluie, un oreiller). |
| `wave`, `talk`, `sip` | Salut, parler avec les mains, boire. |
| `phase` | Décale les personnages entre eux. |

Après `animPerson`, on peut **ajouter** des rotations à la main : bras qui se lèvent vers la pluie, cahier qui évente (`rig.rEl.rotation.x += Math.sin(t * 9) * 0.35`), tête qui suit le ventilateur.

## Faire marcher quelqu'un
- Le plus simple : `p.position.z = z0 + Math.cos(p.rotation.y) * vitesse * t` et `walk` dans `animPerson`.
- **Le long d'une courbe, à vitesse constante** (sortie de l'épicerie, épisode 2) : échantillonner une courbe de Bézier en 64 points, cumuler les longueurs, puis avancer **par distance** et orienter le personnage selon la direction suivante :
```js
const d = 1.15 * Math.max(0, t - 0.3), [x, z] = by(d), [x2, z2] = by(d + 0.05);
walker.position.set(x, 0, z); walker.rotation.y = Math.atan2(x2 - x, z2 - z);
```

## Allonger, asseoir, porter
- Allongé sur le dos : `rotation.x = -π/2` ; les pieds sont l'origine, donc la tête est à +1,75 m dans la direction du corps.
- Accessoire dans la main : l'ajouter à `rig.rEl` (téléphone, cahier, gobelet).
- Accessoire qui doit rester stable (parapluie, oreiller) : l'ajouter au **torse** (`rig.torso`), pas à l'avant-bras, sinon le balancement de la marche l'emporte.

## Animer le décor : `ctx.anim`
Chaque décor renvoie `{ anim: [ (t, durée, image) => { … } ] }`. `objAnim` appelle toutes ces fonctions à chaque image. Exemples de l'épisode 3 : pales du ventilateur, oscillation, mouche (trajectoire de Lissajous), poussière dans le rayon, croix de pharmacie qui alterne température et heure, bus qui avance, corbeaux qui s'envolent quand le train approche, drapeau qui flotte (rotation déphasée de trois bandes), écrans de crise redessinés à chaque image, ondes de chaleur sur la carte.

> [!example] Recette « un max d'animation »
> Pour chaque plan, viser au moins : un mouvement de caméra, un personnage vivant (respiration, regard), un élément du décor qui bouge (vent, eau, lumière, véhicule, oiseaux), un compteur ou un écran qui change, et l'ondulation de chaleur à l'écran pour les plans chauds.

> [!warning] Erreurs d'animation déjà rencontrées
> Voir [[14 - Contrôle qualité]] : objet qui traverse une porte fermée, voiture qui roule dans les piétons, piéton hors cadre, passant caché derrière la file, parapluie invisible, voisin coupé par le bord de l'image.
