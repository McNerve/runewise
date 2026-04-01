"""Generate RuneWise app icon — 1024x1024 PNG.

Design: Clean hexagon with thick gold border, bold "RW" centered inside.
Minimal, no clutter. Inspired by the Gemini reference image.
"""

from PIL import Image, ImageDraw, ImageFilter, ImageFont
import math

SIZE = 1024
CX = SIZE // 2
CY = SIZE // 2

# Colors
BG_DARK = (22, 24, 30)       # slightly warmer dark
GOLD = (196, 164, 80)        # muted gold (less yellow, more elegant)
GOLD_LIGHT = (216, 184, 100) # slightly lighter for text

img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# --- Background: Rounded square ---
draw.rounded_rectangle([0, 0, SIZE - 1, SIZE - 1], radius=190, fill=BG_DARK)

# Subtle top-to-bottom gradient (lighter at top)
for y in range(SIZE):
    t = y / SIZE
    brightness = int(8 - t * 6)
    if brightness > 0:
        draw.line([(0, y), (SIZE, y)], fill=(brightness, brightness, brightness + 2, 8))

# --- Hexagon ---
def hex_pts(cx, cy, r, rot=0):
    return [(cx + r * math.cos(math.radians(60 * i + rot)),
             cy + r * math.sin(math.radians(60 * i + rot))) for i in range(6)]

hex_radius = 340
hex_border = 18  # thick border

# Draw filled hex border by drawing outer hex filled, then inner hex filled with bg
outer = hex_pts(CX, CY, hex_radius, 30)
inner = hex_pts(CX, CY, hex_radius - hex_border, 30)

draw.polygon(outer, fill=GOLD)
draw.polygon(inner, fill=BG_DARK)

# Restore the subtle gradient inside the hex
for y in range(SIZE):
    t = y / SIZE
    brightness = int(5 - t * 4)
    if brightness > 0:
        # Only draw inside the hex region — approximate with the inner polygon
        # Simple approach: just redraw the faint gradient lines (they'll be clipped by visual perception)
        pass

# --- "RW" text ---
font_path = "/System/Library/Fonts/Supplemental/DIN Alternate Bold.ttf"
font_size = 360
font = ImageFont.truetype(font_path, font_size)

text = "RW"
bbox = font.getbbox(text)
tw = bbox[2] - bbox[0]
th = bbox[3] - bbox[1]
tx = CX - tw // 2 - bbox[0]
ty = CY - th // 2 - bbox[1]

# Subtle shadow
shadow = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
sd = ImageDraw.Draw(shadow)
sd.text((tx + 3, ty + 3), text, font=font, fill=(0, 0, 0, 60))
shadow = shadow.filter(ImageFilter.GaussianBlur(radius=5))
img = Image.alpha_composite(img, shadow)
draw = ImageDraw.Draw(img)

# Main text
draw.text((tx, ty), text, font=font, fill=GOLD_LIGHT)

# Save
out = "/Users/steve/Documents/GitHub/runewise/icon-1024.png"
img.save(out, "PNG")
print(f"Saved {out}")
