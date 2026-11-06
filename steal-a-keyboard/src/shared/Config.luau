-- Config.luau
-- ⚙️ TOUS les réglages d'équilibrage du jeu sont ici.
-- Tu peux changer les nombres sans toucher au reste du code.
--
-- Règle importante : ce fichier ne contient que des nombres, des textes et des
-- tableaux (les couleurs sont écrites {R, G, B} de 0 à 255). Aucun Color3 ou
-- Vector3 ici, pour que l'outil de construction de la map (Lune) puisse le lire.

local Config = {}

Config.GameName = "Steal a Keyboard"

----------------------------------------------------------------------
-- ⚡ VITESSE
-- Chaque touche que tu enfonces en marchant donne de la "Speed".
-- La Speed débloque les zones et te fait courir plus vite.
----------------------------------------------------------------------
Config.Speed = {
	KeyStep = 2.5, -- distance (en studs) parcourue sur des touches = 1 "appui"
	TrainingMultiplier = 3, -- bonus sur la piste d'entraînement de ta base
	BaseWalkSpeed = 16, -- vitesse de marche de départ (16 = vitesse Roblox normale)
	WalkSpeedFactor = 6, -- WalkSpeed = Base + Factor * ln(1 + Speed / Divisor)
	WalkSpeedDivisor = 20,
	MaxWalkSpeed = 75, -- au-delà, la caméra et la physique deviennent difficiles
	CarryMultiplier = 0.8, -- quand tu portes un clavier, tu cours 20 % moins vite
}

-- Vitesse de marche réelle selon la Speed accumulée (utilisé par le serveur et l'interface)
function Config.walkSpeedFor(speed: number): number
	local s = Config.Speed
	local ws = s.BaseWalkSpeed + s.WalkSpeedFactor * math.log(1 + math.max(speed, 0) / s.WalkSpeedDivisor)
	return math.min(ws, s.MaxWalkSpeed)
end

----------------------------------------------------------------------
-- ⌨️ SWITCHS (l'amélioration principale)
-- Gain = Speed gagnée par touche enfoncée.
----------------------------------------------------------------------
Config.Switches = {
	{ Name = "Membrane", Gain = 1, Cost = 0, Color = { 170, 170, 180 } },
	{ Name = "Red Switch", Gain = 3, Cost = 500, Color = { 235, 70, 70 } },
	{ Name = "Brown Switch", Gain = 8, Cost = 15000, Color = { 160, 105, 60 } },
	{ Name = "Blue Switch", Gain = 20, Cost = 100000, Color = { 70, 140, 255 } },
	{ Name = "Silver Switch", Gain = 50, Cost = 500000, Color = { 205, 210, 225 } },
	{ Name = "Golden Switch", Gain = 120, Cost = 3000000, Color = { 255, 200, 50 } },
	{ Name = "Diamond Switch", Gain = 300, Cost = 15000000, Color = { 120, 235, 255 } },
	{ Name = "Galaxy Switch", Gain = 800, Cost = 80000000, Color = { 190, 90, 255 } },
}

----------------------------------------------------------------------
-- 🏠 BASE
----------------------------------------------------------------------
Config.Slots = {
	Start = 4, -- emplacements débloqués au départ
	Max = 12, -- emplacements maximum (la map en contient 12 par base)
	-- prix de l'emplacement N
	Costs = {
		[5] = 200,
		[6] = 1500,
		[7] = 8000,
		[8] = 40000,
		[9] = 200000,
		[10] = 1000000,
		[11] = 5000000,
		[12] = 25000000,
	},
}

Config.Base = {
	LockDuration = 60, -- secondes de verrouillage quand tu marches sur la touche LOCK
	OfflineRate = 0.2, -- part des revenus gagnée hors ligne (0.2 = 20 %)
	OfflineMaxSeconds = 2 * 60 * 60, -- maximum 2 h de revenus hors ligne
	SellSeconds = 60, -- prix de revente = 60 secondes de revenus du clavier
	PlotCount = 8, -- nombre de bases sur la map (= joueurs max par serveur)
}

----------------------------------------------------------------------
-- 🗺️ ZONES (les claviers apparaissent ici)
-- Required = Speed minimum pour passer la porte.
-- Les couleurs servent à la construction de la map.
----------------------------------------------------------------------
Config.Zones = {
	{
		Name = "Office",
		Required = 0,
		CapColor = { 236, 238, 242 },
		TopColor = { 250, 251, 253 },
		PlateColor = { 205, 208, 215 },
		Accent = { 90, 175, 255 },
	},
	{
		Name = "Gamer",
		Required = 300,
		CapColor = { 32, 33, 40 },
		TopColor = { 45, 47, 56 },
		PlateColor = { 22, 22, 28 },
		Accent = { 255, 60, 200 },
	},
	{
		Name = "Retro",
		Required = 2500,
		CapColor = { 222, 204, 170 },
		TopColor = { 236, 222, 192 },
		PlateColor = { 140, 100, 70 },
		Accent = { 255, 150, 60 },
	},
	{
		Name = "Candy",
		Required = 12000,
		CapColor = { 255, 190, 220 },
		TopColor = { 255, 215, 235 },
		PlateColor = { 255, 150, 200 },
		Accent = { 255, 105, 180 },
	},
	{
		Name = "Neon",
		Required = 60000,
		CapColor = { 20, 30, 60 },
		TopColor = { 30, 45, 85 },
		PlateColor = { 12, 16, 35 },
		Accent = { 0, 255, 230 },
	},
	{
		Name = "Galaxy",
		Required = 250000,
		CapColor = { 50, 25, 90 },
		TopColor = { 75, 40, 130 },
		PlateColor = { 25, 10, 50 },
		Accent = { 200, 90, 255 },
	},
}

-- Index de la meilleure zone accessible avec cette Speed
function Config.allowedZone(speed: number): number
	local best = 1
	for i, zone in Config.Zones do
		if speed >= zone.Required then
			best = i
		end
	end
	return best
end

Config.Spawning = {
	PedestalsPerZone = 5,
	MinDelay = 6, -- secondes avant qu'un nouveau clavier apparaisse sur un socle vide
	MaxDelay = 16,
	Lifetime = 90, -- un clavier non pris disparaît après 90 s
	DroppedLifetime = 15, -- un clavier lâché au sol reste 15 s
	RareAnnounceRank = 5, -- annonce à tout le serveur à partir de Legendary (rang 5)
}

----------------------------------------------------------------------
-- 🥷 VOL ET GIFLE
----------------------------------------------------------------------
Config.Steal = {
	HoldDuration = 1.5, -- secondes à maintenir E pour voler
	GrabHoldDuration = 0.4, -- secondes à maintenir E pour ramasser dans une zone
	MaxCarryTime = 150, -- au-delà, le clavier porté revient à sa place
	PromptDistance = 11,
}

Config.Slap = {
	Cooldown = 0.8,
	Range = 9, -- distance de la gifle
	StunTime = 0.7, -- le voleur giflé est figé un court instant
}

----------------------------------------------------------------------
-- 🗼 TOUR ASMR BONUS
----------------------------------------------------------------------
Config.Tower = {
	Stages = 8, -- doit correspondre à la map générée
	Cooldown = 10 * 60, -- une récompense toutes les 10 minutes par joueur
	CashFallbackSeconds = 120, -- si ta base est pleine : 120 s de revenus en cash
}

----------------------------------------------------------------------
-- 🔁 REBIRTH
-- Remet à zéro l'argent, la Speed et le switch, mais GARDE tes claviers et
-- tes emplacements. En échange : bonus permanents d'argent et de Speed.
----------------------------------------------------------------------
Config.Rebirth = {
	BaseCost = 1000000, -- prix du 1er rebirth ($1M)
	CostMultiplier = 5, -- chaque rebirth coûte 5x plus cher que le précédent
	CashBonus = 0.5, -- +50 % d'argent par rebirth
	SpeedBonus = 0.5, -- +50 % de Speed par touche par rebirth
	Max = 30,
}

function Config.rebirthCost(rebirths: number): number
	return Config.Rebirth.BaseCost * Config.Rebirth.CostMultiplier ^ rebirths
end

----------------------------------------------------------------------
-- 📖 INDEX : trouver tous les claviers d'une zone = bonus d'argent permanent
----------------------------------------------------------------------
Config.Index = {
	ZoneBonus = 0.1, -- +10 % d'argent par zone complétée
}

----------------------------------------------------------------------
-- 🎉 ÉVÉNEMENTS DE SERVEUR (automatiques, pour tout le serveur)
----------------------------------------------------------------------
Config.Events = {
	Enabled = true,
	FirstDelay = 4 * 60, -- premier événement 4 min après l'ouverture du serveur
	Interval = 12 * 60, -- puis un événement toutes les 12 minutes
	Duration = 3 * 60, -- chaque événement dure 3 minutes
	SpeedMultiplier = 2, -- DoubleSpeed
	CashMultiplier = 2, -- DoubleCash
	MutationMultiplier = 3, -- GoldenHour
	SpawnSpeedup = 4, -- KeyboardRain
	List = {
		{ Id = "DoubleSpeed", Name = "⚡ DOUBLE SPEED", Description = "Every key gives 2x Speed!" },
		{ Id = "DoubleCash", Name = "💰 DOUBLE CASH", Description = "Your keyboards earn 2x cash!" },
		{ Id = "GoldenHour", Name = "🌟 GOLDEN HOUR", Description = "Gold, Diamond and Rainbow keyboards are 3x more common!" },
		{ Id = "KeyboardRain", Name = "⌨️ KEYBOARD RAIN", Description = "Keyboards spawn 4x faster in every zone!" },
	},
}

----------------------------------------------------------------------
-- 👥 RÉCOMPENSE DE GROUPE
-- Colle l'ID de ton groupe Roblox (communauté) : ses membres reçoivent ce
-- bonus une seule fois. 0 = désactivé.
----------------------------------------------------------------------
Config.Group = {
	Id = 0,
	RewardSpeed = 2500,
	RewardCash = 1000,
}

----------------------------------------------------------------------
-- 🏆 CLASSEMENTS (les 2 panneaux de la place centrale)
----------------------------------------------------------------------
Config.Leaderboards = {
	RefreshInterval = 60, -- secondes entre deux mises à jour des panneaux
	SaveInterval = 120, -- secondes entre deux envois des scores
	Size = 10, -- lignes affichées (10 maximum)
	Version = "v1", -- change ce texte pour remettre les classements à zéro
}

----------------------------------------------------------------------
-- 🌍 MONDE
----------------------------------------------------------------------
Config.World = {
	VoidY = -40, -- tomber sous cette hauteur = retour à la base
	RespawnTime = 3,
}

----------------------------------------------------------------------
-- 💾 SAUVEGARDE
----------------------------------------------------------------------
Config.Data = {
	StoreName = "StealAKeyboard_v1", -- change le nom pour repartir de zéro
	AutosaveInterval = 90,
	LockTimeout = 150, -- verrou de session considéré comme abandonné après 150 s
}

----------------------------------------------------------------------
-- 💎 ACHATS ROBUX (Developer Products)
-- Crée les produits dans le Creator Hub, puis colle leurs ID ici.
-- Un produit avec Id = 0 est masqué dans la boutique.
-- Kind = "Speed" ou "Cash".
----------------------------------------------------------------------
Config.Products = {
	{ Id = 0, Kind = "Speed", Amount = 2500, Label = "+2.5K Speed" },
	{ Id = 0, Kind = "Speed", Amount = 25000, Label = "+25K Speed" },
	{ Id = 0, Kind = "Cash", Amount = 10000, Label = "+$10K" },
}

return Config
