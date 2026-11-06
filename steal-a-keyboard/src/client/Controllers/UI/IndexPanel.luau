-- IndexPanel.luau
-- 📖 L'index des claviers : chaque clavier trouvé apparaît en 3D, ceux qu'il te
-- manque sont des silhouettes "???". Compléter une zone = bonus d'argent permanent.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Format = require(Shared:WaitForChild("Format"))
local Items = require(Shared:WaitForChild("Items"))
local KeyboardBuilder = require(Shared:WaitForChild("KeyboardBuilder"))

local Ui = require(script.Parent:WaitForChild("Ui"))

local player = Players.LocalPlayer

local IndexPanel = {}

local ENV = {
	Instance = Instance,
	Vector3 = Vector3,
	CFrame = CFrame,
	Color3 = Color3,
	Enum = Enum,
	UDim2 = UDim2,
	Font = Font,
	ColorSequence = ColorSequence,
	ColorSequenceKeypoint = ColorSequenceKeypoint,
}

local ZONE_ICONS = { "🏢", "🎮", "📜", "🍬", "🌃", "🌌" }

local panel: Frame
local scroll: ScrollingFrame
local counter: TextLabel
local cards = {} -- [itemId] = { Item, Viewport, Name, Rarity, Info, Stroke, Discovered }
local headers = {} -- [zoneIndex] = TextLabel
local built = false

local function rgb(c)
	return Color3.fromRGB(c[1], c[2], c[3])
end

local function foundSet()
	local set = {}
	local list = player:GetAttribute("IndexList")
	if type(list) == "string" then
		for id in string.gmatch(list, "[^,]+") do
			set[id] = true
		end
	end
	return set
end

-- Aperçu 3D du clavier (silhouette noire s'il n'est pas encore trouvé)
local function buildPreview(viewport: ViewportFrame, item, discovered: boolean)
	viewport:ClearAllChildren()
	local model = KeyboardBuilder.build(ENV, {
		Item = item,
		Rarity = Items.Rarities[item.Rarity],
		RarityName = item.Rarity,
		Mutation = Items.Mutations[1],
		NoLabel = true,
		BaseCFrame = CFrame.new(),
	})
	if not discovered then
		for _, part in model:GetDescendants() do
			if part:IsA("BasePart") then
				part.Color = Color3.fromRGB(16, 16, 22)
				part.Material = Enum.Material.SmoothPlastic
				if part.Name == "Glow" or part.Name == "Display" then
					part.Transparency = 1
				end
			end
			if part:HasTag("ItemGlow") then
				part:RemoveTag("ItemGlow")
			end
		end
	end
	model.Parent = viewport
	local camera = Instance.new("Camera")
	camera.FieldOfView = 40
	local width = model:GetAttribute("Width") or 5
	local distance = width * 1.5 + 2
	camera.CFrame = CFrame.lookAt(Vector3.new(0, distance * 0.7, distance), Vector3.new(0, 0.3, 0))
	camera.Parent = viewport
	viewport.CurrentCamera = camera
end

local function buildCard(parent: Instance, item, order: number)
	local rarity = Items.Rarities[item.Rarity]
	local frame = Ui.new("Frame", {
		BackgroundColor3 = Ui.Colors.PanelLight,
		LayoutOrder = order,
		Parent = parent,
	}, { Ui.corner(12) })
	local stroke = Ui.stroke(rgb(rarity.Color), 2)
	stroke.Parent = frame
	local viewport = Ui.new("ViewportFrame", {
		Size = UDim2.new(1, -10, 0, 92),
		Position = UDim2.new(0, 5, 0, 5),
		BackgroundColor3 = Color3.fromRGB(28, 28, 40),
		Ambient = Color3.fromRGB(190, 190, 205),
		LightColor = Color3.fromRGB(255, 255, 255),
		LightDirection = Vector3.new(-1, -2, -1),
		Parent = frame,
	}, { Ui.corner(10) })
	local name = Ui.label({ Size = UDim2.new(1, -10, 0, 24), Position = UDim2.new(0, 5, 0, 100), MaxTextSize = 18, Parent = frame })
	local rarityLabel = Ui.label({
		Font = Ui.FontBody,
		Text = item.Rarity,
		TextColor3 = rgb(rarity.Color),
		Size = UDim2.new(1, -10, 0, 18),
		Position = UDim2.new(0, 5, 0, 124),
		MaxTextSize = 15,
		Parent = frame,
	})
	local info = Ui.label({
		Font = Ui.FontBody,
		TextColor3 = Ui.Colors.Muted,
		Size = UDim2.new(1, -10, 0, 18),
		Position = UDim2.new(0, 5, 0, 144),
		MaxTextSize = 14,
		Parent = frame,
	})
	cards[item.Id] = {
		Item = item,
		Viewport = viewport,
		Name = name,
		Rarity = rarityLabel,
		Info = info,
		Stroke = stroke,
		Discovered = nil,
	}
end

local function build()
	built = true
	for zoneIndex, zone in Config.Zones do
		local section = Ui.new("Frame", {
			Size = UDim2.new(1, -10, 0, 0),
			AutomaticSize = Enum.AutomaticSize.Y,
			BackgroundTransparency = 1,
			LayoutOrder = zoneIndex,
			Parent = scroll,
		}, { Ui.list(Enum.FillDirection.Vertical, 6, Enum.HorizontalAlignment.Left) })
		headers[zoneIndex] = Ui.label({
			TextXAlignment = Enum.TextXAlignment.Left,
			TextColor3 = rgb(zone.Accent),
			Size = UDim2.new(1, 0, 0, 28),
			MaxTextSize = 22,
			LayoutOrder = 0,
			Parent = section,
		})
		local grid = Ui.new("Frame", {
			Size = UDim2.new(1, 0, 0, 0),
			AutomaticSize = Enum.AutomaticSize.Y,
			BackgroundTransparency = 1,
			LayoutOrder = 1,
			Parent = section,
		}, {
			Ui.new("UIGridLayout", {
				CellSize = UDim2.new(0, 172, 0, 168),
				CellPadding = UDim2.new(0, 10, 0, 10),
				SortOrder = Enum.SortOrder.LayoutOrder,
			}),
		})
		for order, item in Items.forZone(zoneIndex) do
			buildCard(grid, item, order)
		end
	end
end

function IndexPanel.refresh()
	if not built then
		return
	end
	local found = foundSet()
	local total, count = 0, 0
	for zoneIndex, zone in Config.Zones do
		local zoneItems = Items.forZone(zoneIndex)
		local zoneFound = 0
		for _, item in zoneItems do
			total += 1
			local discovered = found[item.Id] == true
			if discovered then
				zoneFound += 1
				count += 1
			end
			local card = cards[item.Id]
			if card and card.Discovered ~= discovered then
				card.Discovered = discovered
				buildPreview(card.Viewport, item, discovered)
				card.Name.Text = discovered and item.Name or "???"
				card.Info.Text = discovered and (Format.cash(item.Income) .. "/s") or ("Find it in " .. zone.Name)
				card.Stroke.Transparency = discovered and 0 or 0.7
			end
		end
		local complete = zoneFound == #zoneItems and #zoneItems > 0
		local header = headers[zoneIndex]
		if header then
			header.Text = string.format(
				"%s %s ZONE   %d/%d%s",
				ZONE_ICONS[zoneIndex] or "⌨️",
				string.upper(zone.Name),
				zoneFound,
				#zoneItems,
				complete and ("   ✅ +" .. math.floor(Config.Index.ZoneBonus * 100) .. "% cash") or ""
			)
		end
	end
	local zones = player:GetAttribute("CompletedZones") or 0
	counter.Text = string.format("%d / %d found  •  +%d%% cash", count, total, math.floor(zones * Config.Index.ZoneBonus * 100 + 0.5))
end

function IndexPanel.open()
	if not built then
		build()
	end
	IndexPanel.refresh()
	panel.Visible = true
end

function IndexPanel.close()
	panel.Visible = false
end

function IndexPanel.toggle()
	if panel.Visible then
		IndexPanel.close()
	else
		IndexPanel.open()
	end
end

function IndexPanel.init(gui: ScreenGui)
	panel = Ui.new("Frame", {
		Name = "IndexPanel",
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromScale(0.5, 0.52),
		Size = UDim2.new(0, 790, 0, 540),
		BackgroundColor3 = Ui.Colors.Panel,
		BackgroundTransparency = 0.04,
		Visible = false,
		Parent = gui,
	}, { Ui.corner(20), Ui.stroke(Color3.fromRGB(190, 120, 255), 3) })
	Ui.autoScale(panel)

	Ui.label({
		Text = "📖 KEYBOARD INDEX",
		TextColor3 = Color3.fromRGB(200, 140, 255),
		TextXAlignment = Enum.TextXAlignment.Left,
		Size = UDim2.new(0.55, 0, 0, 46),
		Position = UDim2.new(0, 20, 0, 12),
		MaxTextSize = 36,
		Parent = panel,
	})
	counter = Ui.label({
		Font = Ui.FontBody,
		TextColor3 = Ui.Colors.Muted,
		TextXAlignment = Enum.TextXAlignment.Right,
		Size = UDim2.new(0.38, -70, 0, 30),
		Position = UDim2.new(0.6, 0, 0, 20),
		MaxTextSize = 20,
		Parent = panel,
	})
	Ui.button({
		Size = UDim2.new(0, 46, 0, 46),
		Position = UDim2.new(1, -60, 0, 12),
		BackgroundColor3 = Color3.fromRGB(230, 70, 80),
		Text = "✕",
		Parent = panel,
	}, IndexPanel.close)

	scroll = Ui.new("ScrollingFrame", {
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

	for _, name in { "IndexList", "CompletedZones" } do
		player:GetAttributeChangedSignal(name):Connect(function()
			if panel.Visible then
				IndexPanel.refresh()
			end
		end)
	end
end

return IndexPanel
