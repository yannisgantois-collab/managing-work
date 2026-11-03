-- SoundConfig.luau
-- 🎧 Les sons ASMR du jeu.
--
-- Le dossier assets/sounds contient des sons originaux (créés pour ce jeu, donc
-- libres de droits). Pour de vrais clics de clavier :
--   1. Studio > onglet View > Asset Manager > Bulk Import > choisis les .wav
--   2. Clic droit sur chaque son importé > Copy Asset ID
--   3. Colle l'ID ci-dessous, par exemple Press = { "rbxassetid://1234567890" }
--
-- Tant qu'une liste est vide, le jeu utilise un son intégré à Roblox (Fallback),
-- donc tout fonctionne même sans rien téléverser.

local SoundConfig = {}

-- Profils de touches (les 5 de la vidéo). Plusieurs IDs = variation aléatoire.
SoundConfig.Profiles = {
	Thocky = {
		Label = "Thocky",
		Press = {}, -- colle ici l'ID de key_thocky.wav
		Release = {}, -- colle ici l'ID de key_release.wav
		Volume = 0.9,
		Fallback = { Id = "rbxasset://sounds/action_jump_land.mp3", Speed = 0.85, Volume = 0.7 },
	},
	Clicky = {
		Label = "Clicky",
		Press = {}, -- key_clicky.wav
		Release = {},
		Volume = 0.8,
		Fallback = { Id = "rbxasset://sounds/action_jump_land.mp3", Speed = 2.4, Volume = 0.55 },
	},
	Bubble = {
		Label = "Bubble",
		Press = {}, -- key_bubble.wav
		Release = {},
		Volume = 0.8,
		Fallback = { Id = "rbxasset://sounds/impact_water.mp3", Speed = 2.6, Volume = 0.35 },
	},
	Honey = {
		Label = "Honey",
		Press = {}, -- key_honey.wav
		Release = {},
		Volume = 0.85,
		Fallback = { Id = "rbxasset://sounds/action_jump_land.mp3", Speed = 1.35, Volume = 0.6 },
	},
	Water = {
		Label = "Water",
		Press = {}, -- key_water.wav
		Release = {},
		Volume = 0.8,
		Fallback = { Id = "rbxasset://sounds/impact_water.mp3", Speed = 1.7, Volume = 0.3 },
	},
}

-- Ordre d'affichage dans les réglages
SoundConfig.ProfileOrder = { "Thocky", "Clicky", "Bubble", "Honey", "Water" }
SoundConfig.DefaultProfile = "Thocky"

-- Son de relâchement commun si un profil n'a pas le sien
SoundConfig.SharedRelease = {} -- key_release.wav
SoundConfig.ReleaseFallback = { Id = "rbxasset://sounds/action_jump_land.mp3", Speed = 3.2, Volume = 0.18 }

-- Effets du jeu
SoundConfig.Effects = {
	Collect = { Ids = {}, Volume = 0.7, Fallback = { Id = "rbxasset://sounds/electronicpingshort.wav", Speed = 1.4, Volume = 0.5 } }, -- fx_collect.wav
	Grab = { Ids = {}, Volume = 0.8, Fallback = { Id = "rbxasset://sounds/action_get_up.mp3", Speed = 1.6, Volume = 0.6 } }, -- fx_pop.wav
	Steal = { Ids = {}, Volume = 0.9, Fallback = { Id = "rbxasset://sounds/electronicpingshort.wav", Speed = 0.6, Volume = 0.6 } }, -- fx_alarm.wav
	Deposit = { Ids = {}, Volume = 0.8, Fallback = { Id = "rbxasset://sounds/electronicpingshort.wav", Speed = 1.1, Volume = 0.6 } }, -- fx_deposit.wav
	Slap = { Ids = {}, Volume = 0.9, Fallback = { Id = "rbxasset://sounds/action_jump_land.mp3", Speed = 1.9, Volume = 1 } }, -- fx_slap.wav
	Lock = { Ids = {}, Volume = 0.8, Fallback = { Id = "rbxasset://sounds/action_jump_land.mp3", Speed = 0.6, Volume = 0.9 } }, -- fx_lock.wav
	Notify = { Ids = {}, Volume = 0.6, Fallback = { Id = "rbxasset://sounds/electronicpingshort.wav", Speed = 1.8, Volume = 0.35 } }, -- fx_notify.wav
	Rare = { Ids = {}, Volume = 0.8, Fallback = { Id = "rbxasset://sounds/electronicpingshort.wav", Speed = 2.2, Volume = 0.5 } }, -- fx_rare.wav
	Error = { Ids = {}, Volume = 0.6, Fallback = { Id = "rbxasset://sounds/electronicpingshort.wav", Speed = 0.45, Volume = 0.4 } }, -- fx_error.wav
	Upgrade = { Ids = {}, Volume = 0.8, Fallback = { Id = "rbxasset://sounds/electronicpingshort.wav", Speed = 1.6, Volume = 0.5 } }, -- fx_upgrade.wav
}

-- Musique d'ambiance (optionnelle) : colle des IDs de musique lofi du Creator Store.
-- Liste vide = pas de musique (le réglage "Music" est alors masqué).
SoundConfig.Music = {}
SoundConfig.MusicVolume = 0.35

return SoundConfig
