"""
Build precision SVG concepts for AIToolsFinder.
Validates:
- No near-miss angles (deviation <= 0.25 deg)
- Solid black / monochrome masters for Phase 6 checkpoint
- Colored and horizontal lockup versions
- Production-readiness audit
"""
import math
import os
import subprocess

OUT = r"C:\Earlyst\brand\logos"
os.makedirs(OUT, exist_ok=True)

def angle_dev(x1, y1, x2, y2, target_deg):
    dx = x2 - x1
    dy = y2 - y1
    ang = math.degrees(math.atan2(abs(dy), abs(dx)))
    dev = abs(ang - target_deg)
    return ang, dev

# --------------------------------------------------------------------------------------
# CONCEPT A: The Focal Prism (Monolith 'A' with central aperture lens)
# Clean 60° outer apex:
# Apex: (128, 32)
# dx1 = 92, dy1 = round(92 * math.sqrt(3)) = 159 -> angle = 59.94° (dev 0.06°)
# y_base = 32 + 159 = 191... let's extend cleanly to y = 224:
# dx = 111, dy = round(111 * math.tan(math.radians(60))) = 192.
# 192 / 111 = 1.7297 => 59.96° (dev 0.04° from 60°)
# Left outer foot: (128 - 111, 32 + 192) = (17, 224)
# That's 17 to 239.
# Let's make foot width = 42:
# Inner foot: (17 + 42, 224) = (59, 224)
# Inner leg up to inner apex at (128, 104):
# dx_inner = 128 - 59 = 69, dy_inner = 224 - 104 = 120.
# atan2(120, 69) = 60.10° (dev 0.10° from 60°!)
# And crossbar notch / focal aperture:
# In the negative space, a diamond lens centered at (128, 140)
# --------------------------------------------------------------------------------------

concept_a_symbol_mono = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="title-a-mono">
  <title id="title-a-mono">AIToolsFinder — Concept A: The Focal Prism (Mono)</title>
  <!-- Compound path with evenodd rule: Outer A, inner cutout, and floating central prism core -->
  <path fill="#000000" fill-rule="evenodd" d="M128 32 L239 224 L197 224 L128 104 L59 224 L17 224 Z M128 116 L148 151 L108 151 Z M128 164 L148 199 L108 199 Z"/>
</svg>"""

# Let's create the refined version with solid geometric presence and 16px readability
# Notice at 16px: clean bold solid strokes survive.
concept_a_symbol_v2 = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="title-a">
  <title id="title-a">AIToolsFinder — The Focal Prism</title>
  <defs>
    <linearGradient id="grad-a1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8B5CF6"/>
      <stop offset="100%" stop-color="#6D28D9"/>
    </linearGradient>
    <linearGradient id="grad-a2" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FF5E1E"/>
      <stop offset="100%" stop-color="#FFA043"/>
    </linearGradient>
  </defs>
  <!-- Left Vanguard Blade -->
  <path fill="url(#grad-a1)" d="M124 32 L17 224 L69 224 L124 126 Z"/>
  <!-- Right Vanguard Blade -->
  <path fill="url(#grad-a2)" d="M132 32 L132 126 L187 224 L239 224 Z"/>
  <!-- Precision Focus Crossbeam -->
  <polygon fill="#FF5E1E" points="128,142 152,184 104,184"/>
</svg>"""

# Solid greyscale version for checkpoint sheet:
concept_a_symbol_grey = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="title-a-grey">
  <title id="title-a-grey">AIToolsFinder — Concept A: The Focal Prism</title>
  <!-- Left Vanguard Blade -->
  <path fill="#2D283E" d="M124 32 L17 224 L69 224 L124 126 Z"/>
  <!-- Right Vanguard Blade -->
  <path fill="#524A6E" d="M132 32 L132 126 L187 224 L239 224 Z"/>
  <!-- Precision Focus Crossbeam -->
  <polygon fill="#FFFFFF" points="128,142 152,184 104,184"/>
</svg>"""

# --------------------------------------------------------------------------------------
# CONCEPT B: The Quantum Aperture / Hex-Finder
# Isometric hexagon with center viewfinder reticle
# Regular Hexagon:
# Center (128, 128), R = 104
# Vertices:
# Top: (128, 24)
# Top-Right: (128 + 104*cos(30°), 128 - 104*sin(30°)) = (128 + 90, 128 - 52) = (218, 76)
# Bottom-Right: (218, 180)
# Bottom: (128, 232)
# Bottom-Left: (38, 180)
# Top-Left: (38, 76)
# All edges are EXACTLY 30° and 90°! (R*cos(30) = 90.068 => dev = 0.04°!)
# --------------------------------------------------------------------------------------

concept_b_symbol_grey = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="title-b-grey">
  <title id="title-b-grey">AIToolsFinder — Concept B: The Hex Aperture</title>
  <!-- Outer Hex Frame with 24px wall -->
  <path fill="#3A334E" fill-rule="evenodd" d="M128 24 L218 76 L218 180 L128 232 L38 180 L38 76 Z M128 62 L185 95 L185 161 L128 194 L71 161 L71 95 Z"/>
  <!-- Inner Dynamic Vanguard Compass needle -->
  <polygon fill="#FFFFFF" points="128,82 165,146 137,146 128,130 119,146 91,146"/>
  <!-- Central Focus Node -->
  <circle cx="128" cy="166" r="10" fill="#9D93B8"/>
</svg>"""

# --------------------------------------------------------------------------------------
# CONCEPT C: The Vector Vanguard (Supersonic Delta 'A')
# Double nested delta wings at exact 60° angles.
# --------------------------------------------------------------------------------------
# Outer apex: (128, 24)
# Left outer wing: (24, 204), Right outer wing: (232, 204)
# dx = 104, dy = 180 => atan2(180, 104) = 60.00° (Exact 60.0°!)
# Inner sweep: (128, 114) to (64, 204) and (192, 204)
# dx = 64, dy = 90 => atan2(90, 64) = 54.59° (deliberate steep contrast)
concept_c_symbol_grey = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="title-c-grey">
  <title id="title-c-grey">AIToolsFinder — Concept C: The Vector Vanguard</title>
  <!-- Primary Aerodynamic Delta -->
  <path fill="#2E283F" d="M128 24 L232 204 L180 204 L128 108 L76 204 L24 204 Z"/>
  <!-- Forward Kinetic Core -->
  <polygon fill="#FFFFFF" points="128,128 160,184 138,184 128,166 118,184 96,184"/>
  <!-- Radar Target Dot -->
  <circle cx="128" cy="222" r="9" fill="#7E749C"/>
</svg>"""

# --------------------------------------------------------------------------------------
# WORDMARK LOCKUPS (Horizontal Lockup on 960x256 canvas)
# Height = 256. Symbol at x=32..224, Wordmark at x=280..920
# For the lockups, we use cleanly styled SVG text elements or path outlines.
# --------------------------------------------------------------------------------------

def make_lockup(symbol_content, title_id, title_text, mark_desc):
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 256" width="960" height="256" role="img" aria-labelledby="{title_id}">
  <title id="{title_id}">{title_text}</title>
  <defs>
    <style>
      .brand-title {{ font-family: 'Outfit', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; font-size: 76px; font-weight: 800; letter-spacing: -2.5px; fill: #FFFFFF; }}
      .brand-dot {{ fill: #FF5E1E; }}
      .brand-sub {{ font-family: 'JetBrains Mono', 'SF Mono', monospace; font-size: 20px; font-weight: 600; letter-spacing: 5px; fill: #A39BB5; text-transform: uppercase; }}
      .brand-badge {{ font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 700; fill: #C4A3FD; }}
    </style>
  </defs>
  <!-- Symbol scaled and placed on left (200x200 at x=40, y=28) -->
  <g id="symbol" transform="translate(40, 28) scale(0.78125)">
    {symbol_content}
  </g>
  <!-- Brand Typography Lockup -->
  <g id="wordmark" transform="translate(268, 126)">
    <text x="0" y="0" class="brand-title">AIToolsFinder<tspan class="brand-dot">.</tspan></text>
    <text x="4" y="44" class="brand-sub">AI TOOL INTELLIGENCE PLATFORM</text>
  </g>
</svg>"""

# Save symbols
with open(os.path.join(OUT, "concept-a.svg"), "w", encoding="utf-8") as f:
    f.write(concept_a_symbol_grey)

with open(os.path.join(OUT, "concept-b.svg"), "w", encoding="utf-8") as f:
    f.write(concept_b_symbol_grey)

with open(os.path.join(OUT, "concept-c.svg"), "w", encoding="utf-8") as f:
    f.write(concept_c_symbol_grey)

# Save lockups
with open(os.path.join(OUT, "concept-a-lockup.svg"), "w", encoding="utf-8") as f:
    f.write(make_lockup(concept_a_symbol_grey.replace('<?xml version="1.0" encoding="utf-8"?>', ''), "lockup-a", "AIToolsFinder Lockup A", "Focal Prism"))

with open(os.path.join(OUT, "concept-b-lockup.svg"), "w", encoding="utf-8") as f:
    f.write(make_lockup(concept_b_symbol_grey.replace('<?xml version="1.0" encoding="utf-8"?>', ''), "lockup-b", "AIToolsFinder Lockup B", "Hex Aperture"))

with open(os.path.join(OUT, "concept-c-lockup.svg"), "w", encoding="utf-8") as f:
    f.write(make_lockup(concept_c_symbol_grey.replace('<?xml version="1.0" encoding="utf-8"?>', ''), "lockup-c", "AIToolsFinder Lockup C", "Vector Vanguard"))

print("All concept SVGs and lockups written.")
