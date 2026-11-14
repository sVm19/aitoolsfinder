"""
Generate 3 distinct, production-grade geometric logo concepts for AIToolsFinder.
All coordinates strictly on a 256x256 canvas with clean geometric snapping.
"""

import os
import math

OUT_DIR = r"C:\Earlyst\brand\logos"
os.makedirs(OUT_DIR, exist_ok=True)

# -------------------------------------------------------------
# Concept A: "The Focal Prism" (Architectural Prism 'A')
# Precision faceted letter A with aperture core and light channel
# -------------------------------------------------------------
# Geometry:
# 256x256 viewBox
# Apex at (128, 32)
# Left anchor at (36, 224), Right anchor at (220, 224)
# Left leg facet and Right leg facet with a clean 16px negative space central slit/notch
# Crossbar at y=148 with an inverted diamond aperture

concept_a_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="title-a">
  <title id="title-a">AIToolsFinder — The Focal Prism</title>
  <defs>
    <linearGradient id="prism-violet" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8B5CF6"/>
      <stop offset="100%" stop-color="#6D28D9"/>
    </linearGradient>
    <linearGradient id="prism-orange" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FF5E1E"/>
      <stop offset="100%" stop-color="#FFA043"/>
    </linearGradient>
  </defs>
  <!-- Left Vanguard Facet -->
  <path fill="url(#prism-violet)" d="M124 32 L36 216 L88 216 L124 136 Z"/>
  <!-- Right Vanguard Facet -->
  <path fill="url(#prism-orange)" d="M132 32 L132 136 L168 216 L220 216 Z"/>
  <!-- Central Focus Diamond / Core Prism -->
  <polygon fill="#FFFFFF" points="128,112 144,144 128,176 112,144"/>
  <!-- Crossbar Connector -->
  <path fill="url(#prism-violet)" d="M78 192 L106 136 L120 164 L92 220 L78 192 Z"/>
  <path fill="url(#prism-orange)" d="M178 192 L150 136 L136 164 L164 220 L178 192 Z"/>
</svg>"""

# Let's also do a unified solid silhouette version for testing
concept_a_solid = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="title-a-mono">
  <title id="title-a-mono">AIToolsFinder — The Focal Prism (Solid)</title>
  <path fill="#000000" fill-rule="evenodd" d="M128 32 L220 220 L168 220 L144 168 L112 168 L88 220 L36 220 Z M128 92 L146 136 L110 136 Z"/>
</svg>"""

# -------------------------------------------------------------
# Concept B: "The Hex Aperture" (Quantum Finder)
# Hexagonal finder lens forming an interlocking isometric A & F
# -------------------------------------------------------------
# Outer regular hexagon bounds:
# Center (128, 128), Radius R=104
# Top: (128, 24), Bottom: (128, 232)
# Top-Left: (38, 76), Top-Right: (218, 76)
# Bottom-Left: (38, 180), Bottom-Right: (218, 180)
concept_b_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="title-b">
  <title id="title-b">AIToolsFinder — The Hex Aperture</title>
  <defs>
    <linearGradient id="hex-grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#7C3AED"/>
      <stop offset="100%" stop-color="#4F46E5"/>
    </linearGradient>
    <linearGradient id="hex-grad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF5E1E"/>
      <stop offset="100%" stop-color="#FF9040"/>
    </linearGradient>
  </defs>
  <!-- Hexagonal Perimeter Loop / Finder Aperture -->
  <path fill="url(#hex-grad1)" fill-rule="evenodd" d="M128 24 L218 76 L218 180 L128 232 L38 180 L38 76 Z M128 60 L68 95 L68 161 L128 196 L188 161 L188 95 Z"/>
  <!-- Inner A-Beam Reticle -->
  <polygon fill="url(#hex-grad2)" points="128,76 164,140 144,140 136,124 120,124 112,140 92,140"/>
  <!-- Focus Beacon Point -->
  <circle cx="128" cy="168" r="12" fill="#FF5E1E"/>
</svg>"""

# -------------------------------------------------------------
# Concept C: "The Kinetic Vanguard / Dual Delta"
# Supersonic double-delta chevron forming A & arrow of acceleration
# -------------------------------------------------------------
concept_c_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="title-c">
  <title id="title-c">AIToolsFinder — The Kinetic Vanguard</title>
  <defs>
    <linearGradient id="vanguard-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8B5CF6"/>
      <stop offset="50%" stop-color="#7C3AED"/>
      <stop offset="100%" stop-color="#FF5E1E"/>
    </linearGradient>
  </defs>
  <!-- Outer Supersonic Shield Chevron -->
  <path fill="url(#vanguard-grad)" d="M128 28 L224 196 L180 196 L128 100 L76 196 L32 196 Z"/>
  <!-- Inner Focus Pulse Wedge -->
  <polygon fill="#FF5E1E" points="128,128 160,196 140,196 128,170 116,196 96,196"/>
  <!-- High-Precision Nav Dot -->
  <circle cx="128" cy="222" r="10" fill="#FFFFFF"/>
</svg>"""

with open(os.path.join(OUT_DIR, "concept-a.svg"), "w") as f:
    f.write(concept_a_svg)

with open(os.path.join(OUT_DIR, "concept-b.svg"), "w") as f:
    f.write(concept_b_svg)

with open(os.path.join(OUT_DIR, "concept-c.svg"), "w") as f:
    f.write(concept_c_svg)

print("SVGs generated successfully.")
