-- ShopPanel.luau
-- 🛒 Boutique : meilleurs switchs (plus de Speed par touche), emplacements de base,
-- et boosts Robux s'ils sont configurés dans Config.Products.

local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Format = require(Shared:WaitForChild("Format"))

local Ui = require(script.Parent:WaitForChild("Ui"))

local Remotes = ReplicatedStorage:WaitForChild("Remotes")
local player = Players.LocalPlayer

local ShopPanel = {}

local panel: Frame
local Hud
local refreshers = {}
local busy = false

local function request(action: string)
	if busy then
		return
	end
	busy = true
	local ok, success, message = pcall(function()
		return Remotes.Shop:InvokeServer(action)
	end)
	busy = false
	if ok then
		Hud.notify(message or "", success and "Success" or "Error")
	else
		Hud.notify("Shop error, try again", "Error")
	end
end

local function card(parent: Instance, order: number, title: string, color: Color3)
	local frame = Ui.new("Frame", {
		Size = UDim2.new(1 / 3, -11, 1, 0),
		BackgroundColor3 = Ui.Colors.PanelLight,
		LayoutOrder = order,
		Parent = parent,
	}, { Ui.corner(14), Ui.stroke(color, 2) })
	Ui.label({ Text = title, TextColor3 = color, Size = UDim2.new(1, -20, 0, 34), Position = UDim2.new(0, 10, 0, 8), MaxTextSize = 26, Parent = frame })
	local line1 = Ui.label({ Font = Ui.FontBody, Size = UDim2.new(1, -20, 0, 24), Position = UDim2.new(0, 10, 0, 50), MaxTextSize = 18, Parent = frame })
	local line2 = Ui.label({ Font = Ui.FontBody, TextColor3 = Ui.Colors.Muted, Size = UDim2.new(1, -20, 0, 24), Position = UDim2.new(0, 10, 0, 78), MaxTextSize = 17, Parent = frame })
	local line3 = Ui.label({ Font = Ui.FontBody, TextColor3 = Ui.Colors.Muted, Size = UDim2.new(1, -20, 0, 22), Position = UDim2.new(0, 10, 0, 104), MaxTextSize = 15, Parent = frame })
	return frame, line1, line2, line3
end

local function buildSwitchCard(parent: Instance)
	local frame, line1, line2, line3 = card(parent, 1, "⌨️ SWITCHES", Ui.Colors.Speed)
	local buy = Ui.button({
		Size = UDim2.new(1, -20, 0, 52),
		Position = UDim2.new(0, 10, 1, -62),
		BackgroundColor3 = Ui.Colors.Green,
		Text = "BUY",
		Parent = frame,
	}, function()
		request("UpgradeSwitch")
	end)
	table.insert(refreshers, function()
		local tier = player:GetAttribute("SwitchTier") or 1
		local current = Config.Switches[tier] or Config.Switches[1]
		local nextSwitch = Config.Switches[tier + 1]
		line1.Text = "Now: " .. current.Name .. " (+" .. Format.short(current.Gain) .. " ⚡/key)"
		if nextSwitch then
			line2.Text = "Next: " .. nextSwitch.Name .. " (+" .. Format.short(nextSwitch.Gain) .. " ⚡/key)"
			line3.Text = "More Speed for every key you press!"
			local affordable = (player:GetAttribute("Cash") or 0) >= nextSwitch.Cost
			buy.Text = "BUY " .. Format.cash(nextSwitch.Cost)
			buy.BackgroundColor3 = affordable and Ui.Colors.Green or Ui.Colors.Grey
		else
			line2.Text = "You have the best switch! 🏆"
			line3.Text = ""
			buy.Text = "MAX"
			buy.BackgroundColor3 = Ui.Colors.Grey
		end
	end)
end

local function buildSlotCard(parent: Instance)
	local frame, line1, line2, line3 = card(parent, 2, "🏠 BASE SLOTS", Ui.Colors.Gold)
	local buy = Ui.button({
		Size = UDim2.new(1, -20, 0, 52),
		Position = UDim2.new(0, 10, 1, -62),
		BackgroundColor3 = Ui.Colors.Green,
		Text = "BUY",
		Parent = frame,
	}, function()
		request("BuySlot")
	end)
	table.insert(refreshers, function()
		local count = player:GetAttribute("SlotCount") or Config.Slots.Start
		line1.Text = count .. " / " .. Config.Slots.Max .. " slots unlocked"
		line3.Text = "More slots = more keyboards = more $$$"
		local cost = Config.Slots.Costs[count + 1]
		if count < Config.Slots.Max and cost then
			line2.Text = "Next slot: " .. Format.cash(cost)
			local affordable = (player:GetAttribute("Cash") or 0) >= cost
			buy.Text = "BUY " .. Format.cash(cost)
			buy.BackgroundColor3 = affordable and Ui.Colors.Green or Ui.Colors.Grey
		else
			line2.Text = "All slots unlocked! 🏆"
			buy.Text = "MAX"
			buy.BackgroundColor3 = Ui.Colors.Grey
		end
	end)
end

-- 🔁 Rebirth : il faut appuyer deux fois (confirmation)
local function buildRebirthCard(parent: Instance)
	local purple = Color3.fromRGB(190, 110, 255)
	local frame, line1, line2, line3 = card(parent, 3, "🔁 REBIRTH", purple)
	local armedUntil = 0
	local buy
	buy = Ui.button({
		Size = UDim2.new(1, -20, 0, 52),
		Position = UDim2.new(0, 10, 1, -62),
		BackgroundColor3 = purple,
		Text = "REBIRTH",
		Parent = frame,
	}, function()
		local rebirths = player:GetAttribute("Rebirths") or 0
		if rebirths >= Config.Rebirth.Max then
			return
		end
		if os.clock() < armedUntil then
			armedUntil = 0
			request("Rebirth")
		else
			armedUntil = os.clock() + 3
			buy.Text = "TAP AGAIN TO CONFIRM"
			task.delay(3.05, function()
				if os.clock() >= armedUntil then
					for _, refresh in refreshers do
						refresh()
					end
				end
			end)
		end
	end)
	table.insert(refreshers, function()
		local rebirths = player:GetAttribute("Rebirths") or 0
		local nextCash = 1 + (rebirths + 1) * Config.Rebirth.CashBonus
		local nextSpeed = 1 + (rebirths + 1) * Config.Rebirth.SpeedBonus
		line1.Text = "Rebirth " .. rebirths .. " → " .. (rebirths + 1)
		line2.Text = "Forever: 💵 x" .. nextCash .. "  •  ⚡ x" .. nextSpeed
		line3.Text = "Keeps keyboards & slots. Resets cash, Speed, switch."
		if rebirths >= Config.Rebirth.Max then
			buy.Text = "MAX"
			buy.BackgroundColor3 = Ui.Colors.Grey
			return
		end
		local cost = Config.rebirthCost(rebirths)
		buy.Text = "REBIRTH " .. Format.cash(cost)
		buy.BackgroundColor3 = (player:GetAttribute("Cash") or 0) >= cost and purple or Ui.Colors.Grey
	end)
end

function ShopPanel.open()
	for _, refresh in refreshers do
		refresh()
	end
	panel.Visible = true
end

function ShopPanel.close()
	panel.Visible = false
end

function ShopPanel.toggle()
	if panel.Visible then
		ShopPanel.close()
	else
		ShopPanel.open()
	end
end

function ShopPanel.isOpen(): boolean
	return panel.Visible
end

function ShopPanel.init(gui: ScreenGui, hud)
	Hud = hud
	local products = {}
	for _, product in Config.Products do
		if product.Id ~= 0 then
			table.insert(products, product)
		end
	end

	panel = Ui.new("Frame", {
		Name = "ShopPanel",
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromScale(0.5, 0.52),
		Size = UDim2.new(0, 800, 0, #products > 0 and 440 or 360),
		BackgroundColor3 = Ui.Colors.Panel,
		BackgroundTransparency = 0.04,
		Visible = false,
		Parent = gui,
	}, { Ui.corner(20), Ui.stroke(Ui.Colors.Gold, 3) })
	Ui.autoScale(panel)

	Ui.label({ Text = "🛒 SHOP", TextColor3 = Ui.Colors.Gold, Size = UDim2.new(1, -120, 0, 46), Position = UDim2.new(0, 20, 0, 12), TextXAlignment = Enum.TextXAlignment.Left, MaxTextSize = 38, Parent = panel })
	Ui.button({
		Size = UDim2.new(0, 46, 0, 46),
		Position = UDim2.new(1, -60, 0, 12),
		BackgroundColor3 = Color3.fromRGB(230, 70, 80),
		Text = "✕",
		Parent = panel,
	}, ShopPanel.close)

	local cards = Ui.new("Frame", {
		Size = UDim2.new(1, -40, 0, 260),
		Position = UDim2.new(0, 20, 0, 72),
		BackgroundTransparency = 1,
		Parent = panel,
	}, { Ui.list(Enum.FillDirection.Horizontal, 16) })
	buildSwitchCard(cards)
	buildSlotCard(cards)
	buildRebirthCard(cards)

	if #products > 0 then
		local row = Ui.new("Frame", {
			Size = UDim2.new(1, -40, 0, 64),
			Position = UDim2.new(0, 20, 0, 350),
			BackgroundTransparency = 1,
			Parent = panel,
		}, { Ui.list(Enum.FillDirection.Horizontal, 10) })
		for i, product in products do
			Ui.button({
				Size = UDim2.new(1 / #products, -10, 1, 0),
				BackgroundColor3 = Color3.fromRGB(140, 80, 255),
				Text = "💎 " .. product.Label,
				LayoutOrder = i,
				Parent = row,
			}, function()
				MarketplaceService:PromptProductPurchase(player, product.Id)
			end)
		end
	end

	for _, name in { "Cash", "SwitchTier", "SlotCount", "Rebirths" } do
		player:GetAttributeChangedSignal(name):Connect(function()
			if panel.Visible then
				for _, refresh in refreshers do
					refresh()
				end
			end
		end)
	end
end

return ShopPanel
