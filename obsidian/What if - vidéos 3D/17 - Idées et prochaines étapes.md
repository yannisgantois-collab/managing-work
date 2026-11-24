---
tags: [what-if, idees, backlog]
aliases: [Idées What if, Backlog What if]
créé: 2026-11-24
---

# Idées et prochaines étapes

Retour à [[00 - Carte du projet What if]]

## À recouper avant de publier
- [ ] Épisode 1 : le nombre d'agriculteurs (496 365) sur le site d'Agreste (S1).
- [ ] Épisode 3 : le zinc à « 80 °C » (70 ou 80 °C selon les sources, S7).
- [ ] Épisode 3 : le nombre de cours oasis (203, chiffre à mettre à jour, S13).

## Sujets possibles
Chaque sujet a besoin d'un **compteur** qui porte le récit et d'une **chute réelle** sourcée. Les chiffres restent à vérifier avant d'écrire (voir [[02 - Vérifier les faits et citer les sources]]).
| Sujet | Compteur | Chute réelle à chercher |
|---|---|---|
| Et si la Seine débordait comme en 1910 ? | Hauteur de la Seine | La crue de 1910 et l'exercice de crise sur une crue majeure. |
| Et si Internet s'arrêtait 24 heures ? | Heures sans réseau | Les grandes pannes de réseau et de paiement déjà vécues. |
| Et si l'eau du robinet était coupée dans une grande ville ? | Litres restants par habitant | Les villes qui ont frôlé la pénurie d'eau. |
| Et si les abeilles disparaissaient ? | Part des cultures pollinisées | Le déclin réel des pollinisateurs. |
| Et si plus personne ne voulait être médecin de campagne ? | Médecins dans le département | Les déserts médicaux d'aujourd'hui. |

## Améliorer l'outil
- **Vérifier les sous-titres automatiquement** : nombre de lignes, caractères par seconde, unités non protégées par `nb()`.
- **Vérifier les zones automatiquement** : intégrer la projection des points-clés (visages, panneaux) au rendu du storyboard et signaler ceux qui tombent sous le compteur ou le sous-titre.
- **Générer un nouvel épisode** : partir d'un modèle de `shots.json` (19 plans, temps déjà calculés), comme `projets/canicule/ecrire_script.py`.
- **Bibliothèque de décors** : sortir les objets réutilisables (immeuble, oiseaux, voiture, carte de France) des fichiers d'épisode vers `lib.js`.
- **Voix off facultative** : une synthèse vocale locale et gratuite pourrait lire les sous-titres ; la musique serait alors baissée sous la voix.
- **Image de couverture** : exporter automatiquement la première image du plan P01 avec le titre pour la miniature TikTok.

## Ce qui a bien marché, à garder
- Storyboard validé **avant** l'animation : les corrections coûtent quelques secondes au lieu d'une heure de rendu.
- Un compteur unique, toujours à la même place, qui fait monter la tension.
- Une chute réelle et chiffrée, puis une note d'espoir et un appel au partage ciblé (« Envoie ça à quelqu'un qui vit sous les toits. »).
- Toujours la même durée (78,5 s) et la même grille de 19 plans : on réutilise les temps, la musique et le montage.
