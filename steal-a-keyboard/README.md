# ⌨️ Steal a Keyboard

Un jeu Roblox qui fusionne deux concepts qui marchent :

- **les maps « clavier ASMR »** : toute la map est faite de touches de clavier mécanique qui s'enfoncent sous tes pieds, s'allument en RGB et font « clic » ;
- **la formule « Steal a… »** (Steal An Egg, Steal a Brainrot) : tu gagnes de la vitesse, tu ramasses des objets rares, tu les poses dans ta base pour gagner de l'argent… et tu voles ceux des autres.

## 🎮 La boucle de jeu

1. **Marche sur des touches → ⚡ Speed.** Chaque touche enfoncée te donne de la Speed, et la piste d'entraînement de ta base donne ×3.
2. **Les zones** au bout de la rue (Office, Gamer, Retro, Candy, Neon, Galaxy) ont une porte qui demande un minimum de Speed.
3. **Ramasse un clavier** sur un socle : maintiens E, puis ramène-le dans ta base. Tu cours 20 % moins vite quand tu portes un clavier.
4. **Il rapporte de l'argent chaque seconde** : marche sur sa touche **$** pour encaisser.
5. **Améliore tes switchs** dans la boutique (Membrane → Red → Brown → Blue… → Galaxy) pour gagner plus de Speed par touche, et achète des emplacements.
6. **Vole** les claviers des autres bases (maintiens E). Le propriétaire peut te **gifler avec son clavier** pour te le faire lâcher.
7. **Protège ta base** en marchant sur la touche **LOCK** : 60 secondes de barrière.
8. **Bonus : la tour ASMR** (la map de ta vidéo) derrière la place centrale. Arrive en haut sur la touche **ENTER** et tu gagnes un clavier gratuit de la zone suivante (une fois toutes les 10 minutes).
9. **Rebirth** (boutique, à partir de $1M) : tu repars de zéro en argent, en Speed et en switch, mais tu **gardes tes claviers et tes emplacements**, avec un bonus permanent de +50 % d'argent et +50 % de Speed par rebirth.
10. **Index** (bouton 📖, touche J) : la collection des 24 claviers en 3D. Ceux qu'il te manque sont des silhouettes « ??? ». Chaque zone complétée donne **+10 % d'argent pour toujours**.
11. **Événements de serveur**, automatiques toutes les 12 minutes, pendant 3 minutes : ⚡ Double Speed, 💰 Double Cash, 🌟 Golden Hour (mutations ×3), ⌨️ Keyboard Rain (claviers ×4). Une bannière affiche le temps restant.
12. **Classements** sur la place centrale : 💰 TOP EARNERS (argent gagné au total) et 🥷 TOP THIEVES (vols réussis), pour tous les serveurs.

Ce qui est repris de la vidéo :

- les touches qui s'enfoncent ;
- l'underglow RGB ;
- les 5 sons (Thocky, Clicky, Bubble, Honey, Water) ;
- la couleur des keycaps ;
- les volumes, avec la possibilité de couper les touches des autres joueurs ;
- **tout est gratuit, aucun son n'est payant** ;
- **anti-troll** : les joueurs se traversent, donc personne ne peut te faire voler hors de la map (fling).

## 🚀 Ouvrir et tester le jeu

1. Télécharge **`build/StealAKeyboard.rbxl`** et ouvre-le avec Roblox Studio (double-clic, ou File > Open from File).
2. Clique sur **Play** pour tester seul.
3. Pour tester le vol à plusieurs : onglet **Test** > **Clients and Servers** > choisis **2 Players** > **Start**.

Commandes : **E** pour ramasser ou voler, **clic** pour la gifle (outil « Keyboard Slap »), **B** pour la boutique, **J** pour l'index, **N** pour les réglages ASMR. Sur téléphone, tout se fait aux boutons.

## ✅ Avant de publier

Dans **Home > Game Settings** :

- **Security** : active **Enable Studio Access to API Services**. Sans ça, rien n'est sauvegardé (le jeu l'affiche en bas à gauche).
- **Nombre de joueurs** : mets **8 joueurs maximum par serveur**, parce qu'il y a 8 bases (Game Settings > Places, ou dans le Creator Hub > ton expérience > Places).
- **Avatar** : R15 conseillé (R6 fonctionne aussi).

Ensuite : **File > Publish to Roblox**.

## 🔄 Mettre à jour un jeu déjà publié

Quand je te donne une nouvelle version de `StealAKeyboard.rbxl` :

1. Ouvre le nouveau fichier dans Studio (**File > Open from File**).
2. Fais **File > Publish to Roblox As…**, choisis ton expérience « Steal a Keyboard », puis son lieu, et confirme le remplacement.

Les données des joueurs (argent, claviers, rebirths…) sont gardées : elles sont sur les serveurs de Roblox, pas dans le fichier.

⚠️ Tout ce que tu as modifié toi-même dans Studio (par exemple les IDs de sons collés dans `SoundConfig`) est remplacé par le nouveau fichier. Envoie-moi tes IDs : je les mets directement dans le code pour qu'ils restent dans toutes les versions.

## 🎧 Mettre les vrais sons ASMR (5 minutes)

Les sons originaux du jeu sont dans **`assets/sounds/`**. Ils sont synthétisés de zéro, donc libres de droits. Tant que tu ne les as pas téléversés, le jeu utilise des sons basiques intégrés à Roblox.

1. Dans Studio : onglet **View** > **Asset Manager**, puis le bouton **Bulk Import**. Sélectionne tous les `.wav` de `assets/sounds`.
2. Pour chaque son : clic droit > **Copy Asset ID**.
3. Colle l'ID dans **`ReplicatedStorage > Shared > SoundConfig`**, par exemple `Press = { "rbxassetid://123456789" }`.

| Fichier | Où le coller dans SoundConfig |
|---|---|
| `key_thocky.wav` | `Profiles.Thocky.Press` |
| `key_clicky.wav` | `Profiles.Clicky.Press` |
| `key_bubble.wav` | `Profiles.Bubble.Press` |
| `key_honey.wav` | `Profiles.Honey.Press` |
| `key_water.wav` | `Profiles.Water.Press` |
| `key_release.wav` | `SharedRelease` |
| `fx_collect.wav` | `Effects.Collect.Ids` |
| `fx_pop.wav` | `Effects.Grab.Ids` |
| `fx_alarm.wav` | `Effects.Steal.Ids` |
| `fx_deposit.wav` | `Effects.Deposit.Ids` |
| `fx_slap.wav` | `Effects.Slap.Ids` |
| `fx_lock.wav` | `Effects.Lock.Ids` |
| `fx_notify.wav` | `Effects.Notify.Ids` |
| `fx_rare.wav` | `Effects.Rare.Ids` |
| `fx_error.wav` | `Effects.Error.Ids` |
| `fx_upgrade.wav` | `Effects.Upgrade.Ids` |

Tu peux aussi mettre plusieurs IDs par profil (de vrais enregistrements de claviers du Creator Store, par exemple) : le jeu en choisit un au hasard à chaque touche. Pour ajouter de la musique lofi, colle des IDs dans `SoundConfig.Music`.

## 🛠️ Modifier le jeu

| Je veux changer… | Fichier |
|---|---|
| Vitesse, prix, zones, verrou, tour, sauvegarde | `ReplicatedStorage > Shared > Config` |
| Les claviers à collectionner (noms, raretés, revenus) | `Shared > Items` |
| Couleurs des keycaps / RGB / bases | `Shared > Themes` |
| Sons | `Shared > SoundConfig` |
| Produits Robux (boosts de Speed ou de cash) | `Config.Products` : colle l'ID d'un Developer Product créé dans le Creator Hub |
| Rebirths (prix, bonus) | `Config.Rebirth` |
| Événements (fréquence, durée, liste) | `Config.Events` (`Enabled = false` pour les couper) |
| Récompense de groupe | `Config.Group.Id` : l'ID de ton groupe Roblox (le nombre dans l'adresse de sa page) |
| Classements | `Config.Leaderboards` (change `Version` pour les remettre à zéro) |

**La map** est dans `Workspace > Map` et tu peux la modifier directement dans Studio. Une touche est un Model `Key` qui contient `Cap`, `Top` et `Glow`, avec le tag `Key`. **Duplique des touches pour construire de nouveaux chemins** : elles s'enfonceront, s'allumeront et feront du son automatiquement. Les touches spéciales utilisent l'attribut `Action` :

- `Collect` pour encaisser ;
- `Lock` pour verrouiller la base ;
- `Checkpoint` (avec l'attribut `Stage`) pour la tour ;
- `TowerFinish` pour la touche ENTER.

## 🧑‍💻 Pour les développeurs (Rojo)

Le code source est dans `src/` et la map est générée par code :

```bash
lune run tools/build-map.luau
```

```bash
rojo build -o build/StealAKeyboard.rbxl
```

```bash
lune run tools/check.luau
```

```bash
selene src tools
```

```bash
python3 tools/generate_sounds.py
```

```bash
lune run tests/smoke-server.luau
```

```bash
lune run tests/smoke-client.luau
```

Dans l'ordre : générer la map (`build/Map.rbxm`), construire le fichier Studio, vérifier la syntaxe et la config, lancer le linter, régénérer les sons, puis jouer une partie simulée (2 joueurs côté serveur, interface et touches côté client). Les simulations ne remplacent pas un vrai test dans Studio, mais elles attrapent les erreurs de code. Pour coder dans VS Code avec synchronisation en direct : `rojo serve`, plus le plugin Rojo dans Studio.

Structure :

```
src/shared/   Config, Items, SoundConfig, Themes, Format, KeyboardBuilder, MapGenerator
src/server/   Main + Services : Data (sauvegarde), Player, Plot (bases), Zone, Carry (porter/voler/gifler),
              Speed (vitesse par touche), Shop, Tower, World, ItemModels, Bonus (multiplicateurs),
              Event (événements), Leaderboard (classements)
src/client/   Main + Controllers : KeyEngine (touches ASMR), SoundController, Settings, WorldController,
              UI (Hud, ShopPanel, SettingsPanel, IndexPanel)
tools/        build-map.luau, check.luau, generate_sounds.py
tests/        smoke-server.luau, smoke-client.luau (parties simulées dans Lune)
```

## 💡 Idées pour les prochaines mises à jour

- **Gardiens** dans les zones, pour rendre la récupération des claviers plus dangereuse.
- **Nouvelles zones** et nouveaux claviers (il suffit d'ajouter des lignes dans `Config.Zones` et `Items`, puis de régénérer la map).
- **Quêtes quotidiennes** (« vole 3 claviers », « appuie sur 5 000 touches ») avec récompenses.
- **Boutique de trails / effets de pas** (gratuits ou en Robux) qui changent la couleur des touches sous tes pieds.
