-- KeyEngine.luau
-- ⌨️ LE cœur ASMR : chaque touche sous les pieds d'un joueur s'enfonce
-- (ressort qui rebondit), s'allume en RGB (underglow) et fait "clic".
-- Tout est calculé sur TON écran (fluide, zéro lag) pour TOUS les joueurs proches.

local CollectionService = game:GetService("CollectionService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Themes = require(Shared:WaitForChild("Themes"))

local KeyEngine = {}

local player = Players.LocalPlayer
local SoundController
local Settings

local STIFFNESS = 900 -- raideur du ressort de la touche
local DAMPING = 36 -- amortissement (plus petit = plus de rebond)
local GLOW_FADE = 0.45 -- secondes pour que la lumière s'éteigne
local OTHERS_RANGE = 160 -- distance max pour animer les touches des autres
local DOWN = Vector3.new(0, -8, 0)
local FOOTPRINT = Vector3.new(1.6, 0.9, 1.6)
local FOOT_OFFSETS = {
	Vector3.zero,
	Vector3.new(0.6, 0, 0.6),
	Vector3.new(-0.6, 0, 0.6),
	Vector3.new(0.6, 0, -0.6),
	Vector3.new(-0.6, 0, -0.6),
}

local states = {} -- [Model] = état de la touche
local active = {} -- touches en mouvement
local pressing = {} -- [Player] = { Keys = { [Model] = true }, LastSound = 0 }
local currentTheme = nil

local rayParams = RaycastParams.new()
rayParams.FilterType = Enum.RaycastFilterType.Include
local overlapParams = OverlapParams.new()
overlapParams.FilterType = Enum.RaycastFilterType.Include

local function getState(model: Model)
	local state = states[model]
	if state then
		return state
	end
	local cap = model:FindFirstChild("Cap")
	local top = model:FindFirstChild("Top")
	if not cap or not top then
		return nil
	end
	state = {
		Cap = cap,
		Top = top,
		Glow = model:FindFirstChild("Glow"),
		RestCap = cap.CFrame,
		RestTop = top.CFrame,
		Travel = model:GetAttribute("Travel") or 0.3,
		Offset = 0,
		Velocity = 0,
		Count = 0,
		GlowAlpha = 0,
		GlowColor = nil,
		Rainbow = false,
	}
	states[model] = state
	return state
end

-- Couleur d'underglow choisie par le joueur qui appuie
local function glowFor(presser: Player, model: Model)
	local mode, color
	if presser == player then
		mode, color = Settings.get("GlowMode"), Settings.get("GlowColor")
	else
		mode, color = presser:GetAttribute("GlowMode"), presser:GetAttribute("GlowColor")
	end
	if mode == "Rainbow" then
		return nil, true
	elseif mode == "Color" and typeof(color) == "Color3" then
		return color, false
	end
	local accent = model:GetAttribute("Accent")
	return typeof(accent) == "Color3" and accent or Color3.new(1, 1, 1), false
end

local function press(model: Model, presser: Player)
	local state = getState(model)
	if not state then
		return
	end
	state.Count += 1
	state.GlowColor, state.Rainbow = glowFor(presser, model)
	state.GlowAlpha = 1
	active[model] = true
end

local function release(model: Model)
	local state = states[model]
	if not state then
		return
	end
	state.Count = math.max(0, state.Count - 1)
	active[model] = true
end

-- Quelles touches sont sous ce personnage ?
local function detect(character: Model)
	local keys = {}
	local root = character:FindFirstChild("HumanoidRootPart")
	local humanoid = character:FindFirstChildOfClass("Humanoid")
	if not root or not humanoid or humanoid.Health <= 0 then
		return keys, nil
	end
	-- plusieurs rayons : le centre du personnage peut tomber pile entre deux touches
	local legs = humanoid.RigType == Enum.HumanoidRigType.R15 and humanoid.HipHeight or 2
	local maxDistance = root.Size.Y / 2 + legs + 1.1
	local result, model = nil, nil
	for _, offset in FOOT_OFFSETS do
		local hit = workspace:Raycast(root.Position + offset, DOWN, rayParams)
		if hit and hit.Distance <= maxDistance then
			local parent = hit.Instance.Parent
			if parent and parent:HasTag("Key") then
				result, model = hit, parent
				break
			end
		end
	end
	if not result or not model then
		return keys, root -- en l'air ou pas sur une touche
	end
	keys[model] = true
	-- les touches voisines sous les pieds (+ un peu devant pour anticiper)
	local velocity = root.AssemblyLinearVelocity
	local ahead = Vector3.new(velocity.X, 0, velocity.Z) * 0.045
	if ahead.Magnitude > 1.2 then
		ahead = ahead.Unit * 1.2
	end
	local feet = Vector3.new(root.Position.X, result.Position.Y + 0.25, root.Position.Z)
	local hits = workspace:GetPartBoundsInBox(CFrame.new(feet + ahead), FOOTPRINT, overlapParams)
	for _, part in hits do
		local parent = part.Parent
		if parent and parent:HasTag("Key") then
			keys[parent] = true
		end
	end
	return keys, root
end

local function releaseAll(presser: Player)
	local entry = pressing[presser]
	if not entry then
		return
	end
	for model in entry.Keys do
		release(model)
	end
	entry.Keys = {}
end

local function updatePresser(presser: Player, character: Model, isLocal: boolean, now: number)
	local entry = pressing[presser]
	if not entry then
		entry = { Keys = {}, LastSound = 0 }
		pressing[presser] = entry
	end
	local newKeys, root = detect(character)
	local pressedModel = nil
	local releasedAny = false
	for model in newKeys do
		if not entry.Keys[model] then
			press(model, presser)
			pressedModel = model
		end
	end
	for model in entry.Keys do
		if not newKeys[model] then
			release(model)
			releasedAny = true
		end
	end
	entry.Keys = newKeys

	if not pressedModel and not releasedAny then
		return
	end
	local profileName = if isLocal then Settings.get("SoundProfile") else presser:GetAttribute("SoundProfile")
	if pressedModel and now - entry.LastSound > 0.045 then
		entry.LastSound = now
		local state = states[pressedModel]
		local position = state and state.Cap.Position or (root and root.Position)
		SoundController.playKey(profileName, false, position, isLocal)
	elseif releasedAny and not pressedModel and root and now - entry.LastSound > 0.07 then
		entry.LastSound = now
		SoundController.playKey(profileName, true, root.Position, isLocal)
	end
end

-- Animation : ressort + lumière, puis déplacement groupé (très rapide)
local parts, cframes = {}, {}
local function animate(dt: number)
	table.clear(parts)
	table.clear(cframes)
	local steps = math.max(1, math.ceil(dt * 120))
	local h = math.min(dt, 0.1) / steps
	local clock = os.clock()
	for model in active do
		local state = states[model]
		if not state or not state.Cap.Parent then
			active[model] = nil
			states[model] = nil
		else
			local target = state.Count > 0 and -state.Travel or 0
			for _ = 1, steps do
				local accel = (target - state.Offset) * STIFFNESS - state.Velocity * DAMPING
				state.Velocity += accel * h
				state.Offset += state.Velocity * h
			end
			if state.Count == 0 then
				state.GlowAlpha = math.max(0, state.GlowAlpha - dt / GLOW_FADE)
			end
			local glow = state.Glow
			if glow then
				glow.Transparency = 1 - state.GlowAlpha
				if state.GlowAlpha > 0 then
					if state.Rainbow then
						local p = state.RestCap.Position
						glow.Color = Color3.fromHSV((clock * 0.35 + (p.X + p.Z) * 0.012) % 1, 0.85, 1)
					elseif state.GlowColor and glow.Color ~= state.GlowColor then
						glow.Color = state.GlowColor
					end
				end
			end
			if state.Count == 0 and math.abs(state.Offset) < 0.003 and math.abs(state.Velocity) < 0.05 and state.GlowAlpha <= 0 then
				state.Offset = 0
				state.Velocity = 0
				active[model] = nil
			end
			table.insert(parts, state.Cap)
			table.insert(cframes, state.RestCap * CFrame.new(0, state.Offset, 0))
			table.insert(parts, state.Top)
			table.insert(cframes, state.RestTop * CFrame.new(0, state.Offset, 0))
		end
	end
	if #parts > 0 then
		workspace:BulkMoveTo(parts, cframes, Enum.BulkMoveMode.FireCFrameChanged)
	end
end

----------------------------------------------------------------------
-- Couleur des keycaps (thème choisi dans les réglages, visible sur ton écran)
----------------------------------------------------------------------
local function applyThemeTo(model: Instance)
	if not currentTheme or not model:GetAttribute("Themeable") then
		return
	end
	local cap = model:FindFirstChild("Cap")
	local top = model:FindFirstChild("Top")
	if cap then
		cap.Color = currentTheme.Cap
	end
	if top then
		top.Color = currentTheme.Top
	end
end

function KeyEngine.applyTheme(name: string?)
	local theme = Themes.findKeycaps(name)
	currentTheme = {
		Cap = Color3.fromRGB(theme.Cap[1], theme.Cap[2], theme.Cap[3]),
		Top = Color3.fromRGB(theme.Top[1], theme.Top[2], theme.Top[3]),
	}
	for _, model in CollectionService:GetTagged("Key") do
		applyThemeTo(model)
	end
end

function KeyEngine.init(soundController, settings)
	SoundController = soundController
	Settings = settings

	local map = workspace:WaitForChild("Map")
	rayParams.FilterDescendantsInstances = { map }
	overlapParams.FilterDescendantsInstances = { map }

	KeyEngine.applyTheme(Settings.get("Keycaps"))
	CollectionService:GetInstanceAddedSignal("Key"):Connect(applyThemeTo)
	Settings.Changed:Connect(function(key, value)
		if key == "Keycaps" then
			KeyEngine.applyTheme(value)
		end
	end)

	Players.PlayerRemoving:Connect(function(other)
		releaseAll(other)
		pressing[other] = nil
	end)

	local othersTimer = 0
	RunService.RenderStepped:Connect(function(dt)
		local now = os.clock()
		local character = player.Character
		if character then
			updatePresser(player, character, true, now)
		end
		othersTimer += dt
		if othersTimer >= 0.05 then
			othersTimer = 0
			local camera = workspace.CurrentCamera
			local cameraPosition = camera and camera.CFrame.Position
			for _, other in Players:GetPlayers() do
				if other ~= player then
					local otherCharacter = other.Character
					local root = otherCharacter and otherCharacter:FindFirstChild("HumanoidRootPart")
					if root and (not cameraPosition or (root.Position - cameraPosition).Magnitude < OTHERS_RANGE) then
						updatePresser(other, otherCharacter, false, now)
					else
						releaseAll(other)
					end
				end
			end
		end
		animate(dt)
	end)
end

return KeyEngine
