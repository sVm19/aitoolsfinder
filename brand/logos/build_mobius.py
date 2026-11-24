"""
Generate the Prismatic Möbius Loop:
A continuous 3D twisting ribbon mark forming an infinite optical aperture.
Uses exact cubic beziers, dimensional layering, and vivid luminous tech gradients.
"""

import os

OUT = r"C:\Earlyst\brand\logos"

mobius_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <!-- Facet 1: Violet to Indigo (Ascending West Wing) -->
    <linearGradient id="facet-west" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#6366F1"/>
      <stop offset="50%" stop-color="#8B5CF6"/>
      <stop offset="100%" stop-color="#A855F7"/>
    </linearGradient>
    <!-- Facet 2: Violet to Coral (Apex Crest to East) -->
    <linearGradient id="facet-apex" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#A855F7"/>
      <stop offset="50%" stop-color="#EC4899"/>
      <stop offset="100%" stop-color="#FF5E1E"/>
    </linearGradient>
    <!-- Facet 3: Solar Orange to Gold (Under-loop Crossbar) -->
    <linearGradient id="facet-core" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF5E1E"/>
      <stop offset="100%" stop-color="#FFA043"/>
    </linearGradient>
  </defs>
  
  <!-- Under Layer: Base Loop Bridge -->
  <path d="M72 176 C96 196 160 196 184 176 C194 168 188 152 174 152 C154 152 102 152 82 152 C68 152 62 168 72 176 Z" fill="url(#facet-core)"/>
  
  <!-- Left Ascending Ribbon: Curves up to Apex -->
  <path d="M64 184 C52 172 60 144 84 100 L114 46 C120 36 136 36 142 46 L154 68 C144 68 118 108 98 144 C88 162 76 178 64 184 Z" fill="url(#facet-west)"/>
  
  <!-- Right Descending Ribbon: Sweeps down and twists into foreground -->
  <path d="M128 38 C134 38 140 42 144 50 L196 148 C206 166 200 186 184 192 C172 196 160 188 154 174 L138 136 C138 116 150 78 138 58 C134 50 130 42 128 38 Z" fill="url(#facet-apex)"/>
  
  <!-- Floating Optical Diamond Core in the Center Aperture -->
  <polygon points="128,102 144,118 128,134 112,118" fill="#FFFFFF"/>
</svg>"""

with open(os.path.join(OUT, "modern-mobius.svg"), "w", encoding="utf-8") as f:
    f.write(mobius_svg)

print("Generated modern-mobius.svg")
