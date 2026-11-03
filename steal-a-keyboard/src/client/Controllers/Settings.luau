-- Settings.luau (client)
-- Réglages ASMR du joueur. Appliqués tout de suite sur ton écran,
-- puis envoyés au serveur (sauvegarde + visibles par les autres pour le RGB et le son).

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local SoundConfig = require(Shared:WaitForChild("SoundConfig"))
local Themes = require(Shared:WaitForChild("Themes"))

local Remotes = ReplicatedStorage:WaitForChild("Remotes")
local player = Players.LocalPlayer

local Settings = {}

local values = {
	SoundProfile = SoundConfig.DefaultProfile,
	GlowMode = Themes.DefaultGlowMode,
	GlowColor = Color3.fromRGB(0, 230, 255),
	Keycaps = Themes.DefaultKeycaps,
	MyVolume = 0.8,
	OthersVolume = 0.5,
	MusicVolume = SoundConfig.MusicVolume,
}

local changedEvent = Instance.new("BindableEvent")
Settings.Changed = changedEvent.Event -- (clé, valeur)

local sendScheduled = false

local function send()
	local c = values.GlowColor
	Remotes.SaveSettings:FireServer({
		SoundProfile = values.SoundProfile,
		GlowMode = values.GlowMode,
		GlowColor = { math.floor(c.R * 255 + 0.5), math.floor(c.G * 255 + 0.5), math.floor(c.B * 255 + 0.5) },
		Keycaps = values.Keycaps,
		MyVolume = values.MyVolume,
		OthersVolume = values.OthersVolume,
		MusicVolume = values.MusicVolume,
	})
end

function Settings.get(key: string)
	return values[key]
end

function Settings.set(key: string, value)
	values[key] = value
	changedEvent:Fire(key, value)
	if not sendScheduled then
		sendScheduled = true
		task.delay(0.6, function()
			sendScheduled = false
			send()
		end)
	end
end

-- Récupère les réglages sauvegardés (attributs posés par le serveur au chargement)
local function pull()
	for key in values do
		local value = player:GetAttribute(key)
		if value ~= nil then
			values[key] = value
			changedEvent:Fire(key, value)
		end
	end
end

function Settings.init()
	if player:GetAttribute("Loaded") then
		pull()
	else
		local connection
		connection = player:GetAttributeChangedSignal("Loaded"):Connect(function()
			if player:GetAttribute("Loaded") then
				connection:Disconnect()
				pull()
			end
		end)
	end
end

return Settings
