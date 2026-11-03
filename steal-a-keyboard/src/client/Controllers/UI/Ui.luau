-- Ui.luau
-- Petits outils pour construire l'interface en code (pas besoin de Studio).

local TweenService = game:GetService("TweenService")

local Ui = {}

Ui.Font = Enum.Font.FredokaOne
Ui.FontBody = Enum.Font.GothamBold

Ui.Colors = {
	Panel = Color3.fromRGB(22, 22, 32),
	PanelLight = Color3.fromRGB(40, 40, 58),
	Text = Color3.fromRGB(255, 255, 255),
	Muted = Color3.fromRGB(175, 175, 200),
	Cash = Color3.fromRGB(90, 235, 120),
	Speed = Color3.fromRGB(90, 200, 255),
	Warn = Color3.fromRGB(255, 90, 90),
	Gold = Color3.fromRGB(255, 205, 60),
	Blue = Color3.fromRGB(70, 140, 255),
	Green = Color3.fromRGB(60, 200, 110),
	Grey = Color3.fromRGB(90, 90, 110),
}

-- Crée une instance avec ses propriétés et ses enfants
function Ui.new(className: string, props, children)
	local instance = Instance.new(className)
	local parent = nil
	if props then
		for key, value in props do
			if key == "Parent" then
				parent = value
			else
				instance[key] = value
			end
		end
	end
	if children then
		for _, child in children do
			child.Parent = instance
		end
	end
	if parent then
		instance.Parent = parent
	end
	return instance
end

function Ui.corner(radius: number?)
	return Ui.new("UICorner", { CornerRadius = UDim.new(0, radius or 12) })
end

function Ui.stroke(color: Color3, thickness: number?, transparency: number?)
	return Ui.new("UIStroke", {
		Color = color,
		Thickness = thickness or 2,
		Transparency = transparency or 0,
		ApplyStrokeMode = Enum.ApplyStrokeMode.Border,
	})
end

function Ui.padding(pixels: number)
	return Ui.new("UIPadding", {
		PaddingLeft = UDim.new(0, pixels),
		PaddingRight = UDim.new(0, pixels),
		PaddingTop = UDim.new(0, pixels),
		PaddingBottom = UDim.new(0, pixels),
	})
end

function Ui.list(direction, padding: number?, hAlign, vAlign)
	return Ui.new("UIListLayout", {
		FillDirection = direction or Enum.FillDirection.Vertical,
		Padding = UDim.new(0, padding or 6),
		HorizontalAlignment = hAlign or Enum.HorizontalAlignment.Center,
		VerticalAlignment = vAlign or Enum.VerticalAlignment.Top,
		SortOrder = Enum.SortOrder.LayoutOrder,
	})
end

function Ui.label(props)
	local defaults = {
		BackgroundTransparency = 1,
		Font = Ui.Font,
		TextColor3 = Ui.Colors.Text,
		TextScaled = true,
		Text = "",
	}
	for key, value in props do
		if key ~= "MaxTextSize" then
			defaults[key] = value
		end
	end
	local label = Ui.new("TextLabel", defaults)
	if label.TextScaled then
		Ui.new("UITextSizeConstraint", { MaxTextSize = props.MaxTextSize or 34, Parent = label })
	end
	return label
end

function Ui.tween(instance: Instance, duration: number, goal, style)
	local tween = TweenService:Create(instance, TweenInfo.new(duration, style or Enum.EasingStyle.Quad, Enum.EasingDirection.Out), goal)
	tween:Play()
	return tween
end

-- Bouton arrondi avec petit effet "pression" (comme une touche !)
function Ui.button(props, onClick: () -> ())
	local color = props.BackgroundColor3 or Ui.Colors.Blue
	local defaults = {
		BackgroundColor3 = color,
		AutoButtonColor = false,
		Font = Ui.Font,
		TextColor3 = Ui.Colors.Text,
		TextScaled = true,
		Text = "",
	}
	for key, value in props do
		if key ~= "MaxTextSize" and key ~= "CornerRadius" then
			defaults[key] = value
		end
	end
	local button = Ui.new("TextButton", defaults)
	Ui.corner(props.CornerRadius or 12).Parent = button
	Ui.new("UITextSizeConstraint", { MaxTextSize = props.MaxTextSize or 26, Parent = button })
	Ui.new("UIPadding", { PaddingLeft = UDim.new(0, 6), PaddingRight = UDim.new(0, 6), Parent = button })
	local scale = Ui.new("UIScale", { Parent = button })
	button.MouseButton1Down:Connect(function()
		Ui.tween(scale, 0.06, { Scale = 0.92 })
	end)
	button.MouseButton1Up:Connect(function()
		Ui.tween(scale, 0.12, { Scale = 1 }, Enum.EasingStyle.Back)
	end)
	button.MouseLeave:Connect(function()
		Ui.tween(scale, 0.12, { Scale = 1 })
	end)
	button.Activated:Connect(function()
		onClick()
	end)
	return button
end

-- Échelle automatique selon la taille de l'écran (PC, tablette, téléphone)
local scales = {}
local function currentScale(): number
	local camera = workspace.CurrentCamera
	local size = camera and camera.ViewportSize or Vector2.new(1280, 720)
	return math.clamp(math.min(size.X / 1280, size.Y / 760), 0.55, 1.15)
end

function Ui.autoScale(parent: Instance)
	local scale = Ui.new("UIScale", { Scale = currentScale(), Parent = parent })
	table.insert(scales, scale)
	return scale
end

local function refreshScales()
	local value = currentScale()
	for _, scale in scales do
		scale.Scale = value
	end
end

task.spawn(function()
	local camera = workspace.CurrentCamera
	while not camera do
		task.wait(0.2)
		camera = workspace.CurrentCamera
	end
	camera:GetPropertyChangedSignal("ViewportSize"):Connect(refreshScales)
	refreshScales()
end)

return Ui
