-- SettingsPanel.luau
-- ⚙️ Réglages ASMR, 100 % gratuits (l'argument de la vidéo) :
-- son des touches, underglow RGB, couleur des keycaps, volumes, couper les autres.

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local SoundConfig = require(Shared:WaitForChild("SoundConfig"))
local Themes = require(Shared:WaitForChild("Themes"))

local Ui = require(script.Parent:WaitForChild("Ui"))

local SettingsPanel = {}

local panel: Frame
local Settings
local SoundController
local refreshers = {}

local SELECTED = Color3.fromRGB(70, 140, 255)
local IDLE = Color3.fromRGB(52, 52, 72)

local function rgb(c)
	return Color3.fromRGB(c[1], c[2], c[3])
end

local function refreshAll()
	for _, refresh in refreshers do
		refresh()
	end
end

local function section(parent: Instance, order: number, title: string, cellSize: UDim2)
	local frame = Ui.new("Frame", {
		Size = UDim2.new(1, -10, 0, 0),
		AutomaticSize = Enum.AutomaticSize.Y,
		BackgroundTransparency = 1,
		LayoutOrder = order,
		Parent = parent,
	}, { Ui.list(Enum.FillDirection.Vertical, 6, Enum.HorizontalAlignment.Left) })
	Ui.label({
		Text = title,
		TextXAlignment = Enum.TextXAlignment.Left,
		Size = UDim2.new(1, 0, 0, 28),
		MaxTextSize = 22,
		LayoutOrder = 0,
		Parent = frame,
	})
	local grid = Ui.new("Frame", {
		Size = UDim2.new(1, 0, 0, 0),
		AutomaticSize = Enum.AutomaticSize.Y,
		BackgroundTransparency = 1,
		LayoutOrder = 1,
		Parent = frame,
	}, {
		Ui.new("UIGridLayout", {
			CellSize = cellSize,
			CellPadding = UDim2.new(0, 8, 0, 8),
			SortOrder = Enum.SortOrder.LayoutOrder,
		}),
	})
	return grid
end

-- Bouton à sélection unique : isSelected() dit s'il doit être en surbrillance
local function choice(parent: Instance, order: number, text: string, color: Color3?, isSelected: () -> boolean, onClick: () -> ())
	local button = Ui.button({
		BackgroundColor3 = color or IDLE,
		Text = text,
		LayoutOrder = order,
		MaxTextSize = 20,
		Parent = parent,
	}, function()
		onClick()
		refreshAll()
	end)
	local stroke = Ui.stroke(Color3.fromRGB(255, 255, 255), 3)
	stroke.Parent = button
	table.insert(refreshers, function()
		local selected = isSelected()
		stroke.Transparency = selected and 0 or 0.85
		if not color then
			button.BackgroundColor3 = selected and SELECTED or IDLE
		end
	end)
	return button
end

local function volumeRow(parent: Instance, order: number, title: string, key: string, zeroLabel: string)
	local grid = section(parent, order, title, UDim2.new(0, 96, 0, 42))
	local steps = { 0, 0.25, 0.5, 0.75, 1 }
	for i, value in steps do
		local text = value == 0 and zeroLabel or (math.floor(value * 100) .. "%")
		choice(grid, i, text, nil, function()
			return math.abs((Settings.get(key) or 0) - value) < 0.13
		end, function()
			Settings.set(key, value)
		end)
	end
end

function SettingsPanel.open()
	refreshAll()
	panel.Visible = true
end

function SettingsPanel.close()
	panel.Visible = false
end

function SettingsPanel.toggle()
	if panel.Visible then
		SettingsPanel.close()
	else
		SettingsPanel.open()
	end
end

function SettingsPanel.init(gui: ScreenGui, settings, soundController)
	Settings = settings
	SoundController = soundController

	panel = Ui.new("Frame", {
		Name = "SettingsPanel",
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromScale(0.5, 0.52),
		Size = UDim2.new(0, 660, 0, 520),
		BackgroundColor3 = Ui.Colors.Panel,
		BackgroundTransparency = 0.04,
		Visible = false,
		Parent = gui,
	}, { Ui.corner(20), Ui.stroke(Ui.Colors.Speed, 3) })
	Ui.autoScale(panel)

	Ui.label({
		Text = "⚙️ ASMR SETTINGS",
		TextColor3 = Ui.Colors.Speed,
		TextXAlignment = Enum.TextXAlignment.Left,
		Size = UDim2.new(1, -120, 0, 46),
		Position = UDim2.new(0, 20, 0, 12),
		MaxTextSize = 36,
		Parent = panel,
	})
	Ui.button({
		Size = UDim2.new(0, 46, 0, 46),
		Position = UDim2.new(1, -60, 0, 12),
		BackgroundColor3 = Color3.fromRGB(230, 70, 80),
		Text = "✕",
		Parent = panel,
	}, SettingsPanel.close)

	local scroll = Ui.new("ScrollingFrame", {
		Size = UDim2.new(1, -30, 1, -76),
		Position = UDim2.new(0, 18, 0, 66),
		BackgroundTransparency = 1,
		BorderSizePixel = 0,
		ScrollBarThickness = 6,
		CanvasSize = UDim2.new(0, 0, 0, 0),
		AutomaticCanvasSize = Enum.AutomaticSize.Y,
		ScrollingDirection = Enum.ScrollingDirection.Y,
		Parent = panel,
	}, { Ui.list(Enum.FillDirection.Vertical, 14, Enum.HorizontalAlignment.Left) })

	-- 🎧 Son des touches
	local sounds = section(scroll, 1, "🎧 Key sound", UDim2.new(0, 112, 0, 44))
	for i, name in SoundConfig.ProfileOrder do
		local profile = SoundConfig.Profiles[name]
		choice(sounds, i, profile and profile.Label or name, nil, function()
			return Settings.get("SoundProfile") == name
		end, function()
			Settings.set("SoundProfile", name)
			SoundController.playKey(name, false, nil, true) -- aperçu
		end)
	end

	-- 🌈 Underglow RGB
	local modes = section(scroll, 2, "🌈 RGB underglow (everyone sees it)", UDim2.new(0, 150, 0, 44))
	choice(modes, 1, "AUTO (zone)", nil, function()
		return Settings.get("GlowMode") == "Auto"
	end, function()
		Settings.set("GlowMode", "Auto")
	end)
	choice(modes, 2, "🌈 RAINBOW", nil, function()
		return Settings.get("GlowMode") == "Rainbow"
	end, function()
		Settings.set("GlowMode", "Rainbow")
	end)
	local colors = section(scroll, 3, "🎨 Glow color", UDim2.new(0, 52, 0, 44))
	for i, c in Themes.GlowColors do
		local color = rgb(c)
		choice(colors, i, "", color, function()
			local current = Settings.get("GlowColor")
			return Settings.get("GlowMode") == "Color" and typeof(current) == "Color3" and current == color
		end, function()
			Settings.set("GlowColor", color)
			Settings.set("GlowMode", "Color")
		end)
	end

	-- ⌨️ Couleur des keycaps
	local caps = section(scroll, 4, "⌨️ Keycap color (only on your screen)", UDim2.new(0, 112, 0, 44))
	for i, theme in Themes.Keycaps do
		local color = rgb(theme.Cap)
		local button = choice(caps, i, theme.Name, color, function()
			return Settings.get("Keycaps") == theme.Name
		end, function()
			Settings.set("Keycaps", theme.Name)
		end)
		local brightness = color.R * 0.3 + color.G * 0.59 + color.B * 0.11
		button.TextColor3 = brightness > 0.6 and Color3.fromRGB(30, 30, 40) or Color3.fromRGB(255, 255, 255)
	end

	-- 🔊 Volumes
	volumeRow(scroll, 5, "🔊 My keys volume", "MyVolume", "OFF")
	volumeRow(scroll, 6, "👥 Other players' keys", "OthersVolume", "MUTE")
	if SoundController.hasMusic() then
		volumeRow(scroll, 7, "🎵 Music", "MusicVolume", "OFF")
	end

	Ui.label({
		Text = "Everything here is FREE. No paywall, no locked sound packs. ❤️",
		Font = Ui.FontBody,
		TextColor3 = Ui.Colors.Muted,
		TextXAlignment = Enum.TextXAlignment.Left,
		Size = UDim2.new(1, -10, 0, 24),
		MaxTextSize = 16,
		LayoutOrder = 99,
		Parent = scroll,
	})

	Settings.Changed:Connect(function()
		if panel.Visible then
			refreshAll()
		end
	end)
end

return SettingsPanel
