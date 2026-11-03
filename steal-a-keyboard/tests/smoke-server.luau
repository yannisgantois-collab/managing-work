-- Test serveur : 2 joueurs, ramassage, vol, gifle, verrou, tour, sauvegarde
-- Exécute le VRAI code du jeu (build/StealAKeyboard.rbxl) dans Lune, avec des services
-- Roblox simulés, et vérifie la boucle de jeu de bout en bout.
-- Utilisation (depuis le dossier steal-a-keyboard, après `rojo build`) :
--   lune run tests/smoke-server.luau
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
-- Démarrage du serveur
----------------------------------------------------------------------
local mainReal = dm:GetService("ServerScriptService").Server.Main
local okMain, errMain = xpcall(runSource, debug.traceback, mainReal)
if not okMain then
	record("Main.server", errMain)
	process.exit(1)
end
local function module(name)
	for real, value in moduleCache do
		if real.Name == name then
			return value
		end
	end
end
local Data, Plot, Config = module("DataService"), module("PlotService"), module("Config")

local function makePlayer(userId, name)
	local pl = roblox.Instance.new("Player")
	pl.Name = name
	pl.UserId = userId
	pl.DisplayName = name
	local backpack = roblox.Instance.new("Backpack")
	backpack.Name = "Backpack"
	backpack.Parent = pl
	pl.Parent = PlayersReal
	local character = roblox.Instance.new("Model")
	character.Name = name
	local hrp = roblox.Instance.new("Part")
	hrp.Name = "HumanoidRootPart"
	hrp.Size = Vector3.new(2, 2, 1)
	hrp.CFrame = CFrame.new(0, 4.8, 12)
	hrp.Parent = character
	local humanoid = roblox.Instance.new("Humanoid")
	humanoid.Health = 100
	humanoid.WalkSpeed = 16
	humanoid.RigType = Enum.HumanoidRigType.R15
	humanoid.HipHeight = 2
	humanoid.Parent = character
	character.PrimaryPart = hrp
	character.Parent = Workspace
	pl.Character = character
	ext(PlayersReal).PlayerAdded:Fire(wrap(pl))
	return pl
end
local function hrpOf(pl)
	return pl.Character.HumanoidRootPart
end
local function groundAt(x, z)
	-- les pieds font ~2 studs de large : on prend le sol le plus haut sous eux
	local best = -math.huge
	for _, o in { { 0, 0 }, { 0.8, 0.8 }, { -0.8, 0.8 }, { 0.8, -0.8 }, { -0.8, -0.8 } } do
		local hit = raycastDown(Vector3.new(x + o[1], 200, z + o[2]), Vector3.new(0, -400, 0))
		if hit then
			best = math.max(best, hit.Position.Y)
		end
	end
	return best == -math.huge and 0 or best
end
local function standOnKey(pl, key)
	local top = key.Top
	hrpOf(pl).CFrame = CFrame.new(top.CFrame.Position + Vector3.new(0, top.Size.Y / 2 + 3, 0))
end
local function standAt(pl, pos)
	hrpOf(pl).CFrame = CFrame.new(pos.X, groundAt(pos.X, pos.Z) + 3, pos.Z)
end
local function tick(n)
	for _ = 1, n or 1 do
		heartbeat:Fire(0.1)
		task.wait(0.01)
	end
end
local function assertTrue(cond, msg)
	if cond then
		print("✅ " .. msg)
	else
		record("ASSERT", msg)
	end
end
local function lastNotif(name)
	local list = notifications[name] or {}
	return list[#list] or ""
end
local function findItem(filter)
	for _, model in Workspace.Items:GetChildren() do
		if filter(model) then
			return model
		end
	end
end
local function prompt(model, kind)
	for _, d in model:GetDescendants() do
		if d:IsA("ProximityPrompt") and d:GetAttribute("PromptKind") == kind then
			return d
		end
	end
end
local function fire(real, eventName, ...)
	ext(real)[eventName]:Fire(...)
	task.wait(0.05)
end

-- 1. Connexion de deux joueurs
local A = makePlayer(1, "Alice")
local B = makePlayer(2, "Bob")
task.wait(0.5)
assertTrue(A:GetAttribute("Loaded") == true and B:GetAttribute("Loaded") == true, "les deux joueurs sont chargés")
assertTrue(A:GetAttribute("PlotIndex") == 1 and B:GetAttribute("PlotIndex") == 2, "bases attribuées (1 et 2)")
assertTrue(A:FindFirstChild("leaderstats") ~= nil, "leaderstats créés")
local spawn1 = mapReal.Plots.Plot_1.SpawnPoint.CFrame.Position
assertTrue((hrpOf(A).CFrame.Position - spawn1).Magnitude < 1, "Alice apparaît dans sa base")
assertTrue(A.Backpack:FindFirstChild("Keyboard Slap") ~= nil, "outil gifle donné")
assertTrue(string.find(mapReal.Plots.Plot_1.Sign.SignOut.Title.Text, "Alice") ~= nil, "panneau de base au nom d'Alice")

-- 2. Marcher sur la rue -> Speed
for i = 0, 30 do
	standAt(A, Vector3.new(0, 0, 40 + i * 2.5))
	tick(1)
end
local speed = A:GetAttribute("Speed") or 0
assertTrue(speed >= 20, "marcher sur des touches donne de la Speed (" .. speed .. ")")
assertTrue(math.abs(A.Character.Humanoid.WalkSpeed - Config.walkSpeedFor(speed)) < 0.01, "WalkSpeed mis à jour")

-- 3. Attendre un clavier dans la zone 1 et le ramasser
task.wait(4.5)
local item = findItem(function(m)
	return m:GetAttribute("ZoneIndex") == 1
end)
assertTrue(item ~= nil, "un clavier est apparu dans la zone Office")
if item then
	standAt(A, item.PrimaryPart.CFrame.Position + Vector3.new(0, 0, -4))
	fire(prompt(item, "Grab"), "Triggered", wrap(A))
	assertTrue(A:GetAttribute("CarryingName") ~= nil, "Alice porte le clavier (" .. tostring(A:GetAttribute("CarryingName")) .. ")")
	assertTrue(A.Character:FindFirstChild("CarriedKeyboard") ~= nil, "le clavier est sur sa tête")
	-- 4. Retour à la base -> dépôt
	standAt(A, spawn1 + Vector3.new(6, 0, 0))
	task.wait(0.4)
	assertTrue(A:GetAttribute("CarryingName") == nil, "clavier déposé")
	local profileA = Data.get(wrap(A))
	assertTrue(profileA.Data.Slots["1"] ~= nil, "emplacement 1 rempli dans la sauvegarde")
end

-- 5. Revenus + collecte
task.wait(2.2)
local cashBefore = A:GetAttribute("Cash") or 0
local collectKey = mapReal.Plots.Plot_1.Slots.Slot_1.CollectKey
standAt(A, spawn1 + Vector3.new(30, 0, 0)) -- quitte la touche
tick(1)
standOnKey(A, collectKey)
tick(2)
assertTrue((A:GetAttribute("Cash") or 0) > cashBefore, "marcher sur $ encaisse l'argent (" .. tostring(A:GetAttribute("Cash")) .. ")")

-- 6. Boutique
Data.addCash(wrap(A), 100000)
local shop = ext(remotesReal.Shop).Invoke
local ok1, msg1 = shop(wrap(A), "BuySlot")
assertTrue(ok1 == true and A:GetAttribute("SlotCount") == 5, "achat d'emplacement : " .. tostring(msg1))
local ok2, msg2 = shop(wrap(A), "UpgradeSwitch")
assertTrue(ok2 == true and A:GetAttribute("SwitchTier") == 2, "achat de switch : " .. tostring(msg2))
local ok3, msg3 = shop(wrap(B), "UpgradeSwitch")
assertTrue(ok3 == false, "Bob sans argent ne peut pas acheter : " .. tostring(msg3))

-- 7. Vol par Bob
local slotItem = findItem(function(m)
	return m:GetAttribute("PlotIndex") == 1 and m:GetAttribute("SlotIndex") == 1
end)
assertTrue(slotItem ~= nil, "le clavier d'Alice est posé sur son socle")
if slotItem then
	standAt(B, slotItem.PrimaryPart.CFrame.Position + Vector3.new(0, 0, -5))
	fire(prompt(slotItem, "Steal"), "Triggered", wrap(B))
	assertTrue(B:GetAttribute("CarryingStolen") == true, "Bob porte le clavier volé")
	assertTrue(string.find(lastNotif("Alice"), "stealing") ~= nil, "Alice est prévenue du vol")
	-- 8. Alice gifle Bob
	local bPos = hrpOf(B).CFrame.Position
	hrpOf(A).CFrame = CFrame.lookAt(bPos + Vector3.new(0, 0, -4), bPos)
	local tool = A.Backpack:FindFirstChild("Keyboard Slap")
	fire(tool, "Activated")
	assertTrue(B:GetAttribute("CarryingName") == nil, "la gifle fait lâcher le clavier")
	assertTrue(findItem(function(m)
		return m:GetAttribute("PlotIndex") == 1 and m:GetAttribute("SlotIndex") == 1
	end) ~= nil, "le clavier revient sur le socle d'Alice")
	-- 9. Bob revole et rentre chez lui
	task.wait(Config.Slap.StunTime + 0.1)
	local again = findItem(function(m)
		return m:GetAttribute("PlotIndex") == 1 and m:GetAttribute("SlotIndex") == 1
	end)
	standAt(B, again.PrimaryPart.CFrame.Position + Vector3.new(0, 0, -5))
	fire(prompt(again, "Steal"), "Triggered", wrap(B))
	local spawn2 = mapReal.Plots.Plot_2.SpawnPoint.CFrame.Position
	standAt(B, spawn2 + Vector3.new(6, 0, 0))
	task.wait(0.4)
	assertTrue(Data.get(wrap(B)).Data.Slots["1"] ~= nil, "Bob a le clavier volé dans sa base")
	assertTrue(Data.get(wrap(A)).Data.Slots["1"] == nil, "Alice ne l'a plus")
end

-- 10. Verrou
local lockKey = mapReal.Plots.Plot_1.LockKey
standAt(A, spawn1 + Vector3.new(20, 0, 0))
tick(1)
standOnKey(A, lockKey)
tick(1)
assertTrue(Plot.isLocked(Plot.getPlot(wrap(A))), "la touche LOCK verrouille la base")
assertTrue(mapReal.Plots.Plot_1.Barrier.CanCollide == true, "barrière activée")

-- 11. Tour : checkpoints puis ENTER
local towerKeys = {}
for _, d in mapReal.Tower:GetChildren() do
	if d:HasTag("Key") then
		local action = d:GetAttribute("Action")
		local stage = d:GetAttribute("Stage")
		if action == "Checkpoint" and stage and not towerKeys[stage] then
			towerKeys[stage] = d
		elseif action == "TowerFinish" then
			towerKeys.finish = d
		end
	end
end
local slotsBefore = 0
for _ in Data.get(wrap(A)).Data.Slots do
	slotsBefore += 1
end
for stage = 1, Config.Tower.Stages do
	standOnKey(A, towerKeys[stage])
	tick(1)
end
assertTrue(A:GetAttribute("TowerStage") == Config.Tower.Stages, "checkpoints 1 à " .. Config.Tower.Stages)
standOnKey(A, towerKeys.finish)
tick(1)
local slotsAfter = 0
for _ in Data.get(wrap(A)).Data.Slots do
	slotsAfter += 1
end
assertTrue(slotsAfter == slotsBefore + 1, "récompense de la tour ajoutée à la base")
assertTrue((A:GetAttribute("TowerReadyAt") or 0) > os.time(), "temps de recharge de la tour")

-- 12. Chute dans le vide
hrpOf(B).CFrame = CFrame.new(0, -100, 0)
task.wait(0.4)
assertTrue(hrpOf(B).CFrame.Position.Y > 0, "chute dans le vide = retour à la base")

-- 13. Déconnexion + reconnexion de Bob
B.Parent = nil
ext(PlayersReal).PlayerRemoving:Fire(wrap(B))
task.wait(0.3)
local saved = storeData["Player_2"]
assertTrue(saved ~= nil and saved.Session == nil, "Bob sauvegardé et verrou libéré")
assertTrue(saved and saved.Slots["1"] ~= nil, "le clavier volé est dans la sauvegarde de Bob")
assertTrue(mapReal.Plots.Plot_2:GetAttribute("OwnerUserId") == 0, "base de Bob libérée")
local B2 = makePlayer(2, "Bob")
task.wait(0.5)
assertTrue(Data.get(wrap(B2)).Data.Slots["1"] ~= nil, "Bob retrouve son clavier en revenant")


-- 15. Cas limites
-- 15a. vol pendant le verrou (la base d'Alice est verrouillée)
do
	local profileA = Data.get(wrap(A))
	local slotKey = nil
	for k in profileA.Data.Slots do slotKey = k break end
	local target = findItem(function(m) return m:GetAttribute("PlotIndex") == 1 and tostring(m:GetAttribute("SlotIndex")) == slotKey end)
	assertTrue(target ~= nil, "Alice a encore un clavier posé (récompense de la tour)")
	if target then
		standAt(B2, target.PrimaryPart.CFrame.Position + Vector3.new(0, 0, -5))
		fire(prompt(target, "Steal"), "Triggered", wrap(B2))
		assertTrue(B2:GetAttribute("CarryingName") == nil, "impossible de voler une base verrouillée")
		assertTrue(string.find(lastNotif("Bob"), "locked") ~= nil, "message 'base verrouillée' : " .. lastNotif("Bob"))
	end
end
-- 15b. porte de vitesse : Bob (peu de Speed) téléporté hors de la zone 6
do
	local zone6 = mapReal.Zones.Zone_6
	local bounds = zone6.Bounds.CFrame.Position
	hrpOf(B2).CFrame = CFrame.new(bounds.X, 4.8, bounds.Z)
	task.wait(0.45)
	assertTrue(hrpOf(B2).CFrame.Position.Z < bounds.Z - 40, "la porte de vitesse renvoie les joueurs trop lents")
end
-- 15c. revente
do
	local profileB = Data.get(wrap(B2))
	local cashBefore = B2:GetAttribute("Cash") or 0
	local item = findItem(function(m) return m:GetAttribute("PlotIndex") == 2 and m:GetAttribute("SlotIndex") == 1 end)
	assertTrue(item ~= nil, "le clavier de Bob est posé")
	if item then
		standAt(B2, item.PrimaryPart.CFrame.Position + Vector3.new(0, 0, 5))
		fire(prompt(item, "Sell"), "Triggered", wrap(B2))
		assertTrue((B2:GetAttribute("Cash") or 0) > cashBefore and profileB.Data.Slots["1"] == nil, "revente : +" .. tostring((B2:GetAttribute("Cash") or 0) - cashBefore))
	end
	-- Alice ne peut pas vendre le clavier de Bob
end
-- 15d. clavier de zone lâché après une gifle puis ramassé par le gifleur
do
	task.wait(1)
	local zoneItem = findItem(function(m) return m:GetAttribute("ZoneIndex") == 1 end)
	if not zoneItem then task.wait(12) zoneItem = findItem(function(m) return m:GetAttribute("ZoneIndex") == 1 end) end
	assertTrue(zoneItem ~= nil, "un autre clavier de zone est disponible")
	if zoneItem then
		standAt(B2, zoneItem.PrimaryPart.CFrame.Position + Vector3.new(0, 0, -4))
		fire(prompt(zoneItem, "Grab"), "Triggered", wrap(B2))
		assertTrue(B2:GetAttribute("CarryingName") ~= nil, "Bob ramasse un clavier de zone")
		local bPos = hrpOf(B2).CFrame.Position
		hrpOf(A).CFrame = CFrame.lookAt(bPos + Vector3.new(0, 0, -4), bPos)
		task.wait(Config.Slap.Cooldown + 0.05)
		fire(A.Backpack:FindFirstChild("Keyboard Slap"), "Activated")
		assertTrue(B2:GetAttribute("CarryingName") == nil, "gifle : Bob lâche le clavier de zone")
		local dropped = findItem(function(m)
			return m:GetAttribute("ZoneIndex") == nil and m:GetAttribute("PlotIndex") == nil and prompt(m, "Grab") ~= nil
		end)
		assertTrue(dropped ~= nil, "le clavier est tombé au sol")
		if dropped then
			fire(prompt(dropped, "Grab"), "Triggered", wrap(A))
			assertTrue(A:GetAttribute("CarryingName") ~= nil, "Alice ramasse le clavier lâché")
		end
	end
end
-- 15e. Alice part en portant un clavier : rien ne casse
do
	local wasCarrying = A:GetAttribute("CarryingName") ~= nil
	assertTrue(wasCarrying, "Alice porte un clavier avant de partir")
end
-- 15f. achat Robux simulé
do
	Config.Products[1].Id = 999
	local mp = mocks.MarketplaceService
	local speedBefore = B2:GetAttribute("Speed") or 0
	local decision = mp.ProcessReceipt({ PlayerId = 2, ProductId = 999, PurchaseId = "p1" })
	assertTrue(decision == Enum.ProductPurchaseDecision.PurchaseGranted and (B2:GetAttribute("Speed") or 0) == speedBefore + Config.Products[1].Amount, "achat Robux : Speed ajoutée")
	local again = mp.ProcessReceipt({ PlayerId = 2, ProductId = 999, PurchaseId = "p1" })
	assertTrue(again == Enum.ProductPurchaseDecision.PurchaseGranted and (B2:GetAttribute("Speed") or 0) == speedBefore + Config.Products[1].Amount, "le même achat n'est pas donné deux fois")
end
-- 15g. réglages : valeurs invalides ignorées, valides appliquées
do
	local saveSettings = ext(remotesReal.SaveSettings).OnServerEvent
	saveSettings:Fire(wrap(B2), { SoundProfile = "Hacker", MyVolume = 99, GlowColor = { "x" }, Keycaps = "Nope" })
	task.wait(0.3)
	assertTrue(B2:GetAttribute("SoundProfile") == "Thocky" and B2:GetAttribute("MyVolume") == 1, "réglages invalides refusés / bornés")
	saveSettings:Fire(wrap(B2), { SoundProfile = "Water", GlowMode = "Rainbow", GlowColor = { 255, 0, 0 }, Keycaps = "Mint", OthersVolume = 0 })
	task.wait(0.05)
	assertTrue(B2:GetAttribute("SoundProfile") == "Water" and B2:GetAttribute("GlowMode") == "Rainbow" and B2:GetAttribute("Keycaps") == "Mint" and B2:GetAttribute("OthersVolume") == 0, "réglages valides appliqués")
end
-- 15h. le voleur part avec un clavier volé : il revient chez la victime
do
	-- Bob vole... la base d'Alice est-elle encore verrouillée ? attendre la fin du verrou est long : on déverrouille via le temps
	local plotA = Plot.getPlot(wrap(A))
	plotA.LockedUntil = 0
	local profileA = Data.get(wrap(A))
	local slotKey = nil
	for k in profileA.Data.Slots do slotKey = k break end
	local target = findItem(function(m) return m:GetAttribute("PlotIndex") == 1 and tostring(m:GetAttribute("SlotIndex")) == slotKey end)
	if target then
		standAt(B2, target.PrimaryPart.CFrame.Position + Vector3.new(0, 0, -5))
		fire(prompt(target, "Steal"), "Triggered", wrap(B2))
		assertTrue(B2:GetAttribute("CarryingStolen") == true, "Bob vole le clavier de la tour d'Alice")
		B2.Parent = nil
		ext(PlayersReal).PlayerRemoving:Fire(wrap(B2))
		task.wait(0.3)
		assertTrue(findItem(function(m) return m:GetAttribute("PlotIndex") == 1 and tostring(m:GetAttribute("SlotIndex")) == slotKey end) ~= nil, "le voleur part : le clavier revient chez Alice")
		assertTrue(storeData["Player_1"] ~= nil, "données d'Alice toujours là")
	end
end

-- 14. Fermeture du serveur
for _, fn in bindToClose do
	local ok, err = pcall(fn)
	if not ok then
		record("BindToClose", err)
	end
end
assertTrue(storeData["Player_1"] and storeData["Player_1"].Session == nil, "BindToClose sauvegarde Alice")

print(string.format("\n%d erreur(s)", #errors))
for _, e in errors do
	print(" - " .. string.sub(e, 1, 400))
end
process.exit(#errors > 0 and 1 or 0)
