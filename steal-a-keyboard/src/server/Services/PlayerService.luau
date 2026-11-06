-- PlayerService.luau
-- 👤 Arrivée / départ des joueurs, apparition dans leur base, chute dans le vide,
-- réglages ASMR, et envoi des notifications / effets aux clients.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local SoundConfig = require(Shared:WaitForChild("SoundConfig"))
local Themes = require(Shared:WaitForChild("Themes"))

local Remotes = ReplicatedStorage:WaitForChild("Remotes")

local PlayerService = {}
local Game

----------------------------------------------------------------------
-- Messages vers les clients
----------------------------------------------------------------------
-- kind : "Info", "Success", "Error", "Alert", "Rare"
function PlayerService.notify(player: Player, text: string, kind: string?)
	if player.Parent == Players then
		Remotes.Notify:FireClient(player, text, kind or "Info")
	end
end

function PlayerService.notifyAll(text: string, kind: string?)
	Remotes.Notify:FireAllClients(text, kind or "Info")
end

-- Effets (sons, popups). position peut être nil.
function PlayerService.effect(player: Player, kind: string, ...)
	if player.Parent == Players then
		Remotes.Effect:FireClient(player, kind, ...)
	end
end

function PlayerService.effectAll(kind: string, ...)
	Remotes.Effect:FireAllClients(kind, ...)
end

----------------------------------------------------------------------
-- Téléportation / apparition
----------------------------------------------------------------------
function PlayerService.getSpawnCFrame(player: Player): CFrame
	local plot = Game.Plot.getPlot(player)
	local spawnPoint = plot and plot.Model:FindFirstChild("SpawnPoint")
	if spawnPoint then
		return spawnPoint.CFrame
	end
	return CFrame.new(0, 6, 12)
end

function PlayerService.teleport(player: Player, cf: CFrame)
	local character = player.Character
	local root = character and character:FindFirstChild("HumanoidRootPart")
	if not root then
		return
	end
	root.AssemblyLinearVelocity = Vector3.zero
	character:PivotTo(cf)
end

function PlayerService.spawnAtBase(player: Player)
	PlayerService.teleport(player, PlayerService.getSpawnCFrame(player))
end

----------------------------------------------------------------------
-- Personnage
----------------------------------------------------------------------
local function setCollisionGroup(instance: Instance)
	if instance:IsA("BasePart") then
		instance.CollisionGroup = "Players"
	end
end

local function prepareCharacter(player: Player)
	if not player:GetAttribute("Loaded") then
		return
	end
	PlayerService.spawnAtBase(player)
	Game.Carry.giveTool(player)
	Game.Speed.applyWalkSpeed(player)
end

local function onCharacterAdded(player: Player, character: Model)
	for _, descendant in character:GetDescendants() do
		setCollisionGroup(descendant)
	end
	character.DescendantAdded:Connect(setCollisionGroup)

	local humanoid = character:WaitForChild("Humanoid", 10)
	if humanoid then
		humanoid.Died:Connect(function()
			Game.Carry.fail(player, "Died")
		end)
	end
	-- petite attente : Roblox finit de placer le personnage
	task.delay(0.15, function()
		if player.Character == character then
			prepareCharacter(player)
		end
	end)
end

----------------------------------------------------------------------
-- Arrivée / départ
----------------------------------------------------------------------
local function onPlayerAdded(player: Player)
	player.CharacterAdded:Connect(function(character)
		onCharacterAdded(player, character)
	end)
	if player.Character then
		task.spawn(onCharacterAdded, player, player.Character)
	end

	local profile = Game.Data.load(player)
	if player.Parent ~= Players then
		-- parti pendant le chargement : on rend le verrou
		Game.Data.saveProfile(profile, true)
		return
	end
	Game.Data.register(player, profile)
	Game.Plot.assign(player)
	Game.Bonus.sync(player)
	player:SetAttribute("TowerStage", 0)
	player:SetAttribute("Loaded", true)
	if player.Character then
		prepareCharacter(player)
	end

	PlayerService.notify(player, "Welcome to Steal a Keyboard! ⌨️ Walk on keys to gain ⚡ Speed.", "Info")
	if not profile.CanSave then
		PlayerService.notify(player, "⚠️ Saving is OFF (Studio without API access).", "Error")
	end
	task.spawn(PlayerService.checkGroupReward, player)
end

-- 👥 Bonus unique pour les membres du groupe Roblox (Config.Group)
function PlayerService.checkGroupReward(player: Player)
	local group = Config.Group
	if not group or group.Id == 0 then
		return
	end
	local ok, inGroup = pcall(function()
		return player:IsInGroup(group.Id)
	end)
	local profile = Game.Data.get(player)
	if not ok or not profile or player.Parent ~= Players then
		return
	end
	if inGroup then
		if not profile.Data.GroupRewardClaimed then
			profile.Data.GroupRewardClaimed = true
			Game.Data.addSpeed(player, group.RewardSpeed or 0)
			Game.Data.addCash(player, group.RewardCash or 0)
			Game.Speed.applyWalkSpeed(player)
			PlayerService.notify(player, "👥 Thanks for joining the group! Free reward received 🎁", "Rare")
		end
	elseif not profile.Data.GroupRewardClaimed then
		task.wait(20)
		PlayerService.notify(player, "👥 Join the group for a FREE bonus (+" .. (group.RewardSpeed or 0) .. " Speed)!", "Info")
	end
end

local function onPlayerRemoving(player: Player)
	Game.Carry.onPlayerRemoving(player)
	Game.Speed.onPlayerRemoving(player)
	Game.Tower.onPlayerRemoving(player)
	Game.Plot.unassign(player)
	Game.Leaderboard.submit(player)
	Game.Data.release(player)
end

----------------------------------------------------------------------
-- Réglages envoyés par le client (vérifiés ici)
----------------------------------------------------------------------
local lastSettings = {}

local function validColorTable(value): boolean
	if type(value) ~= "table" then
		return false
	end
	for i = 1, 3 do
		if type(value[i]) ~= "number" or value[i] ~= value[i] then
			return false
		end
	end
	return true
end

local function onSaveSettings(player: Player, incoming)
	local now = os.clock()
	if now - (lastSettings[player] or 0) < 0.2 then
		return
	end
	lastSettings[player] = now
	local profile = Game.Data.get(player)
	if not profile or type(incoming) ~= "table" then
		return
	end
	local s = profile.Data.Settings
	if type(incoming.SoundProfile) == "string" and SoundConfig.Profiles[incoming.SoundProfile] then
		s.SoundProfile = incoming.SoundProfile
	end
	if incoming.GlowMode == "Auto" or incoming.GlowMode == "Color" or incoming.GlowMode == "Rainbow" then
		s.GlowMode = incoming.GlowMode
	end
	if validColorTable(incoming.GlowColor) then
		s.GlowColor = {
			math.clamp(math.floor(incoming.GlowColor[1]), 0, 255),
			math.clamp(math.floor(incoming.GlowColor[2]), 0, 255),
			math.clamp(math.floor(incoming.GlowColor[3]), 0, 255),
		}
	end
	if type(incoming.Keycaps) == "string" then
		for _, theme in Themes.Keycaps do
			if theme.Name == incoming.Keycaps then
				s.Keycaps = theme.Name
			end
		end
	end
	for _, key in { "MyVolume", "OthersVolume", "MusicVolume" } do
		local value = incoming[key]
		if type(value) == "number" and value == value then
			s[key] = math.clamp(value, 0, 1)
		end
	end
	Game.Data.applySettingsAttributes(player)
end

----------------------------------------------------------------------
function PlayerService.init(registry)
	Game = registry

	Remotes.SaveSettings.OnServerEvent:Connect(onSaveSettings)
	Players.PlayerAdded:Connect(onPlayerAdded)
	Players.PlayerRemoving:Connect(function(player)
		lastSettings[player] = nil
		onPlayerRemoving(player)
	end)
	for _, player in Players:GetPlayers() do
		task.spawn(onPlayerAdded, player)
	end

	-- Chute dans le vide : retour au checkpoint de la tour ou à la base
	task.spawn(function()
		while true do
			task.wait(0.25)
			for _, player in Players:GetPlayers() do
				local character = player.Character
				local root = character and character:FindFirstChild("HumanoidRootPart")
				if root and root.Position.Y < Config.World.VoidY then
					Game.Carry.fail(player, "Void")
					local cf = Game.Tower.getRespawn(player) or PlayerService.getSpawnCFrame(player)
					PlayerService.teleport(player, cf)
				end
			end
		end
	end)
end

return PlayerService
