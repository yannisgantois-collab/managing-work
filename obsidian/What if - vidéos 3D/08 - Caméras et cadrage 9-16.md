---
tags: [what-if, camera, cadrage, tiktok]
aliases: [Cadrage 9:16, CAMS, CAMANIM]
créé: 2026-11-24
---

# Caméras et cadrage 9:16

Retour à [[00 - Carte du projet What if]]

## Déclarer un cadrage
```js
'street:pharmacy': [52, [4.0, 1.65, 6.0], [8.0, 4.0, -30], { ao: false, bloom: [0.3, 0.45, 0.93], heat: 0.0014 }],
//                  fov  position            cible           options de rendu (voir la note 09)
```
Options utiles : `far` / `near` (le plan lointain à 600 m cachait la tour Eiffel, d'où `far: 3500`), `ao`, `bloom`, `dof`, `heat`.

## Mouvements (`CAMANIM` dans `animN.js`)
`u` va de 0 à 1 sur la durée du plan, `b` est le cadrage de base :
```js
P02: (u, b) => ({ ...b, pos: lerp3(b.pos, b.look, 0.1 * ease(u)) }),               // poussée lente
P03: (u, b) => ({ ...b, pos: add3(b.pos, [0, 0, 1.6 * u]) }),                       // recul
P05: (u, b) => ({ ...b, look: add3(b.look, [22 * u, 0, 0]) }),                      // panoramique
P07: (u, b) => ({ ...b, look: add3(b.look, [0, -3.5 * ease(u), 0]) }),              // la caméra descend
P12: (u, b, t) => ({ ...b, pos: add3(b.pos, [Math.sin(t * 1.7) * 0.03, Math.sin(t * 2.3) * 0.02, 0]) }), // caméra portée
P06: (u, b) => ({ ...b, pos: lerp3(b.pos, [0.55, 1.85, 3.0], ease(u)), look: lerp3(b.look, [0.8, 1.7, 0], ease(u)) }), // avancer sur un objet
```

## Le cadre vertical est étroit
Avec un champ vertical de 50°, le champ horizontal n'est que de `2 × atan(tan(25°) × 9/16) ≈ 29°`. Un objet à 34° de l'axe est hors champ. Pour placer un objet à un endroit précis de l'image, on calcule sa position projetée.

> [!tip] Vérifier un cadrage sans rendre
> Un petit script Node projette des points-clés (tête d'un personnage, panneau, tasse) avec une `PerspectiveCamera` three.js et affiche leur position en % de l'image. On essaie plusieurs cadrages en une seconde, puis on rend seulement le meilleur.
> ```js
> const v = new THREE.Vector3(...p).project(camera);
> console.log(`${(50 + v.x * 50).toFixed(0)}%, ${(50 - v.y * 50).toFixed(0)}%`);
> ```

## Les zones de l'écran
| Zone | Place | Règle |
|---|---|---|
| Titre (P01) | à 25 % du haut | Rien de lisible dessous. |
| Compteur | à gauche, de 44,5 % à 52 % de la hauteur, de 7 % à 30 % de la largeur | Jamais un visage ou un panneau dessous. |
| Sous-titre | de 63 % à 73 % de la hauteur | Les objets à lire (affiche, panneau) restent au-dessus. |
| Interface TikTok | bord droit (au-delà de 86 %) et bas | Rien d'important. |

> [!warning] Erreurs de cadrage corrigées
> - Le compteur cachait Jeanne (épisode 2, dernier plan) : cible décalée vers elle et léger recul.
> - L'affiche de l'école passait sous le sous-titre : affiche remontée, caméra qui avance dessus.
> - Le panneau « EAU 28 °C » sortait de l'image pendant le panoramique : panoramique dans l'autre sens.
> - La voisine était coupée par le haut de l'image : placée à la fenêtre du premier étage.
> - Les toits du premier rang bouchaient la vue sur Paris : caméra montée à 27 m.
