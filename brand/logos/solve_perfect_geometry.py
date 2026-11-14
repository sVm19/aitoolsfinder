"""
Solve coordinates so that every diagonal line is within 0.15 deg of 60 deg or 45 deg,
and create real holes with fill-rule='evenodd' (no fake white knockouts).
"""
import math

def check_line(x1, y1, x2, y2):
    dx = x2 - x1
    dy = y2 - y1
    deg = math.degrees(math.atan2(abs(dy), abs(dx)))
    clean = min([0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180], key=lambda c: abs(c - deg))
    dev = abs(clean - deg)
    return deg, clean, dev

# CONCEPT A: 45° and 90° pure geometric Monolith Aperture
# 45-degree angles are mathematically exact with integers!
# Canvas 256x256
# Center x = 128
# Apex: (128, 24)
# Left descent at 60 deg or 45 deg?
# Let's test 60 deg with exact integers:
# If top apex is (128, 28):
# dx = 104, dy = round(104 * math.sqrt(3)) = 180. (180/104 = 1.73077 -> 59.98 deg!)
# Left foot: (128 - 104, 28 + 180) = (24, 208)
# Right foot: (128 + 104, 28 + 180) = (232, 208)
# Foot width: 44. (24 + 44 = 68), (232 - 44 = 188)
# Inner leg up to (128, 104):
# dx_inner = 128 - 68 = 60, dy_inner = 208 - 104 = 104.
# 104 / 60 = 1.7333 -> 60.02 deg! Dev is 0.02 deg!
# Crossbar at y = 148 to y = 176:
# At y = 148:
# Outer left: x = 128 - (148 - 28)/sqrt(3) = 128 - 120/1.732 = 128 - 69.28 = 59
# Inner left: x = 128 - (148 - 104)/sqrt(3) = 128 - 44/1.732 = 128 - 25.4 = 103
# Inner right: x = 128 + 25 = 153
# Outer right: x = 128 + 69 = 197
# At y = 176:
# Inner left at y=176: x = 128 - (176 - 104)/sqrt(3) = 128 - 72/1.732 = 128 - 41.57 = 86
# Inner right at y=176: x = 128 + 42 = 170
# Diamond aperture inside the crossbar!
# Top at (128, 126), Bottom at (128, 168), Left at (107, 147), Right at (149, 147)
# dx = 21, dy = 21 -> EXACT 45.00 deg!

print("Line 1:", check_line(128, 28, 24, 208))
print("Line 2:", check_line(68, 208, 128, 104))
print("Line 3:", check_line(128, 126, 107, 147))
print("Line 4:", check_line(107, 147, 128, 168))
