"""
Generate the Stack Orbit Symbol with exact 30.00° isometric angles.
"""

import os

OUT = r"C:\Earlyst\brand\logos"

# Center: (128, 128)
# Left vertex at x = 76, center at x = 128 (dx = 52), right vertex at x = 180 (dx = 52)
# With dy = 30: 30/52 = 0.57692 => angle = 29.98° (exact 30°)
# Tier 1: Top diamond
# Apex (128, 64) -> Right (180, 94) -> Bottom (128, 124) -> Left (76, 94) -> Close
# Tier 2: Chevron middle
# Upper lip: Left (76, 120) -> Center (128, 150) -> Right (180, 120)
# Lower lip: Right (180, 134) -> Center (128, 164) -> Left (76, 134)
# Tier 3: Chevron bottom
# Upper lip: Left (76, 154) -> Center (128, 184) -> Right (180, 154)
# Lower lip: Right (180, 168) -> Center (128, 198) -> Left (76, 168)

stack_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="stack-title">
  <title id="stack-title">aiToolsFinder — Stack Orbit Mark</title>
  <defs>
    <linearGradient id="orbit-violet" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#A78BFA"/>
      <stop offset="100%" stop-color="#7C3AED"/>
    </linearGradient>
    <linearGradient id="stack-orange" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FF5E1E"/>
      <stop offset="100%" stop-color="#FFA043"/>
    </linearGradient>
  </defs>
  <!-- Outer Precision Circular Orbit Ring (Filled, 0 strokes) -->
  <path fill="url(#orbit-violet)" fill-rule="evenodd" d="M128 20 C187.646 20 236 68.354 236 128 C236 187.646 187.646 236 128 236 C68.354 236 20 187.646 20 128 C20 68.354 68.354 20 128 20 Z M128 36 C77.19 36 36 77.19 36 128 C36 178.81 77.19 220 128 220 C178.81 220 220 178.81 220 128 C220 77.19 178.81 36 128 36 Z"/>
  
  <!-- Tier 1: Top Floating Stack Plate (Active Tool Tier - Radiant Orange) -->
  <path fill="url(#stack-orange)" d="M128 64 L180 94 L128 124 L76 94 Z"/>
  
  <!-- Tier 2: Middle Stack Plate (Intelligence Workflow Tier - Electric Violet) -->
  <path fill="url(#orbit-violet)" d="M76 118 L128 148 L180 118 L180 134 L128 164 L76 134 Z"/>
  
  <!-- Tier 3: Bottom Foundation Plate (Infrastructure Tier - Electric Violet) -->
  <path fill="url(#orbit-violet)" d="M76 152 L128 182 L180 152 L180 168 L128 198 L76 168 Z"/>
</svg>"""

with open(os.path.join(OUT, "mark-stack-orbit.svg"), "w", encoding="utf-8") as f:
    f.write(stack_svg)

print("Generated exact 30 deg mark-stack-orbit.svg")
