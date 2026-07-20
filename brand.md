# VEIL Brand

## Palette: Parchment

A warm, restrained grayscale — pure monochrome (C=0) with a subtle 50° hue cast. Designed for a prediction market that should feel more like a premium intelligence briefing than a casino.

### 5 seeds (dark mode)

| Role | OKLCH | Approx hex |
|---|---|---|
| bg-base | `oklch(0.12 0 50)` | `#0E0D0B` |
| bg-elevated | `oklch(0.18 0 50)` | `#1A1916` |
| primary | `oklch(0.58 0 50)` | `#8A8780` |
| primary-soft | `oklch(0.76 0 50)` | `#C4C0B9` |
| fg-base | `oklch(0.97 0 50)` | `#F2F1EF` |

### 5 seeds (light mode)

| Role | OKLCH | Approx hex |
|---|---|---|
| bg-base | `oklch(0.98 0.003 50)` | `#F5F3EF` |
| bg-elevated | `oklch(1 0 0)` | `#FFFFFF` |
| primary | `oklch(0.44 0 50)` | `#5E5C56` |
| primary-soft | `oklch(0.65 0 50)` | `#9D9A93` |
| fg-base | `oklch(0.14 0 50)` | `#0F0E0C` |

### Contrast

All body text, primary button labels, muted text, and focus rings pass WCAG AA in both modes. The low-chroma design keeps ratios above 4.5:1 for body text while feeling soft and intentional.

### Voice

- **Tone:** Authoritative, restrained, never playful
- **Adjectives:** Minimal, premium, sharp, warm-but-not-soft
- **Personality:** A private intelligence report — not a casino lobby
- **Target feeling:** You're making informed bets, not gambling

### Typography

| Role | Font | Weights |
|---|---|---|
| Display / heading | Fraunces (serif) | 300 (soft), 400 (body heading), 700 (impact) |
| Body / UI | Geist (sans) | 400, 500, 600 |
| Data / monospace | JetBrains Mono | 400, 500 |

Approach: Fraunces for premium editorial weight, Geist for clean utility, JetBrains Mono for numbers that must be trusted (odds, volume, P&L).

### Gradients

- **Elevation (card lift):** `oklch(0.12 0 50)` → `oklch(0.18 0 50)`
- **Hero overlay:** `oklch(0.58 0 50)` → `oklch(0.12 0 50)`
- **Light mode card:** `oklch(1 0 0)` → `oklch(0.98 0.003 50)`

No accent color. No second hue. Every visual distinction comes from value (lightness), not chroma.

### shadcn tokens

Full token set is in `app/globals.css` under `@layer base { :root { ... } .dark { ... } }`. The `--radius` is `0.375rem` (sharper corners for a more technical/premium feel).

### Location

`brand.md` — this file. The single source of truth for VEIL's visual identity.
