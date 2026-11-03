-- WorldService.luau
-- 🌍 Prépare le monde : map (secours si absente), dossiers, nuages, collisions.

local Players = game:GetService("Players")
local PhysicsService = game:GetService("PhysicsService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Themes = require(Shared:WaitForChild("Themes"))

local WorldService = {}

function WorldService.init()
	-- Map : normalement déjà dans le fichier (générée par tools/build-map.luau).
	-- Si quelqu'un l'a supprimée, on la reconstruit au lancement.
	local map = workspace:FindFirstChild("Map")
	if not map then
		warn("[World] Workspace.Map introuvable : génération de la map au lancement...")
		local MapGenerator = require(Shared:WaitForChild("MapGenerator"))
		map = MapGenerator.build({
			Instance = Instance,
			Vector3 = Vector3,
			CFrame = CFrame,
			Color3 = Color3,
			Enum = Enum,
			UDim2 = UDim2,
			Font = Font,
		}, Config, Themes)
		map.Parent = workspace
	end
	WorldService.Map = map

	-- Dossier des claviers (posés, portés, lâchés)
	local items = workspace:FindFirstChild("Items")
	if not items then
		items = Instance.new("Folder")
		items.Name = "Items"
		items.Parent = workspace
	end
	WorldService.Items = items

	-- Nuages du coucher de soleil
	local terrain = workspace:FindFirstChildOfClass("Terrain")
	if terrain and not terrain:FindFirstChildOfClass("Clouds") then
		local clouds = Instance.new("Clouds")
		clouds.Cover = 0.5
		clouds.Density = 0.55
		clouds.Color = Color3.fromRGB(255, 232, 222)
		clouds.Parent = terrain
	end

	-- Anti-troll : les joueurs se traversent (pas de fling possible)
	pcall(function()
		PhysicsService:RegisterCollisionGroup("Players")
	end)
	PhysicsService:CollisionGroupSetCollidable("Players", "Players", false)

	Players.RespawnTime = Config.World.RespawnTime
end

return WorldService
