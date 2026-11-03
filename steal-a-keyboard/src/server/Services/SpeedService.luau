-- SpeedService.luau
-- ⚡ Chaque touche sous tes pieds = de la Speed. Le serveur mesure la distance
-- parcourue SUR des touches (anti-triche : il ne fait pas confiance au client).
-- Il déclenche aussi les touches spéciales : $ (collecte), LOCK, checkpoints, ENTER.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))

local SpeedService = {}
local Game

local TICK = 0.1
local states = {} -- [player] = { LastPos, Accum, CurrentKey, LastRepeat }
local rayParams = RaycastParams.new()
rayParams.FilterType = Enum.RaycastFilterType.Include
local FOOT_OFFSETS = {
	Vector3.zero,
	Vector3.new(0.6, 0, 0.6),
	Vector3.new(-0.6, 0, 0.6),
	Vector3.new(0.6, 0, -0.6),
	Vector3.new(-0.6, 0, -0.6),
}

function SpeedService.applyWalkSpeed(player: Player)
	local character = player.Character
	local humanoid = character and character:FindFirstChildOfClass("Humanoid")
	if not humanoid then
		return
	end
	local walkSpeed = Config.walkSpeedFor(player:GetAttribute("Speed") or 0)
	if Game.Carry.isCarrying(player) then
		walkSpeed *= Config.Speed.CarryMultiplier
	end
	if Game.Carry.isStunned(player) then
		walkSpeed = 0
	end
	if math.abs(humanoid.WalkSpeed - walkSpeed) > 0.01 then
		humanoid.WalkSpeed = walkSpeed
	end
end

local function onStep(player: Player, key: Model)
	local action = key:GetAttribute("Action")
	if action == "Collect" then
		Game.Plot.collectByKey(player, key)
	elseif action == "Lock" then
		Game.Plot.lockByKey(player, key)
	elseif action == "Checkpoint" then
		Game.Tower.checkpoint(player, key:GetAttribute("Stage"))
	elseif action == "TowerFinish" then
		Game.Tower.finish(player)
	end
	if key:GetAttribute("Area") ~= "Tower" then
		Game.Tower.leave(player)
	end
end

local function update(dt: number)
	for _, player in Players:GetPlayers() do
		local profile = player:GetAttribute("Loaded") and Game.Data.get(player)
		local character = player.Character
		local root = character and character:FindFirstChild("HumanoidRootPart")
		local humanoid = character and character:FindFirstChildOfClass("Humanoid")
		if profile and root and humanoid and humanoid.Health > 0 then
			local state = states[player]
			if not state then
				state = { LastPos = nil, Accum = 0, CurrentKey = nil, LastRepeat = 0 }
				states[player] = state
			end
			local position = root.Position

			-- quelle touche est sous les pieds ? (plusieurs rayons : le centre du
			-- personnage peut tomber pile dans l'espace entre deux touches)
			local key = nil
			local legs = humanoid.RigType == Enum.HumanoidRigType.R15 and humanoid.HipHeight or 2
			local maxDistance = root.Size.Y / 2 + legs + 1.25
			for _, offset in FOOT_OFFSETS do
				local result = workspace:Raycast(position + offset, Vector3.new(0, -8, 0), rayParams)
				if result and result.Distance <= maxDistance then
					local parent = result.Instance.Parent
					if parent and parent:HasTag("Key") then
						key = parent
						break
					end
				end
			end

			-- distance parcourue sur des touches -> appuis -> Speed
			if key and state.LastPos then
				local delta = Vector3.new(position.X - state.LastPos.X, 0, position.Z - state.LastPos.Z).Magnitude
				delta = math.min(delta, humanoid.WalkSpeed * dt * 1.5 + 1)
				state.Accum += delta
				local presses = math.floor(state.Accum / Config.Speed.KeyStep)
				if presses > 0 then
					state.Accum -= presses * Config.Speed.KeyStep
					local switch = Config.Switches[profile.Data.SwitchTier] or Config.Switches[1]
					-- le bonus x3 ne marche que sur la piste de TA base
					local ownTraining = key:GetAttribute("Training") and key:GetAttribute("PlotIndex") == player:GetAttribute("PlotIndex")
					local multiplier = ownTraining and Config.Speed.TrainingMultiplier or 1
					Game.Data.addSpeed(player, presses * switch.Gain * multiplier)
					SpeedService.applyWalkSpeed(player)
				end
			end
			state.LastPos = position

			-- touches spéciales
			if key ~= state.CurrentKey then
				state.CurrentKey = key
				state.LastRepeat = os.clock()
				if key then
					onStep(player, key)
				end
			elseif key and key:GetAttribute("Action") == "Collect" and os.clock() - state.LastRepeat > 1 then
				state.LastRepeat = os.clock()
				onStep(player, key) -- rester sur la touche $ continue de collecter
			end
		end
	end
end

function SpeedService.onPlayerRemoving(player: Player)
	states[player] = nil
end

function SpeedService.init(registry)
	Game = registry
	rayParams.FilterDescendantsInstances = { Game.World.Map }
	local elapsed = 0
	RunService.Heartbeat:Connect(function(dt)
		elapsed += dt
		if elapsed >= TICK then
			local step = math.min(elapsed, 0.5)
			elapsed = 0
			update(step)
		end
	end)
end

return SpeedService
