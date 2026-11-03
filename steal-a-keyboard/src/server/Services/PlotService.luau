-- PlotService.luau
-- 🏠 Les bases : attribution, claviers posés, revenus, collecte ($),
-- verrouillage (LOCK), revente, et début/fin des vols.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Items = require(Shared:WaitForChild("Items"))
local Format = require(Shared:WaitForChild("Format"))

local ItemModels = require(script.Parent:WaitForChild("ItemModels"))

local PlotService = {}
local Game

-- plots[i] = { Index, Model, Owner, Slots = { [s] = { Model, Stealing, Thief } }, LockedUntil }
local plots = {}

local function now(): number
	return workspace:GetServerTimeNow()
end

local function slotFolder(plot, s)
	local slots = plot.Model:FindFirstChild("Slots")
	return slots and slots:FindFirstChild("Slot_" .. s)
end

local function setSign(plot, text: string)
	local sign = plot.Model:FindFirstChild("Sign")
	if not sign then
		return
	end
	for _, guiName in { "SignOut", "SignIn" } do
		local gui = sign:FindFirstChild(guiName)
		local label = gui and gui:FindFirstChild("Title")
		if label then
			label.Text = text
		end
	end
end

local function pendingLabel(plot, s)
	local folder = slotFolder(plot, s)
	local key = folder and folder:FindFirstChild("CollectKey")
	local cap = key and key:FindFirstChild("Cap")
	local gui = cap and cap:FindFirstChild("PendingGui")
	return gui, gui and gui:FindFirstChild("Amount")
end

local function updatePending(plot, s, entry)
	local gui, label = pendingLabel(plot, s)
	if not gui or not label then
		return
	end
	if entry and (entry.Pending or 0) >= 1 then
		gui.Enabled = true
		label.Text = Format.cash(entry.Pending)
	else
		gui.Enabled = entry ~= nil
		label.Text = entry and "$0" or ""
	end
end

local function destroySlotModel(plot, s)
	local state = plot.Slots[s]
	if state and state.Model then
		state.Model:Destroy()
		state.Model = nil
	end
end

local function spawnSlotModel(plot, s)
	destroySlotModel(plot, s)
	local owner = plot.Owner
	local profile = owner and Game.Data.get(owner)
	local entry = profile and profile.Data.Slots[tostring(s)]
	local folder = slotFolder(plot, s)
	local anchor = folder and folder:FindFirstChild("Anchor")
	if not entry or not anchor then
		return
	end
	local model = ItemModels.build(entry, anchor.CFrame)
	if not model then
		profile.Data.Slots[tostring(s)] = nil -- clavier supprimé de la config
		return
	end
	model:SetAttribute("OwnerUserId", owner.UserId)
	model:SetAttribute("PlotIndex", plot.Index)
	model:SetAttribute("SlotIndex", s)
	local description = ItemModels.describe(entry)
	local stealPrompt = ItemModels.addPrompt(model, "Steal", "Steal 🥷", description, Config.Steal.HoldDuration)
	stealPrompt.Triggered:Connect(function(thief)
		Game.Carry.tryStealFromSlot(thief, plot.Index, s)
	end)
	local price = Items.incomeOf(entry) * Config.Base.SellSeconds
	local sellPrompt = ItemModels.addPrompt(model, "Sell", "Sell for " .. Format.cash(price), description, 1)
	sellPrompt.Triggered:Connect(function(player)
		PlotService.sell(player, plot.Index, s)
	end)
	model.Parent = Game.World.Items
	plot.Slots[s].Model = model
end

local function refreshSlotVisual(plot, s, unlocked: boolean)
	local folder = slotFolder(plot, s)
	if not folder then
		return
	end
	local ring = folder:FindFirstChild("Ring")
	if ring then
		ring.Transparency = unlocked and 0 or 0.85
	end
	local pedestal = folder:FindFirstChild("Pedestal")
	if pedestal then
		pedestal.Transparency = unlocked and 0 or 0.5
	end
	local key = folder:FindFirstChild("CollectKey")
	local top = key and key:FindFirstChild("Top")
	local legend = top and top:FindFirstChild("Legend")
	local label = legend and legend:FindFirstChildOfClass("TextLabel")
	if label then
		label.Text = unlocked and "$" or "🔒"
	end
end

----------------------------------------------------------------------
-- API
----------------------------------------------------------------------
function PlotService.getPlot(player: Player)
	for _, plot in plots do
		if plot.Owner == player then
			return plot
		end
	end
	return nil
end

function PlotService.getPlotByIndex(index: number)
	return plots[index]
end

function PlotService.isLocked(plot): boolean
	return plot.LockedUntil > now()
end

function PlotService.isInside(plot, position: Vector3): boolean
	local bounds = plot.Model:FindFirstChild("Bounds")
	if not bounds then
		return false
	end
	local p = bounds.CFrame:PointToObjectSpace(position)
	local half = bounds.Size / 2
	return math.abs(p.X) <= half.X and math.abs(p.Y) <= half.Y and math.abs(p.Z) <= half.Z
end

function PlotService.getPlotAt(position: Vector3)
	for _, plot in plots do
		if PlotService.isInside(plot, position) then
			return plot
		end
	end
	return nil
end

-- Revenu total par seconde d'un joueur
function PlotService.totalIncome(player: Player): number
	local profile = Game.Data.get(player)
	if not profile then
		return 0
	end
	local total = 0
	for _, entry in profile.Data.Slots do
		total += Items.incomeOf(entry)
	end
	return total
end

-- Met à jour les emplacements (débloqués / verrouillés) et les claviers posés
function PlotService.refresh(player: Player)
	local plot = PlotService.getPlot(player)
	local profile = Game.Data.get(player)
	if not plot or not profile then
		return
	end
	for s = 1, Config.Slots.Max do
		local unlocked = s <= profile.Data.SlotCount
		refreshSlotVisual(plot, s, unlocked)
		local entry = profile.Data.Slots[tostring(s)]
		local state = plot.Slots[s]
		if entry and not state.Stealing and not state.Model then
			spawnSlotModel(plot, s)
		elseif not entry and state.Model then
			destroySlotModel(plot, s)
		end
		updatePending(plot, s, profile.Data.Slots[tostring(s)])
	end
	player:SetAttribute("Income", PlotService.totalIncome(player))
end

function PlotService.assign(player: Player)
	for index = 1, #plots do
		local plot = plots[index]
		if not plot.Owner then
			plot.Owner = player
			plot.LockedUntil = 0
			plot.Slots = {}
			for s = 1, Config.Slots.Max do
				plot.Slots[s] = { Model = nil, Stealing = false, Thief = nil }
			end
			plot.Model:SetAttribute("OwnerUserId", player.UserId)
			plot.Model:SetAttribute("OwnerName", player.DisplayName)
			plot.Model:SetAttribute("LockedUntil", 0)
			setSign(plot, player.DisplayName .. "'s Base")
			player:SetAttribute("PlotIndex", index)

			-- revenus hors ligne (une partie, plafonnés)
			local profile = Game.Data.get(player)
			if profile and (profile.Data.LastSeen or 0) > 0 then
				local offline = math.clamp(os.time() - profile.Data.LastSeen, 0, Config.Base.OfflineMaxSeconds)
				local earned = 0
				for _, entry in profile.Data.Slots do
					local gain = Items.incomeOf(entry) * offline * Config.Base.OfflineRate
					entry.Pending = (entry.Pending or 0) + gain
					earned += gain
				end
				if earned >= 1 then
					task.delay(3, function()
						Game.Player.notify(player, "💤 Your keyboards earned " .. Format.cash(earned) .. " while you were away! Step on the $ keys.", "Success")
					end)
				end
			end
			PlotService.refresh(player)
			return plot
		end
	end
	Game.Player.notify(player, "No free base on this server 😢 (max " .. #plots .. " players).", "Error")
	return nil
end

function PlotService.unassign(player: Player)
	local plot = PlotService.getPlot(player)
	if not plot then
		return
	end
	for s = 1, Config.Slots.Max do
		destroySlotModel(plot, s)
		plot.Slots[s] = { Model = nil, Stealing = false, Thief = nil }
		updatePending(plot, s, nil)
		refreshSlotVisual(plot, s, true)
	end
	plot.Owner = nil
	plot.LockedUntil = 0
	plot.Model:SetAttribute("OwnerUserId", 0)
	plot.Model:SetAttribute("OwnerName", "")
	plot.Model:SetAttribute("LockedUntil", 0)
	local barrier = plot.Model:FindFirstChild("Barrier")
	if barrier then
		barrier.Transparency = 1
		barrier.CanCollide = false
	end
	setSign(plot, "FREE BASE")
end

-- Ajoute un clavier dans le premier emplacement libre. Renvoie l'index ou nil.
function PlotService.addItem(player: Player, record)
	local plot = PlotService.getPlot(player)
	local profile = Game.Data.get(player)
	if not plot or not profile then
		return nil
	end
	for s = 1, profile.Data.SlotCount do
		local key = tostring(s)
		if profile.Data.Slots[key] == nil and not plot.Slots[s].Stealing then
			profile.Data.Slots[key] = { Id = record.Id, Mutation = record.Mutation or "None", Pending = 0 }
			profile.Data.Index[record.Id] = true
			spawnSlotModel(plot, s)
			updatePending(plot, s, profile.Data.Slots[key])
			player:SetAttribute("Income", PlotService.totalIncome(player))
			return s
		end
	end
	return nil
end

function PlotService.slotPosition(plot, s): Vector3?
	local folder = slotFolder(plot, s)
	local anchor = folder and folder:FindFirstChild("Anchor")
	return anchor and anchor.Position
end

----------------------------------------------------------------------
-- Collecte, verrou, revente
----------------------------------------------------------------------
function PlotService.collect(player: Player, s: number)
	local plot = PlotService.getPlot(player)
	local profile = Game.Data.get(player)
	if not plot or not profile or s > profile.Data.SlotCount then
		return
	end
	local entry = profile.Data.Slots[tostring(s)]
	if not entry or (entry.Pending or 0) < 1 then
		return
	end
	local amount = math.floor(entry.Pending)
	entry.Pending -= amount
	profile.Data.Stats.Collected += amount
	Game.Data.addCash(player, amount)
	updatePending(plot, s, entry)
	Game.Player.effect(player, "Collect", amount, PlotService.slotPosition(plot, s))
end

-- Appelé quand un joueur marche sur une touche $ (Action = "Collect")
function PlotService.collectByKey(player: Player, key: Model)
	local plot = plots[key:GetAttribute("PlotIndex") or 0]
	if plot and plot.Owner == player then
		PlotService.collect(player, key:GetAttribute("SlotIndex") or 0)
	end
end

local function unlockPlot(plot)
	plot.LockedUntil = 0
	plot.Model:SetAttribute("LockedUntil", 0)
	local barrier = plot.Model:FindFirstChild("Barrier")
	if barrier then
		barrier.Transparency = 1
		barrier.CanCollide = false
	end
	if plot.Owner then
		Game.Player.notify(plot.Owner, "🔓 Your base is unlocked! Step on LOCK again.", "Alert")
	end
end

function PlotService.lock(player: Player)
	local plot = PlotService.getPlot(player)
	if not plot then
		return
	end
	if PlotService.isLocked(plot) then
		return
	end
	plot.LockedUntil = now() + Config.Base.LockDuration
	plot.Model:SetAttribute("LockedUntil", plot.LockedUntil)
	local barrier = plot.Model:FindFirstChild("Barrier")
	if barrier then
		barrier.Transparency = 0.45
		barrier.CanCollide = true
		-- les intrus sont poussés dehors
		for _, other in Players:GetPlayers() do
			local root = other ~= player and other.Character and other.Character:FindFirstChild("HumanoidRootPart")
			if root and PlotService.isInside(plot, root.Position) then
				Game.Player.teleport(other, barrier.CFrame * CFrame.new(-7, -1, 0) * CFrame.Angles(0, math.pi / 2, 0))
			end
		end
		Game.Player.effectAll("Lock", barrier.Position)
	end
	Game.Player.notify(player, "🔒 Base locked for " .. Config.Base.LockDuration .. "s!", "Success")
end

function PlotService.lockByKey(player: Player, key: Model)
	local plot = plots[key:GetAttribute("PlotIndex") or 0]
	if plot and plot.Owner == player then
		PlotService.lock(player)
	end
end

function PlotService.sell(player: Player, plotIndex: number, s: number)
	local plot = plots[plotIndex]
	if not plot or plot.Owner ~= player or plot.Slots[s].Stealing then
		return
	end
	local profile = Game.Data.get(player)
	local entry = profile and profile.Data.Slots[tostring(s)]
	if not entry then
		return
	end
	local price = math.floor(Items.incomeOf(entry) * Config.Base.SellSeconds + (entry.Pending or 0))
	profile.Data.Slots[tostring(s)] = nil
	destroySlotModel(plot, s)
	updatePending(plot, s, nil)
	Game.Data.addCash(player, price)
	player:SetAttribute("Income", PlotService.totalIncome(player))
	Game.Player.effect(player, "Collect", price, PlotService.slotPosition(plot, s))
	Game.Player.notify(player, "💸 Sold " .. ItemModels.describe(entry) .. " for " .. Format.cash(price), "Success")
end

----------------------------------------------------------------------
-- Vol
----------------------------------------------------------------------
-- Renvoie (record, propriétaire) ou (nil, message d'erreur)
function PlotService.beginSteal(thief: Player, plotIndex: number, s: number)
	local plot = plots[plotIndex]
	if not plot or not plot.Owner or plot.Owner == thief then
		return nil, nil
	end
	if PlotService.isLocked(plot) then
		return nil, "This base is locked! 🔒"
	end
	local profile = Game.Data.get(plot.Owner)
	local entry = profile and profile.Data.Slots[tostring(s)]
	local state = plot.Slots[s]
	if not entry or not state or state.Stealing then
		return nil, nil
	end
	state.Stealing = true
	state.Thief = thief
	destroySlotModel(plot, s)
	updatePending(plot, s, nil)
	return { Id = entry.Id, Mutation = entry.Mutation }, plot.Owner
end

-- Fin du vol : success = le voleur l'a ramené chez lui
function PlotService.endSteal(plotIndex: number, s: number, success: boolean)
	local plot = plots[plotIndex]
	local state = plot and plot.Slots[s]
	if not state or not state.Stealing then
		return
	end
	state.Stealing = false
	state.Thief = nil
	local owner = plot.Owner
	local profile = owner and Game.Data.get(owner)
	if not profile then
		return
	end
	local key = tostring(s)
	local entry = profile.Data.Slots[key]
	if success then
		if entry then
			-- le propriétaire garde l'argent déjà gagné par ce clavier
			local pending = math.floor(entry.Pending or 0)
			if pending > 0 then
				Game.Data.addCash(owner, pending)
			end
		end
		profile.Data.Slots[key] = nil
		profile.Data.Stats.TimesStolen += 1
		updatePending(plot, s, nil)
		owner:SetAttribute("Income", PlotService.totalIncome(owner))
	else
		spawnSlotModel(plot, s)
		updatePending(plot, s, entry)
	end
end

----------------------------------------------------------------------
function PlotService.init(registry)
	Game = registry
	local folder = Game.World.Map:WaitForChild("Plots")
	for _, model in folder:GetChildren() do
		local index = model:GetAttribute("PlotIndex")
		if model:IsA("Model") and index then
			plots[index] = { Index = index, Model = model, Owner = nil, Slots = {}, LockedUntil = 0 }
		end
	end

	-- Revenus : chaque seconde, chaque clavier posé remplit sa touche $
	task.spawn(function()
		while true do
			task.wait(1)
			for _, plot in plots do
				local owner = plot.Owner
				local profile = owner and Game.Data.get(owner)
				if profile then
					for s = 1, profile.Data.SlotCount do
						local entry = profile.Data.Slots[tostring(s)]
						local state = plot.Slots[s]
						if entry and state and not state.Stealing then
							entry.Pending = (entry.Pending or 0) + Items.incomeOf(entry)
							updatePending(plot, s, entry)
						end
					end
				end
				if plot.LockedUntil > 0 and now() >= plot.LockedUntil then
					unlockPlot(plot)
				end
			end
		end
	end)
end

return PlotService
