-- TowerService.luau
-- 🗼 La tour ASMR bonus (la map de la vidéo) : checkpoints et récompense au sommet.
-- Marche sur la touche ENTER tout en haut = un clavier gratuit de la zone suivante !

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Items = require(Shared:WaitForChild("Items"))
local Format = require(Shared:WaitForChild("Format"))

local ItemModels = require(script.Parent:WaitForChild("ItemModels"))

local TowerService = {}
local Game

local checkpoints = {} -- [stage] = CFrame de réapparition
local lastCooldownNotice = {}
local rng = Random.new()

function TowerService.checkpoint(player: Player, stage: number?)
	if type(stage) ~= "number" then
		return
	end
	local current = player:GetAttribute("TowerStage") or 0
	if stage == current + 1 then
		player:SetAttribute("TowerStage", stage)
		Game.Player.effect(player, "Checkpoint", stage)
		if stage < Config.Tower.Stages then
			Game.Player.notify(player, "✅ Checkpoint " .. stage .. "/" .. Config.Tower.Stages, "Success")
		end
	end
end

-- Sortie de la tour (pied posé sur une touche hors tour)
function TowerService.leave(player: Player)
	if (player:GetAttribute("TowerStage") or 0) > 0 then
		player:SetAttribute("TowerStage", 0)
	end
end

function TowerService.getRespawn(player: Player): CFrame?
	local stage = player:GetAttribute("TowerStage") or 0
	if stage >= 1 then
		return checkpoints[stage]
	end
	return nil
end

function TowerService.finish(player: Player)
	local stage = player:GetAttribute("TowerStage") or 0
	if stage < Config.Tower.Stages - 1 then
		return -- il faut avoir grimpé la tour
	end
	local profile = Game.Data.get(player)
	if not profile then
		return
	end
	local now = os.time()
	if now < (profile.Data.TowerReadyAt or 0) then
		if os.clock() - (lastCooldownNotice[player] or 0) > 3 then
			lastCooldownNotice[player] = os.clock()
			Game.Player.notify(player, "🗼 Next tower reward in " .. Format.time(profile.Data.TowerReadyAt - now), "Info")
		end
		return
	end
	profile.Data.TowerReadyAt = now + Config.Tower.Cooldown
	player:SetAttribute("TowerReadyAt", profile.Data.TowerReadyAt)
	profile.Data.Stats.TowerWins += 1
	player:SetAttribute("TowerStage", 0)

	-- récompense : un clavier de la zone suivante (que tu ne peux pas encore atteindre !)
	local zoneIndex = math.min(Config.allowedZone(profile.Data.Speed) + 1, #Config.Zones)
	local item = Items.rollForZone(zoneIndex, function()
		return rng:NextNumber()
	end)
	local record = {
		Id = item.Id,
		Mutation = Items.rollMutation(function()
			return rng:NextNumber()
		end),
	}
	local name = ItemModels.describe(record)
	if Game.Plot.addItem(player, record) then
		Game.Player.notify(player, "🎁 TOWER REWARD: " .. name .. " added to your base!", "Rare")
	else
		local cash = math.floor(Items.incomeOf(record) * Config.Tower.CashFallbackSeconds)
		Game.Data.addCash(player, cash)
		Game.Player.notify(player, "🎁 Base full: you get " .. Format.cash(cash) .. " instead of " .. name .. "!", "Rare")
	end
	Game.Player.effect(player, "TowerWin")
	Game.Player.notifyAll("🗼 " .. player.DisplayName .. " beat the ASMR Tower!", "Info")
	task.delay(2.5, function()
		if player.Parent then
			Game.Player.spawnAtBase(player)
		end
	end)
end

function TowerService.onPlayerRemoving(player: Player)
	lastCooldownNotice[player] = nil
end

function TowerService.init(registry)
	Game = registry
	local tower = Game.World.Map:FindFirstChild("Tower")
	local folder = tower and tower:FindFirstChild("Checkpoints")
	if folder then
		for _, marker in folder:GetChildren() do
			local stage = marker:GetAttribute("Stage")
			if marker:IsA("BasePart") and stage then
				checkpoints[stage] = marker.CFrame
			end
		end
	end
end

return TowerService
