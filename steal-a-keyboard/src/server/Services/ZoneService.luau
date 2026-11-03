-- ZoneService.luau
-- 🗺️ Les zones : apparition des claviers sur les socles, ramassage,
-- portes de vitesse (vérifiées côté serveur), claviers lâchés au sol.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Items = require(Shared:WaitForChild("Items"))
local Format = require(Shared:WaitForChild("Format"))

local ItemModels = require(script.Parent:WaitForChild("ItemModels"))

local ZoneService = {}
local Game

local zones = {}
local rng = Random.new()
local function roll(): number
	return rng:NextNumber()
end

local function nextDelay(): number
	return rng:NextNumber(Config.Spawning.MinDelay, Config.Spawning.MaxDelay)
end

local function despawn(pedestal)
	if pedestal.Model then
		pedestal.Model:Destroy()
	end
	pedestal.Model = nil
	pedestal.Record = nil
	pedestal.NextSpawn = os.clock() + nextDelay()
end

local function grabFromPedestal(player: Player, zone, pedestal)
	if not pedestal.Model or not pedestal.Record then
		return
	end
	if Game.Carry.isCarrying(player) then
		Game.Player.notify(player, "You are already carrying a keyboard!", "Error")
		return
	end
	if (player:GetAttribute("Speed") or 0) < zone.Required then
		Game.Player.notify(player, "You need ⚡ " .. Format.short(zone.Required) .. " Speed for this zone!", "Error")
		return
	end
	local root = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
	if not root or (root.Position - pedestal.Part.Position).Magnitude > Config.Steal.PromptDistance + 6 then
		return
	end
	local record = pedestal.Record
	despawn(pedestal)
	if Game.Carry.start(player, record, { Source = "Zone" }) then
		Game.Player.effectAll("Grab", root.Position)
		Game.Player.notify(player, "📦 Bring the " .. ItemModels.describe(record) .. " back to your base!", "Info")
	end
end

local function spawnOnPedestal(zone, pedestal)
	local item = Items.rollForZone(zone.Index, roll)
	if not item or not pedestal.Anchor then
		pedestal.NextSpawn = os.clock() + nextDelay()
		return
	end
	local record = { Id = item.Id, Mutation = Items.rollMutation(roll) }
	local model = ItemModels.build(record, pedestal.Anchor.CFrame)
	if not model then
		pedestal.NextSpawn = os.clock() + nextDelay()
		return
	end
	model:SetAttribute("ZoneIndex", zone.Index)
	local prompt = ItemModels.addPrompt(model, "Grab", "Grab", ItemModels.describe(record), Config.Steal.GrabHoldDuration)
	prompt.Triggered:Connect(function(player)
		grabFromPedestal(player, zone, pedestal)
	end)
	model.Parent = Game.World.Items
	pedestal.Model = model
	pedestal.Record = record
	pedestal.SpawnedAt = os.clock()

	local rarity = Items.Rarities[item.Rarity]
	local rareMutation = record.Mutation == "Diamond" or record.Mutation == "Rainbow"
	if (rarity and rarity.Rank >= Config.Spawning.RareAnnounceRank) or rareMutation then
		Game.Player.notifyAll(
			"✨ A " .. string.upper(item.Rarity) .. " " .. ItemModels.describe(record) .. " appeared in the " .. zone.Name .. " Zone!",
			"Rare"
		)
	end
end

-- Un clavier lâché (gifle, mort) reste au sol quelques secondes : n'importe qui peut le ramasser
function ZoneService.dropItem(record, position: Vector3)
	local params = RaycastParams.new()
	params.FilterType = Enum.RaycastFilterType.Include
	params.FilterDescendantsInstances = { Game.World.Map }
	local hit = workspace:Raycast(position + Vector3.new(0, 2, 0), Vector3.new(0, -14, 0), params)
	if not hit then
		return -- au-dessus du vide : perdu
	end
	local model = ItemModels.build(record, CFrame.new(hit.Position) * CFrame.Angles(0, rng:NextNumber(0, math.pi * 2), 0))
	if not model then
		return
	end
	local taken = false
	local prompt = ItemModels.addPrompt(model, "Grab", "Grab", ItemModels.describe(record), Config.Steal.GrabHoldDuration)
	prompt.Triggered:Connect(function(player)
		if taken or Game.Carry.isCarrying(player) then
			return
		end
		taken = true
		model:Destroy()
		if Game.Carry.start(player, record, { Source = "Drop" }) then
			Game.Player.effectAll("Grab", hit.Position)
		end
	end)
	model.Parent = Game.World.Items
	task.delay(Config.Spawning.DroppedLifetime, function()
		if not taken then
			taken = true
			model:Destroy()
		end
	end)
end

function ZoneService.getZone(index: number)
	return zones[index]
end

local function isInside(part: BasePart?, position: Vector3): boolean
	if not part then
		return false
	end
	local p = part.CFrame:PointToObjectSpace(position)
	local half = part.Size / 2
	return math.abs(p.X) <= half.X and math.abs(p.Y) <= half.Y and math.abs(p.Z) <= half.Z
end

-- Met à jour les textes si la config a changé depuis la génération de la map
local function syncZoneTexts(zone)
	if zone.Gate then
		zone.Gate:SetAttribute("Required", zone.Required)
		local gui = zone.Gate:FindFirstChild("SignGui")
		local line = gui and gui:FindFirstChild("Line1")
		if line then
			line.Text = "⚡ " .. Format.short(zone.Required) .. " SPEED"
		end
	end
	local arch = zone.Model:FindFirstChild("ArchSign")
	local gui = arch and arch:FindFirstChild("SignGui")
	local line = gui and gui:FindFirstChild("Line2")
	if line then
		line.Text = zone.Required > 0 and ("⚡ " .. Format.short(zone.Required)) or "FREE"
	end
end

function ZoneService.init(registry)
	Game = registry
	local folder = Game.World.Map:WaitForChild("Zones")
	for _, model in folder:GetChildren() do
		local index = model:GetAttribute("ZoneIndex")
		if model:IsA("Model") and index then
			local zoneConfig = Config.Zones[index]
			local zone = {
				Index = index,
				Name = zoneConfig and zoneConfig.Name or model:GetAttribute("ZoneName") or ("Zone " .. index),
				Model = model,
				Required = zoneConfig and zoneConfig.Required or model:GetAttribute("Required") or 0,
				Bounds = model:FindFirstChild("Bounds"),
				Gate = model:FindFirstChild("Gate"),
				Pedestals = {},
			}
			model:SetAttribute("Required", zone.Required)
			local pedestals = model:FindFirstChild("Pedestals")
			if pedestals then
				for _, part in pedestals:GetChildren() do
					if part:IsA("BasePart") then
						table.insert(zone.Pedestals, {
							Part = part,
							Anchor = part:FindFirstChild("Anchor"),
							Model = nil,
							Record = nil,
							SpawnedAt = 0,
							NextSpawn = os.clock() + rng:NextNumber(0.5, 4),
						})
					end
				end
			end
			syncZoneTexts(zone)
			zones[index] = zone
		end
	end

	-- Apparition / disparition des claviers
	task.spawn(function()
		while true do
			task.wait(1)
			local clock = os.clock()
			for _, zone in zones do
				for _, pedestal in zone.Pedestals do
					if pedestal.Model then
						if clock - pedestal.SpawnedAt > Config.Spawning.Lifetime then
							despawn(pedestal)
						end
					elseif clock >= pedestal.NextSpawn then
						spawnOnPedestal(zone, pedestal)
					end
				end
			end
		end
	end)

	-- Portes de vitesse : le client ouvre la porte s'il a assez de Speed ;
	-- ici on renvoie les tricheurs qui seraient passés quand même.
	task.spawn(function()
		while true do
			task.wait(0.3)
			for _, player in Players:GetPlayers() do
				local root = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
				if root then
					local speed = player:GetAttribute("Speed") or 0
					for _, zone in zones do
						if zone.Required > speed and isInside(zone.Bounds, root.Position) then
							local gate = zone.Gate
							local back = gate and gate.Position + Vector3.new(0, -gate.Size.Y / 2 + 4.8, -7)
								or Vector3.new(0, 6, 300)
							Game.Player.teleport(player, CFrame.lookAt(back, back + Vector3.new(0, 0, -1)))
							Game.Player.notify(player, "You need ⚡ " .. Format.short(zone.Required) .. " Speed to enter!", "Error")
							break
						end
					end
				end
			end
		end
	end)
end

return ZoneService
