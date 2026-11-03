-- WorldController.luau
-- Effets du monde sur TON écran : portes de vitesse ouvertes si tu as assez de Speed,
-- passage à travers ta propre barrière LOCK, invites "Maintenir E" filtrées,
-- claviers arc-en-ciel / RGB animés, keycaps géantes qui flottent.

local CollectionService = game:GetService("CollectionService")
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")

local WorldController = {}

local player = Players.LocalPlayer

local function myPlot()
	local plots = workspace:FindFirstChild("Map") and workspace.Map:FindFirstChild("Plots")
	if not plots then
		return nil
	end
	for _, plot in plots:GetChildren() do
		if plot:GetAttribute("OwnerUserId") == player.UserId then
			return plot
		end
	end
	return nil
end

local function plotByIndex(index)
	local plots = workspace:FindFirstChild("Map") and workspace.Map:FindFirstChild("Plots")
	return plots and plots:FindFirstChild("Plot_" .. tostring(index))
end

local function isLocked(plot): boolean
	return plot ~= nil and (plot:GetAttribute("LockedUntil") or 0) > workspace:GetServerTimeNow()
end

-- Portes de vitesse + ta barrière
local function updateBarriers()
	local speed = player:GetAttribute("Speed") or 0
	for _, gate in CollectionService:GetTagged("SpeedGate") do
		if gate:IsA("BasePart") then
			local open = speed >= (gate:GetAttribute("Required") or 0)
			gate.CanCollide = not open
			gate.Transparency = open and 0.88 or 0.55
			local gui = gate:FindFirstChild("SignGui")
			local line = gui and gui:FindFirstChild("Line2")
			if line then
				line.Text = open and "OPEN ✅" or "NEEDED"
			end
		end
	end
	local plot = myPlot()
	local barrier = plot and plot:FindFirstChild("Barrier")
	if barrier and barrier.CanCollide then
		barrier.CanCollide = false -- le propriétaire passe à travers son propre verrou
	end
end

-- N'affiche que les invites qui te concernent (le serveur revérifie tout)
local function updatePrompts()
	local carrying = player:GetAttribute("CarryingName") ~= nil
	for _, prompt in CollectionService:GetTagged("ItemPrompt") do
		if prompt:IsA("ProximityPrompt") then
			local kind = prompt:GetAttribute("PromptKind")
			local model = prompt.Parent and prompt.Parent.Parent
			local owner = model and model:GetAttribute("OwnerUserId")
			local enabled
			if kind == "Steal" then
				enabled = not carrying and owner ~= player.UserId and not isLocked(plotByIndex(model:GetAttribute("PlotIndex")))
			elseif kind == "Sell" then
				enabled = owner == player.UserId
			else -- Grab
				enabled = not carrying
			end
			if prompt.Enabled ~= enabled then
				prompt.Enabled = enabled
			end
		end
	end
end

-- Claviers RGB et mutation Rainbow
local function animateItems(clock: number)
	for _, glow in CollectionService:GetTagged("ItemGlow") do
		if glow:IsA("BasePart") and glow:GetAttribute("Rgb") then
			glow.Color = Color3.fromHSV((clock * 0.25 + glow.Position.X * 0.02) % 1, 0.9, 1)
		end
	end
	for _, model in CollectionService:GetTagged("RainbowItem") do
		local i = 0
		for _, part in model:GetChildren() do
			if part.Name == "K" and part:IsA("BasePart") then
				i += 1
				part.Color = Color3.fromHSV((clock * 0.4 + i * 0.07) % 1, 0.75, 1)
			end
		end
	end
end

-- Keycaps géantes qui flottent doucement
local floating = {}
local function trackFloating(model: Instance)
	if model:IsA("Model") and not floating[model] then
		floating[model] = { Base = model:GetPivot(), Offset = model:GetAttribute("BobOffset") or 0 }
	end
end

function WorldController.init()
	for _, model in CollectionService:GetTagged("FloatingDecor") do
		trackFloating(model)
	end
	CollectionService:GetInstanceAddedSignal("FloatingDecor"):Connect(trackFloating)

	task.spawn(function()
		while true do
			task.wait(0.2)
			updateBarriers()
			updatePrompts()
		end
	end)

	local itemTimer = 0
	RunService.Heartbeat:Connect(function(dt)
		local clock = os.clock()
		itemTimer += dt
		if itemTimer >= 0.05 then
			itemTimer = 0
			animateItems(clock)
		end
		for model, info in floating do
			if model.Parent then
				local t = clock * 0.5 + info.Offset
				model:PivotTo(info.Base * CFrame.new(0, math.sin(t) * 2.5, 0) * CFrame.Angles(0, t * 0.15, 0))
			else
				floating[model] = nil
			end
		end
	end)
end

return WorldController
