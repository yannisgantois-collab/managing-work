-- MapGenerator.luau
-- 🗺️ Construit toute la map en touches de clavier ASMR.
--
-- Utilisé de deux façons :
--   1. par l'outil `tools/build-map.luau` (Lune) qui crée build/Map.rbxm : la map
--      est donc visible et modifiable dans Roblox Studio ;
--   2. par le serveur, en secours, si le dossier Workspace.Map n'existe pas.
-- Le module ne fait aucun require : on lui passe les constructeurs Roblox (`env`),
-- la Config et les Themes.
--
-- Repères : Y = hauteur. Le dessus des plaques est à Y = 0 et le dessus des touches
-- (là où on marche) est à Y = 1.8 partout.

local MapGenerator = {}

MapGenerator.SURFACE = 1.8

function MapGenerator.build(env, Config, Themes)
	local Instance, Vector3, CFrame, Color3, Enum, UDim2, Font =
		env.Instance, env.Vector3, env.CFrame, env.Color3, env.Enum, env.UDim2, env.Font

	local stats = { Parts = 0, Keys = 0 }

	local function rgb(c)
		return Color3.fromRGB(c[1], c[2], c[3])
	end
	local function hue(h, s, v)
		return Color3.fromHSV(h % 1, s or 0.8, v or 1)
	end
	local function darker(c, f)
		return Color3.new(c.R * f, c.G * f, c.B * f)
	end
	local function short(n)
		if n >= 1e6 then
			return string.format("%gM", math.floor(n / 1e5) / 10)
		elseif n >= 1e3 then
			return string.format("%gK", math.floor(n / 1e2) / 10)
		end
		return tostring(n)
	end

	local KEY_H, KEY_LIFT = 1.2, 0.6
	local SURFACE = KEY_LIFT + KEY_H

	local WHITE_CAP = rgb(Themes.Keycaps[1].Cap)
	local WHITE_TOP = rgb(Themes.Keycaps[1].Top)
	local CASE = Color3.fromRGB(214, 217, 224)
	local DARK = Color3.fromRGB(36, 37, 46)
	local FONT = Font.fromEnum(Enum.Font.FredokaOne)

	--------------------------------------------------------------------
	-- Outils de base
	--------------------------------------------------------------------
	local function newPart(parent, name, size, cf, color, props)
		local p = Instance.new("Part")
		p.Name = name
		p.Anchored = true
		p.Size = size
		p.CFrame = cf
		p.Color = color
		p.Material = Enum.Material.SmoothPlastic
		p.TopSurface = Enum.SurfaceType.Smooth
		p.BottomSurface = Enum.SurfaceType.Smooth
		if props then
			for key, value in props do
				p[key] = value
			end
		end
		p.Parent = parent
		stats.Parts += 1
		return p
	end

	local function neon(parent, name, size, cf, color, props)
		local p = newPart(parent, name, size, cf, color, props)
		p.Material = Enum.Material.Neon
		p.CastShadow = false
		p.CanQuery = false
		p.CanTouch = false
		return p
	end

	-- Pièce invisible qui sert de repère (spawn, ancrage, limites)
	local function ghost(parent, name, size, cf)
		local p = newPart(parent, name, size, cf, Color3.new(1, 1, 1))
		p.Transparency = 1
		p.CanCollide = false
		p.CanQuery = false
		p.CanTouch = false
		p.CastShadow = false
		return p
	end

	local function folder(parent, name)
		local f = Instance.new("Folder")
		f.Name = name
		f.Parent = parent
		return f
	end

	-- Texte sur une face de pièce. lines = { {Text=, Color=, Height=, Name=} }
	local function surfaceText(part, face, lines, guiName, pixelsPerStud)
		local gui = Instance.new("SurfaceGui")
		gui.Name = guiName or "SignGui"
		gui.Face = face
		gui.SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud
		gui.PixelsPerStud = pixelsPerStud or 25
		gui.LightInfluence = 0
		gui.Parent = part
		local layout = Instance.new("UIListLayout")
		layout.FillDirection = Enum.FillDirection.Vertical
		layout.HorizontalAlignment = Enum.HorizontalAlignment.Center
		layout.VerticalAlignment = Enum.VerticalAlignment.Center
		layout.SortOrder = Enum.SortOrder.LayoutOrder
		layout.Parent = gui
		for i, line in lines do
			local label = Instance.new("TextLabel")
			label.Name = line.Name or ("Line" .. i)
			label.Size = UDim2.new(0.94, 0, line.Height or (0.9 / #lines), 0)
			label.BackgroundTransparency = 1
			label.Text = line.Text
			label.TextColor3 = line.Color or Color3.new(1, 1, 1)
			label.TextScaled = true
			label.FontFace = FONT
			label.TextStrokeTransparency = 0.35
			label.TextStrokeColor3 = Color3.fromRGB(15, 15, 25)
			label.LayoutOrder = i
			label.Parent = gui
		end
		return gui
	end

	--------------------------------------------------------------------
	-- ⌨️ UNE TOUCHE = Model "Key" { Glow (néon caché), Cap, Top }
	-- cf = centre de la case, posé sur le dessus de la plaque.
	--------------------------------------------------------------------
	local function makeKey(parent, cf, sx, sz, o)
		local h = o.height or KEY_H
		local lift = o.lift or KEY_LIFT
		local travel = o.travel or math.min(0.34, lift - 0.16)
		local gap = o.gap or math.clamp(math.min(sx, sz) * 0.1, 0.22, 0.6)
		local capW, capD = sx - gap, sz - gap
		local skirtH, topH = h * 0.66, h * 0.34
		local inset = math.min(capW, capD) * 0.08
		local accent = o.accent or Color3.new(1, 1, 1)

		local model = Instance.new("Model")
		model.Name = o.name or "Key"
		newPart(model, "Glow", Vector3.new(sx - 0.08, 0.1, sz - 0.08), cf * CFrame.new(0, 0.055, 0), accent, {
			Material = Enum.Material.Neon,
			Transparency = 1,
			CanCollide = false,
			CanQuery = false,
			CanTouch = false,
			CastShadow = false,
		})
		local cap = newPart(model, "Cap", Vector3.new(capW, skirtH, capD), cf * CFrame.new(0, lift + skirtH / 2, 0), o.cap or WHITE_CAP, {
			CanTouch = false,
		})
		local top = newPart(
			model,
			"Top",
			Vector3.new(capW - inset * 2, topH, capD - inset * 2),
			cf * CFrame.new(0, lift + skirtH + topH / 2, 0),
			o.top or WHITE_TOP,
			{ CanTouch = false, CastShadow = false }
		)
		model.PrimaryPart = cap
		model:SetAttribute("Accent", accent)
		model:SetAttribute("Travel", travel)
		model:SetAttribute("Area", o.area or "World")
		if o.themeable then
			model:SetAttribute("Themeable", true)
		end
		if o.training then
			model:SetAttribute("Training", true)
		end
		if o.action then
			model:SetAttribute("Action", o.action)
		end
		if o.attrs then
			for key, value in o.attrs do
				model:SetAttribute(key, value)
			end
		end
		model:AddTag("Key")
		if o.label then
			surfaceText(top, Enum.NormalId.Top, { { Text = o.label, Color = o.labelColor or Color3.fromRGB(40, 40, 50), Height = 0.8 } }, "Legend", 40)
			local legend = top:FindFirstChild("Legend")
			if legend then
				local label = legend:FindFirstChildOfClass("TextLabel")
				if label then
					label.TextStrokeTransparency = 1
				end
			end
		end
		model.Parent = parent
		stats.Keys += 1
		return model
	end

	-- Remplit un rectangle (centré sur cf, plaque au niveau de cf) avec des touches.
	-- optsFn(ix, iz, lx, lz) -> options ; skip(lx, lz, cx, cz, ix, iz) -> true pour laisser la case vide
	local function keyGrid(parent, cf, width, length, cell, optsFn, skip)
		local nx = math.max(1, math.floor(width / cell + 0.5))
		local nz = math.max(1, math.floor(length / cell + 0.5))
		local cx, cz = width / nx, length / nz
		local skipped = {}
		for ix = 0, nx - 1 do
			for iz = 0, nz - 1 do
				local lx = -width / 2 + cx * (ix + 0.5)
				local lz = -length / 2 + cz * (iz + 0.5)
				if skip and skip(lx, lz, cx, cz, ix, iz) then
					table.insert(skipped, { lx, lz, cx, cz })
				else
					makeKey(parent, cf * CFrame.new(lx, 0, lz), cx, cz, optsFn(ix, iz, lx, lz))
				end
			end
		end
		return skipped
	end

	-- Plaque (le "boîtier" du clavier) dont le dessus est au niveau de cf
	local function plate(parent, cf, width, length, color, thickness)
		thickness = thickness or 2
		return newPart(parent, "Plate", Vector3.new(width, thickness, length), cf * CFrame.new(0, -thickness / 2, 0), color)
	end

	-- Petit rebord lumineux entre deux points (au niveau des plaques)
	local function lip(parent, a, b, accent)
		local length = (b - a).Magnitude
		if length < 0.5 then
			return
		end
		local cf = CFrame.lookAt((a + b) / 2, b)
		local h = SURFACE + 0.6
		newPart(parent, "Border", Vector3.new(1, h, length), cf * CFrame.new(0, h / 2, 0), CASE)
		neon(parent, "BorderGlow", Vector3.new(1.06, 0.25, length), cf * CFrame.new(0, h + 0.12, 0), accent)
	end

	-- Rebord le long d'une ligne en laissant des ouvertures (gaps = { {debut, fin}, ... } en distance depuis a)
	local function lipWithGaps(parent, a, b, accent, gaps)
		local total = (b - a).Magnitude
		local dir = (b - a).Unit
		local cursor = 0
		table.sort(gaps, function(g1, g2)
			return g1[1] < g2[1]
		end)
		for _, g in gaps do
			if g[1] > cursor then
				lip(parent, a + dir * cursor, a + dir * g[1], accent)
			end
			cursor = math.max(cursor, g[2])
		end
		if cursor < total then
			lip(parent, a + dir * cursor, b, accent)
		end
	end

	local function arch(parent, center, width, height, faceTowardMinusZ, lines)
		local pillarH = height
		newPart(parent, "ArchPillar", Vector3.new(2, pillarH, 2), CFrame.new(center + Vector3.new(-width / 2, pillarH / 2, 0)), DARK)
		newPart(parent, "ArchPillar", Vector3.new(2, pillarH, 2), CFrame.new(center + Vector3.new(width / 2, pillarH / 2, 0)), DARK)
		local beam = newPart(parent, "ArchSign", Vector3.new(width + 2, 5, 1.6), CFrame.new(center + Vector3.new(0, pillarH + 2.5, 0)), DARK)
		surfaceText(beam, faceTowardMinusZ and Enum.NormalId.Front or Enum.NormalId.Back, lines, "SignGui", 20)
		return beam
	end

	local map = Instance.new("Folder")
	map.Name = "Map"

	--------------------------------------------------------------------
	-- 🟦 PLACE CENTRALE (spawn) + WASD géant
	--------------------------------------------------------------------
	do
		local plaza = folder(map, "Plaza")
		local cf = CFrame.new(0, 0, 0)
		plate(plaza, cf, 60, 60, CASE)
		local function overlaps(lx, lz, cx, cz, r)
			return lx + cx / 2 > r[1] and lx - cx / 2 < r[2] and lz + cz / 2 > r[3] and lz - cz / 2 < r[4]
		end
		local W = { -3.75, 3.75, -21.25, -13.75 }
		local ASD = { -11.25, 11.25, -13.75, -6.25 }
		local skipped = keyGrid(plaza, cf, 60, 60, 5, function(_, _, lx, lz)
			return { accent = hue(math.atan2(lz, lx) / (2 * math.pi)), area = "Plaza", themeable = true }
		end, function(lx, lz, cx, cz)
			return overlaps(lx, lz, cx, cz, W) or overlaps(lx, lz, cx, cz, ASD)
		end)
		for _, c in skipped do
			newPart(plaza, "Filler", Vector3.new(c[3], SURFACE, c[4]), cf * CFrame.new(c[1], SURFACE / 2, c[2]), CASE)
		end
		local giant = { { "W", 0, -17.5 }, { "A", -7.5, -10 }, { "S", 0, -10 }, { "D", 7.5, -10 } }
		for i, g in giant do
			makeKey(plaza, cf * CFrame.new(g[2], SURFACE, g[3]), 7.5, 7.5, {
				accent = hue(i / 4),
				area = "Plaza",
				themeable = true,
				label = g[1],
				height = 1.6,
				lift = 0.5,
				travel = 0.35,
				gap = 0.5,
			})
		end

		local spawn = Instance.new("SpawnLocation")
		spawn.Name = "SpawnLocation"
		spawn.Anchored = true
		spawn.Size = Vector3.new(6, 0.2, 6)
		spawn.CFrame = CFrame.new(0, SURFACE + 0.2, 12)
		spawn.Transparency = 1
		spawn.CanCollide = false
		spawn.CanQuery = false
		spawn.CanTouch = false
		spawn.Neutral = true
		spawn.Duration = 0
		spawn.Parent = plaza
		stats.Parts += 1

		-- rebords (ouvertures vers la rue et vers la tour)
		local accent = Color3.fromRGB(255, 255, 255)
		lipWithGaps(plaza, Vector3.new(-30.5, 0, 30.5), Vector3.new(30.5, 0, 30.5), accent, { { 15.5, 45.5 } })
		lipWithGaps(plaza, Vector3.new(-30.5, 0, -30.5), Vector3.new(30.5, 0, -30.5), accent, { { 45, 54 } })
		lip(plaza, Vector3.new(-30.5, 0, -30.5), Vector3.new(-30.5, 0, 30.5), accent)
		lip(plaza, Vector3.new(30.5, 0, -30.5), Vector3.new(30.5, 0, 30.5), accent)

		-- panneaux
		local title = newPart(plaza, "TitleBoard", Vector3.new(1, 15, 46), CFrame.new(-33, 11, 0), DARK)
		surfaceText(title, Enum.NormalId.Right, {
			{ Text = "STEAL A KEYBOARD", Color = Color3.fromRGB(255, 255, 255), Height = 0.42 },
			{ Text = "⌨️ ASMR  •  RGB  •  STEAL", Color = Color3.fromRGB(120, 220, 255), Height = 0.22 },
		}, "SignGui", 18)
		neon(plaza, "TitleGlow", Vector3.new(1.2, 0.5, 46.4), CFrame.new(-33, 18.6, 0), Color3.fromRGB(255, 80, 200))
		newPart(plaza, "TitlePole", Vector3.new(1, 4, 1), CFrame.new(-33, 1.5, 0), DARK)

		local howTo = newPart(plaza, "HowToBoard", Vector3.new(1, 15, 40), CFrame.new(33, 11, 0), DARK)
		surfaceText(howTo, Enum.NormalId.Left, {
			{ Text = "HOW TO PLAY", Color = Color3.fromRGB(255, 220, 80), Height = 0.18 },
			{ Text = "1. Walk on keys = ⚡ SPEED", Height = 0.13 },
			{ Text = "2. Grab keyboards in the ZONES", Height = 0.13 },
			{ Text = "3. Bring them to YOUR base", Height = 0.13 },
			{ Text = "4. Step on $ keys to collect", Height = 0.13 },
			{ Text = "5. Steal from others! 🥷", Height = 0.13 },
		}, "SignGui", 18)
		neon(plaza, "HowToGlow", Vector3.new(1.2, 0.5, 40.4), CFrame.new(33, 18.6, 0), Color3.fromRGB(80, 220, 255))
		newPart(plaza, "HowToPole", Vector3.new(1, 4, 1), CFrame.new(33, 1.5, 0), DARK)
	end

	--------------------------------------------------------------------
	-- 🛣️ RUE des bases (z 30 -> 300)
	--------------------------------------------------------------------
	local STREET_START, STREET_END = 30, 300
	local plotRanges = {}
	for row = 0, math.ceil(Config.Base.PlotCount / 2) - 1 do
		local zc = 70 + row * 56
		table.insert(plotRanges, { zc - 22, zc + 22 })
	end
	do
		local street = folder(map, "Street")
		local length = STREET_END - STREET_START
		local cf = CFrame.new(0, 0, (STREET_START + STREET_END) / 2)
		plate(street, cf, 30, length, CASE)
		keyGrid(street, cf, 30, length, 5, function(_, _, _, lz)
			return { accent = hue((lz / length + 0.5) * 0.85), area = "Street", themeable = true }
		end)
		local gaps = {}
		for _, r in plotRanges do
			table.insert(gaps, { r[1] - STREET_START, r[2] - STREET_START })
		end
		for _, side in { -1, 1 } do
			local copy = {}
			for i, g in gaps do
				copy[i] = { g[1], g[2] }
			end
			lipWithGaps(street, Vector3.new(side * 15.5, 0, STREET_START), Vector3.new(side * 15.5, 0, STREET_END), Color3.fromRGB(255, 255, 255), copy)
		end
		arch(street, Vector3.new(0, SURFACE, STREET_END - 2), 32, 18, true, {
			{ Text = "⚡ ZONES ⚡", Color = Color3.fromRGB(255, 230, 90), Height = 0.85 },
		})
	end

	--------------------------------------------------------------------
	-- 🏠 BASES (8) de chaque côté de la rue
	--------------------------------------------------------------------
	do
		local plots = folder(map, "Plots")
		local F = SURFACE
		local WH = 11
		local wallColor = Color3.fromRGB(226, 229, 236)
		local perSide = math.ceil(Config.Base.PlotCount / 2)
		for index = 1, Config.Base.PlotCount do
			local side = index <= perSide and 1 or -1
			local row = (index - 1) % perSide
			local zc = 70 + row * 56
			local pc = side == 1 and CFrame.new(15, 0, zc) or CFrame.new(-15, 0, zc) * CFrame.Angles(0, math.pi, 0)
			local accent = rgb(Themes.PlotAccents[(index - 1) % #Themes.PlotAccents + 1])

			local model = Instance.new("Model")
			model.Name = "Plot_" .. index
			model:SetAttribute("PlotIndex", index)
			model:SetAttribute("OwnerUserId", 0)
			model:SetAttribute("OwnerName", "")
			model:SetAttribute("LockedUntil", 0)

			newPart(model, "Floor", Vector3.new(40, F + 2, 44), pc * CFrame.new(20, (F - 2) / 2, 0), Color3.fromRGB(58, 60, 72))

			local function wall(name, size, x, z, yBottom)
				yBottom = yBottom or F
				newPart(model, name, size, pc * CFrame.new(x, yBottom + size.Y / 2, z), wallColor)
				neon(model, name .. "Glow", Vector3.new(size.X + 0.1, 0.3, size.Z + 0.1), pc * CFrame.new(x, yBottom + size.Y + 0.15, z), accent)
			end
			wall("WallFrontL", Vector3.new(1, WH, 16), 0.5, -14)
			wall("WallFrontR", Vector3.new(1, WH, 16), 0.5, 14)
			wall("Lintel", Vector3.new(1, 3, 12), 0.5, 0, F + 8)
			wall("WallSideA", Vector3.new(40, WH, 1), 20, 21.5)
			wall("WallSideB", Vector3.new(40, WH, 1), 20, -21.5)
			wall("WallBack", Vector3.new(1, WH, 44), 39.5, 0)

			local sign = newPart(model, "Sign", Vector3.new(1.2, 5, 24), pc * CFrame.new(0.5, F + WH + 2.8, 0), DARK)
			surfaceText(sign, Enum.NormalId.Left, { { Name = "Title", Text = "FREE BASE", Height = 0.8 } }, "SignOut", 20)
			surfaceText(sign, Enum.NormalId.Right, { { Name = "Title", Text = "FREE BASE", Height = 0.8 } }, "SignIn", 20)

			neon(model, "Barrier", Vector3.new(0.6, 8, 12), pc * CFrame.new(0.5, F + 4, 0), Color3.fromRGB(255, 60, 60), {
				Transparency = 1,
				CanCollide = false,
			})

			-- Piste d'entraînement (x3)
			local training = folder(model, "Training")
			keyGrid(training, pc * CFrame.new(23, F, 0), 30, 7.5, 2.5, function()
				return {
					accent = accent,
					area = "Base",
					themeable = true,
					training = true,
					height = 0.55,
					lift = 0.38,
					travel = 0.22,
					gap = 0.3,
					attrs = { PlotIndex = index },
				}
			end)
			neon(model, "TrainEdge", Vector3.new(30.6, 0.12, 0.3), pc * CFrame.new(23, F + 0.06, 3.95), accent)
			neon(model, "TrainEdge", Vector3.new(30.6, 0.12, 0.3), pc * CFrame.new(23, F + 0.06, -3.95), accent)
			local trainSign = newPart(model, "TrainingSign", Vector3.new(0.3, 3.4, 12), pc * CFrame.new(38.8, F + 6.2, 0), DARK)
			surfaceText(trainSign, Enum.NormalId.Left, {
				{ Text = "TRAINING", Color = accent, Height = 0.5 },
				{ Text = "⚡ x" .. Config.Speed.TrainingMultiplier .. " SPEED", Height = 0.4 },
			}, "SignGui", 25)

			-- 12 emplacements (socle + touche $)
			local slots = folder(model, "Slots")
			for s = 1, Config.Slots.Max do
				local sideZ = s <= 6 and 1 or -1
				local x = 8.5 + ((s - 1) % 6) * 5.6
				local slot = Instance.new("Model")
				slot.Name = "Slot_" .. s
				slot:SetAttribute("SlotIndex", s)
				newPart(slot, "Pedestal", Vector3.new(4.6, 2.2, 4.6), pc * CFrame.new(x, F + 1.1, sideZ * 17.6), Color3.fromRGB(40, 41, 50))
				neon(slot, "Ring", Vector3.new(4.9, 0.25, 4.9), pc * CFrame.new(x, F + 1.95, sideZ * 17.6), accent)
				ghost(slot, "Anchor", Vector3.new(1, 0.2, 1), pc * CFrame.new(x, F + 2.25, sideZ * 17.6) * CFrame.Angles(0, sideZ == 1 and math.pi or 0, 0))
				local key = makeKey(slot, pc * CFrame.new(x, F, sideZ * 12.2), 4.2, 4.2, {
					name = "CollectKey",
					accent = Color3.fromRGB(90, 255, 130),
					cap = Color3.fromRGB(70, 200, 110),
					top = Color3.fromRGB(110, 230, 140),
					area = "Base",
					action = "Collect",
					label = "$",
					labelColor = Color3.fromRGB(255, 255, 255),
					height = 0.55,
					lift = 0.38,
					travel = 0.22,
					gap = 0.4,
					attrs = { SlotIndex = s, PlotIndex = index },
				})
				local billboard = Instance.new("BillboardGui")
				billboard.Name = "PendingGui"
				billboard.Size = UDim2.new(6, 0, 1.6, 0)
				billboard.StudsOffset = Vector3.new(0, 2.2, 0)
				billboard.MaxDistance = 60
				billboard.LightInfluence = 0
				billboard.Enabled = false
				billboard.Parent = key.PrimaryPart
				local amount = Instance.new("TextLabel")
				amount.Name = "Amount"
				amount.Size = UDim2.new(1, 0, 1, 0)
				amount.BackgroundTransparency = 1
				amount.Text = ""
				amount.TextColor3 = Color3.fromRGB(110, 255, 140)
				amount.TextScaled = true
				amount.FontFace = FONT
				amount.TextStrokeTransparency = 0.2
				amount.Parent = billboard
				slot.Parent = slots
			end

			makeKey(model, pc * CFrame.new(3.6, F, -12.2), 4.2, 4.2, {
				name = "LockKey",
				accent = Color3.fromRGB(255, 70, 70),
				cap = Color3.fromRGB(215, 60, 70),
				top = Color3.fromRGB(240, 90, 95),
				area = "Base",
				action = "Lock",
				label = "LOCK",
				labelColor = Color3.fromRGB(255, 255, 255),
				height = 0.55,
				lift = 0.38,
				travel = 0.22,
				gap = 0.4,
				attrs = { PlotIndex = index },
			})

			ghost(model, "SpawnPoint", Vector3.new(2, 1, 2), pc * CFrame.new(4, F + 3, 0) * CFrame.Angles(0, -math.pi / 2, 0))
			ghost(model, "Bounds", Vector3.new(38.5, 16, 42.5), pc * CFrame.new(20.25, F + 8, 0))
			model.Parent = plots
		end
	end

	--------------------------------------------------------------------
	-- 🗺️ ZONES (6) + ponts
	--------------------------------------------------------------------
	local function bridge(parent, z0, z1, accent)
		local length = z1 - z0
		local cf = CFrame.new(0, 0, (z0 + z1) / 2)
		plate(parent, cf, 30, length, CASE)
		keyGrid(parent, cf, 30, length, 5, function()
			return { accent = accent, area = "Street", themeable = true }
		end)
		lip(parent, Vector3.new(-15.5, 0, z0), Vector3.new(-15.5, 0, z1), accent)
		lip(parent, Vector3.new(15.5, 0, z0), Vector3.new(15.5, 0, z1), accent)
	end

	-- Décor à thème, toujours sur les côtés (|x| > 40) pour ne jamais bloquer le chemin
	local function zoneDecor(parent, k, zs, accent)
		local back = zs + 84
		if k == 1 then -- écran géant + mug
			newPart(parent, "MonitorStand", Vector3.new(3, 10, 3), CFrame.new(-50, 5, zs + 42), DARK)
			newPart(parent, "Monitor", Vector3.new(1.5, 19, 34), CFrame.new(-50, 19, zs + 42), DARK)
			neon(parent, "MonitorScreen", Vector3.new(0.3, 16, 31), CFrame.new(-49.2, 19, zs + 42), Color3.fromRGB(120, 190, 255))
			local mug = newPart(parent, "Mug", Vector3.new(9, 7, 7), CFrame.new(46, 3, zs + 30) * CFrame.Angles(0, 0, math.rad(90)), Color3.fromRGB(240, 240, 240))
			mug.Shape = Enum.PartType.Cylinder
		elseif k == 2 then -- souris gamer géante + piliers RGB
			newPart(parent, "Mouse", Vector3.new(12, 5, 18), CFrame.new(46, 2, zs + 40), DARK)
			neon(parent, "MouseRgb", Vector3.new(12.2, 0.4, 18.2), CFrame.new(46, 0.2, zs + 40), accent)
			neon(parent, "MouseWheel", Vector3.new(1.2, 2, 3), CFrame.new(46, 5, zs + 35), Color3.fromRGB(0, 255, 200))
			for i, x in { -40, 40 } do
				neon(parent, "RgbPillar", Vector3.new(2, 30, 2), CFrame.new(x, 15, back - 4), hue(i / 3))
			end
		elseif k == 3 then -- feuille de papier géante
			local paper = newPart(parent, "Paper", Vector3.new(0.6, 30, 24), CFrame.new(50, 17, zs + 42) * CFrame.Angles(0, 0, math.rad(8)), Color3.fromRGB(250, 248, 238))
			surfaceText(paper, Enum.NormalId.Left, {
				{ Text = "Dear thief,", Color = Color3.fromRGB(40, 40, 40), Height = 0.2 },
				{ Text = "steal responsibly.", Color = Color3.fromRGB(40, 40, 40), Height = 0.2 },
			}, "SignGui", 12)
			for _, x in { -40, 40 } do
				newPart(parent, "WoodPillar", Vector3.new(3, 26, 3), CFrame.new(x, 13, back - 4), Color3.fromRGB(120, 80, 50))
			end
		elseif k == 4 then -- sucettes
			for i, x in { -44, 44, -44 } do
				local z = zs + 20 + i * 18
				newPart(parent, "LollipopStick", Vector3.new(1, 16, 1), CFrame.new(x, 6, z), Color3.fromRGB(255, 255, 255))
				local candy = newPart(parent, "Lollipop", Vector3.new(1.5, 10, 10), CFrame.new(x, 16, z) * CFrame.Angles(0, math.rad(90), 0), hue(0.9 - i * 0.12, 0.45, 1))
				candy.Shape = Enum.PartType.Cylinder
			end
		elseif k == 5 then -- piliers néon
			for i = 0, 5 do
				local x = (i % 2 == 0) and -42 or 42
				neon(parent, "NeonPillar", Vector3.new(1.5, 34, 1.5), CFrame.new(x, 17, zs + 8 + i * 14), (i % 2 == 0) and accent or Color3.fromRGB(255, 0, 140))
			end
		elseif k == 6 then -- planètes
			local planets = { { -55, 40, zs + 20, 18 }, { 60, 55, zs + 60, 26 }, { 0, 70, back + 40, 34 } }
			for i, p in planets do
				local ball = newPart(parent, "Planet", Vector3.new(p[4], p[4], p[4]), CFrame.new(p[1], p[2], p[3]), hue(0.7 + i * 0.08, 0.6, 0.9), {
					CanCollide = false,
				})
				ball.Shape = Enum.PartType.Ball
			end
			local ring = neon(parent, "PlanetRing", Vector3.new(0.5, 44, 44), CFrame.new(60, 55, zs + 60) * CFrame.Angles(0, 0, math.rad(80)), accent, {
				CanCollide = false,
				Transparency = 0.4,
			})
			ring.Shape = Enum.PartType.Cylinder
		end
	end

	do
		local zones = folder(map, "Zones")
		bridge(zones, STREET_END, 320, rgb(Config.Zones[1].Accent))
		for k, zone in Config.Zones do
			local zs = 320 + (k - 1) * 100
			local accent = rgb(zone.Accent)
			local model = Instance.new("Model")
			model.Name = "Zone_" .. k
			model:SetAttribute("ZoneIndex", k)
			model:SetAttribute("Required", zone.Required)
			model:SetAttribute("ZoneName", zone.Name)

			local cf = CFrame.new(0, 0, zs + 42)
			plate(model, cf, 66, 84, rgb(zone.PlateColor))
			local pedestalCells = { { 2, 4 }, { 8, 4 }, { 5, 7 }, { 2, 10 }, { 8, 10 } }
			keyGrid(model, cf, 66, 84, 6, function()
				return {
					cap = rgb(zone.CapColor),
					top = rgb(zone.TopColor),
					accent = accent,
					area = "Zone",
					attrs = { ZoneIndex = k },
				}
			end, function(_, _, _, _, ix, iz)
				for _, c in pedestalCells do
					if c[1] == ix and c[2] == iz then
						return true
					end
				end
				return false
			end)

			local pedestals = folder(model, "Pedestals")
			for i, c in pedestalCells do
				if i > Config.Spawning.PedestalsPerZone then
					break
				end
				local lx, lz = -33 + 6 * (c[1] + 0.5), -42 + 6 * (c[2] + 0.5)
				local ped = newPart(pedestals, "Pedestal_" .. i, Vector3.new(5, 3, 5), cf * CFrame.new(lx, 1.5, lz), darker(rgb(zone.PlateColor), 0.75))
				ped:SetAttribute("PedestalIndex", i)
				neon(ped, "Ring", Vector3.new(5.3, 0.3, 5.3), cf * CFrame.new(lx, 2.6, lz), accent)
				ghost(ped, "Anchor", Vector3.new(1, 0.2, 1), cf * CFrame.new(lx, 3.05, lz) * CFrame.Angles(0, math.pi, 0))
			end

			-- rebords : côtés complets, avant/arrière avec ouverture pour les ponts
			lip(model, Vector3.new(-33.5, 0, zs), Vector3.new(-33.5, 0, zs + 84), accent)
			lip(model, Vector3.new(33.5, 0, zs), Vector3.new(33.5, 0, zs + 84), accent)
			lipWithGaps(model, Vector3.new(-33.5, 0, zs - 0.5), Vector3.new(33.5, 0, zs - 0.5), accent, { { 18, 49 } })
			if k < #Config.Zones then
				lipWithGaps(model, Vector3.new(-33.5, 0, zs + 84.5), Vector3.new(33.5, 0, zs + 84.5), accent, { { 18, 49 } })
			else
				lip(model, Vector3.new(-33.5, 0, zs + 84.5), Vector3.new(33.5, 0, zs + 84.5), accent)
			end

			-- porte de vitesse
			if zone.Required > 0 then
				local gate = neon(model, "Gate", Vector3.new(66, 22, 0.8), CFrame.new(0, 11, zs - 1.2), accent, {
					Transparency = 0.55,
					CanCollide = true,
				})
				gate:AddTag("SpeedGate")
				gate:SetAttribute("Required", zone.Required)
				gate:SetAttribute("ZoneIndex", k)
				surfaceText(gate, Enum.NormalId.Front, {
					{ Text = "⚡ " .. short(zone.Required) .. " SPEED", Height = 0.2 },
					{ Text = "NEEDED", Height = 0.12 },
				}, "SignGui", 12)
			end
			arch(model, Vector3.new(0, 0, zs - 1.2), 70, 26, true, {
				{ Text = string.upper(zone.Name) .. " ZONE", Color = accent, Height = 0.55 },
				{ Text = zone.Required > 0 and ("⚡ " .. short(zone.Required)) or "FREE", Height = 0.35 },
			})

			ghost(model, "Bounds", Vector3.new(66, 40, 84), CFrame.new(0, 20, zs + 42))
			zoneDecor(model, k, zs, accent)
			model.Parent = zones

			if k < #Config.Zones then
				bridge(zones, zs + 84, zs + 100, rgb(Config.Zones[k + 1].Accent))
			end
		end
	end

	--------------------------------------------------------------------
	-- 🗼 TOUR ASMR (la reproduction de la vidéo) derrière la place
	--------------------------------------------------------------------
	do
		local tower = folder(map, "Tower")
		local checkpoints = folder(tower, "Checkpoints")
		local center = Vector3.new(0, 0, -100)
		local R = 19
		local RISE = 6
		local STAGES = Config.Tower.Stages
		local cornerOffsets = { Vector3.new(R, 0, R), Vector3.new(-R, 0, R), Vector3.new(-R, 0, -R), Vector3.new(R, 0, -R) }
		local function cornerPos(k)
			return center + cornerOffsets[(k % 4) + 1] + Vector3.new(0, k * RISE, 0)
		end
		local function halfSize(k)
			return k == STAGES and 7 or 5
		end
		local SIDE_KINDS = { "Stairs", "Pads", "Spacebars", "Beam", "ZigZag", "GapRunway", "BigPads", "Spacebars" }

		local function gateFrame(pos, dir)
			local cf = CFrame.lookAt(pos, pos + dir)
			local white = Color3.fromRGB(255, 255, 255)
			neon(tower, "Frame", Vector3.new(0.6, 9, 0.6), cf * CFrame.new(-4.4, SURFACE + 4.5, 0), white, { CanCollide = false })
			neon(tower, "Frame", Vector3.new(0.6, 9, 0.6), cf * CFrame.new(4.4, SURFACE + 4.5, 0), white, { CanCollide = false })
			neon(tower, "Frame", Vector3.new(9.4, 0.6, 0.6), cf * CFrame.new(0, SURFACE + 9, 0), white, { CanCollide = false })
		end

		local function buildSide(origin, dir, length, rise, kindIndex, accent)
			local kind = SIDE_KINDS[(kindIndex - 1) % #SIDE_KINDS + 1]
			local base = CFrame.lookAt(origin, origin + dir)
			local W = 8
			local o = { accent = accent, area = "Tower", themeable = true }
			local function opts()
				return o
			end
			local function at(t, x, y)
				return base * CFrame.new(x, y, -t)
			end
			if kind == "Stairs" or kind == "GapRunway" then
				local n = 12
				local L = length / n
				for j = 0, n - 1 do
					if not (kind == "GapRunway" and (j == 3 or j == 7)) then
						local rowCf = at((j + 0.5) * L, 0, (j + 1) * rise / (n + 1))
						plate(tower, rowCf, W, L, CASE)
						keyGrid(tower, rowCf, W, L, W / 3, opts)
					end
				end
			elseif kind == "Pads" or kind == "BigPads" or kind == "ZigZag" then
				local n = kind == "BigPads" and 3 or (kind == "ZigZag" and 5 or 4)
				local padLen = kind == "BigPads" and 7.2 or (kind == "ZigZag" and 2.6 or 5)
				local padW = kind == "BigPads" and 7.2 or 5
				local g = (length - n * padLen) / (n + 1)
				for i = 1, n do
					local x = 0
					if kind == "ZigZag" then
						x = (i % 2 == 0) and 1.6 or -1.6
					end
					local padCf = at(g * i + padLen * (i - 0.5), x, i * rise / (n + 1))
					plate(tower, padCf, padW, padLen, CASE)
					keyGrid(tower, padCf, padW, padLen, kind == "BigPads" and 2.4 or 2.5, opts)
				end
			elseif kind == "Spacebars" then
				local n = 7
				local depth = 2.2
				local g = (length - n * depth) / (n + 1)
				for i = 1, n do
					local cf = at(g * i + depth * (i - 0.5), 0, i * rise / (n + 1))
					plate(tower, cf, W, depth, CASE)
					makeKey(tower, cf, W, depth, o)
				end
			elseif kind == "Beam" then
				local n = 11
				local L = length / n
				for j = 0, n - 1 do
					local cf = at((j + 0.5) * L, 0, (j + 1) * rise / (n + 1))
					plate(tower, cf, 2.6, L, CASE)
					makeKey(tower, cf, 2.6, L, o)
				end
			end
		end

		-- pont depuis la place
		do
			local cf = CFrame.new(R, 0, -53)
			plate(tower, cf, 8, 46, CASE)
			keyGrid(tower, cf, 8, 46, 2.6, function(_, _, _, lz)
				return { accent = hue(lz / 46 + 0.5), area = "Plaza", themeable = true }
			end)
			lip(tower, Vector3.new(R - 4.5, 0, -30), Vector3.new(R - 4.5, 0, -76), Color3.fromRGB(255, 255, 255))
			lip(tower, Vector3.new(R + 4.5, 0, -30), Vector3.new(R + 4.5, 0, -76), Color3.fromRGB(255, 255, 255))
			local beam = arch(tower, Vector3.new(R, SURFACE, -31.5), 11, 14, false, {
				{ Text = "ASMR TOWER", Color = Color3.fromRGB(255, 255, 255), Height = 0.5 },
				{ Text = "FREE KEYBOARD AT THE TOP!", Color = Color3.fromRGB(255, 220, 80), Height = 0.35 },
			})
			beam.Name = "TowerSign"
		end

		for k = 0, STAGES do
			local pos = cornerPos(k)
			local h = halfSize(k)
			local pf = CFrame.new(pos)
			local accent = hue(k / STAGES)
			plate(tower, pf, h * 2, h * 2, CASE)
			if k == STAGES then
				keyGrid(tower, pf, h * 2, h * 2, h * 2 / 3, function(ix, iz)
					if ix == 1 and iz == 1 then
						return {
							accent = Color3.fromRGB(255, 220, 60),
							cap = Color3.fromRGB(255, 200, 50),
							top = Color3.fromRGB(255, 225, 120),
							area = "Tower",
							action = "TowerFinish",
							label = "ENTER",
							labelColor = Color3.fromRGB(90, 60, 0),
						}
					end
					return { accent = accent, area = "Tower", themeable = true, action = "Checkpoint", attrs = { Stage = k } }
				end)
			elseif k == 0 then
				keyGrid(tower, pf, h * 2, h * 2, 5, function()
					return { accent = accent, area = "Tower", themeable = true }
				end)
			else
				keyGrid(tower, pf, h * 2, h * 2, 5, function()
					return { accent = accent, area = "Tower", themeable = true, action = "Checkpoint", attrs = { Stage = k } }
				end)
			end
			if k >= 1 then
				local marker = ghost(checkpoints, "Checkpoint_" .. k, Vector3.new(1, 1, 1), CFrame.new(pos + Vector3.new(0, SURFACE + 3, 0)))
				marker:SetAttribute("Stage", k)
			end
			if k < STAGES then
				local nextPos = cornerPos(k + 1)
				local flat = Vector3.new(nextPos.X - pos.X, 0, nextPos.Z - pos.Z)
				local dir = flat.Unit
				local length = flat.Magnitude - h - halfSize(k + 1)
				buildSide(pos + dir * h, dir, length, RISE, k + 1, hue((k + 0.5) / STAGES))
				gateFrame(Vector3.new(nextPos.X, nextPos.Y, nextPos.Z) - dir * halfSize(k + 1), dir)
			end
		end

		-- pilier central couvert de keycaps
		local topY = STAGES * RISE + 4
		newPart(tower, "Core", Vector3.new(14, topY + 30, 14), CFrame.new(center + Vector3.new(0, (topY - 30) / 2, 0)), CASE)
		local faces = { Vector3.new(1, 0, 0), Vector3.new(-1, 0, 0), Vector3.new(0, 0, 1), Vector3.new(0, 0, -1) }
		for _, normal in faces do
			local faceCf = CFrame.lookAt(center + normal * 7, center + normal * 8)
			for row = 0, 12 do
				for col = -1, 1 do
					local y = -24 + row * 6
					local color = (row + col) % 3 == 0 and hue(row / 13, 0.35, 1) or WHITE_CAP
					newPart(tower, "WallKey", Vector3.new(3.6, 3.6, 0.8), faceCf * CFrame.new(col * 4.3, y, -0.4), color, {
						CastShadow = false,
						CanQuery = false,
						CanTouch = false,
					})
				end
			end
		end
		neon(tower, "CoreCrown", Vector3.new(14.4, 0.6, 14.4), CFrame.new(center + Vector3.new(0, topY + 0.3, 0)), Color3.fromRGB(255, 255, 255))
	end

	--------------------------------------------------------------------
	-- ✨ DÉCOR : keycaps géantes qui flottent dans le ciel
	--------------------------------------------------------------------
	do
		local decor = folder(map, "Decor")
		local seed = 4242
		local function rand()
			seed = (seed * 16807) % 2147483647
			return seed / 2147483647
		end
		local letters = { "Q", "E", "R", "T", "Y", "Z", "X", "C", "V", "ESC", "ALT", "TAB", "CTRL", "F", "G", "SHIFT" }
		for i, letter in letters do
			-- de chaque côté de la map, jamais au-dessus du chemin
			local sideX = (i % 2 == 0) and 1 or -1
			local pos = Vector3.new(sideX * (80 + rand() * 110), 25 + rand() * 65, -160 + (i / #letters) * 1100 + rand() * 40)
			local size = 14 + rand() * 12
			local rot = CFrame.Angles(math.rad(rand() * 30 - 15), rand() * math.pi * 2, math.rad(rand() * 30 - 15))
			local cf = CFrame.new(pos) * rot
			local model = Instance.new("Model")
			model.Name = "FloatingKey"
			local accent = hue(i / #letters, 0.5, 1)
			local cap = newPart(model, "Cap", Vector3.new(size, size * 0.45, size), cf, WHITE_CAP, { CanCollide = false, CanQuery = false, CanTouch = false })
			local top = newPart(model, "Top", Vector3.new(size * 0.82, size * 0.16, size * 0.82), cf * CFrame.new(0, size * 0.305, 0), accent, {
				CanCollide = false,
				CanQuery = false,
				CanTouch = false,
				CastShadow = false,
			})
			neon(model, "Glow", Vector3.new(size * 1.04, size * 0.06, size * 1.04), cf * CFrame.new(0, -size * 0.24, 0), accent, { CanCollide = false })
			surfaceText(top, Enum.NormalId.Top, { { Text = letter, Color = Color3.fromRGB(40, 40, 50), Height = 0.8 } }, "Legend", 8)
			model.PrimaryPart = cap
			model:SetAttribute("BobOffset", rand() * 10)
			model:AddTag("FloatingDecor")
			model.Parent = decor
		end
	end

	return map, stats
end

return MapGenerator
