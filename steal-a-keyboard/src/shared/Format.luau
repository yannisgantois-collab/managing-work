-- Format.luau
-- Affichage des nombres : 1234 -> "1.23K", 2500000 -> "2.5M"

local Format = {}

local SUFFIXES = { "", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc" }

function Format.short(value: number): string
	if value ~= value then -- NaN
		return "0"
	end
	local negative = value < 0
	value = math.abs(value)
	local index = 1
	while value >= 1000 and index < #SUFFIXES do
		value /= 1000
		index += 1
	end
	local text
	if index == 1 then
		text = tostring(math.floor(value))
	elseif value >= 100 then
		text = string.format("%d", math.floor(value))
	elseif value >= 10 then
		text = string.format("%.1f", math.floor(value * 10) / 10)
	else
		text = string.format("%.2f", math.floor(value * 100) / 100)
	end
	-- enlève les zéros inutiles : "2.50" -> "2.5", "3.00" -> "3"
	if string.find(text, "%.") then
		text = string.gsub(text, "0+$", "")
		text = string.gsub(text, "%.$", "")
	end
	return (negative and "-" or "") .. text .. SUFFIXES[index]
end

function Format.cash(value: number): string
	return "$" .. Format.short(value)
end

-- 1234567 -> "1,234,567"
function Format.commas(value: number): string
	local text = tostring(math.floor(value))
	local result = text
	while true do
		local replaced, count = string.gsub(result, "^(-?%d+)(%d%d%d)", "%1,%2")
		result = replaced
		if count == 0 then
			break
		end
	end
	return result
end

-- 75 -> "1:15"
function Format.time(seconds: number): string
	seconds = math.max(0, math.floor(seconds))
	local minutes = math.floor(seconds / 60)
	return string.format("%d:%02d", minutes, seconds % 60)
end

return Format
