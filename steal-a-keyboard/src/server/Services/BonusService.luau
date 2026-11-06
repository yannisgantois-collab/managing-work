-- BonusService.luau
-- ✖️ Calcule les multiplicateurs de chaque joueur :
--   argent = rebirths x zones complétées dans l'index x événement Double Cash
--   Speed  = rebirths x événement Double Speed

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Items = require(Shared:WaitForChild("Items"))

local BonusService = {}
local Game

-- Nombre de zones dont TOUS les claviers ont déjà été trouvés
function BonusService.completedZones(profile): number
	local count = 0
	for zoneIndex = 1, #Config.Zones do
		local zoneItems = Items.forZone(zoneIndex)
		local complete = #zoneItems > 0
		for _, item in zoneItems do
			if not profile.Data.Index[item.Id] then
				complete = false
				break
			end
		end
		if complete then
			count += 1
		end
	end
	return count
end

-- Bonus d'argent permanent (sans les événements) : utilisé pour l'argent hors ligne
function BonusService.permanentCash(player: Player): number
	local profile = Game.Data.get(player)
	if not profile then
		return 1
	end
	local rebirths = profile.Data.Rebirths or 0
	return (1 + rebirths * Config.Rebirth.CashBonus) * (1 + BonusService.completedZones(profile) * Config.Index.ZoneBonus)
end

function BonusService.cash(player: Player): number
	local multiplier = BonusService.permanentCash(player)
	if Game.Event.isActive("DoubleCash") then
		multiplier *= Config.Events.CashMultiplier
	end
	return multiplier
end

function BonusService.speed(player: Player): number
	local profile = Game.Data.get(player)
	local rebirths = profile and profile.Data.Rebirths or 0
	local multiplier = 1 + rebirths * Config.Rebirth.SpeedBonus
	if Game.Event.isActive("DoubleSpeed") then
		multiplier *= Config.Events.SpeedMultiplier
	end
	return multiplier
end

-- Recopie les bonus dans les attributs du joueur (affichés par l'interface)
function BonusService.sync(player: Player)
	local profile = Game.Data.get(player)
	if not profile then
		return
	end
	player:SetAttribute("CashMultiplier", BonusService.cash(player))
	player:SetAttribute("SpeedMultiplier", BonusService.speed(player))
	player:SetAttribute("CompletedZones", BonusService.completedZones(profile))
	player:SetAttribute("Income", Game.Plot.totalIncome(player))
end

function BonusService.syncAll()
	for player in Game.Data.Profiles do
		BonusService.sync(player)
	end
end

function BonusService.init(registry)
	Game = registry
end

return BonusService
