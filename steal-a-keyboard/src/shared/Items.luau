-- Items.luau
-- ⌨️ Les claviers à collectionner (et à voler !).
--
-- Pour ajouter un clavier : copie une ligne, change Id (unique), Name, Zone,
-- Rarity, Income (argent par seconde) et Weight (chance d'apparition : plus
-- c'est grand, plus il est fréquent dans sa zone).
-- Layout : Full, TKL, Sixty, Forty, Numpad, Split, Typewriter, Deck, Laptop
-- Les couleurs sont {R, G, B} de 0 à 255.

local Items = {}

-- Raretés : Rank sert au tri, Scale à la taille du clavier affiché
Items.Rarities = {
	Common = { Rank = 1, Color = { 200, 200, 205 }, Scale = 1.0 },
	Uncommon = { Rank = 2, Color = { 90, 220, 110 }, Scale = 1.05 },
	Rare = { Rank = 3, Color = { 70, 160, 255 }, Scale = 1.1 },
	Epic = { Rank = 4, Color = { 185, 90, 255 }, Scale = 1.18 },
	Legendary = { Rank = 5, Color = { 255, 190, 40 }, Scale = 1.26 },
	Mythic = { Rank = 6, Color = { 255, 70, 90 }, Scale = 1.36 },
	Secret = { Rank = 7, Color = { 255, 255, 255 }, Scale = 1.5, Gradient = true }, -- texte arc-en-ciel
}

-- Mutations : tirées au hasard quand un clavier apparaît
Items.Mutations = {
	{ Name = "None", Multiplier = 1, Chance = 0 }, -- le reste des chances
	{ Name = "Gold", Multiplier = 2, Chance = 0.08, Color = { 255, 200, 40 } },
	{ Name = "Diamond", Multiplier = 3, Chance = 0.03, Color = { 130, 235, 255 } },
	{ Name = "Rainbow", Multiplier = 5, Chance = 0.01, Color = { 255, 120, 220 } },
}

Items.List = {
	-- 🏢 Zone 1 : Office
	{
		Id = "office_basic",
		Name = "Office Keyboard",
		Zone = 1,
		Rarity = "Common",
		Income = 1,
		Weight = 50,
		Layout = "Full",
		Case = { 205, 205, 210 },
		Keys = { 245, 245, 245 },
		Accent = { 120, 190, 255 },
	},
	{
		Id = "office_laptop",
		Name = "Laptop Keys",
		Zone = 1,
		Rarity = "Common",
		Income = 2,
		Weight = 30,
		Layout = "Laptop",
		Case = { 160, 165, 175 },
		Keys = { 40, 42, 48 },
		Accent = { 200, 220, 255 },
	},
	{
		Id = "office_numpad",
		Name = "Numpad",
		Zone = 1,
		Rarity = "Uncommon",
		Income = 4,
		Weight = 15,
		Layout = "Numpad",
		Case = { 230, 230, 235 },
		Keys = { 255, 255, 255 },
		Accent = { 90, 175, 255 },
	},
	{
		Id = "office_ergo",
		Name = "Ergo Split",
		Zone = 1,
		Rarity = "Rare",
		Income = 9,
		Weight = 5,
		Layout = "Split",
		Case = { 60, 65, 80 },
		Keys = { 235, 238, 245 },
		Accent = { 90, 175, 255 },
	},

	-- 🎮 Zone 2 : Gamer
	{
		Id = "gamer_tkl",
		Name = "Gamer TKL",
		Zone = 2,
		Rarity = "Uncommon",
		Income = 8,
		Weight = 45,
		Layout = "TKL",
		Case = { 25, 25, 30 },
		Keys = { 40, 40, 48 },
		Accent = { 255, 60, 200 },
		Glow = true,
	},
	{
		Id = "gamer_rgb60",
		Name = "RGB 60%",
		Zone = 2,
		Rarity = "Rare",
		Income = 14,
		Weight = 30,
		Layout = "Sixty",
		Case = { 15, 15, 20 },
		Keys = { 245, 245, 250 },
		Accent = { 0, 255, 200 },
		Glow = true,
		Rgb = true,
	},
	{
		Id = "gamer_pro",
		Name = "Pro Esports Board",
		Zone = 2,
		Rarity = "Epic",
		Income = 25,
		Weight = 18,
		Layout = "Forty",
		Case = { 230, 30, 60 },
		Keys = { 25, 25, 30 },
		Accent = { 255, 255, 255 },
		Glow = true,
	},
	{
		Id = "gamer_deck",
		Name = "Streamer Deck",
		Zone = 2,
		Rarity = "Legendary",
		Income = 45,
		Weight = 7,
		Layout = "Deck",
		Case = { 20, 20, 24 },
		Keys = { 60, 60, 70 },
		Accent = { 140, 80, 255 },
		Glow = true,
		Rgb = true,
	},

	-- 📜 Zone 3 : Retro
	{
		Id = "retro_typewriter",
		Name = "Typewriter",
		Zone = 3,
		Rarity = "Rare",
		Income = 40,
		Weight = 45,
		Layout = "Typewriter",
		Case = { 40, 40, 40 },
		Keys = { 235, 225, 200 },
		Accent = { 200, 160, 90 },
	},
	{
		Id = "retro_buckling",
		Name = "Buckling Beast",
		Zone = 3,
		Rarity = "Epic",
		Income = 65,
		Weight = 30,
		Layout = "Full",
		Case = { 210, 200, 175 },
		Keys = { 120, 120, 125 },
		Accent = { 255, 150, 60 },
	},
	{
		Id = "retro_terminal",
		Name = "Retro Terminal",
		Zone = 3,
		Rarity = "Epic",
		Income = 100,
		Weight = 18,
		Layout = "TKL",
		Case = { 180, 160, 120 },
		Keys = { 90, 70, 50 },
		Accent = { 90, 255, 120 },
		Glow = true,
	},
	{
		Id = "retro_golden",
		Name = "Golden Typewriter",
		Zone = 3,
		Rarity = "Legendary",
		Income = 180,
		Weight = 7,
		Layout = "Typewriter",
		Case = { 230, 175, 40 },
		Keys = { 255, 245, 220 },
		Accent = { 255, 200, 60 },
		Glow = true,
	},

	-- 🍬 Zone 4 : Candy
	{
		Id = "candy_bubblegum",
		Name = "Bubblegum 65%",
		Zone = 4,
		Rarity = "Epic",
		Income = 200,
		Weight = 45,
		Layout = "Sixty",
		Case = { 255, 150, 200 },
		Keys = { 255, 230, 240 },
		Accent = { 255, 105, 180 },
		Glow = true,
	},
	{
		Id = "candy_marshmallow",
		Name = "Marshmallow Keys",
		Zone = 4,
		Rarity = "Epic",
		Income = 320,
		Weight = 30,
		Layout = "Forty",
		Case = { 255, 255, 255 },
		Keys = { 255, 210, 230 },
		Accent = { 160, 220, 255 },
		Glow = true,
	},
	{
		Id = "candy_jelly",
		Name = "Jelly Board",
		Zone = 4,
		Rarity = "Legendary",
		Income = 520,
		Weight = 18,
		Layout = "TKL",
		Case = { 120, 230, 190 },
		Keys = { 255, 160, 210 },
		Accent = { 255, 255, 120 },
		Glow = true,
		Rgb = true,
	},
	{
		Id = "candy_cotton",
		Name = "Cotton Candy Split",
		Zone = 4,
		Rarity = "Mythic",
		Income = 900,
		Weight = 7,
		Layout = "Split",
		Case = { 170, 210, 255 },
		Keys = { 255, 190, 225 },
		Accent = { 255, 120, 220 },
		Glow = true,
		Rgb = true,
	},

	-- 🌃 Zone 5 : Neon
	{
		Id = "neon_cyber",
		Name = "Cyber Deck",
		Zone = 5,
		Rarity = "Legendary",
		Income = 1000,
		Weight = 45,
		Layout = "Deck",
		Case = { 10, 15, 35 },
		Keys = { 20, 40, 80 },
		Accent = { 0, 255, 230 },
		Glow = true,
	},
	{
		Id = "neon_hologram",
		Name = "Hologram Keys",
		Zone = 5,
		Rarity = "Legendary",
		Income = 1600,
		Weight = 30,
		Layout = "Sixty",
		Case = { 15, 20, 40 },
		Keys = { 120, 240, 255 },
		Accent = { 0, 200, 255 },
		Glow = true,
		Rgb = true,
	},
	{
		Id = "neon_phantom",
		Name = "Neon Phantom",
		Zone = 5,
		Rarity = "Mythic",
		Income = 2600,
		Weight = 18,
		Layout = "Full",
		Case = { 5, 5, 10 },
		Keys = { 15, 15, 25 },
		Accent = { 255, 0, 120 },
		Glow = true,
		Rgb = true,
	},
	{
		Id = "neon_glitch",
		Name = "Glitch Board",
		Zone = 5,
		Rarity = "Mythic",
		Income = 4500,
		Weight = 7,
		Layout = "Forty",
		Case = { 255, 0, 90 },
		Keys = { 0, 255, 200 },
		Accent = { 255, 255, 255 },
		Glow = true,
		Rgb = true,
	},

	-- 🌌 Zone 6 : Galaxy
	{
		Id = "galaxy_nebula",
		Name = "Nebula 75%",
		Zone = 6,
		Rarity = "Mythic",
		Income = 5000,
		Weight = 45,
		Layout = "TKL",
		Case = { 40, 15, 80 },
		Keys = { 150, 110, 255 },
		Accent = { 200, 90, 255 },
		Glow = true,
		Rgb = true,
	},
	{
		Id = "galaxy_comet",
		Name = "Comet Keys",
		Zone = 6,
		Rarity = "Mythic",
		Income = 8000,
		Weight = 30,
		Layout = "Sixty",
		Case = { 230, 235, 255 },
		Keys = { 90, 160, 255 },
		Accent = { 120, 220, 255 },
		Glow = true,
		Rgb = true,
	},
	{
		Id = "galaxy_blackhole",
		Name = "Black Hole Board",
		Zone = 6,
		Rarity = "Secret",
		Income = 14000,
		Weight = 18,
		Layout = "Full",
		Case = { 5, 5, 8 },
		Keys = { 20, 10, 35 },
		Accent = { 255, 140, 40 },
		Glow = true,
		Rgb = true,
	},
	{
		Id = "galaxy_infinity",
		Name = "Infinity Keyboard",
		Zone = 6,
		Rarity = "Secret",
		Income = 30000,
		Weight = 7,
		Layout = "Split",
		Case = { 255, 255, 255 },
		Keys = { 255, 215, 90 },
		Accent = { 255, 255, 255 },
		Glow = true,
		Rgb = true,
	},
}

-- Accès rapide par Id
Items.ById = {}
for _, item in Items.List do
	Items.ById[item.Id] = item
end

function Items.get(id: string)
	return Items.ById[id]
end

function Items.getMutation(name: string?)
	for _, mutation in Items.Mutations do
		if mutation.Name == name then
			return mutation
		end
	end
	return Items.Mutations[1]
end

-- Revenu par seconde d'un clavier possédé ({Id, Mutation})
function Items.incomeOf(record): number
	local item = Items.ById[record.Id]
	if not item then
		return 0
	end
	return item.Income * Items.getMutation(record.Mutation).Multiplier
end

-- Claviers d'une zone
function Items.forZone(zoneIndex: number)
	local result = {}
	for _, item in Items.List do
		if item.Zone == zoneIndex then
			table.insert(result, item)
		end
	end
	return result
end

-- Tirage pondéré d'un clavier d'une zone. rng = fonction qui renvoie un nombre entre 0 et 1.
function Items.rollForZone(zoneIndex: number, rng: () -> number)
	local pool = Items.forZone(zoneIndex)
	local total = 0
	for _, item in pool do
		total += item.Weight
	end
	local pick = rng() * total
	for _, item in pool do
		pick -= item.Weight
		if pick <= 0 then
			return item
		end
	end
	return pool[#pool]
end

-- Tirage d'une mutation
function Items.rollMutation(rng: () -> number): string
	local roll = rng()
	for i = #Items.Mutations, 2, -1 do
		local mutation = Items.Mutations[i]
		if roll < mutation.Chance then
			return mutation.Name
		end
		roll -= mutation.Chance
	end
	return "None"
end

return Items
