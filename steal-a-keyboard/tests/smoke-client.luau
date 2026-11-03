-- Test client : interface, touches ASMR, boutique, réglages
-- Exécute le VRAI code du jeu (build/StealAKeyboard.rbxl) dans Lune, avec des services
-- Roblox simulés, et vérifie la boucle de jeu de bout en bout.
-- Utilisation (depuis le dossier steal-a-keyboard, après `rojo build`) :
--   lune run tests/smoke-client.luau
-- Les simulations ne remplacent pas un test dans Roblox Studio (physique, sons, rendu).
local roblox = require("@lune/roblox")
local fs = require("@lune/fs")
local luau = require("@lune/luau")
local task = require("@lune/task")
local process = require("@lune/process")
local serde = require("@lune/serde")

local Vector3, CFrame, Enum = roblox.Vector3, roblox.CFrame, roblox.Enum
local PLACE = "build/StealAKeyboard.rbxl"
local dm = roblox.deserializePlace(fs.readFile(PLACE))

local errors = {}
local function record(where, err)
	table.insert(errors, where .. ": " .. tostring(err))
	print("💥 ERROR in " .. where .. ": " .. tostring(err))
end

----------------------------------------------------------------------
-- Signals
----------------------------------------------------------------------
local function Signal(name)
	local self = { Name = name, Handlers = {} }
	function self:Connect(fn)
		local entry = { Fn = fn, Connected = true }
		table.insert(self.Handlers, entry)
		return {
			Disconnect = function()
				entry.Connected = false
			end,
		}
	end
	function self:Fire(...)
		local args = table.pack(...)
		for _, h in self.Handlers do
			if h.Connected then
				task.spawn(function()
					local ok, err = xpcall(h.Fn, debug.traceback, table.unpack(args, 1, args.n))
					if not ok then
						record("signal " .. name, err)
					end
				end)
			end
		end
	end
	return self
end

----------------------------------------------------------------------
-- Proxies autour des vraies instances Lune
----------------------------------------------------------------------
local proxies = setmetatable({}, { __mode = "k" })
local reals = setmetatable({}, { __mode = "k" })
local extensions = {}
local function ext(real)
	local e = extensions[real]
	if not e then
		e = {}
		extensions[real] = e
	end
	return e
end
local EVENTS = {
	Triggered = true, Activated = true, Died = true, CharacterAdded = true, DescendantAdded = true,
	OnServerEvent = true, PlayerAdded = true, PlayerRemoving = true, ChildAdded = true, Ended = true,
	OnClientEvent = true, MouseButton1Down = true, MouseButton1Up = true, MouseLeave = true,
}

local wrap, unwrap
local function wrapValue(v)
	if typeof(v) == "Instance" then
		return wrap(v)
	elseif type(v) == "table" and not reals[v] then
		local t = {}
		for k, x in v do
			t[k] = wrapValue(x)
		end
		return t
	end
	return v
end
function unwrap(v)
	if type(v) == "table" and reals[v] then
		return reals[v]
	end
	return v
end
local function unwrapArgs(...)
	local out = table.pack(...)
	for i = 1, out.n do
		out[i] = unwrap(out[i])
	end
	return table.unpack(out, 1, out.n)
end

local function getPivot(real)
	if real:IsA("BasePart") then
		return real.CFrame
	end
	local primary = real.PrimaryPart or real:FindFirstChild("HumanoidRootPart")
	if primary then
		return primary.CFrame
	end
	for _, d in real:GetDescendants() do
		if d:IsA("BasePart") then
			return d.CFrame
		end
	end
	return CFrame.new()
end
local function pivotTo(real, cf)
	if real:IsA("BasePart") then
		real.CFrame = cf
		return
	end
	local delta = cf * getPivot(real):Inverse()
	for _, d in real:GetDescendants() do
		if d:IsA("BasePart") then
			d.CFrame = delta * d.CFrame
		end
	end
end

local ProxyMeta = {}
ProxyMeta.__index = function(p, key)
	local real = reals[p]
	local e = extensions[real]
	if e and e[key] ~= nil then
		return e[key]
	end
	if key == "WaitForChild" then
		return function(_, name)
			local child = real:FindFirstChild(name)
			if not child then
				error("WaitForChild would hang: " .. real:GetFullName() .. "." .. name, 2)
			end
			return wrap(child)
		end
	elseif key == "PivotTo" then
		return function(_, cf)
			pivotTo(real, cf)
		end
	elseif key == "GetPivot" then
		return function()
			return getPivot(real)
		end
	elseif real.ClassName == "BindableEvent" and (key == "Event" or key == "Fire") then
		local e2 = ext(real)
		e2.Event = e2.Event or Signal(real.Name .. ".Event")
		if key == "Event" then
			return e2.Event
		end
		return function(_, ...)
			e2.Event:Fire(...)
		end
	elseif key == "Play" or key == "Stop" then
		return function() end
	elseif key == "GetAttributeChangedSignal" or key == "GetPropertyChangedSignal" then
		return function(_, name)
			local e2 = ext(real)
			e2.__changed = e2.__changed or {}
			e2.__changed[name] = e2.__changed[name] or Signal(real.Name .. ".changed." .. name)
			return e2.__changed[name]
		end
	elseif key == "Position" and real:IsA("BasePart") then
		return real.CFrame.Position
	elseif key == "AssemblyLinearVelocity" then
		return Vector3.zero
	elseif EVENTS[key] then
		local s = Signal(real.Name .. "." .. key)
		ext(real)[key] = s
		return s
	end
	local ok, value = pcall(function()
		return real[key]
	end)
	if not ok then
		if string.find(tostring(value), "missing default value", 1, true) then
			return nil -- propriété jamais définie (Lune) : Roblox renverrait sa valeur par défaut
		end
		error(tostring(value), 2)
	end
	if type(value) == "function" then
		return function(self, ...)
			local results = table.pack(value(unwrap(self), unwrapArgs(...)))
			for i = 1, results.n do
				results[i] = wrapValue(results[i])
			end
			return table.unpack(results, 1, results.n)
		end
	end
	return wrapValue(value)
end
ProxyMeta.__newindex = function(p, key, value)
	local real = reals[p]
	local e = extensions[real]
	if e and e.__setters and e.__setters[key] then
		e.__setters[key](value)
		return
	end
	if key == "AssemblyLinearVelocity" then
		return
	end
	real[key] = unwrap(value)
end
ProxyMeta.__tostring = function(p)
	return "Proxy(" .. tostring(reals[p]) .. ")"
end
function wrap(real)
	if real == nil then
		return nil
	end
	local p = proxies[real]
	if p then
		return p
	end
	p = setmetatable({}, ProxyMeta)
	proxies[real] = p
	reals[p] = real
	return p
end

----------------------------------------------------------------------
-- Services simulés
----------------------------------------------------------------------
local Workspace = dm:GetService("Workspace")
local PlayersReal = dm:GetService("Players")
local storeData = {}
local function deepCopy(v)
	if type(v) ~= "table" then
		return v
	end
	local t = {}
	for k, x in v do
		t[k] = deepCopy(x)
	end
	return t
end
local DataStoreService = {
	GetDataStore = function(_, name)
		return {
			UpdateAsync = function(_, key, fn)
				local new = fn(deepCopy(storeData[key]), nil)
				if new ~= nil then
					local ok, err = pcall(serde.encode, "json", new)
					if not ok then
						record("DataStore JSON", err)
					end
					storeData[key] = deepCopy(new)
				end
				return new
			end,
		}
	end,
}
local heartbeat = Signal("Heartbeat")
local mocks = {
	DataStoreService = DataStoreService,
	PhysicsService = { RegisterCollisionGroup = function() end, CollisionGroupSetCollidable = function() end },
	MarketplaceService = {},
	RunService = { Heartbeat = heartbeat, IsStudio = function()
		return false
	end },
	Debris = { AddItem = function() end },
}
local bindToClose = {}
ext(dm).GetService = function(_, name)
	return mocks[name] or wrap(dm:GetService(name))
end
ext(dm).BindToClose = function(_, fn)
	table.insert(bindToClose, fn)
end
ext(dm).JobId = "test-job"
ext(PlayersReal).GetPlayers = function()
	local list = {}
	for _, child in PlayersReal:GetChildren() do
		if child:IsA("Player") then
			table.insert(list, wrap(child))
		end
	end
	return list
end
ext(PlayersReal).GetPlayerByUserId = function(_, id)
	for _, child in PlayersReal:GetChildren() do
		if child:IsA("Player") and child.UserId == id then
			return wrap(child)
		end
	end
	return nil
end
ext(PlayersReal).PlayerAdded = Signal("PlayerAdded")
ext(PlayersReal).PlayerRemoving = Signal("PlayerRemoving")

-- Remotes
local notifications = {}
local effects = {}
local remotesReal = dm:GetService("ReplicatedStorage").Remotes
for _, remote in remotesReal:GetChildren() do
	local e = ext(remote)
	if remote.ClassName == "RemoteEvent" then
		e.FireClient = function(_, player, ...)
			local name = unwrap(player).Name
			if remote.Name == "Notify" then
				notifications[name] = notifications[name] or {}
				table.insert(notifications[name], (...))
			else
				table.insert(effects, { name, ... })
			end
		end
		e.FireAllClients = function(_, ...)
			if remote.Name == "Notify" then
				notifications.ALL = notifications.ALL or {}
				table.insert(notifications.ALL, (...))
			else
				table.insert(effects, { "ALL", ... })
			end
		end
	else
		e.__setters = {
			OnServerInvoke = function(fn)
				e.Invoke = fn
			end,
		}
	end
end

-- Raycast vers le bas contre les pièces de la map
local mapReal = Workspace.Map
local castParts = {}
for _, d in mapReal:GetDescendants() do
	if d:IsA("BasePart") then
		local ok, canQuery = pcall(function()
			return d.CanQuery
		end)
		if not ok or canQuery ~= false then
			table.insert(castParts, d)
		end
	end
end
local function raycastDown(origin, direction)
	local best, bestTop = nil, -math.huge
	for _, part in castParts do
		local cf, size = part.CFrame, part.Size
		local lp = cf:PointToObjectSpace(origin)
		if math.abs(lp.X) <= size.X / 2 and math.abs(lp.Z) <= size.Z / 2 then
			local top = cf.Position.Y + size.Y / 2
			if top <= origin.Y + 0.01 and top >= origin.Y + direction.Y and top > bestTop then
				best, bestTop = part, top
			end
		end
	end
	if best then
		return { Instance = wrap(best), Position = Vector3.new(origin.X, bestTop, origin.Z), Distance = origin.Y - bestTop, Normal = Vector3.new(0, 1, 0) }
	end
	return nil
end
local serverClock = os.clock()
ext(Workspace).Raycast = function(_, origin, direction)
	return raycastDown(origin, direction)
end
ext(Workspace).GetServerTimeNow = function()
	return 1e6 + (os.clock() - serverClock)
end

----------------------------------------------------------------------
-- Environnement d'exécution des scripts
----------------------------------------------------------------------
local function guard(fn, where)
	return function(...)
		local ok, err = xpcall(fn, debug.traceback, ...)
		if not ok then
			record(where, err)
		end
	end
end
local mockTask = {
	spawn = function(fn, ...)
		return task.spawn(guard(fn, "task.spawn"), ...)
	end,
	delay = function(t, fn, ...)
		return task.delay(t, guard(fn, "task.delay"), ...)
	end,
	defer = function(fn, ...)
		return task.defer(guard(fn, "task.defer"), ...)
	end,
	wait = task.wait,
	cancel = task.cancel,
}
local MockRandom = {
	new = function()
		return {
			NextNumber = function(_, a, b)
				a, b = a or 0, b or 1
				return a + math.random() * (b - a)
			end,
			NextInteger = function(_, a, b)
				return math.random(a, b)
			end,
		}
	end,
}
local MockParams = {
	new = function()
		return {}
	end,
}
local moduleCache = {}
local envBase
envBase = {
	print = print,
	warn = function(...)
		print("⚠️ WARN", ...)
	end,
	error = error, pcall = pcall, xpcall = xpcall, type = type, tostring = tostring, tonumber = tonumber,
	pairs = pairs, ipairs = ipairs, next = next, select = select, unpack = table.unpack,
	setmetatable = setmetatable, getmetatable = getmetatable, rawget = rawget, rawset = rawset, rawequal = rawequal,
	math = math, string = string, table = table, os = os, coroutine = coroutine, utf8 = utf8, debug = debug,
	typeof = function(v)
		if type(v) == "table" and reals[v] then
			return "Instance"
		end
		return typeof(v)
	end,
	task = mockTask,
	Instance = {
		new = function(className)
			return wrap(roblox.Instance.new(className))
		end,
	},
	Vector3 = Vector3, Vector2 = roblox.Vector2, CFrame = CFrame, Color3 = roblox.Color3, Enum = Enum,
	UDim = roblox.UDim, UDim2 = roblox.UDim2, Font = roblox.Font,
	ColorSequence = roblox.ColorSequence, ColorSequenceKeypoint = roblox.ColorSequenceKeypoint,
	Random = MockRandom, RaycastParams = MockParams, OverlapParams = MockParams,
	TweenInfo = { new = function(...) return { ... } end },
	game = wrap(dm), workspace = wrap(Workspace),
}
local function makeEnv(scriptReal, requireFn)
	local env = {}
	for k, v in envBase do
		env[k] = v
	end
	env.script = wrap(scriptReal)
	env.require = requireFn
	return env
end
local function runSource(scriptReal)
	local requireFn
	requireFn = function(moduleProxy)
		local real = unwrap(moduleProxy)
		if moduleCache[real] == nil then
			local fn = luau.load(real.Source, { environment = makeEnv(real, requireFn), debugName = real:GetFullName(), injectGlobals = false })
			moduleCache[real] = fn()
		end
		return moduleCache[real]
	end
	local fn = luau.load(scriptReal.Source, { environment = makeEnv(scriptReal, requireFn), debugName = scriptReal:GetFullName(), injectGlobals = false })
	return fn()
end


----------------------------------------------------------------------
-- Côté client
----------------------------------------------------------------------
local PlayersService = PlayersReal
local localPlayer = roblox.Instance.new("Player")
localPlayer.Name = "Alice"
localPlayer.UserId = 1
localPlayer.DisplayName = "Alice"
local playerGui = roblox.Instance.new("PlayerGui")
playerGui.Name = "PlayerGui"
playerGui.Parent = localPlayer
localPlayer.Parent = PlayersService
ext(PlayersService).LocalPlayer = wrap(localPlayer)
local function setAttr(name, value)
	localPlayer:SetAttribute(name, value)
	local e = ext(localPlayer)
	if e.__changed and e.__changed[name] then
		e.__changed[name]:Fire()
	end
end
-- personnage sur la rue
local character = roblox.Instance.new("Model")
character.Name = "Alice"
local hrp = roblox.Instance.new("Part")
hrp.Name = "HumanoidRootPart"
hrp.Size = Vector3.new(2, 2, 1)
hrp.CFrame = CFrame.new(0, 4.8, 60)
hrp.Parent = character
local humanoid = roblox.Instance.new("Humanoid")
humanoid.Health = 100
humanoid.WalkSpeed = 16
humanoid.RigType = Enum.HumanoidRigType.R15
humanoid.HipHeight = 2
humanoid.Parent = character
character.PrimaryPart = hrp
character.Parent = Workspace
localPlayer.Character = character

-- caméra
local camera = roblox.Instance.new("Camera")
camera.CFrame = CFrame.new(0, 20, 40)
ext(camera).ViewportSize = roblox.Vector2.new(844, 390) -- téléphone en paysage
ext(Workspace).CurrentCamera = wrap(camera)

-- services client simulés
local renderStepped = Signal("RenderStepped")
local tagAdded = {}
mocks.RunService = { Heartbeat = heartbeat, RenderStepped = renderStepped, IsStudio = function() return false end }
mocks.CollectionService = {
	GetTagged = function(_, tag)
		local list = {}
		for _, d in Workspace:GetDescendants() do
			if d:HasTag(tag) then
				table.insert(list, wrap(d))
			end
		end
		return list
	end,
	GetInstanceAddedSignal = function(_, tag)
		tagAdded[tag] = tagAdded[tag] or Signal("tag." .. tag)
		return tagAdded[tag]
	end,
}
mocks.TweenService = {
	Create = function(_, instance, info, goal)
		return { Play = function()
			for k, v in goal do
				instance[k] = v
			end
		end }
	end,
}
mocks.UserInputService = { InputBegan = Signal("InputBegan") }
mocks.ContentProvider = { PreloadAsync = function() end }
local prompted = {}
mocks.MarketplaceService = { PromptProductPurchase = function(_, _, id) table.insert(prompted, id) end }

-- remotes côté client
local sent = {}
for _, remote in remotesReal:GetChildren() do
	local e = ext(remote)
	if remote.ClassName == "RemoteEvent" then
		e.FireServer = function(_, ...)
			table.insert(sent, { remote.Name, ... })
		end
	else
		e.InvokeServer = function(_, action)
			return true, "ok " .. tostring(action)
		end
	end
end

-- BulkMoveTo / GetPartBoundsInBox
local moved = 0
ext(Workspace).BulkMoveTo = function(_, parts, cframes)
	for i, p in parts do
		unwrap(p).CFrame = cframes[i]
		moved += 1
	end
end
ext(Workspace).GetPartBoundsInBox = function(_, cf, size)
	local result = {}
	local c = cf.Position
	for _, part in castParts do
		local pc, ps = part.CFrame.Position, part.Size
		if math.abs(pc.X - c.X) <= (ps.X + size.X) / 2 and math.abs(pc.Y - c.Y) <= (ps.Y + size.Y) / 2 and math.abs(pc.Z - c.Z) <= (ps.Z + size.Z) / 2 then
			table.insert(result, wrap(part))
		end
	end
	return result
end

-- attributs posés par le serveur
for k, v in {
	Loaded = true, Cash = 1234, Speed = 56, SwitchTier = 2, SlotCount = 4, PlotIndex = 1, Income = 7,
	SoundProfile = "Clicky", GlowMode = "Rainbow", GlowColor = roblox.Color3.fromRGB(255, 0, 0), Keycaps = "Mint",
	MyVolume = 0.8, OthersVolume = 0.5, MusicVolume = 0.3, DataSaving = false, TowerReadyAt = 0,
} do
	localPlayer:SetAttribute(k, v)
end
mapReal.Plots.Plot_1:SetAttribute("OwnerUserId", 1)

local mainReal = localPlayer and dm:GetService("StarterPlayer").StarterPlayerScripts.Client.Main
local okMain, errMain = xpcall(runSource, debug.traceback, mainReal)
if not okMain then
	record("Main.client", errMain)
end
local function module(name)
	for real, value in moduleCache do
		if real.Name == name then
			return value
		end
	end
end
local function assertTrue(cond, msg)
	if cond then
		print("✅ " .. msg)
	else
		record("ASSERT", msg)
	end
end

-- interface créée ?
local hud = playerGui:FindFirstChild("KeyboardHUD")
assertTrue(hud ~= nil, "HUD créé")
local function findText(root, pattern)
	for _, d in root:GetDescendants() do
		if (d:IsA("TextLabel") or d:IsA("TextButton")) and string.find(d.Text, pattern, 1, true) then
			return d
		end
	end
end
assertTrue(findText(hud, "$1.23K") ~= nil, "argent affiché ($1.23K)")
assertTrue(findText(hud, "Red Switch") ~= nil, "switch affiché")
assertTrue(findText(hud, "Saving OFF") ~= nil and findText(hud, "Saving OFF").Visible, "avertissement sauvegarde visible")

-- thème des keycaps appliqué (Mint)
local streetKey = nil
for _, d in mapReal.Street:GetChildren() do
	if d:HasTag("Key") then streetKey = d break end
end
local mint = roblox.Color3.fromRGB(170, 235, 205)
local c = streetKey.Cap.Color
assertTrue(math.abs(c.R - mint.R) < 0.01 and math.abs(c.G - mint.G) < 0.01, "thème Mint appliqué aux touches")

-- marcher : les touches s'enfoncent et s'allument
local pressedGlow = false
for i = 0, 20 do
	hrp.CFrame = CFrame.new(0, 4.8, 60 + i * 1.5)
	renderStepped:Fire(1 / 60)
	task.wait(0.005)
	for _, d in mapReal.Street:GetChildren() do
		if d:HasTag("Key") and d.Glow.Transparency < 0.5 then
			pressedGlow = true
		end
	end
end
assertTrue(moved > 0, "les touches bougent (BulkMoveTo x" .. moved .. ")")
assertTrue(pressedGlow, "l'underglow s'allume sous le joueur")
-- quitter : relâchement + extinction
hrp.CFrame = CFrame.new(0, 60, 60)
for _ = 1, 80 do
	renderStepped:Fire(1 / 60)
	task.wait(0.002)
end
local allOff = true
for _, d in mapReal.Street:GetChildren() do
	if d:HasTag("Key") and d.Glow.Transparency < 0.99 then
		allOff = false
	end
end
assertTrue(allOff, "les touches se rallument/éteignent après le passage")

-- notifications et effets
local notify = ext(remotesReal.Notify).OnClientEvent
notify:Fire("Hello test", "Rare")
local effect = ext(remotesReal.Effect).OnClientEvent
effect:Fire("Collect", 150, Vector3.new(0, 0, 0))
effect:Fire("Steal")
effect:Fire("Slap", Vector3.new(0, 2, 0), true)
effect:Fire("TowerWin")
task.wait(0.1)
assertTrue(findText(hud, "Hello test") ~= nil, "notification affichée")
assertTrue(findText(hud, "+$150") ~= nil, "popup +$150")

-- bannière de transport
setAttr("CarryingName", "Gold Gamer TKL")
setAttr("CarryingStolen", true)
task.wait(0.05)
assertTrue(findText(hud, "STOLEN: Gold Gamer TKL") ~= nil, "bannière du clavier volé")

-- boutique
local Shop = module("ShopPanel")
Shop.open()
local shopPanel = hud:FindFirstChild("ShopPanel")
assertTrue(shopPanel and shopPanel.Visible, "boutique ouverte")
local buy = findText(shopPanel, "BUY $15K")
assertTrue(buy ~= nil, "bouton d'achat du Brown Switch")
if buy then
	ext(buy).Activated:Fire()
	task.wait(0.1)
	assertTrue(findText(hud, "ok UpgradeSwitch") ~= nil, "achat envoyé au serveur")
end
Shop.close()

-- réglages
local SettingsPanelModule = module("SettingsPanel")
SettingsPanelModule.open()
local settingsPanel = hud:FindFirstChild("SettingsPanel")
assertTrue(settingsPanel and settingsPanel.Visible, "réglages ouverts")
local water = findText(settingsPanel, "Water")
if water then
	ext(water).Activated:Fire()
end
local mute = findText(settingsPanel, "MUTE")
if mute then
	ext(mute).Activated:Fire()
end
task.wait(0.8)
local last = sent[#sent]
assertTrue(last and last[1] == "SaveSettings" and last[2].SoundProfile == "Water" and last[2].OthersVolume == 0, "réglages envoyés au serveur (Water, MUTE)")
-- raccourci B
mocks.UserInputService.InputBegan:Fire({ KeyCode = Enum.KeyCode.B }, false)
task.wait(0.05)
assertTrue(shopPanel.Visible, "touche B ouvre la boutique")

print(string.format("\n%d erreur(s)", #errors))
for _, e in errors do
	print(" - " .. string.sub(e, 1, 600))
end
process.exit(#errors > 0 and 1 or 0)
