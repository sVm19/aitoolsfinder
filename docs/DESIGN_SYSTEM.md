# Design System

## 1. Brand palette
The approved three-color combination is:

| Token | Hex | Use |
|---|---|---|
| Space Black | `#010102` | Main page background |
| Deep Lavender | `#7022FC` | Primary brand and interactive color |
| Sunrise Orange | `#FD8F32` | Accent and selective emphasis |

## 2. Supporting neutrals
Use supporting neutrals for readability; the brand palette is not sufficient for all text and surfaces.

Suggested starting tokens:
- `--surface-1: #0B0A0F`
- `--surface-2: #121018`
- `--surface-3: #1A1722`
- `--border: #302A3A`
- `--text-primary: #F7F5FA`
- `--text-secondary: #B5ADBF`
- `--text-muted: #948CA0` (keeps normal text at or above 4.5:1 on the elevated dark surface)

Validate contrast before release. Do not use low-contrast lavender or orange for long body text.

## 3. Color usage
- Space Black should dominate the visual system.
- Lavender is for primary buttons, links, focus rings and selected states.
- Orange is for limited emphasis, badges, important highlights and selected calls to action.
- Avoid using both accent colors at full intensity in every component.
- Sponsored and warning states need separate semantic treatment and explicit labels.

## 4. Typography
Choose one readable sans-serif family and use a restrained type scale. Suggested: Geist or Inter. Define tokens for display, heading, body, small text and labels. Avoid excessively small text.

## 5. Spacing and layout
Use a consistent 4px-based spacing scale. Use a centered content container with responsive max-widths. Maintain consistent section spacing and card padding.

## 6. Components
Create reusable variants for:
- Button: primary, secondary, outline, ghost, destructive
- Input, search input, select, checkbox and filter chips
- Tool card and category card
- Badge: verified, sponsored, pricing, status
- Score display with methodology link
- Pricing card
- Comparison table
- Breadcrumb
- Dialog, dropdown, tooltip and toast
- Skeleton, empty state and error state

## 7. Radius and elevation
Use a consistent radius scale. Prefer subtle borders and restrained shadows over excessive glow. Lavender glow is reserved for selected hero/CTA treatments.

## 8. Motion
- Short, purposeful transitions.
- Avoid motion that delays interaction.
- Respect reduced-motion settings.
- Do not animate large layout properties when transform/opacity will work.
- Keep GSAP timelines scoped and cleaned up.

## 9. Design implementation
Store design tokens in CSS variables and map them into Tailwind theme configuration. Avoid hardcoding brand colors throughout components. Use semantic tokens such as `primary`, `accent`, `background`, `surface`, `foreground`, `muted` and `border`.
