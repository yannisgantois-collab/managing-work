-- LeaderboardService.luau
-- 🏆 Les deux panneaux de la place centrale : TOP EARNERS (argent gagné au total)
-- et TOP THIEVES (nombre de vols réussis). Classements de tous les serveurs
-- (OrderedDataStore) : ils ne marchent que dans un jeu publié.

local DataStoreService = game:GetService("DataStoreService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Format = require(Shared:WaitForChild("Format"))

local LeaderboardService = {}
local Game

local BOARDS = {
	{
		Key = "Earned",
		BoardName = "RichestBoard",
		Value = function(data)
			return data.Stats.TotalEarned or 0
		end,
		Format = function(value)
			return Format.cash(value)
		end,
	},
	{
		Key = "Steals",
		BoardName = "ThievesBoard",
		Value = function(data)
			return data.Stats.Steals or 0
		end,
		Format = function(value)
			return Format.short(value) .. " steals"
		end,
	},
}

local stores = {}
local nameCache = {}

local function getStore(board)
	if stores[board.Key] == nil then
		local ok, store = pcall(function()
			return DataStoreService:GetOrderedDataStore("LB_" .. board.Key .. "_" .. Config.Leaderboards.Version)
		end)
		stores[board.Key] = ok and store or false
	end
	return stores[board.Key] or nil
end

local function setRows(board, lines)
	local plaza = Game.World.Map:FindFirstChild("Plaza")
	local part = plaza and plaza:FindFirstChild(board.BoardName)
	if not part then
		return
	end
	for _, guiName in { "BoardFront", "BoardBack" } do
		local gui = part:FindFirstChild(guiName)
		if gui then
			for i = 1, 10 do
				local row = gui:FindFirstChild("Row" .. i)
				if row then
					row.Text = lines[i] or ""
				end
			end
		end
	end
end

local function nameOf(userId: number): string
	if nameCache[userId] then
		return nameCache[userId]
	end
	local player = Players:GetPlayerByUserId(userId)
	if player then
		nameCache[userId] = player.DisplayName
		return player.DisplayName
	end
	local ok, name = pcall(function()
		return Players:GetNameFromUserIdAsync(userId)
	end)
	if ok and type(name) == "string" then
		nameCache[userId] = name
		return name
	end
	return "Player"
end

-- Envoie les scores d'un joueur (appelé régulièrement et quand il quitte)
function LeaderboardService.submit(player: Player)
	local profile = Game.Data.get(player)
	if not profile or not profile.CanSave then
		return -- pas de scores pour les parties de test sans sauvegarde
	end
	for _, board in BOARDS do
		local store = getStore(board)
		local value = math.floor(board.Value(profile.Data))
		if store and value > 0 then
			local ok, err = pcall(function()
				store:SetAsync(tostring(player.UserId), value)
			end)
			if not ok then
				warn("[Leaderboard] Envoi impossible :", err)
			end
		end
	end
end

-- Relit le top 10 et met à jour les panneaux
function LeaderboardService.refresh()
	for _, board in BOARDS do
		local store = getStore(board)
		local lines = {}
		local ok, entries = false, nil
		if store then
			ok, entries = pcall(function()
				return store:GetSortedAsync(false, math.clamp(Config.Leaderboards.Size, 1, 10)):GetCurrentPage()
			end)
		end
		if ok and type(entries) == "table" then
			for rank, entry in entries do
				local userId = tonumber(entry.key)
				lines[rank] = string.format("%d. %s  —  %s", rank, userId and nameOf(userId) or "?", board.Format(entry.value))
			end
			if #entries == 0 then
				lines[1] = "No scores yet. Be the first!"
			end
		else
			lines[1] = "Publish the game to see the leaderboard"
		end
		setRows(board, lines)
	end
end

function LeaderboardService.init(registry)
	Game = registry
	task.spawn(function()
		task.wait(5)
		while true do
			LeaderboardService.refresh()
			task.wait(Config.Leaderboards.RefreshInterval)
		end
	end)
	task.spawn(function()
		while true do
			task.wait(Config.Leaderboards.SaveInterval)
			for player in Game.Data.Profiles do
				task.spawn(LeaderboardService.submit, player)
			end
		end
	end)
end

return LeaderboardService
