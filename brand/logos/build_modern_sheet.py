"""
Build lockups and unified concept sheet for the 3 modern concepts.
"""

import os
import subprocess

OUT = r"C:\Earlyst\brand\logos"

# Lockup 1: Quantum Nexus
lockup_1_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 256" width="960" height="256" role="img" aria-labelledby="lock-1-title">
  <title id="lock-1-title">AIToolsFinder — Quantum Nexus Lockup</title>
  <defs>
    <style>
      .brand-title { font-family: 'Outfit', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; font-size: 76px; font-weight: 800; letter-spacing: -2px; fill: #FFFFFF; }
      .brand-dot { fill: #FF5E1E; }
      .brand-tag { font-family: 'JetBrains Mono', 'SF Mono', monospace; font-size: 18px; font-weight: 600; letter-spacing: 5px; fill: #A78BFA; text-transform: uppercase; }
    </style>
    <linearGradient id="l1-violet" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#A78BFA"/>
      <stop offset="100%" stop-color="#7C3AED"/>
    </linearGradient>
    <linearGradient id="l1-orange" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FF5E1E"/>
      <stop offset="100%" stop-color="#FFA043"/>
    </linearGradient>
  </defs>
  <!-- Symbol Container (180x180 at x=48, y=38) -->
  <g id="symbol" transform="translate(48, 38) scale(0.703125)">
    <path fill="url(#l1-violet)" fill-rule="evenodd" d="M128 20 C187.646 20 236 68.354 236 128 C236 187.646 187.646 236 128 236 C68.354 236 20 187.646 20 128 C20 68.354 68.354 20 128 20 Z M128 36 C77.19 36 36 77.19 36 128 C36 178.81 77.19 220 128 220 C178.81 220 220 178.81 220 128 C220 77.19 178.81 36 128 36 Z"/>
    <path fill="url(#l1-violet)" d="M128 48 C128 92 164 128 208 128 C164 128 128 164 128 208 C128 164 92 128 48 128 C92 128 128 92 128 48 Z"/>
    <polygon points="128,104 152,128 128,152 104,128" fill="url(#l1-orange)"/>
  </g>
  <!-- Typography Lockup -->
  <g id="wordmark" transform="translate(256, 128)">
    <text x="0" y="0" class="brand-title">AIToolsFinder<tspan class="brand-dot">.</tspan></text>
    <text x="4" y="42" class="brand-tag">AI TOOL INTELLIGENCE PLATFORM</text>
  </g>
</svg>"""

# Lockup 2: Prismatic Möbius
lockup_2_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 256" width="960" height="256" role="img" aria-labelledby="lock-2-title">
  <title id="lock-2-title">AIToolsFinder — Prismatic Möbius Lockup</title>
  <defs>
    <style>
      .brand-title { font-family: 'Outfit', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; font-size: 76px; font-weight: 800; letter-spacing: -2px; fill: #FFFFFF; }
      .brand-dot { fill: #FF5E1E; }
      .brand-tag { font-family: 'JetBrains Mono', 'SF Mono', monospace; font-size: 18px; font-weight: 600; letter-spacing: 5px; fill: #EC4899; text-transform: uppercase; }
    </style>
    <linearGradient id="l2-west" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#6366F1"/>
      <stop offset="50%" stop-color="#8B5CF6"/>
      <stop offset="100%" stop-color="#A855F7"/>
    </linearGradient>
    <linearGradient id="l2-apex" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#A855F7"/>
      <stop offset="50%" stop-color="#EC4899"/>
      <stop offset="100%" stop-color="#FF5E1E"/>
    </linearGradient>
    <linearGradient id="l2-core" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF5E1E"/>
      <stop offset="100%" stop-color="#FFA043"/>
    </linearGradient>
  </defs>
  <g id="symbol" transform="translate(48, 38) scale(0.703125)">
    <path d="M72 176 C96 196 160 196 184 176 C194 168 188 152 174 152 C154 152 102 152 82 152 C68 152 62 168 72 176 Z" fill="url(#l2-core)"/>
    <path d="M64 184 C52 172 60 144 84 100 L114 46 C120 36 136 36 142 46 L154 68 C144 68 118 108 98 144 C88 162 76 178 64 184 Z" fill="url(#l2-west)"/>
    <path d="M128 38 C134 38 140 42 144 50 L196 148 C206 166 200 186 184 192 C172 196 160 188 154 174 L138 136 C138 116 150 78 138 58 C134 50 130 42 128 38 Z" fill="url(#l2-apex)"/>
    <polygon points="128,102 144,118 128,134 112,118" fill="#FFFFFF"/>
  </g>
  <g id="wordmark" transform="translate(256, 128)">
    <text x="0" y="0" class="brand-title">AIToolsFinder<tspan class="brand-dot">.</tspan></text>
    <text x="4" y="42" class="brand-tag">DISCOVERY &amp; BENCHMARK RADAR</text>
  </g>
</svg>"""

# Lockup 3: Streamline A
lockup_3_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 256" width="960" height="256" role="img" aria-labelledby="lock-3-title">
  <title id="lock-3-title">AIToolsFinder — Aerodynamic Streamline Lockup</title>
  <defs>
    <style>
      .brand-title { font-family: 'Outfit', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; font-size: 76px; font-weight: 800; letter-spacing: -2px; fill: #FFFFFF; }
      .brand-dot { fill: #FF5E1E; }
      .brand-tag { font-family: 'JetBrains Mono', 'SF Mono', monospace; font-size: 18px; font-weight: 600; letter-spacing: 5px; fill: #60A5FA; text-transform: uppercase; }
    </style>
    <linearGradient id="l3-body" x1="20%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%" stop-color="#A855F7"/>
      <stop offset="50%" stop-color="#6366F1"/>
      <stop offset="100%" stop-color="#3B82F6"/>
    </linearGradient>
    <linearGradient id="l3-accent" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FF5E1E"/>
      <stop offset="100%" stop-color="#FBBF24"/>
    </linearGradient>
  </defs>
  <g id="symbol" transform="translate(48, 38) scale(0.703125)">
    <path d="M128 32 C138 32 146 40 152 50 L216 178 C224 194 216 210 198 210 C186 210 178 202 172 190 L158 160 L98 160 L84 190 C78 202 70 210 58 210 C40 210 32 194 40 178 L104 50 C110 40 118 32 128 32 Z M128 86 L110 128 L146 128 Z" fill="url(#l3-body)"/>
    <path d="M128 144 L142 158 L128 172 L114 158 Z" fill="url(#l3-accent)"/>
  </g>
  <g id="wordmark" transform="translate(256, 128)">
    <text x="0" y="0" class="brand-title">AIToolsFinder<tspan class="brand-dot">.</tspan></text>
    <text x="4" y="42" class="brand-tag">CURATED SAAS &amp; AI DIRECTORY</text>
  </g>
</svg>"""

with open(os.path.join(OUT, "lockup-quantum-nexus.svg"), "w", encoding="utf-8") as f:
    f.write(lockup_1_svg)
with open(os.path.join(OUT, "lockup-prismatic-mobius.svg"), "w", encoding="utf-8") as f:
    f.write(lockup_2_svg)
with open(os.path.join(OUT, "lockup-streamline-a.svg"), "w", encoding="utf-8") as f:
    f.write(lockup_3_svg)

print("Generated modern lockups.")
