-- Themes.luau
-- 🎨 Couleurs personnalisables (gratuites, comme dans la vidéo).
-- Couleurs écrites {R, G, B} de 0 à 255.

local Themes = {}

-- Couleur des keycaps (place, rue, bases, tour). Chaque joueur choisit la sienne,
-- elle ne change que sur SON écran.
Themes.Keycaps = {
	{ Name = "Classic", Cap = { 236, 238, 242 }, Top = { 250, 251, 253 } },
	{ Name = "Midnight", Cap = { 34, 35, 42 }, Top = { 48, 50, 60 } },
	{ Name = "Pastel", Cap = { 255, 200, 225 }, Top = { 255, 222, 238 } },
	{ Name = "Mint", Cap = { 170, 235, 205 }, Top = { 205, 248, 228 } },
	{ Name = "Ocean", Cap = { 120, 170, 235 }, Top = { 160, 200, 250 } },
	{ Name = "Retro", Cap = { 222, 204, 170 }, Top = { 238, 225, 196 } },
	{ Name = "Lava", Cap = { 235, 95, 60 }, Top = { 255, 140, 90 } },
}
Themes.DefaultKeycaps = "Classic"

-- Couleurs d'underglow RGB proposées (en plus de "Auto" et "Rainbow")
Themes.GlowColors = {
	{ 255, 60, 60 },
	{ 255, 150, 40 },
	{ 255, 230, 50 },
	{ 60, 255, 120 },
	{ 0, 230, 255 },
	{ 60, 110, 255 },
	{ 180, 80, 255 },
	{ 255, 80, 200 },
	{ 255, 255, 255 },
}
Themes.DefaultGlowMode = "Auto" -- "Auto" (couleur de la zone), "Color" ou "Rainbow"

-- Couleur d'accent de chaque base (8 bases)
Themes.PlotAccents = {
	{ 255, 80, 80 },
	{ 255, 170, 50 },
	{ 255, 235, 70 },
	{ 80, 240, 120 },
	{ 0, 220, 255 },
	{ 90, 120, 255 },
	{ 190, 90, 255 },
	{ 255, 90, 200 },
}

-- Couleurs de l'interface
Themes.Ui = {
	Panel = { 22, 22, 30 },
	PanelLight = { 38, 38, 52 },
	Text = { 255, 255, 255 },
	Muted = { 175, 175, 195 },
	Cash = { 90, 235, 120 },
	Speed = { 90, 200, 255 },
	Warn = { 255, 90, 90 },
	Gold = { 255, 205, 60 },
	Button = { 70, 140, 255 },
	ButtonGreen = { 60, 200, 110 },
	ButtonRed = { 230, 70, 80 },
}

function Themes.findKeycaps(name: string?)
	for _, theme in Themes.Keycaps do
		if theme.Name == name then
			return theme
		end
	end
	return Themes.Keycaps[1]
end

return Themes
