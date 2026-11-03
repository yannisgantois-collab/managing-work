-- tools/build-map.luau
-- Génère build/Map.rbxm à partir de src/shared/MapGenerator.luau
-- Utilisation (depuis le dossier steal-a-keyboard) : lune run tools/build-map.luau

local roblox = require("@lune/roblox")
local fs = require("@lune/fs")

local Config = require("../src/shared/Config")
local Themes = require("../src/shared/Themes")
local MapGenerator = require("../src/shared/MapGenerator")

local env = {
	Instance = roblox.Instance,
	Vector3 = roblox.Vector3,
	CFrame = roblox.CFrame,
	Color3 = roblox.Color3,
	Enum = roblox.Enum,
	UDim2 = roblox.UDim2,
	Font = roblox.Font,
}

local map, stats = MapGenerator.build(env, Config, Themes)

local parts, models = 0, 0
for _, descendant in map:GetDescendants() do
	if descendant:IsA("BasePart") then
		parts += 1
	elseif descendant:IsA("Model") then
		models += 1
	end
end

if not fs.isDir("build") then
	fs.writeDir("build")
end
fs.writeFile("build/Map.rbxm", roblox.serializeModel({ map }))
print(string.format("Map générée : %d pièces, %d touches, %d modèles -> build/Map.rbxm", parts, stats.Keys, models))
