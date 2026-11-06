-- EventService.luau
-- 🎉 Événements automatiques pour tout le serveur : Double Speed, Double Cash,
-- Golden Hour (mutations x3), Keyboard Rain (apparitions x4).
-- Les réglages sont dans Config.Events.

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))

local EventService = {}
local Game

local current = nil -- { Id, Name, EndsAt, Token }
local rng = Random.new()

local function find(id: string)
	for _, event in Config.Events.List do
		if event.Id == id then
			return event
		end
	end
	return nil
end

function EventService.isActive(id: string): boolean
	return current ~= nil and current.Id == id
end

function EventService.getCurrent()
	return current
end

-- L'interface lit ces attributs (posés sur ReplicatedStorage, visibles par tous)
local function publish()
	ReplicatedStorage:SetAttribute("EventId", current and current.Id or nil)
	ReplicatedStorage:SetAttribute("EventName", current and current.Name or nil)
	ReplicatedStorage:SetAttribute("EventDescription", current and current.Description or nil)
	ReplicatedStorage:SetAttribute("EventEndsAt", current and current.EndsAt or nil)
end

function EventService.stop(silent: boolean?)
	if not current then
		return
	end
	local name = current.Name
	current = nil
	publish()
	Game.Bonus.syncAll()
	if not silent then
		Game.Player.notifyAll(name .. " is over! Next event soon 👀", "Info")
	end
end

-- Lance un événement (aussi utilisable pour tester : EventService.start("DoubleCash", 60))
function EventService.start(id: string, duration: number?): boolean
	local event = find(id)
	if not event then
		return false
	end
	if current then
		EventService.stop(true)
	end
	local length = duration or Config.Events.Duration
	local token = {}
	current = {
		Id = event.Id,
		Name = event.Name,
		Description = event.Description,
		EndsAt = workspace:GetServerTimeNow() + length,
		Token = token,
	}
	publish()
	Game.Bonus.syncAll()
	if id == "KeyboardRain" then
		Game.Zone.hurrySpawns()
	end
	Game.Player.notifyAll("🎉 EVENT: " .. event.Name .. " — " .. event.Description, "Rare")
	task.delay(length, function()
		if current and current.Token == token then
			EventService.stop(false)
		end
	end)
	return true
end

function EventService.init(registry)
	Game = registry
	if not Config.Events.Enabled or #Config.Events.List == 0 then
		return
	end
	task.spawn(function()
		task.wait(Config.Events.FirstDelay)
		local lastId = nil
		while true do
			local choices = {}
			for _, event in Config.Events.List do
				if event.Id ~= lastId or #Config.Events.List == 1 then
					table.insert(choices, event)
				end
			end
			local pick = choices[rng:NextInteger(1, #choices)]
			lastId = pick.Id
			EventService.start(pick.Id)
			task.wait(Config.Events.Interval)
		end
	end)
end

return EventService
