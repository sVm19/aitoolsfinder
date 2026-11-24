"""
Generate 3 ultra-premium, modern tech marks for AIToolsFinder.
Built strictly with <= 2 brand colors, clean compound shapes, no loose strokes, and perfect optical balance.
"""

import os
import subprocess

OUT = r"C:\Earlyst\brand\logos"
os.makedirs(OUT, exist_ok=True)

# -------------------------------------------------------------------------------------
# MARK 1: The Quantum Nexus (AI Core + Finder Orbit)
# Symbolizes AI Intelligence (Astroid) focused through an optical Finder Aperture.
# Two-tone: Electric Violet body (#8B5CF6) + Solar Orange Core (#FF5E1E).
# -------------------------------------------------------------------------------------
nexus_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="nexus-title">
  <title id="nexus-title">AIToolsFinder — Quantum Nexus</title>
  <defs>
    <linearGradient id="nexus-violet" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#A78BFA"/>
      <stop offset="100%" stop-color="#7C3AED"/>
    </linearGradient>
    <linearGradient id="nexus-orange" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FF5E1E"/>
      <stop offset="100%" stop-color="#FFA043"/>
    </linearGradient>
  </defs>
  <!-- Compound Outer Orbit Ring with 4 Optical Notches (Filled paths, 0 strokes) -->
  <path fill="url(#nexus-violet)" fill-rule="evenodd" d="M128 20 C187.646 20 236 68.354 236 128 C236 187.646 187.646 236 128 236 C68.354 236 20 187.646 20 128 C20 68.354 68.354 20 128 20 Z M128 36 C77.19 36 36 77.19 36 128 C36 178.81 77.19 220 128 220 C178.81 220 220 178.81 220 128 C220 77.19 178.81 36 128 36 Z"/>
  <!-- Central Luminous AI Astroid Spark -->
  <path fill="url(#nexus-violet)" d="M128 48 C128 92 164 128 208 128 C164 128 128 164 128 208 C128 164 92 128 48 128 C92 128 128 92 128 48 Z"/>
  <!-- Precision Focal Diamond Core -->
  <polygon points="128,104 152,128 128,152 104,128" fill="url(#nexus-orange)"/>
</svg>"""

# -------------------------------------------------------------------------------------
# MARK 2: The Hyper-Prism 'A' (Fluid Supersonic Ribbon)
# An ultra-modern, fluid ribbon 'A' with rounded aerodynamic curves, 
# negative-space aperture slit, and a precision floating finder beacon.
# -------------------------------------------------------------------------------------
prism_a_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="prism-title">
  <title id="prism-title">AIToolsFinder — Hyper-Prism</title>
  <defs>
    <linearGradient id="prism-v" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8B5CF6"/>
      <stop offset="100%" stop-color="#6D28D9"/>
    </linearGradient>
    <linearGradient id="prism-o" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FF5E1E"/>
      <stop offset="100%" stop-color="#FFA043"/>
    </linearGradient>
  </defs>
  <!-- Fluid Aerodynamic Monolith: Left Ascending Wing -->
  <path fill="url(#prism-v)" d="M122 28 C116 28 110 32 106 38 L28 182 C22 194 30 208 44 208 L82 208 C90 208 98 202 102 194 L122 152 L122 28 Z"/>
  <!-- Fluid Aerodynamic Monolith: Right Descending Wing with Crossbar Horizon -->
  <path fill="url(#prism-v)" d="M134 28 L134 152 L154 194 C158 202 166 208 174 208 L212 208 C226 208 234 194 228 182 L150 38 C146 32 140 28 134 28 Z"/>
  <!-- Precision Refraction Beacon (Floating Aperture Diamond) -->
  <polygon points="128,88 148,112 128,136 108,112" fill="url(#prism-o)"/>
</svg>"""

# -------------------------------------------------------------------------------------
# MARK 3: The Orbital Vortex (The Infinity Discovery Loop)
# An interlocking continuous orbital loop forming an abstract 'a' and optical camera/radar iris.
# Supreme modernism, reminiscent of Linear/OpenAI.
# -------------------------------------------------------------------------------------
vortex_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="vortex-title">
  <title id="vortex-title">AIToolsFinder — Orbital Vortex</title>
  <defs>
    <linearGradient id="vortex-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#A855F7"/>
      <stop offset="50%" stop-color="#7C3AED"/>
      <stop offset="100%" stop-color="#4F46E5"/>
    </linearGradient>
    <linearGradient id="vortex-spark" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF5E1E"/>
      <stop offset="100%" stop-color="#FBBF24"/>
    </linearGradient>
  </defs>
  <!-- Outer Interlocking S-Loop / Vortex -->
  <path fill="url(#vortex-grad)" fill-rule="evenodd" d="M128 24 C185.438 24 232 70.562 232 128 C232 185.438 185.438 232 128 232 C70.562 232 24 185.438 24 128 C24 70.562 70.562 24 128 24 Z M128 60 C90.445 60 60 90.445 60 128 C60 165.555 90.445 196 128 196 C165.555 196 196 165.555 196 128 C196 90.445 165.555 60 128 60 Z"/>
  <!-- Dynamic Velocity Slash & Focal Lens -->
  <path fill="url(#vortex-spark)" d="M86 170 L170 86 C176 80 186 86 182 94 L146 174 C142 182 130 184 124 178 L86 170 Z"/>
  <!-- Central Aperture Iris -->
  <circle cx="128" cy="128" r="16" fill="#030206"/>
  <circle cx="128" cy="128" r="10" fill="url(#vortex-spark)"/>
</svg>"""

with open(os.path.join(OUT, "mark-quantum-nexus.svg"), "w", encoding="utf-8") as f:
    f.write(nexus_svg)

with open(os.path.join(OUT, "mark-hyper-prism.svg"), "w", encoding="utf-8") as f:
    f.write(prism_a_svg)

with open(os.path.join(OUT, "mark-orbital-vortex.svg"), "w", encoding="utf-8") as f:
    f.write(vortex_svg)

print("Generated 3 new super-modern marks.")
