-- ItemModels.luau
-- Fabrique les modèles 3D des claviers et leurs invites "Maintenir E".

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Items = require(Shared:WaitForChild("Items"))
local Format = require(Shared:WaitForChild("Format"))
local KeyboardBuilder = require(Shared:WaitForChild("KeyboardBuilder"))

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

local ItemModels = {}

-- "Gold Gamer TKL"
function ItemModels.describe(record): string
	local item = Items.get(record.Id)
	local name = item and item.Name or "Keyboard"
	if record.Mutation and record.Mutation ~= "None" then
		return record.Mutation .. " " .. name
	end
	return name
end

-- record = { Id = "gamer_tkl", Mutation = "Gold" }
-- incomeMultiplier (optionnel) : bonus du propriétaire, pour afficher le vrai "$/s"
function ItemModels.build(record, baseCFrame: CFrame, incomeMultiplier: number?)
	local item = Items.get(record.Id)
	if not item then
		warn("[Items] Clavier inconnu :", record.Id)
		return nil
	end
	local model = KeyboardBuilder.build(ENV, {
		Item = item,
		Rarity = Items.Rarities[item.Rarity],
		RarityName = item.Rarity,
		Mutation = Items.getMutation(record.Mutation),
		IncomeText = Format.cash(Items.incomeOf(record) * (incomeMultiplier or 1)) .. "/s",
		BaseCFrame = baseCFrame,
	})
	model:SetAttribute("Rarity", item.Rarity)
	return model
end

-- Ajoute une invite (ProximityPrompt). kind = "Grab", "Steal" ou "Sell".
-- Le client masque les invites qui ne le concernent pas ; le serveur revérifie tout.
function ItemModels.addPrompt(model: Model, kind: string, actionText: string, objectText: string, holdDuration: number)
	local prompt = Instance.new("ProximityPrompt")
	prompt.Name = kind .. "Prompt"
	prompt.ActionText = actionText
	prompt.ObjectText = objectText
	prompt.HoldDuration = holdDuration
	prompt.MaxActivationDistance = Config.Steal.PromptDistance
	prompt.RequiresLineOfSight = false
	prompt.KeyboardKeyCode = Enum.KeyCode.E
	prompt:SetAttribute("PromptKind", kind)
	prompt:AddTag("ItemPrompt")
	prompt.Parent = model.PrimaryPart
	return prompt
end

return ItemModels
