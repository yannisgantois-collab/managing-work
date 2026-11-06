-- Main.client.luau
-- Démarre tout ce qui tourne sur l'écran du joueur.

local Players = game:GetService("Players")
local UserInputService = game:GetService("UserInputService")

local Controllers = script.Parent:WaitForChild("Controllers")
local UI = Controllers:WaitForChild("UI")

local SoundController = require(Controllers:WaitForChild("SoundController"))
local Settings = require(Controllers:WaitForChild("Settings"))
local KeyEngine = require(Controllers:WaitForChild("KeyEngine"))
local WorldController = require(Controllers:WaitForChild("WorldController"))
local Hud = require(UI:WaitForChild("Hud"))
local ShopPanel = require(UI:WaitForChild("ShopPanel"))
local SettingsPanel = require(UI:WaitForChild("SettingsPanel"))
local IndexPanel = require(UI:WaitForChild("IndexPanel"))

local player = Players.LocalPlayer

SoundController.init()
Settings.init()

local function applyVolumes()
	SoundController.setVolumes(Settings.get("MyVolume"), Settings.get("OthersVolume"), Settings.get("MusicVolume"))
end
applyVolumes()
Settings.Changed:Connect(function(key)
	if key == "MyVolume" or key == "OthersVolume" or key == "MusicVolume" then
		applyVolumes()
	end
end)

KeyEngine.init(SoundController, Settings)
WorldController.init()

local gui = Hud.init({
	SoundController = SoundController,
	onShop = function()
		SettingsPanel.close()
		IndexPanel.close()
		ShopPanel.toggle()
	end,
	onIndex = function()
		ShopPanel.close()
		SettingsPanel.close()
		IndexPanel.toggle()
	end,
	onSettings = function()
		ShopPanel.close()
		IndexPanel.close()
		SettingsPanel.toggle()
	end,
})
ShopPanel.init(gui, Hud)
SettingsPanel.init(gui, Settings, SoundController)
IndexPanel.init(gui)

-- Raccourcis PC : B = boutique, N = réglages ASMR, J = index
UserInputService.InputBegan:Connect(function(input, processed)
	if processed then
		return
	end
	if input.KeyCode == Enum.KeyCode.B then
		SettingsPanel.close()
		IndexPanel.close()
		ShopPanel.toggle()
	elseif input.KeyCode == Enum.KeyCode.N then
		ShopPanel.close()
		IndexPanel.close()
		SettingsPanel.toggle()
	elseif input.KeyCode == Enum.KeyCode.J then
		ShopPanel.close()
		SettingsPanel.close()
		IndexPanel.toggle()
	end
end)

print("⌨️ Steal a Keyboard : client prêt pour", player.Name)
