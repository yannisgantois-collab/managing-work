-- SoundController.luau
-- 🎧 Joue les sons ASMR : tes touches (son "2D", toujours net), celles des autres
-- joueurs (son "3D" positionné dans le monde), les effets et la musique.

local ContentProvider = game:GetService("ContentProvider")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local SoundService = game:GetService("SoundService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local SoundConfig = require(Shared:WaitForChild("SoundConfig"))

local SoundController = {}

local volumes = { My = 0.8, Others = 0.5, Music = SoundConfig.MusicVolume }
local random = Random.new()

local folder2D: Folder
local pools = {} -- [soundId] = { Sounds = {Sound}, Index = 0 }
local emitters = {} -- sons 3D : { Attachment, Sound }
local emitterIndex = 0
local profiles = {} -- [nom] = { Press = {entrée}, Release = {entrée} }
local effects = {} -- [nom] = { entrée }
local music: Sound? = nil
local musicIndex = 0

-- Une "entrée" = { Id, Speed, Volume }
local function entriesFor(ids, volume: number, fallback)
	local list = {}
	for _, id in ids do
		if type(id) == "string" and id ~= "" then
			table.insert(list, { Id = id, Speed = 1, Volume = volume })
		end
	end
	if #list == 0 and fallback then
		table.insert(list, { Id = fallback.Id, Speed = fallback.Speed or 1, Volume = fallback.Volume or volume })
	end
	return list
end

local function getPool(id: string)
	local pool = pools[id]
	if pool then
		return pool
	end
	pool = { Sounds = {}, Index = 0 }
	for i = 1, 8 do
		local sound = Instance.new("Sound")
		sound.Name = "Pool" .. i
		sound.SoundId = id
		sound.Parent = folder2D
		table.insert(pool.Sounds, sound)
	end
	pools[id] = pool
	return pool
end

local function play2D(entry, volume: number, pitchJitter: number)
	local pool = getPool(entry.Id)
	pool.Index = pool.Index % #pool.Sounds + 1
	local sound = pool.Sounds[pool.Index]
	sound.Volume = entry.Volume * volume
	sound.PlaybackSpeed = entry.Speed * (1 + random:NextNumber(-pitchJitter, pitchJitter))
	sound.TimePosition = 0
	sound:Play()
end

local function play3D(entry, volume: number, position: Vector3, pitchJitter: number)
	emitterIndex = emitterIndex % #emitters + 1
	local emitter = emitters[emitterIndex]
	emitter.Attachment.Position = position -- l'attachement est dans Terrain : position = monde
	local sound = emitter.Sound
	if sound.SoundId ~= entry.Id then
		sound.SoundId = entry.Id
	end
	sound.Volume = entry.Volume * volume
	sound.PlaybackSpeed = entry.Speed * (1 + random:NextNumber(-pitchJitter, pitchJitter))
	sound.TimePosition = 0
	sound:Play()
end

function SoundController.setVolumes(my: number?, others: number?, musicVolume: number?)
	if my then
		volumes.My = my
	end
	if others then
		volumes.Others = others
	end
	if musicVolume then
		volumes.Music = musicVolume
		if music then
			music.Volume = musicVolume
		end
	end
end

function SoundController.hasMusic(): boolean
	return #SoundConfig.Music > 0
end

-- Son d'une touche. isLocal = c'est TA touche (son net) ; sinon son 3D.
function SoundController.playKey(profileName: string?, isRelease: boolean, position: Vector3?, isLocal: boolean)
	local profile = profiles[profileName or ""] or profiles[SoundConfig.DefaultProfile]
	if not profile then
		return
	end
	local list = isRelease and profile.Release or profile.Press
	if #list == 0 then
		return
	end
	local entry = list[random:NextInteger(1, #list)]
	if isLocal or not position then
		if volumes.My > 0 then
			play2D(entry, volumes.My, 0.06)
		end
	elseif volumes.Others > 0 then
		play3D(entry, volumes.Others, position, 0.08)
	end
end

function SoundController.playEffect(name: string, position: Vector3?)
	local list = effects[name]
	if not list or #list == 0 then
		return
	end
	local entry = list[random:NextInteger(1, #list)]
	if position then
		play3D(entry, 1, position, 0.03)
	else
		play2D(entry, 1, 0.03)
	end
end

local function startMusic()
	if #SoundConfig.Music == 0 then
		return
	end
	music = Instance.new("Sound")
	music.Name = "Music"
	music.Volume = volumes.Music
	music.Parent = SoundService
	local function playNext()
		musicIndex = musicIndex % #SoundConfig.Music + 1
		music.SoundId = SoundConfig.Music[musicIndex]
		music:Play()
	end
	music.Ended:Connect(playNext)
	playNext()
end

function SoundController.init()
	folder2D = Instance.new("Folder")
	folder2D.Name = "KeySounds"
	folder2D.Parent = SoundService

	for name, profile in SoundConfig.Profiles do
		local release = profile.Release
		if #release == 0 then
			release = SoundConfig.SharedRelease
		end
		profiles[name] = {
			Press = entriesFor(profile.Press, profile.Volume or 0.8, profile.Fallback),
			Release = entriesFor(release, (profile.Volume or 0.8) * 0.45, SoundConfig.ReleaseFallback),
		}
	end
	for name, effect in SoundConfig.Effects do
		effects[name] = entriesFor(effect.Ids, effect.Volume or 0.8, effect.Fallback)
	end

	local terrain = workspace:FindFirstChildOfClass("Terrain")
	for i = 1, 16 do
		local attachment = Instance.new("Attachment")
		attachment.Name = "KeySoundEmitter" .. i
		attachment.Parent = terrain
		local sound = Instance.new("Sound")
		sound.RollOffMode = Enum.RollOffMode.InverseTapered
		sound.RollOffMinDistance = 8
		sound.RollOffMaxDistance = 80
		sound.Parent = attachment
		table.insert(emitters, { Attachment = attachment, Sound = sound })
	end

	-- précharge tous les sons pour éviter le délai du premier clic
	task.spawn(function()
		local preload = {}
		for _, profile in profiles do
			for _, entry in profile.Press do
				table.insert(preload, getPool(entry.Id).Sounds[1])
			end
			for _, entry in profile.Release do
				table.insert(preload, getPool(entry.Id).Sounds[1])
			end
		end
		for _, list in effects do
			for _, entry in list do
				table.insert(preload, getPool(entry.Id).Sounds[1])
			end
		end
		pcall(function()
			ContentProvider:PreloadAsync(preload)
		end)
	end)

	startMusic()
end

return SoundController
