-- tools/check.luau
-- Vérifications automatiques (sans Roblox) : syntaxe de tous les scripts,
-- cohérence de la config, construction de chaque clavier.
-- Utilisation (depuis le dossier steal-a-keyboard) : lune run tools/check.luau

local fs = require("@lune/fs")
local luau = require("@lune/luau")
local process = require("@lune/process")
local roblox = require("@lune/roblox")

local Config = require("../src/shared/Config")
local Items = require("../src/shared/Items")
local SoundConfig = require("../src/shared/SoundConfig")
local Themes = require("../src/shared/Themes")
local Format = require("../src/shared/Format")
local KeyboardBuilder = require("../src/shared/KeyboardBuilder")

local failures = 0
local checks = 0
local function check(condition, message)
	checks += 1
	if not condition then
		failures += 1
		print("❌ " .. message)
	end
end

-- 1. Syntaxe de chaque fichier .luau
local function walk(dir)
	for _, name in fs.readDir(dir) do
		local path = dir .. "/" .. name
		if fs.isDir(path) then
			walk(path)
		elseif string.sub(name, -5) == ".luau" then
			local ok, err = pcall(luau.compile, fs.readFile(path))
			check(ok, "Erreur de syntaxe dans " .. path .. " : " .. tostring(err))
		end
	end
end
walk("src")
walk("tools")

-- 2. Config
local previousCost = -1
for i, switch in Config.Switches do
	check(switch.Cost > previousCost, "Switch " .. i .. " doit coûter plus cher que le précédent")
	check(switch.Gain > 0, "Switch " .. i .. " doit avoir un Gain > 0")
	previousCost = switch.Cost
end
for n = Config.Slots.Start + 1, Config.Slots.Max do
	check(Config.Slots.Costs[n] ~= nil, "Prix manquant pour l'emplacement " .. n)
end
check(Config.Slots.Max <= 12, "La map ne contient que 12 emplacements par base")
local previousRequired = -1
for i, zone in Config.Zones do
	check(zone.Required > previousRequired, "Zone " .. i .. " doit demander plus de Speed que la précédente")
	previousRequired = zone.Required
	check(#Items.forZone(i) > 0, "La zone " .. i .. " n'a aucun clavier")
end
check(Config.walkSpeedFor(0) == Config.Speed.BaseWalkSpeed, "walkSpeedFor(0) doit valoir la vitesse de base")
check(Config.walkSpeedFor(1e12) <= Config.Speed.MaxWalkSpeed, "walkSpeedFor doit être plafonné")
check(Config.walkSpeedFor(1000) > Config.walkSpeedFor(100), "walkSpeedFor doit augmenter")
check(Config.allowedZone(0) == 1, "allowedZone(0) doit être 1")
check(Config.allowedZone(1e12) == #Config.Zones, "allowedZone(énorme) doit être la dernière zone")

-- 3. Items
local ids = {}
for _, item in Items.List do
	check(not ids[item.Id], "Id de clavier en double : " .. item.Id)
	ids[item.Id] = true
	check(Config.Zones[item.Zone] ~= nil, item.Id .. " : zone inexistante")
	check(Items.Rarities[item.Rarity] ~= nil, item.Id .. " : rareté inconnue " .. tostring(item.Rarity))
	check(KeyboardBuilder.Layouts[item.Layout] ~= nil, item.Id .. " : layout inconnu " .. tostring(item.Layout))
	check(item.Income > 0 and item.Weight > 0, item.Id .. " : Income et Weight doivent être > 0")
end
local totalChance = 0
for i = 2, #Items.Mutations do
	totalChance += Items.Mutations[i].Chance
end
check(totalChance < 1, "Les chances de mutation dépassent 100 %")

-- tirages
local seed = 1
local function rng()
	seed = (seed * 16807) % 2147483647
	return seed / 2147483647
end
local counts = {}
for _ = 1, 20000 do
	local item = Items.rollForZone(2, rng)
	counts[item.Id] = (counts[item.Id] or 0) + 1
end
check((counts.gamer_tkl or 0) > (counts.gamer_deck or 0), "Le tirage pondéré ne respecte pas les poids")
local mutationCounts = {}
for _ = 1, 20000 do
	local m = Items.rollMutation(rng)
	mutationCounts[m] = (mutationCounts[m] or 0) + 1
end
check((mutationCounts.None or 0) > 16000, "Trop de mutations")
check((mutationCounts.Gold or 0) > (mutationCounts.Diamond or 0), "Gold doit être plus fréquent que Diamond")
check(Items.incomeOf({ Id = "office_basic", Mutation = "Gold" }) == 2, "incomeOf avec mutation Gold")

-- 4. Sons
check(SoundConfig.Profiles[SoundConfig.DefaultProfile] ~= nil, "Profil de son par défaut inconnu")
for _, name in SoundConfig.ProfileOrder do
	check(SoundConfig.Profiles[name] ~= nil, "Profil de son inconnu : " .. name)
end
for _, effect in { "Collect", "Grab", "Steal", "Deposit", "Slap", "Lock", "Notify", "Rare", "Error", "Upgrade" } do
	check(SoundConfig.Effects[effect] ~= nil, "Effet sonore manquant : " .. effect)
end

-- 5. Thèmes
check(Themes.findKeycaps(Themes.DefaultKeycaps).Name == Themes.DefaultKeycaps, "Thème de keycaps par défaut inconnu")
check(#Themes.PlotAccents >= Config.Base.PlotCount, "Pas assez de couleurs de base")

-- 6. Format
check(Format.short(0) == "0", "Format.short(0)")
check(Format.short(999) == "999", "Format.short(999) = " .. Format.short(999))
check(Format.short(1000) == "1K", "Format.short(1000) = " .. Format.short(1000))
check(Format.short(1234) == "1.23K", "Format.short(1234) = " .. Format.short(1234))
check(Format.short(2500000) == "2.5M", "Format.short(2500000) = " .. Format.short(2500000))
check(Format.short(15000) == "15K", "Format.short(15000) = " .. Format.short(15000))
check(Format.cash(150) == "$150", "Format.cash(150)")
check(Format.commas(1234567) == "1,234,567", "Format.commas = " .. Format.commas(1234567))
check(Format.time(75) == "1:15", "Format.time(75)")

-- 7. Construction de chaque clavier (toutes mutations)
local env = {
	Instance = roblox.Instance,
	Vector3 = roblox.Vector3,
	CFrame = roblox.CFrame,
	Color3 = roblox.Color3,
	Enum = roblox.Enum,
	UDim2 = roblox.UDim2,
	Font = roblox.Font,
	ColorSequence = roblox.ColorSequence,
	ColorSequenceKeypoint = roblox.ColorSequenceKeypoint,
}
local maxParts = 0
for _, item in Items.List do
	for _, mutation in Items.Mutations do
		local ok, result = pcall(KeyboardBuilder.build, env, {
			Item = item,
			Rarity = Items.Rarities[item.Rarity],
			RarityName = item.Rarity,
			Mutation = mutation,
			IncomeText = "$1/s",
			BaseCFrame = roblox.CFrame.new(0, 5, 0),
		})
		check(ok, "Construction de " .. item.Id .. " (" .. mutation.Name .. ") : " .. tostring(result))
		if ok then
			check(result.PrimaryPart ~= nil, item.Id .. " : pas de PrimaryPart")
			local parts = 0
			for _, d in result:GetDescendants() do
				if d:IsA("BasePart") then
					parts += 1
				end
			end
			maxParts = math.max(maxParts, parts)
		end
	end
end

print(string.format("%d vérifications, %d échec(s). Clavier le plus lourd : %d pièces.", checks, failures, maxParts))
if failures > 0 then
	process.exit(1)
end
