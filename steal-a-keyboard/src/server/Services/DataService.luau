-- DataService.luau
-- 💾 Sauvegarde des joueurs avec DataStore + verrou de session
-- (empêche deux serveurs d'écrire en même temps les données d'un même joueur).
--
-- Dans Studio, la sauvegarde ne marche que si :
--   Game Settings > Security > "Enable Studio Access to API Services" est activé
--   ET le jeu est publié. Sinon le jeu tourne quand même, sans sauvegarder.

local DataStoreService = game:GetService("DataStoreService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local SoundConfig = require(Shared:WaitForChild("SoundConfig"))
local Themes = require(Shared:WaitForChild("Themes"))

local DataService = {}
DataService.Profiles = {}

local function deepCopy(value)
	if type(value) ~= "table" then
		return value
	end
	local copy = {}
	for key, inner in value do
		copy[key] = deepCopy(inner)
	end
	return copy
end

local DEFAULT_DATA = {
	Version = 1,
	Cash = 0,
	Speed = 0,
	SwitchTier = 1,
	SlotCount = Config.Slots.Start,
	Rebirths = 0,
	GroupRewardClaimed = false,
	Slots = {}, -- ["1"] = { Id = "office_basic", Mutation = "None", Pending = 0 }
	Index = {}, -- ["office_basic"] = true (claviers déjà possédés)
	Stats = { Steals = 0, TimesStolen = 0, Collected = 0, TowerWins = 0, TotalEarned = 0 },
	Settings = {
		SoundProfile = SoundConfig.DefaultProfile,
		GlowMode = Themes.DefaultGlowMode,
		GlowColor = { 0, 230, 255 },
		Keycaps = Themes.DefaultKeycaps,
		MyVolume = 0.8,
		OthersVolume = 0.5,
		MusicVolume = SoundConfig.MusicVolume,
	},
	TowerReadyAt = 0,
	LastSeen = 0,
	Receipts = {},
}

-- Complète les données d'un ancien joueur avec les nouvelles valeurs par défaut
local NO_RECONCILE = { Slots = true, Index = true, Receipts = true }
local function reconcile(data, template)
	for key, value in template do
		if data[key] == nil then
			data[key] = deepCopy(value)
		elseif type(value) == "table" and type(data[key]) == "table" and not NO_RECONCILE[key] then
			reconcile(data[key], value)
		end
	end
	return data
end

local store = nil
local storeFailed = false
local function getStore()
	if store or storeFailed then
		return store
	end
	local ok, result = pcall(function()
		return DataStoreService:GetDataStore(Config.Data.StoreName)
	end)
	if ok then
		store = result
	else
		storeFailed = true
		warn("[Data] DataStore indisponible (normal dans un Studio non publié) :", result)
	end
	return store
end

function DataService.defaultData()
	return deepCopy(DEFAULT_DATA)
end

-- Charge (et verrouille) les données d'un joueur. Peut attendre quelques secondes.
function DataService.load(player: Player)
	local profile = {
		Player = player,
		Key = "Player_" .. player.UserId,
		Data = nil,
		CanSave = false,
		Saving = false,
	}
	local ds = getStore()
	local maxAttempts = RunService:IsStudio() and 1 or 5
	local attempt = 0
	while ds and profile.Data == nil and player.Parent == Players do
		attempt += 1
		local lockedElsewhere = false
		local ok, result = pcall(function()
			return ds:UpdateAsync(profile.Key, function(old)
				lockedElsewhere = false
				local data = type(old) == "table" and old or deepCopy(DEFAULT_DATA)
				local session = data.Session
				if
					type(session) == "table"
					and session.JobId ~= game.JobId
					and os.time() - (session.Time or 0) < Config.Data.LockTimeout
				then
					lockedElsewhere = true
					return nil -- un autre serveur n'a pas encore rendu les données
				end
				data.Session = { JobId = game.JobId, Time = os.time() }
				return data
			end)
		end)
		if ok and not lockedElsewhere and type(result) == "table" then
			profile.Data = reconcile(result, DEFAULT_DATA)
			profile.CanSave = true
		elseif ok and lockedElsewhere then
			task.wait(3) -- on retente : l'autre serveur va sauvegarder et libérer
		else
			warn("[Data] Chargement impossible pour " .. player.Name .. " :", result)
			if attempt >= maxAttempts then
				break
			end
			task.wait(attempt * 2)
		end
	end
	if profile.Data == nil then
		-- pas de DataStore : on joue avec des données neuves, sans jamais les sauvegarder
		profile.Data = deepCopy(DEFAULT_DATA)
		profile.CanSave = false
	end
	return profile
end

-- Sauvegarde. release = true libère le verrou (quand le joueur part).
function DataService.saveProfile(profile, release: boolean?)
	if not profile.CanSave then
		return false
	end
	local ds = getStore()
	if not ds then
		return false
	end
	while profile.Saving do
		task.wait(0.1)
	end
	if not profile.CanSave then
		return false
	end
	profile.Saving = true
	local data = profile.Data
	data.LastSeen = os.time()
	local ok, err = pcall(function()
		ds:UpdateAsync(profile.Key, function(old)
			if type(old) == "table" and type(old.Session) == "table" and old.Session.JobId ~= game.JobId then
				return nil -- un autre serveur possède ces données : on n'écrase rien
			end
			if release then
				data.Session = nil
			else
				data.Session = { JobId = game.JobId, Time = os.time() }
			end
			return data
		end)
	end)
	profile.Saving = false
	if release then
		profile.CanSave = false
	end
	if not ok then
		warn("[Data] Sauvegarde ratée pour " .. tostring(profile.Key) .. " :", err)
	end
	return ok
end

function DataService.save(player: Player, release: boolean?)
	local profile = DataService.Profiles[player]
	if not profile then
		return false
	end
	return DataService.saveProfile(profile, release)
end

function DataService.get(player: Player)
	return DataService.Profiles[player]
end

-- Recopie les valeurs importantes dans les attributs du joueur (lus par l'interface)
function DataService.sync(player: Player)
	local profile = DataService.Profiles[player]
	if not profile then
		return
	end
	local data = profile.Data
	player:SetAttribute("Cash", data.Cash)
	player:SetAttribute("Speed", data.Speed)
	player:SetAttribute("SwitchTier", data.SwitchTier)
	player:SetAttribute("SlotCount", data.SlotCount)
	player:SetAttribute("Rebirths", data.Rebirths or 0)
	local leaderstats = player:FindFirstChild("leaderstats")
	if leaderstats then
		local cash = leaderstats:FindFirstChild("Cash")
		if cash then
			cash.Value = math.floor(data.Cash)
		end
		local speed = leaderstats:FindFirstChild("Speed")
		if speed then
			speed.Value = math.floor(data.Speed)
		end
		local rebirths = leaderstats:FindFirstChild("Rebirths")
		if rebirths then
			rebirths.Value = data.Rebirths or 0
		end
	end
end

-- Liste des claviers déjà trouvés, envoyée à l'interface ("id1,id2,...")
function DataService.syncIndex(player: Player)
	local profile = DataService.Profiles[player]
	if not profile then
		return
	end
	local ids = {}
	for id, found in profile.Data.Index do
		if found then
			table.insert(ids, id)
		end
	end
	table.sort(ids)
	player:SetAttribute("IndexList", table.concat(ids, ","))
end

function DataService.applySettingsAttributes(player: Player)
	local profile = DataService.Profiles[player]
	if not profile then
		return
	end
	local s = profile.Data.Settings
	player:SetAttribute("SoundProfile", s.SoundProfile)
	player:SetAttribute("GlowMode", s.GlowMode)
	local c = s.GlowColor
	player:SetAttribute("GlowColor", Color3.fromRGB(c[1] or 0, c[2] or 230, c[3] or 255))
	player:SetAttribute("Keycaps", s.Keycaps)
	player:SetAttribute("MyVolume", s.MyVolume)
	player:SetAttribute("OthersVolume", s.OthersVolume)
	player:SetAttribute("MusicVolume", s.MusicVolume)
end

-- Enregistre le profil chargé : leaderstats + attributs
function DataService.register(player: Player, profile)
	DataService.Profiles[player] = profile
	local leaderstats = Instance.new("Folder")
	leaderstats.Name = "leaderstats"
	local cash = Instance.new("IntValue")
	cash.Name = "Cash"
	cash.Parent = leaderstats
	local speed = Instance.new("IntValue")
	speed.Name = "Speed"
	speed.Parent = leaderstats
	local rebirths = Instance.new("IntValue")
	rebirths.Name = "Rebirths"
	rebirths.Parent = leaderstats
	leaderstats.Parent = player
	player:SetAttribute("DataSaving", profile.CanSave)
	player:SetAttribute("TowerReadyAt", profile.Data.TowerReadyAt or 0)
	DataService.applySettingsAttributes(player)
	DataService.sync(player)
	DataService.syncIndex(player)
end

-- Sauvegarde finale + libération quand le joueur quitte
function DataService.release(player: Player)
	local profile = DataService.Profiles[player]
	if not profile then
		return
	end
	DataService.saveProfile(profile, true)
	DataService.Profiles[player] = nil
end

function DataService.addCash(player: Player, amount: number)
	local profile = DataService.Profiles[player]
	if not profile or amount ~= amount then
		return
	end
	profile.Data.Cash = math.max(0, profile.Data.Cash + amount)
	if amount > 0 then
		profile.Data.Stats.TotalEarned = (profile.Data.Stats.TotalEarned or 0) + amount
	end
	DataService.sync(player)
end

function DataService.spendCash(player: Player, cost: number): boolean
	local profile = DataService.Profiles[player]
	if not profile or cost < 0 or profile.Data.Cash < cost then
		return false
	end
	profile.Data.Cash -= cost
	DataService.sync(player)
	return true
end

function DataService.addSpeed(player: Player, amount: number)
	local profile = DataService.Profiles[player]
	if not profile or amount ~= amount then
		return
	end
	profile.Data.Speed = math.max(0, profile.Data.Speed + amount)
	DataService.sync(player)
end

function DataService.init()
	-- sauvegarde automatique
	task.spawn(function()
		while true do
			task.wait(Config.Data.AutosaveInterval)
			for player in DataService.Profiles do
				task.spawn(DataService.save, player, false)
			end
		end
	end)

	-- sauvegarde de tout le monde quand le serveur s'arrête
	game:BindToClose(function()
		local pending = 0
		for player in DataService.Profiles do
			pending += 1
			task.spawn(function()
				DataService.save(player, true)
				pending -= 1
			end)
		end
		local started = os.clock()
		while pending > 0 and os.clock() - started < 25 do
			task.wait(0.2)
		end
	end)
end

return DataService
