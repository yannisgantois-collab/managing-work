---
tags: [what-if, son, numpy, musique, synthese]
aliases: [Bande-son What if, synth.py]
créé: 2026-11-24
---

# Bande-son procédurale

Retour à [[00 - Carte du projet What if]] · Montage : [[12 - Montage et export ffmpeg]]

Pas de voix off, pas de banque de sons : tout est **synthétisé en Python avec numpy**, à 48 kHz en stéréo, et calé sur les temps de `shots.json`. Un fichier par épisode : `synth.py`, `synth2.py`, `synth3.py`.
```bash
python3 synth3.py projets/canicule/soundtrack.wav projets/canicule/shots.json
```

## Le principe
- Deux bus : **effets** (`fx`) et **musique** (`mu`). La musique passe dans une courbe de volume (`duck`) avant d'être mélangée.
- `add(signal, t0, gain, pan, bus)` pose un son à l'instant `t0` (en secondes), avec un panoramique à puissance constante.
- `T('P13')` donne le début du plan P13 : on écrit `T('P13') + 1.22` pour tomber exactement sur l'image de l'éclair.
- Générateur aléatoire à graine (`default_rng(7)`) : la bande-son est identique à chaque génération.
- Les gains restent bas (0,01 à 0,1) ; la normalisation finale à −14 LUFS remonte l'ensemble.

## Les briques
| Brique | Comment |
|---|---|
| `band(x, lo, hi)` | Filtre passe-bande doux par FFT : la base de presque tout. |
| `noise`, `brown`, `roomtone` | Bruit blanc, bruit brun, ambiance de pièce. |
| `wind`, `rain`, `water`, `hiss` | Bruits filtrés modulés lentement. |
| `hum(d, f)` | Bourdonnement 50 Hz et ses harmoniques (frigo, ligne électrique, centrale). |
| `babble` | Brouhaha de foule : bruit filtré dans la bande de la voix, modulé. |
| `thump`, `click`, `step`, `knock`, `door_thump` | Chocs : sinus grave qui décroît vite et bruit court. |
| `beep`, `ting`, `siren`, `sit_tones`, `ringback`, `phone_trill` | Signaux : sirène « pin-pon », tonalités « numéro inaccessible », sonnerie. |
| `piano(f)` | Six partiels légèrement inharmoniques qui s'éteignent chacun à leur vitesse. |
| `pad(fréquences)` | Nappe : sinus désaccordés de ±0,18 Hz plus l'octave, passe-bas à 2 200 Hz, attaque et relâche lentes. |

Ajouts de l'épisode 3 : martinets (`swift`), tôle de zinc qui travaille (`metal_tic`, `zinc_clac`), ventilateur, mouche (`buzz`), crissement des rails, grésillement de la caténaire, corbeaux (`caw`) et battements d'ailes, alarme de voiture, compresseurs de climatiseurs, grillons, arrosage, radio, tonnerre, battement de cœur, oiseaux (`chirp`).

## La musique, au service du récit (épisode 3)
- Actes 1 et 2 : nappe en mineur qui **monte d'un demi-ton** par accord, comme le thermomètre, et une pulsation grave qui **se resserre** de 0,95 s à 0,6 s entre deux battements.
- P11 (50 °C) : musique écrasée à 8 % : un quasi-silence oppressant, seulement le brumisateur et le bip de la croix.
- P13 : la musique est **coupée net** au tonnerre.
- Après l'orage : accords plus doux avec piano, puis passage en **majeur** au plan de l'espoir (P18) et accord résolu sur la carte de fin.
- Fondu de 0,6 s avant la fin, crête normalisée à 0,89, fichier WAV 16 bits.
```python
def ramp(t0, t1, v0, v1): i0, i1 = int(t0 * SR), int(t1 * SR); duck[i0:i1] = np.linspace(v0, v1, max(1, i1 - i0))
ramp(T('P11') - 0.3, T('P11') + 0.2, 1, 0.08)        # écrasée à 50 °C
ramp(T('P13') + 1.15, T('P13') + 1.22, 1, 0)         # coupée par le tonnerre
```

> [!tip] Chaque plan a trois couches
> Une ambiance de fond (vent, pièce, ville), un ou deux **événements** synchronisés sur l'image (une porte, un bip, l'envol des corbeaux), et la musique. Pour placer un événement, prendre l'instant exact dans le code de l'animation du décor.

> [!warning] Erreurs rencontrées
> - Deux tableaux de longueurs différentes additionnés (`zinc_clac`) : compléter le plus court avec des zéros.
> - `np.arange` avec un pas qui varie : impossible, il faut une boucle `while`.
> - Une fonction à moitié écrite laissée dans le fichier fait planter tout le script : la retirer ou la finir.
