-- Hud.luau
-- 🖥️ L'interface principale : argent, Speed, switch, boutons, bannière du clavier
-- porté, état du verrou, notifications et petits "+$" / "+⚡" qui s'envolent.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Format = require(Shared:WaitForChild("Format"))

local Ui = require(script.Parent:WaitForChild("Ui"))

local Remotes = ReplicatedStorage:WaitForChild("Remotes")
local player = Players.LocalPlayer

local Hud = {}

local SoundController
local gui: ScreenGui
local notifications: Frame
local popupLayer: Frame
local flash: Frame
local cashValue, speedValue, switchLabel
local banner, bannerText
local statusLabel, towerLabel
local notifCounter = 0

local KIND_COLORS = {
	Info = Color3.fromRGB(70, 140, 255),
	Success = Color3.fromRGB(60, 200, 110),
	Error = Color3.fromRGB(230, 70, 80),
	Alert = Color3.fromRGB(255, 60, 60),
	Rare = Color3.fromRGB(255, 190, 40),
}
local KIND_SOUNDS = { Info = "Notify", Success = "Notify", Error = "Error", Alert = "Steal", Rare = "Rare" }

----------------------------------------------------------------------
-- Notifications (en haut à droite)
----------------------------------------------------------------------
function Hud.notify(text: string, kind: string?)
	kind = kind or "Info"
	local color = KIND_COLORS[kind] or KIND_COLORS.Info
	notifCounter -= 1
	local frame = Ui.new("Frame", {
		Name = "Notification",
		Size = UDim2.new(1, 0, 0, 50),
		BackgroundColor3 = Ui.Colors.Panel,
		BackgroundTransparency = 0.1,
		LayoutOrder = notifCounter,
		Parent = notifications,
	}, { Ui.corner(12), Ui.stroke(color, 2) })
	Ui.new("Frame", {
		Size = UDim2.new(0, 6, 1, -12),
		Position = UDim2.new(0, 6, 0, 6),
		BackgroundColor3 = color,
		BorderSizePixel = 0,
		Parent = frame,
	}, { Ui.corner(3) })
	local label = Ui.label({
		Text = text,
		Font = Ui.FontBody,
		TextWrapped = true,
		TextXAlignment = Enum.TextXAlignment.Left,
		Size = UDim2.new(1, -26, 1, -8),
		Position = UDim2.new(0, 18, 0, 4),
		MaxTextSize = 19,
		Parent = frame,
	})
	local scale = Ui.new("UIScale", { Scale = 0.6, Parent = frame })
	Ui.tween(scale, 0.25, { Scale = 1 }, Enum.EasingStyle.Back)

	-- 5 notifications maximum à l'écran
	local list = {}
	for _, child in notifications:GetChildren() do
		if child:IsA("Frame") then
			table.insert(list, child)
		end
	end
	table.sort(list, function(a, b)
		return a.LayoutOrder > b.LayoutOrder
	end)
	for i = 1, #list - 5 do
		list[i]:Destroy()
	end

	if SoundController then
		SoundController.playEffect(KIND_SOUNDS[kind] or "Notify")
	end
	task.delay(kind == "Rare" and 6 or 4.5, function()
		if frame.Parent then
			Ui.tween(frame, 0.3, { BackgroundTransparency = 1 })
			Ui.tween(label, 0.3, { TextTransparency = 1 })
			task.wait(0.32)
			frame:Destroy()
		end
	end)
end

----------------------------------------------------------------------
-- Petits textes qui s'envolent
----------------------------------------------------------------------
local function popup(text: string, color: Color3, position: UDim2, size: number?)
	local label = Ui.label({
		Text = text,
		TextColor3 = color,
		TextStrokeTransparency = 0.2,
		Size = UDim2.new(0, 320, 0, size or 46),
		Position = position,
		AnchorPoint = Vector2.new(0.5, 0.5),
		MaxTextSize = size or 46,
		Parent = popupLayer,
	})
	Ui.tween(label, 1.0, {
		Position = position - UDim2.fromOffset(0, 80),
		TextTransparency = 1,
		TextStrokeTransparency = 1,
	})
	task.delay(1.05, function()
		label:Destroy()
	end)
end

local function flashScreen(color: Color3)
	flash.BackgroundColor3 = color
	flash.BackgroundTransparency = 0.7
	Ui.tween(flash, 0.6, { BackgroundTransparency = 1 })
end

----------------------------------------------------------------------
-- Construction
----------------------------------------------------------------------
local function pill(parent: Instance, icon: string, color: Color3, order: number)
	local frame = Ui.new("Frame", {
		Size = UDim2.new(0, 220, 0, 54),
		BackgroundColor3 = Ui.Colors.Panel,
		BackgroundTransparency = 0.08,
		LayoutOrder = order,
		Parent = parent,
	}, { Ui.corner(18), Ui.stroke(color, 3) })
	Ui.label({ Text = icon, Size = UDim2.new(0, 42, 0, 42), Position = UDim2.new(0, 8, 0, 6), Parent = frame })
	local value = Ui.label({
		Text = "0",
		TextColor3 = color,
		TextXAlignment = Enum.TextXAlignment.Left,
		Size = UDim2.new(1, -62, 1, -12),
		Position = UDim2.new(0, 54, 0, 6),
		MaxTextSize = 34,
		Parent = frame,
	})
	return frame, value
end

local function sideButton(parent: Instance, icon: string, text: string, color: Color3, order: number, onClick)
	local button = Ui.button({
		Size = UDim2.new(0, 86, 0, 86),
		BackgroundColor3 = Ui.Colors.Panel,
		BackgroundTransparency = 0.08,
		LayoutOrder = order,
		Text = "",
		Parent = parent,
		CornerRadius = 18,
	}, onClick)
	Ui.stroke(color, 3).Parent = button
	Ui.label({ Text = icon, Size = UDim2.new(1, 0, 0.58, 0), Position = UDim2.new(0, 0, 0.04, 0), Parent = button })
	Ui.label({ Text = text, TextColor3 = color, Size = UDim2.new(1, 0, 0.3, 0), Position = UDim2.new(0, 0, 0.64, 0), MaxTextSize = 20, Parent = button })
	return button
end

local function myPlot()
	local index = player:GetAttribute("PlotIndex")
	local map = workspace:FindFirstChild("Map")
	local plots = map and map:FindFirstChild("Plots")
	return plots and index and plots:FindFirstChild("Plot_" .. index)
end

local function refreshStats()
	cashValue.Text = Format.cash(player:GetAttribute("Cash") or 0)
	local speed = player:GetAttribute("Speed") or 0
	speedValue.Text = Format.short(speed)
	local tier = player:GetAttribute("SwitchTier") or 1
	local switch = Config.Switches[tier] or Config.Switches[1]
	local income = player:GetAttribute("Income") or 0
	switchLabel.Text = string.format(
		"⌨️ %s  •  +%s ⚡/key  •  🏃 %d  •  💸 %s/s",
		switch.Name,
		Format.short(switch.Gain),
		math.floor(Config.walkSpeedFor(speed)),
		Format.cash(income)
	)
end

local function refreshBanner()
	local name = player:GetAttribute("CarryingName")
	if name then
		local stolen = player:GetAttribute("CarryingStolen")
		banner.Visible = true
		banner.BackgroundColor3 = stolen and Color3.fromRGB(120, 25, 35) or Color3.fromRGB(30, 60, 120)
		bannerText.Text = stolen and ("🥷 STOLEN: " .. name .. " — run to your base!") or ("📦 " .. name .. " — bring it to your base!")
	else
		banner.Visible = false
	end
end

local function refreshStatus()
	local plot = myPlot()
	if plot then
		local remaining = (plot:GetAttribute("LockedUntil") or 0) - workspace:GetServerTimeNow()
		if remaining > 0 then
			statusLabel.Text = "🔒 Base locked: " .. math.ceil(remaining) .. "s"
			statusLabel.TextColor3 = Color3.fromRGB(255, 120, 120)
		else
			statusLabel.Text = "🔓 Base open — step on LOCK to protect it"
			statusLabel.TextColor3 = Ui.Colors.Muted
		end
	else
		statusLabel.Text = ""
	end
	local readyAt = player:GetAttribute("TowerReadyAt") or 0
	local towerWait = readyAt - os.time()
	if towerWait > 0 then
		towerLabel.Text = "🗼 Tower reward in " .. Format.time(towerWait)
		towerLabel.TextColor3 = Ui.Colors.Muted
	else
		towerLabel.Text = "🗼 Tower reward READY — climb the ASMR Tower!"
		towerLabel.TextColor3 = Ui.Colors.Gold
	end
end

-- Effets envoyés par le serveur
local function onEffect(kind: string, a, b)
	if kind == "Collect" then
		SoundController.playEffect("Collect")
		popup("+" .. Format.cash(a or 0), Ui.Colors.Cash, UDim2.new(0.5, 0, 0.66, 0), 52)
	elseif kind == "Grab" then
		SoundController.playEffect("Grab", typeof(a) == "Vector3" and a or nil)
	elseif kind == "Steal" then
		SoundController.playEffect("Steal")
		flashScreen(Color3.fromRGB(255, 0, 0))
	elseif kind == "Deposit" then
		SoundController.playEffect("Deposit", typeof(a) == "Vector3" and a or nil)
	elseif kind == "Slap" then
		SoundController.playEffect("Slap", typeof(a) == "Vector3" and a or nil)
		if b then
			SoundController.playEffect("Grab", typeof(a) == "Vector3" and a or nil)
		end
	elseif kind == "Lock" then
		SoundController.playEffect("Lock", typeof(a) == "Vector3" and a or nil)
	elseif kind == "Upgrade" then
		SoundController.playEffect("Upgrade")
		flashScreen(Color3.fromRGB(255, 220, 80))
	elseif kind == "Checkpoint" then
		SoundController.playEffect("Notify")
	elseif kind == "TowerWin" then
		SoundController.playEffect("Rare")
		flashScreen(Color3.fromRGB(255, 220, 80))
		popup("🗼 TOWER BEATEN!", Ui.Colors.Gold, UDim2.new(0.5, 0, 0.45, 0), 60)
	end
end

function Hud.init(deps)
	SoundController = deps.SoundController
	local playerGui = player:WaitForChild("PlayerGui")

	gui = Ui.new("ScreenGui", {
		Name = "KeyboardHUD",
		ResetOnSpawn = false,
		ZIndexBehavior = Enum.ZIndexBehavior.Sibling,
		Parent = playerGui,
	})

	flash = Ui.new("Frame", {
		Name = "Flash",
		Size = UDim2.fromScale(1, 1),
		BackgroundTransparency = 1,
		BorderSizePixel = 0,
		ZIndex = 0,
		Parent = gui,
	})

	-- Haut : argent + Speed + ligne d'info
	local top = Ui.new("Frame", {
		Name = "Stats",
		AnchorPoint = Vector2.new(0.5, 0),
		Position = UDim2.new(0.5, 0, 0, 6),
		Size = UDim2.new(0, 470, 0, 130),
		BackgroundTransparency = 1,
		Parent = gui,
	})
	Ui.autoScale(top)
	local row = Ui.new("Frame", { Size = UDim2.new(1, 0, 0, 56), BackgroundTransparency = 1, Parent = top }, {
		Ui.list(Enum.FillDirection.Horizontal, 12, Enum.HorizontalAlignment.Center),
	})
	local _, cash = pill(row, "💵", Ui.Colors.Cash, 1)
	local _, speed = pill(row, "⚡", Ui.Colors.Speed, 2)
	cashValue, speedValue = cash, speed
	switchLabel = Ui.label({
		Font = Ui.FontBody,
		TextColor3 = Ui.Colors.Text,
		TextStrokeTransparency = 0.4,
		Size = UDim2.new(1, 40, 0, 22),
		Position = UDim2.new(0, -20, 0, 62),
		MaxTextSize = 17,
		Parent = top,
	})
	statusLabel = Ui.label({
		Font = Ui.FontBody,
		TextStrokeTransparency = 0.5,
		Size = UDim2.new(1, 0, 0, 20),
		Position = UDim2.new(0, 0, 0, 86),
		MaxTextSize = 16,
		Parent = top,
	})
	towerLabel = Ui.label({
		Font = Ui.FontBody,
		TextStrokeTransparency = 0.5,
		Size = UDim2.new(1, 0, 0, 18),
		Position = UDim2.new(0, 0, 0, 108),
		MaxTextSize = 15,
		Parent = top,
	})

	-- Bannière du clavier porté
	banner = Ui.new("Frame", {
		Name = "CarryBanner",
		AnchorPoint = Vector2.new(0.5, 0),
		Position = UDim2.new(0.5, 0, 0, 142),
		Size = UDim2.new(0, 560, 0, 44),
		BackgroundColor3 = Color3.fromRGB(30, 60, 120),
		BackgroundTransparency = 0.1,
		Visible = false,
		Parent = gui,
	}, { Ui.corner(14), Ui.stroke(Color3.fromRGB(255, 255, 255), 2, 0.4) })
	Ui.autoScale(banner)
	bannerText = Ui.label({ Size = UDim2.new(1, -20, 1, -8), Position = UDim2.new(0, 10, 0, 4), MaxTextSize = 24, Parent = banner })

	-- Gauche : boutons
	local side = Ui.new("Frame", {
		Name = "Buttons",
		AnchorPoint = Vector2.new(0, 0.5),
		Position = UDim2.new(0, 12, 0.5, 0),
		Size = UDim2.new(0, 86, 0, 190),
		BackgroundTransparency = 1,
		Parent = gui,
	}, { Ui.list(Enum.FillDirection.Vertical, 14) })
	Ui.autoScale(side)
	sideButton(side, "🛒", "SHOP", Ui.Colors.Gold, 1, deps.onShop)
	sideButton(side, "⚙️", "ASMR", Ui.Colors.Speed, 2, deps.onSettings)

	-- Droite : notifications
	notifications = Ui.new("Frame", {
		Name = "Notifications",
		AnchorPoint = Vector2.new(1, 0),
		Position = UDim2.new(1, -12, 0, 8),
		Size = UDim2.new(0, 360, 0, 320),
		BackgroundTransparency = 1,
		Parent = gui,
	}, { Ui.list(Enum.FillDirection.Vertical, 6) })
	Ui.autoScale(notifications)

	popupLayer = Ui.new("Frame", { Name = "Popups", Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, Parent = gui })

	-- Mises à jour
	for _, name in { "Cash", "Speed", "SwitchTier", "Income" } do
		player:GetAttributeChangedSignal(name):Connect(refreshStats)
	end
	for _, name in { "CarryingName", "CarryingStolen" } do
		player:GetAttributeChangedSignal(name):Connect(refreshBanner)
	end
	refreshStats()
	refreshBanner()

	-- "+⚡" quand la Speed monte (regroupé toutes les 0,35 s)
	local lastSpeed = player:GetAttribute("Speed") or 0
	local gained = 0
	player:GetAttributeChangedSignal("Speed"):Connect(function()
		local value = player:GetAttribute("Speed") or 0
		if value > lastSpeed then
			gained += value - lastSpeed
		end
		lastSpeed = value
	end)
	task.spawn(function()
		while true do
			task.wait(0.35)
			if gained >= 1 then
				popup("+" .. Format.short(gained) .. " ⚡", Ui.Colors.Speed, UDim2.new(0.5, 130 * (math.random() - 0.5), 0, 190), 30)
				gained = 0
			end
			refreshStatus()
		end
	end)

	Remotes.Notify.OnClientEvent:Connect(Hud.notify)
	Remotes.Effect.OnClientEvent:Connect(onEffect)

	-- Avertissement sauvegarde désactivée (Studio)
	local savingWarning = Ui.label({
		Text = "⚠️ Saving OFF (Studio)",
		Font = Ui.FontBody,
		TextColor3 = Color3.fromRGB(255, 170, 90),
		AnchorPoint = Vector2.new(0, 1),
		Position = UDim2.new(0, 12, 1, -12),
		Size = UDim2.new(0, 220, 0, 20),
		MaxTextSize = 16,
		Visible = false,
		Parent = gui,
	})
	local function refreshSaving()
		savingWarning.Visible = player:GetAttribute("DataSaving") == false
	end
	player:GetAttributeChangedSignal("DataSaving"):Connect(refreshSaving)
	refreshSaving()
	return gui
end

return Hud
