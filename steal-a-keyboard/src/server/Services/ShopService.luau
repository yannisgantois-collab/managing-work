-- ShopService.luau
-- 🛒 Améliorations (switchs, emplacements) et achats Robux (Developer Products).

local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Format = require(Shared:WaitForChild("Format"))

local Remotes = ReplicatedStorage:WaitForChild("Remotes")

local ShopService = {}
local Game

local function handle(player: Player, action)
	local profile = Game.Data.get(player)
	if not profile then
		return false, "Loading..."
	end
	local data = profile.Data
	if action == "UpgradeSwitch" then
		local nextTier = data.SwitchTier + 1
		local switch = Config.Switches[nextTier]
		if not switch then
			return false, "You have the best switch! 🏆"
		end
		if not Game.Data.spendCash(player, switch.Cost) then
			return false, "Not enough cash! You need " .. Format.cash(switch.Cost)
		end
		data.SwitchTier = nextTier
		Game.Data.sync(player)
		Game.Player.effect(player, "Upgrade")
		return true, "⌨️ Upgraded to " .. switch.Name .. "! +" .. switch.Gain .. " Speed per key"
	elseif action == "BuySlot" then
		local count = data.SlotCount
		if count >= Config.Slots.Max then
			return false, "All slots are unlocked! 🏆"
		end
		local cost = Config.Slots.Costs[count + 1]
		if not cost then
			return false, "No price set for this slot"
		end
		if not Game.Data.spendCash(player, cost) then
			return false, "Not enough cash! You need " .. Format.cash(cost)
		end
		data.SlotCount = count + 1
		Game.Data.sync(player)
		Game.Plot.refresh(player)
		Game.Player.effect(player, "Upgrade")
		return true, "🏠 Slot " .. data.SlotCount .. " unlocked!"
	elseif action == "Rebirth" then
		local rebirths = data.Rebirths or 0
		if rebirths >= Config.Rebirth.Max then
			return false, "Max rebirth reached! 🏆"
		end
		if Game.Carry.isCarrying(player) then
			return false, "Bring your keyboard home before you rebirth!"
		end
		local cost = Config.rebirthCost(rebirths)
		if data.Cash < cost then
			return false, "You need " .. Format.cash(cost) .. " to rebirth"
		end
		-- on garde les claviers et les emplacements ; on remet à zéro le reste
		data.Cash = 0
		data.Speed = 0
		data.SwitchTier = 1
		data.Rebirths = rebirths + 1
		Game.Data.sync(player)
		Game.Bonus.sync(player)
		Game.Speed.applyWalkSpeed(player)
		Game.Plot.refreshLabels(player)
		Game.Player.effect(player, "TowerWin")
		Game.Player.notifyAll("🔁 " .. player.DisplayName .. " reached REBIRTH " .. data.Rebirths .. "!", "Rare")
		return true,
			string.format(
				"🔁 REBIRTH %d! Cash x%s, Speed x%s forever",
				data.Rebirths,
				tostring(1 + data.Rebirths * Config.Rebirth.CashBonus),
				tostring(1 + data.Rebirths * Config.Rebirth.SpeedBonus)
			)
	end
	return false, "Unknown action"
end

local function findProduct(productId: number)
	for _, product in Config.Products do
		if product.Id ~= 0 and product.Id == productId then
			return product
		end
	end
	return nil
end

local function processReceipt(receipt)
	local player = Players:GetPlayerByUserId(receipt.PlayerId)
	local profile = player and Game.Data.get(player)
	if not player or not profile then
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end
	local receipts = profile.Data.Receipts
	if table.find(receipts, receipt.PurchaseId) then
		return Enum.ProductPurchaseDecision.PurchaseGranted -- déjà donné
	end
	local product = findProduct(receipt.ProductId)
	if not product then
		warn("[Shop] Produit inconnu :", receipt.ProductId)
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end
	if product.Kind == "Speed" then
		Game.Data.addSpeed(player, product.Amount)
		Game.Speed.applyWalkSpeed(player)
	elseif product.Kind == "Cash" then
		Game.Data.addCash(player, product.Amount)
	end
	table.insert(receipts, receipt.PurchaseId)
	while #receipts > 50 do
		table.remove(receipts, 1)
	end
	task.spawn(Game.Data.save, player, false)
	Game.Player.notify(player, "💎 Thanks for your purchase! " .. product.Label, "Success")
	Game.Player.effect(player, "Upgrade")
	return Enum.ProductPurchaseDecision.PurchaseGranted
end

function ShopService.init(registry)
	Game = registry
	Remotes.Shop.OnServerInvoke = function(player, action)
		if type(action) ~= "string" then
			return false, "Invalid"
		end
		return handle(player, action)
	end
	MarketplaceService.ProcessReceipt = processReceipt
end

return ShopService
