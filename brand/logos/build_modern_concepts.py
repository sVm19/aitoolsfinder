"""
Generate 3 ultra-modern, creative logo concepts for AIToolsFinder.
Built on fluid continuous curvature, superellipses, and optical dimensional depth.
"""

import os
import subprocess

OUT = r"C:\Earlyst\brand\logos"
os.makedirs(OUT, exist_ok=True)

# -------------------------------------------------------------------------------------
# MODERN CONCEPT 1: The Quantum Nexus (Fluid AI Spark + Aperture Lens)
# Combines an organic 4-point astroid/superellipse core with a precision circular orbit.
# Sleek, radiant, instantly communicates AI intelligence + precision tool finder.
# -------------------------------------------------------------------------------------
concept_1_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <linearGradient id="nexus-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#A78BFA"/>
      <stop offset="45%" stop-color="#7C3AED"/>
      <stop offset="100%" stop-color="#FF5E1E"/>
    </linearGradient>
    <linearGradient id="core-grad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FF5E1E"/>
      <stop offset="100%" stop-color="#FFA043"/>
    </linearGradient>
  </defs>
  <!-- Outer Finder Orbit Ring -->
  <circle cx="128" cy="128" r="92" fill="none" stroke="url(#nexus-grad)" stroke-width="14" stroke-dasharray="140 18 36 18" stroke-linecap="round"/>
  <!-- Central Luminous AI Astroid/Nexus -->
  <path d="M128 38 C128 88 168 128 218 128 C168 128 128 168 128 218 C128 168 88 128 38 128 C88 128 128 88 128 38 Z" fill="url(#nexus-grad)"/>
  <!-- Inner Precision Focal Core -->
  <circle cx="128" cy="128" r="22" fill="#0E0A1A"/>
  <circle cx="128" cy="128" r="14" fill="url(#core-grad)"/>
</svg>"""

# Monochromatic version for auditing and scaling
concept_1_mono = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <!-- Compound path for single-color production: outer orbit + central astroid + counter lens -->
  <path fill="#FFFFFF" fill-rule="evenodd" d="M128 22 A106 106 0 1 0 128 234 A106 106 0 1 0 128 22 Z M128 36 A92 92 0 1 1 128 220 A92 92 0 1 1 128 36 Z M128 54 C128 94 162 128 202 128 C162 128 128 162 128 202 C128 162 94 128 54 128 C94 128 128 94 128 54 Z M128 114 A14 14 0 1 0 128 142 A14 14 0 1 0 128 114 Z"/>
</svg>"""

# -------------------------------------------------------------------------------------
# MODERN CONCEPT 2: The Continuous Helix 'A' (Fluid Möbius Loop)
# A continuous, aerodynamic dimensional ribbon that loops upward to form an iconic modern 'A'
# with smooth rounded contours. Represents infinity, continuity, intelligence and discovery.
# -------------------------------------------------------------------------------------
concept_2_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <linearGradient id="helix-left" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#C084FC"/>
      <stop offset="60%" stop-color="#7C3AED"/>
      <stop offset="100%" stop-color="#4C1D95"/>
    </linearGradient>
    <linearGradient id="helix-right" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF7A00"/>
      <stop offset="60%" stop-color="#FF5E1E"/>
      <stop offset="100%" stop-color="#D93800"/>
    </linearGradient>
  </defs>
  <!-- Left Ascending Fluid Blade -->
  <path d="M52 196 C44 176 68 120 108 58 C116 46 128 36 136 44 C144 52 144 68 136 84 C116 124 96 168 104 188 C108 198 100 206 88 206 C74 206 58 206 52 196 Z" fill="url(#helix-left)"/>
  <!-- Right Sweeping Transverse Blade (Crossbar + Right Leg) -->
  <path d="M78 148 C94 138 128 132 152 136 C176 140 188 162 198 184 C204 198 196 206 182 206 C170 206 162 196 156 182 C146 162 136 158 116 158 C96 158 84 164 78 148 Z" fill="url(#helix-right)"/>
  <!-- Central Refraction Spark -->
  <circle cx="128" cy="100" r="14" fill="#FFA043"/>
</svg>"""

# Clean geometric version of the Modern Streamline 'A'
# An iconic aerodynamic silhouette with smooth rounded corners, inner prism cut, and glowing apex
concept_2_clean = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <linearGradient id="stream-body" x1="20%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%" stop-color="#A855F7"/>
      <stop offset="50%" stop-color="#6366F1"/>
      <stop offset="100%" stop-color="#3B82F6"/>
    </linearGradient>
    <linearGradient id="stream-accent" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FF5E1E"/>
      <stop offset="100%" stop-color="#FBBF24"/>
    </linearGradient>
  </defs>
  <!-- Aerodynamic 'A' Loop with Continuous Bezier Curves -->
  <path d="M128 32 C138 32 146 40 152 50 L216 178 C224 194 216 210 198 210 C186 210 178 202 172 190 L158 160 L98 160 L84 190 C78 202 70 210 58 210 C40 210 32 194 40 178 L104 50 C110 40 118 32 128 32 Z M128 86 L110 128 L146 128 Z" fill="url(#stream-body)"/>
  <!-- Floating Optical Diamond Core -->
  <path d="M128 144 L142 158 L128 172 L114 158 Z" fill="url(#stream-accent)"/>
</svg>"""

# -------------------------------------------------------------------------------------
# MODERN CONCEPT 3: The Prism Aperture / Raycast Beacon
# A hyper-clean, minimal, futuristic radar/prism beacon.
# A circular disc sheared by an ascending 45° light ray that reveals the letter 'a' and a finder reticle.
# -------------------------------------------------------------------------------------
concept_3_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <linearGradient id="prism-grad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#7C3AED"/>
      <stop offset="50%" stop-color="#8B5CF6"/>
      <stop offset="100%" stop-color="#FF5E1E"/>
    </linearGradient>
    <linearGradient id="ray-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF5E1E"/>
      <stop offset="100%" stop-color="#FFA043"/>
    </linearGradient>
  </defs>
  <!-- Outer Precision Rounded Badge -->
  <rect x="28" y="28" width="200" height="200" rx="48" fill="#0D0914" stroke="#2D2240" stroke-width="4"/>
  <!-- Optical Refraction Triad -->
  <!-- Top Apex Beam -->
  <path d="M128 54 C134 54 140 58 144 64 L188 140 C192 148 186 156 178 156 L78 156 C70 156 64 148 68 140 L112 64 C116 58 122 54 128 54 Z" fill="url(#prism-grad)"/>
  <!-- Forward Velocity Ray -->
  <path d="M128 96 L158 146 L98 146 Z" fill="#0D0914"/>
  <!-- High Intensity Core Spark -->
  <circle cx="128" cy="180" r="12" fill="url(#ray-grad)"/>
  <circle cx="128" cy="128" r="8" fill="url(#ray-grad)"/>
</svg>"""

# Write out the new concepts
with open(os.path.join(OUT, "modern-nexus.svg"), "w", encoding="utf-8") as f:
    f.write(concept_1_svg)

with open(os.path.join(OUT, "modern-streamline.svg"), "w", encoding="utf-8") as f:
    f.write(concept_2_clean)

with open(os.path.join(OUT, "modern-beacon.svg"), "w", encoding="utf-8") as f:
    f.write(concept_3_svg)

print("Generated modern concept SVGs.")
