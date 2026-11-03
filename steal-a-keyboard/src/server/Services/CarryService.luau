-- CarryService.luau
-- 📦 Porter un clavier au-dessus de sa tête, le déposer dans sa base,
-- voler dans la base des autres, et la gifle-clavier pour récupérer un vol.

local Debris = game:GetService("Debris")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Items = require(Shared:WaitForChild("Items"))

local ItemModels = require(script.Parent:WaitForChild("ItemModels"))

local CarryService = {}
local Game

-- carrying[player] = { Record, Model, Source ("Zone"|"Steal"|"Drop"), PlotIndex, SlotIndex, Victim, StartedAt }
local carrying = {}
local slapCooldown = {}
local stunnedUntil = {}
local lastFullWarning = {}
local toolTemplate = nil

local function rootOf(player: Player): BasePart?
	local character = player.Character
	return character and character:FindFirstChild("HumanoidRootPart") :: BasePart?
end

function CarryService.isCarrying(player: Player): boolean
	return carrying[player] ~= nil
end

function CarryService.isStunned(player: Player): boolean
	return (stunnedUntil[player] or 0) > os.clock()
end

-- Commence à porter un clavier. info = { Source, PlotIndex?, SlotIndex?, Victim? }
function CarryService.start(player: Player, record, info): boolean
	if carrying[player] then
		return false
	end
	local character = player.Character
	local root = rootOf(player)
	local humanoid = character and character:FindFirstChildOfClass("Humanoid")
	if not root or not humanoid or humanoid.Health <= 0 then
		return false
	end
	local model = ItemModels.build(record, root.CFrame * CFrame.new(0, 3.4, 0))
	if not model then
		return false
	end
	model.Name = "CarriedKeyboard"
	for _, part in model:GetDescendants() do
		if part:IsA("BasePart") then
			local weld = Instance.new("WeldConstraint")
			weld.Part0 = root
			weld.Part1 = part
			weld.Parent = part
			part.CanCollide = false
			part.CanQuery = false
			part.CanTouch = false
			part.Massless = true
			part.Anchored = false
		end
	end
	local highlight = Instance.new("Highlight")
	highlight.FillTransparency = 0.8
	highlight.OutlineTransparency = 0.1
	highlight.OutlineColor = info.Source == "Steal" and Color3.fromRGB(255, 60, 60) or Color3.fromRGB(255, 220, 80)
	highlight.FillColor = highlight.OutlineColor
	highlight.DepthMode = Enum.HighlightDepthMode.Occluded
	highlight.Parent = model
	model.Parent = character

	carrying[player] = {
		Record = record,
		Model = model,
		Source = info.Source,
		PlotIndex = info.PlotIndex,
		SlotIndex = info.SlotIndex,
		Victim = info.Victim,
		StartedAt = os.clock(),
	}
	local item = Items.get(record.Id)
	player:SetAttribute("CarryingName", ItemModels.describe(record))
	player:SetAttribute("CarryingRarity", item and item.Rarity or "Common")
	player:SetAttribute("CarryingStolen", info.Source == "Steal")
	Game.Speed.applyWalkSpeed(player)
	return true
end

local function clear(player: Player)
	local state = carrying[player]
	if not state then
		return nil
	end
	carrying[player] = nil
	if state.Model then
		state.Model:Destroy()
	end
	player:SetAttribute("CarryingName", nil)
	player:SetAttribute("CarryingRarity", nil)
	player:SetAttribute("CarryingStolen", nil)
	Game.Speed.applyWalkSpeed(player)
	return state
end

-- Le porteur perd son clavier. reason : "Slapped", "Died", "Void", "Left", "Timeout"
function CarryService.fail(player: Player, reason: string)
	local root = rootOf(player)
	local position = root and root.Position
	local state = clear(player)
	if not state then
		return
	end
	local name = ItemModels.describe(state.Record)
	if state.Source == "Steal" then
		Game.Plot.endSteal(state.PlotIndex, state.SlotIndex, false)
		local victim = state.Victim
		if victim and victim.Parent == Players then
			Game.Player.notify(victim, "✅ Your " .. name .. " is back in your base!", "Success")
		end
		if reason ~= "Left" then
			Game.Player.notify(player, "❌ The stolen " .. name .. " went back to its owner!", "Error")
		end
	else
		if (reason == "Slapped" or reason == "Died") and position then
			Game.Zone.dropItem(state.Record, position)
		end
		if reason ~= "Left" then
			Game.Player.notify(player, "❌ You dropped the " .. name .. "!", "Error")
		end
	end
end

-- Un joueur essaie de voler le clavier d'un emplacement
function CarryService.tryStealFromSlot(thief: Player, plotIndex: number, s: number)
	if carrying[thief] then
		Game.Player.notify(thief, "You are already carrying a keyboard!", "Error")
		return
	end
	local root = rootOf(thief)
	local plot = Game.Plot.getPlotByIndex(plotIndex)
	local slotPos = plot and Game.Plot.slotPosition(plot, s)
	if not root or not slotPos or (root.Position - slotPos).Magnitude > Config.Steal.PromptDistance + 6 then
		return
	end
	local record, ownerOrMessage = Game.Plot.beginSteal(thief, plotIndex, s)
	if not record then
		if type(ownerOrMessage) == "string" then
			Game.Player.notify(thief, ownerOrMessage, "Error")
		end
		return
	end
	local owner = ownerOrMessage
	if not CarryService.start(thief, record, { Source = "Steal", PlotIndex = plotIndex, SlotIndex = s, Victim = owner }) then
		Game.Plot.endSteal(plotIndex, s, false)
		return
	end
	local name = ItemModels.describe(record)
	Game.Player.notify(owner, "🚨 " .. thief.DisplayName .. " is stealing your " .. name .. "! Slap them!", "Alert")
	Game.Player.effect(owner, "Steal")
	Game.Player.notify(thief, "🥷 Run back to your base with the " .. name .. "!", "Info")
	Game.Player.effectAll("Grab", slotPos)
end

local function deposit(player: Player, state)
	local slot = Game.Plot.addItem(player, state.Record)
	if not slot then
		if os.clock() - (lastFullWarning[player] or 0) > 4 then
			lastFullWarning[player] = os.clock()
			Game.Player.notify(player, "Your base is full! Sell a keyboard or buy a slot in the Shop 🛒", "Error")
		end
		return
	end
	clear(player)
	local name = ItemModels.describe(state.Record)
	local plot = Game.Plot.getPlot(player)
	Game.Player.effectAll("Deposit", plot and Game.Plot.slotPosition(plot, slot))
	if state.Source == "Steal" then
		Game.Plot.endSteal(state.PlotIndex, state.SlotIndex, true)
		local profile = Game.Data.get(player)
		if profile then
			profile.Data.Stats.Steals += 1
		end
		Game.Player.notify(player, "🥷 You stole the " .. name .. "!", "Success")
		local victim = state.Victim
		if victim and victim.Parent == Players then
			Game.Player.notify(victim, "😱 " .. player.DisplayName .. " stole your " .. name .. "!", "Alert")
		end
	else
		Game.Player.notify(player, "📦 " .. name .. " added to your base!", "Success")
	end
end

----------------------------------------------------------------------
-- 🖐️ Gifle-clavier
----------------------------------------------------------------------
local function buildTool()
	local tool = Instance.new("Tool")
	tool.Name = "Keyboard Slap"
	tool.ToolTip = "Slap thieves to make them drop the keyboard!"
	tool.CanBeDropped = false
	tool.RequiresHandle = true
	tool.Grip = CFrame.new(0, 0, -1.3)

	local handle = Instance.new("Part")
	handle.Name = "Handle"
	handle.Size = Vector3.new(1.1, 0.35, 3.4)
	handle.Color = Color3.fromRGB(35, 35, 45)
	handle.Material = Enum.Material.SmoothPlastic
	handle.CanCollide = false
	handle.Massless = true
	handle.TopSurface = Enum.SurfaceType.Smooth
	handle.BottomSurface = Enum.SurfaceType.Smooth
	handle.Parent = tool

	local keys = Instance.new("Part")
	keys.Name = "Keys"
	keys.Size = Vector3.new(0.9, 0.2, 3.1)
	keys.Color = Color3.fromRGB(240, 240, 245)
	keys.Material = Enum.Material.SmoothPlastic
	keys.CanCollide = false
	keys.Massless = true
	keys.CFrame = handle.CFrame * CFrame.new(0, 0.27, 0)
	keys.Parent = tool

	local glow = Instance.new("Part")
	glow.Name = "Glow"
	glow.Size = Vector3.new(1.16, 0.08, 3.46)
	glow.Color = Color3.fromRGB(255, 60, 200)
	glow.Material = Enum.Material.Neon
	glow.CanCollide = false
	glow.Massless = true
	glow.CFrame = handle.CFrame * CFrame.new(0, -0.2, 0)
	glow.Parent = tool

	for _, part in { keys, glow } do
		local weld = Instance.new("WeldConstraint")
		weld.Part0 = handle
		weld.Part1 = part
		weld.Parent = handle
	end
	return tool
end

local function slap(player: Player, tool: Tool)
	local clock = os.clock()
	if clock - (slapCooldown[player] or 0) < Config.Slap.Cooldown then
		return
	end
	slapCooldown[player] = clock
	local root = rootOf(player)
	if not root then
		return
	end
	-- animation de coup (gérée par le script Animate par défaut de Roblox)
	local anim = Instance.new("StringValue")
	anim.Name = "toolanim"
	anim.Value = "Slash"
	anim.Parent = tool
	Debris:AddItem(anim, 1)

	local hit = false
	for _, other in Players:GetPlayers() do
		local otherRoot = other ~= player and rootOf(other)
		if otherRoot then
			local offset = otherRoot.Position - root.Position
			local distance = offset.Magnitude
			if distance > 0 and distance <= Config.Slap.Range then
				local facing = root.CFrame.LookVector:Dot(offset.Unit)
				if (facing > 0.1 or distance < 3.5) and carrying[other] then
					CarryService.fail(other, "Slapped")
					stunnedUntil[other] = clock + Config.Slap.StunTime
					Game.Speed.applyWalkSpeed(other)
					task.delay(Config.Slap.StunTime + 0.05, function()
						if other.Parent == Players then
							Game.Speed.applyWalkSpeed(other)
						end
					end)
					Game.Player.notify(other, "💥 " .. player.DisplayName .. " slapped you!", "Alert")
					hit = true
				end
			end
		end
	end
	Game.Player.effectAll("Slap", root.Position + root.CFrame.LookVector * 3, hit)
end

function CarryService.giveTool(player: Player)
	local backpack = player:FindFirstChildOfClass("Backpack")
	if not backpack or not toolTemplate then
		return
	end
	local name = toolTemplate.Name
	if backpack:FindFirstChild(name) or (player.Character and player.Character:FindFirstChild(name)) then
		return
	end
	local tool = toolTemplate:Clone()
	tool.Activated:Connect(function()
		slap(player, tool)
	end)
	tool.Parent = backpack
end

function CarryService.onPlayerRemoving(player: Player)
	CarryService.fail(player, "Left")
	-- si ce joueur était volé, l'objet disparaît avec lui (il le garde dans sa sauvegarde)
	for thief, state in carrying do
		if state.Source == "Steal" and state.Victim == player then
			clear(thief)
			Game.Player.notify(thief, "The owner left: the keyboard vanished.", "Error")
		end
	end
	slapCooldown[player] = nil
	stunnedUntil[player] = nil
	lastFullWarning[player] = nil
end

function CarryService.init(registry)
	Game = registry
	toolTemplate = buildTool()

	-- Dépôt automatique en entrant dans sa base + limite de temps
	task.spawn(function()
		while true do
			task.wait(0.15)
			for player, state in carrying do
				local root = rootOf(player)
				local plot = Game.Plot.getPlot(player)
				if root and plot and Game.Plot.isInside(plot, root.Position) then
					deposit(player, state)
				elseif os.clock() - state.StartedAt > Config.Steal.MaxCarryTime then
					CarryService.fail(player, "Timeout")
				end
			end
		end
	end)
end

return CarryService
