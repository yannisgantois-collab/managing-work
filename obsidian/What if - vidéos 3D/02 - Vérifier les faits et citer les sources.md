---
tags: [what-if, sources, fact-checking]
aliases: [Sources What if, Fact-checking]
créé: 2026-11-24
---

# Vérifier les faits et citer les sources

Retour à [[00 - Carte du projet What if]] · Voir aussi [[01 - Écrire un What if]]

## La règle
Chaque chiffre réel affiché (compteur, sous-titre, panneau dans le décor) a une ligne dans le tableau des sources du storyboard : référence `S1…`, donnée, lien, plans concernés, **statut** :
- **Vérifié** : au moins une source sérieuse (organisme officiel, presse de référence), si possible deux qui concordent ;
- **À recouper** : une seule source, ou des sources qui divergent, ou une page qu'on n'a pas pu ouvrir.

Les chiffres inventés pour la fiction sont **déclarés** en une phrase sous le tableau (« Chiffres inventés pour la fiction : … »).

## Où ça se règle dans l'outil
Dans `projets/<nom>/shots.json`, section `page.sources` : `[référence, donnée, url, plans, statut]`. Chaque plan liste ses sources dans `src` et les défauts qu'il corrige dans `fix`.

## Méthode qui a marché
1. Lister les faits nécessaires au scénario **avant** d'écrire les sous-titres.
2. Lancer plusieurs recherches web en parallèle, une par fait.
3. Préférer : sites officiels (ville, ministère, Inserm, Météo-France, Santé publique France), puis agences (AFP), puis presse.
4. Noter les nuances : « jusqu'à 80 °C » (une source dit 70, une autre 80 : statut « à recouper ») ; « 15 000 morts » est un arrondi, l'Inserm dit **14 802 décès en excès du 1er au 20 août 2003**.
5. Si le chiffre affiché n'est pas exactement celui de la source, l'écrire comme la source l'écrit.

> [!warning] Corrections faites grâce à la vérification
> - Épisode 2 : l'autonomie des antennes mobiles n'est pas « quelques heures » mais **10 à 30 minutes**.
> - Épisode 1 : « Paris a 3 jours de réserves » n'a pas de source ; l'Apur et la Ville de Paris disent **5 à 7 jours**.
> - Épisode 3 : le chiffre des cours oasis (203) date du début de 2025, il est marqué « à mettre à jour ».

> [!info] Limites de l'environnement
> Certains sites ne s'ouvrent pas depuis la session cloud (insee.fr, paris.fr) : on s'appuie alors sur les résumés de recherche et on marque « à recouper » quand un doute reste.

## Exemples de sources solides par thème
- **Agriculture** : Agreste (recensement 2020), ministère de l'Agriculture, INSEE.
- **Électricité** : Public Sénat (panne du 19 décembre 1978), presse espagnole et française pour le 28 avril 2025, FDA pour la conservation au frigo.
- **Canicule** : Ville de Paris (exercice « Paris à 50 °C » du 13 octobre 2023, records météo), Inserm (2003), Météo-France (record de 46,0 °C le 28 juin 2019 à Vérargues, projection d'une France à +4 °C), Santé publique France (risque × 4 sous les toits), ministère de l'Éducation nationale (brevet 2019 reporté).

Les tableaux complets sont dans chaque fiche épisode : [[Épisode 1 - Agriculteurs]], [[Épisode 2 - Coupure d'électricité]], [[Épisode 3 - Paris à 50 degrés]].
