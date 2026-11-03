-- Main.server.luau
-- Démarre tous les services du serveur dans le bon ordre.
-- Chaque service reçoit la table `Game` pour appeler les autres (Game.Plot, Game.Carry...).

local Services = script.Parent:WaitForChild("Services")

local Game = {
	World = require(Services:WaitForChild("WorldService")),
	Data = require(Services:WaitForChild("DataService")),
	Player = require(Services:WaitForChild("PlayerService")),
	Plot = require(Services:WaitForChild("PlotService")),
	Zone = require(Services:WaitForChild("ZoneService")),
	Carry = require(Services:WaitForChild("CarryService")),
	Speed = require(Services:WaitForChild("SpeedService")),
	Shop = require(Services:WaitForChild("ShopService")),
	Tower = require(Services:WaitForChild("TowerService")),
}

Game.World.init(Game)
Game.Data.init(Game)
Game.Plot.init(Game)
Game.Zone.init(Game)
Game.Carry.init(Game)
Game.Speed.init(Game)
Game.Shop.init(Game)
Game.Tower.init(Game)
Game.Player.init(Game) -- en dernier : commence à accueillir les joueurs

print("⌨️ Steal a Keyboard : serveur prêt")
