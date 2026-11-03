-- KeyboardBuilder.luau
-- Construit le modèle 3D d'un clavier à collectionner (case + touches + RGB + étiquette).
-- Le module ne fait aucun require : on lui passe les constructeurs Roblox dans `env`
-- (Instance, Vector3, CFrame, Color3, Enum, UDim2, Font, ColorSequence, ColorSequenceKeypoint).

local KeyboardBuilder = {}

-- Chaque rangée = largeurs de touches en "unités". Un nombre négatif = espace vide.
local LAYOUTS = {
	Full = {
		{ 1, 1, 1, 1, 1, 1, 1, 1 },
		{ 1.5, 1, 1, 1, 1, 1, 1.5 },
		{ 1.75, 1, 1, 1, 1, 2.25 },
		{ 1.25, 1.25, 3, 1.25, 1.25 },
	},
	TKL = {
		{ 1, 1, 1, 1, 1, 1, 1, 1, -0.35, 1, 1 },
		{ 1.5, 1, 1, 1, 1, 1, 1.5, -0.35, 1, 1 },
		{ 1.75, 1, 1, 1, 1, 2.25, -2.35 },
		{ 1.25, 1.25, 3, 1.25, 1.25, -0.35, 1, 1 },
	},
	Sixty = {
		{ 1, 1, 1, 1, 1, 1, 1 },
		{ 1.5, 1, 1, 1, 1, 1.5 },
		{ 1.75, 1, 1, 1, 2.25 },
		{ 1.25, 4.5, 1.25 },
	},
	Forty = {
		{ 1, 1, 1, 1, 1, 1 },
		{ 1.25, 1, 1, 1, 1.75 },
		{ 1.5, 3, 1.5 },
	},
	Numpad = {
		{ 1, 1, 1, 1 },
		{ 1, 1, 1, 1 },
		{ 1, 1, 1, 1 },
		{ 2, 1, 1 },
	},
	Deck = {
		{ 1.4, 1.4, 1.4, 1.4 },
		{ 1.4, 1.4, 1.4, 1.4 },
		{ 1.4, 1.4, 1.4, 1.4 },
	},
	Laptop = {
		{ 1, 1, 1, 1, 1, 1, 1, 1 },
		{ 1, 1, 1, 1, 1, 1, 1, 1 },
		{ 1.5, 5, 1.5 },
	},
	Split = { -- une moitié ; le constructeur la duplique
		{ 1, 1, 1, 1 },
		{ 1.5, 1, 1.5 },
		{ 1, 2, 1 },
	},
	Typewriter = {
		{ 1, 1, 1, 1, 1, 1, 1 },
		{ 1, 1, 1, 1, 1, 1 },
		{ 1, 1, 1, 1, 1 },
		{ 5 },
	},
}

local function rowWidth(row)
	local width = 0
	for _, w in row do
		width += math.abs(w)
	end
	return width
end

local function layoutSize(rows)
	local width = 0
	for _, row in rows do
		width = math.max(width, rowWidth(row))
	end
	return width, #rows
end

local function rgb(Color3, c)
	return Color3.fromRGB(c[1], c[2], c[3])
end

--[[
	opts = {
		Item = définition (Items.List),
		Rarity = définition de rareté, RarityName = "Epic",
		Mutation = définition de mutation,
		IncomeText = "$12/s",
		BaseCFrame = CFrame du dessous du clavier (centre),
		NoLabel = true pour ne pas créer l'étiquette,
	}
]]
function KeyboardBuilder.build(env, opts)
	local Instance, Vector3, CFrame, Color3, Enum, UDim2, Font =
		env.Instance, env.Vector3, env.CFrame, env.Color3, env.Enum, env.UDim2, env.Font

	local item = opts.Item
	local rarity = opts.Rarity
	local mutation = opts.Mutation
	local base = opts.BaseCFrame or CFrame.new()

	local layoutName = item.Layout or "Full"
	local rows = LAYOUTS[layoutName] or LAYOUTS.Full
	local scale = (rarity and rarity.Scale or 1) * (item.Scale or 1)
	local u = 0.68 * scale -- taille d'une unité de touche
	local caseH = 0.5 * u
	local keyH = 0.36 * u
	local gapK = 0.12 * u
	local margin = 0.22 * u

	local caseColor = rgb(Color3, item.Case)
	local keyColor = rgb(Color3, item.Keys)
	local accent = rgb(Color3, item.Accent)
	local caseMaterial = Enum.Material.SmoothPlastic
	local keyMaterial = Enum.Material.SmoothPlastic
	local keyTransparency = 0

	local mutationName = mutation and mutation.Name or "None"
	if mutationName == "Gold" then
		caseColor = Color3.fromRGB(225, 165, 30)
		keyColor = Color3.fromRGB(255, 215, 90)
		caseMaterial = Enum.Material.Metal
	elseif mutationName == "Diamond" then
		caseColor = Color3.fromRGB(190, 245, 255)
		keyColor = Color3.fromRGB(140, 235, 255)
		keyMaterial = Enum.Material.Glass
		caseMaterial = Enum.Material.Glass
		keyTransparency = 0.15
	end

	local model = Instance.new("Model")
	model.Name = "Keyboard"
	model:SetAttribute("ItemId", item.Id)
	model:SetAttribute("Mutation", mutationName)

	local function part(name, size, cf, color, material)
		local p = Instance.new("Part")
		p.Name = name
		p.Size = size
		p.CFrame = cf
		p.Color = color
		p.Material = material or Enum.Material.SmoothPlastic
		p.Anchored = true
		p.CanCollide = false
		p.CanTouch = false
		p.CanQuery = false
		p.Massless = true
		p.CastShadow = false
		p.TopSurface = Enum.SurfaceType.Smooth
		p.BottomSurface = Enum.SurfaceType.Smooth
		p.Parent = model
		return p
	end

	-- Construit un bloc de touches (une "moitié" pour le split) centré sur `center`
	local function buildBlock(center, blockRows)
		local widthU, depthU = layoutSize(blockRows)
		local w = widthU * u + margin * 2
		local d = depthU * u + margin * 2
		local case = part("Case", Vector3.new(w, caseH, d), center * CFrame.new(0, caseH / 2, 0), caseColor, caseMaterial)
		local round = layoutName == "Typewriter"
		for r, row in blockRows do
			local z = -d / 2 + margin + (r - 0.5) * u
			local x = -w / 2 + margin + (widthU - rowWidth(row)) * u / 2
			if round then
				x += (r - 1) * u * 0.25 -- décalage typique des machines à écrire
			end
			for _, wu in row do
				local width = math.abs(wu) * u
				if wu > 0 then
					local keyCf = center * CFrame.new(x + width / 2, caseH + keyH / 2, z)
					local key
					if round and wu <= 1 then
						key = part("K", Vector3.new(keyH, width - gapK, width - gapK), keyCf * CFrame.Angles(0, 0, math.rad(90)), keyColor, keyMaterial)
						key.Shape = Enum.PartType.Cylinder
					else
						key = part("K", Vector3.new(width - gapK, keyH, u - gapK), keyCf, keyColor, keyMaterial)
					end
					key.Transparency = keyTransparency
				end
				x += width
			end
		end
		return case, w, d
	end

	-- Le "devant" du clavier (barre d'espace) est du côté +Z, le "fond" du côté -Z.
	local primary, totalW, totalD
	if layoutName == "Split" then
		local half = LAYOUTS.Split
		local widthU = layoutSize(half)
		local halfW = widthU * u + margin * 2
		local offset = halfW / 2 + u * 0.35
		local _, _, d = buildBlock(base * CFrame.new(-offset, 0, 0) * CFrame.Angles(0, math.rad(9), 0), half)
		buildBlock(base * CFrame.new(offset, 0, 0) * CFrame.Angles(0, math.rad(-9), 0), half)
		totalW, totalD = offset * 2 + halfW, d
		-- petit point d'ancrage invisible entre les deux moitiés
		primary = part("Root", Vector3.new(0.2, 0.2, 0.2), base * CFrame.new(0, caseH / 2, 0), caseColor, caseMaterial)
		primary.Transparency = 1
	else
		primary, totalW, totalD = buildBlock(base, rows)
	end

	-- Détails spéciaux
	if layoutName == "Typewriter" then
		local roller = part("Roller", Vector3.new(totalW * 0.9, u * 0.7, u * 0.7), base * CFrame.new(0, caseH + u * 0.55, -totalD / 2 - u * 0.1), Color3.fromRGB(30, 30, 30))
		roller.Shape = Enum.PartType.Cylinder
		part("Paper", Vector3.new(totalW * 0.55, u * 2.2, 0.05), base * CFrame.new(0, caseH + u * 1.6, -totalD / 2 - u * 0.2) * CFrame.Angles(math.rad(-12), 0, 0), Color3.fromRGB(250, 250, 245))
	elseif layoutName == "Laptop" then
		part("Screen", Vector3.new(totalW, u * 3, u * 0.12), base * CFrame.new(0, caseH + u * 1.45, -totalD / 2 - u * 0.35) * CFrame.Angles(math.rad(-15), 0, 0), caseColor, caseMaterial)
		local display = part("Display", Vector3.new(totalW * 0.9, u * 2.6, 0.04), base * CFrame.new(0, caseH + u * 1.45, -totalD / 2 - u * 0.27) * CFrame.Angles(math.rad(-15), 0, 0), accent, Enum.Material.Neon)
		display.Transparency = 0.1
	end

	-- Underglow RGB
	if item.Glow or (rarity and rarity.Rank >= 4) or mutationName ~= "None" then
		local glow = part("Glow", Vector3.new(totalW + 0.16 * scale, 0.1, totalD + 0.16 * scale), base * CFrame.new(0, 0.05, 0), accent, Enum.Material.Neon)
		glow:AddTag("ItemGlow")
		if item.Rgb then
			glow:SetAttribute("Rgb", true)
		end
	end
	if mutationName == "Rainbow" then
		model:AddTag("RainbowItem")
	end

	model.PrimaryPart = primary
	model:SetAttribute("Height", caseH + keyH)
	model:SetAttribute("Width", totalW)

	-- Étiquette flottante : mutation, nom, rareté, revenu
	if not opts.NoLabel then
		local gui = Instance.new("BillboardGui")
		gui.Name = "Info"
		gui.Size = UDim2.new(8, 0, 3.2, 0)
		gui.StudsOffset = Vector3.new(0, 2.2 + scale * 0.8, 0)
		gui.MaxDistance = 75
		gui.LightInfluence = 0
		gui.Parent = primary

		local list = Instance.new("UIListLayout")
		list.FillDirection = Enum.FillDirection.Vertical
		list.HorizontalAlignment = Enum.HorizontalAlignment.Center
		list.VerticalAlignment = Enum.VerticalAlignment.Bottom
		list.SortOrder = Enum.SortOrder.LayoutOrder
		list.Parent = gui

		local function line(name, text, color, heightScale, order)
			local label = Instance.new("TextLabel")
			label.Name = name
			label.Size = UDim2.new(1, 0, heightScale, 0)
			label.BackgroundTransparency = 1
			label.Text = text
			label.TextColor3 = color
			label.TextScaled = true
			label.FontFace = Font.fromEnum(Enum.Font.FredokaOne)
			label.TextStrokeTransparency = 0.15
			label.TextStrokeColor3 = Color3.fromRGB(20, 20, 30)
			label.LayoutOrder = order
			label.Parent = gui
			return label
		end

		if mutationName ~= "None" and mutation.Color then
			line("Mutation", string.upper(mutationName), rgb(Color3, mutation.Color), 0.22, 1)
		end
		line("ItemName", item.Name, Color3.fromRGB(255, 255, 255), 0.3, 2)
		local rarityLabel = line("Rarity", opts.RarityName or item.Rarity, rarity and rgb(Color3, rarity.Color) or Color3.new(1, 1, 1), 0.24, 3)
		if rarity and rarity.Gradient and env.ColorSequence then
			local gradient = Instance.new("UIGradient")
			gradient.Color = env.ColorSequence.new({
				env.ColorSequenceKeypoint.new(0, Color3.fromRGB(255, 80, 80)),
				env.ColorSequenceKeypoint.new(0.33, Color3.fromRGB(255, 230, 80)),
				env.ColorSequenceKeypoint.new(0.66, Color3.fromRGB(80, 220, 255)),
				env.ColorSequenceKeypoint.new(1, Color3.fromRGB(220, 90, 255)),
			})
			gradient.Parent = rarityLabel
		end
		line("Income", opts.IncomeText or "", Color3.fromRGB(110, 255, 140), 0.24, 4)
	end

	return model
end

-- Liste des dispositions (pour vérifier la config)
KeyboardBuilder.Layouts = LAYOUTS

return KeyboardBuilder
