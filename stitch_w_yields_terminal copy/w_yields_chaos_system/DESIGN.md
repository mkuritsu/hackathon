---
name: W Yields Chaos System
colors:
  surface: '#131315'
  surface-dim: '#131315'
  surface-bright: '#39393b'
  surface-container-lowest: '#0e0e10'
  surface-container-low: '#1c1b1d'
  surface-container: '#201f21'
  surface-container-high: '#2a2a2c'
  surface-container-highest: '#353437'
  on-surface: '#e5e1e4'
  on-surface-variant: '#c4c9ac'
  inverse-surface: '#e5e1e4'
  inverse-on-surface: '#313032'
  outline: '#8e9379'
  outline-variant: '#444933'
  surface-tint: '#abd600'
  primary: '#ffffff'
  on-primary: '#283500'
  primary-container: '#c3f400'
  on-primary-container: '#556d00'
  inverse-primary: '#506600'
  secondary: '#e3b5ff'
  on-secondary: '#4d007a'
  secondary-container: '#9400e4'
  on-secondary-container: '#f0d2ff'
  tertiary: '#ffffff'
  on-tertiary: '#65002e'
  tertiary-container: '#ffd9e1'
  on-tertiary-container: '#c60061'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#c3f400'
  primary-fixed-dim: '#abd600'
  on-primary-fixed: '#161e00'
  on-primary-fixed-variant: '#3c4d00'
  secondary-fixed: '#f3daff'
  secondary-fixed-dim: '#e3b5ff'
  on-secondary-fixed: '#2f004c'
  on-secondary-fixed-variant: '#6e00ab'
  tertiary-fixed: '#ffd9e1'
  tertiary-fixed-dim: '#ffb1c4'
  on-tertiary-fixed: '#3f001a'
  on-tertiary-fixed-variant: '#8f0044'
  background: '#131315'
  on-background: '#e5e1e4'
  surface-variant: '#353437'
typography:
  headline-xl:
    fontFamily: Anton
    fontSize: 48px
    fontWeight: '400'
    lineHeight: '1.1'
    letterSpacing: 0.02em
  headline-lg:
    fontFamily: Anton
    fontSize: 32px
    fontWeight: '400'
    lineHeight: '1.2'
    letterSpacing: 0.02em
  headline-lg-mobile:
    fontFamily: Anton
    fontSize: 28px
    fontWeight: '400'
    lineHeight: '1.2'
  financial-display:
    fontFamily: Space Mono
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Space Mono
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.1em
spacing:
  unit: 4px
  gutter: 16px
  margin-mobile: 12px
  margin-desktop: 24px
  border-width: 2px
---

## Brand & Style

The design system is engineered for "W Yields," a satirical paper-trading platform that mirrors the dopamine-drenched aesthetic of high-stakes gambling and livestreaming culture. The brand personality is aggressive, hyper-energetic, and unapologetically loud. It targets an audience desensitized by financial "fin-tok" and meme-stock volatility, evoking an emotional response of urgency, irony, and sensory overload.

The design style is a fusion of **Neon-Brutalism** and **Arcade-Dashboards**. It rejects the calm, trustworthy nature of traditional fintech in favor of a "Casino-Neon" aesthetic. Key visual drivers include high-contrast overlays, thick structural borders, and a UI that feels like a live broadcast from the floor of a digital stock exchange under a blacklight.

## Colors

This design system utilizes a high-octane dark mode palette. The foundation is a "Near-Black" (#0a0a0c) which allows the neon accents to pop with maximum vibrance. 

- **Primary (Acid Lime):** Used for critical actions, positive yield indicators, and primary branding.
- **Secondary (Electric Purple):** Used for decorative elements, secondary buttons, and data categorizations.
- **Accent (Hot Pink):** Reserved for "Hype" moments, special alerts, and satirical gamification elements.
- **Signal Red:** Dedicated strictly to losses, errors, and "margin calls."
- **Text:** Pure white for readability against the dark void, with high-contrast gray for metadata.

## Typography

Typography is used as a structural weapon. 
- **Headlines:** Utilize **Anton** for its chunky, condensed, and urgent impact. All headlines should feel like breaking news or a casino jackpot announcement.
- **Numbers:** Financial figures must use **Space Mono** to mimic LED counters and provide a technical, monospaced "ticker" feel.
- **Body:** **Inter** provides the necessary legibility for satirical articles and fine-print disclaimers, ensuring the UI remains functional despite the visual noise.
- **Labels:** Small labels and tags should be uppercase Space Mono to reinforce the "system terminal" aesthetic.

## Layout & Spacing

The layout follows a **Rigid Grid** philosophy. Elements are locked into a high-density configuration to mimic a trading terminal. 

- **Ticker Strips:** Horizontal scrolling banners should exist at the very top and bottom of the viewport, continuously cycling market data.
- **Sticker-Tags:** Status indicators do not follow the grid; they should be slightly rotated (1-3 degrees) to look like stickers slapped onto the UI.
- **Borders:** Every major container must use a 2px solid border in Acid Lime or Electric Purple.
- **Scanlines:** A subtle, fixed-position overlay of horizontal 1px lines (5% opacity) should be applied to the entire screen to simulate a CRT monitor.

## Elevation & Depth

This design system rejects shadows and soft blurs in favor of **Bold Borders** and **Tonal Layering**.

- **Depth via Contrast:** Elevation is communicated by changing the border color or thickness, not by adding shadows. A higher-priority element might have a 3px Acid Lime border, while a background card has a 1px Gray border.
- **Overlays:** Use high-opacity (90%) black backgrounds for modals to ensure they completely cut through the background "noise."
- **Glow:** While shadows are forbidden, "Neon Glow" (outer glows using the primary/secondary colors) can be applied sparingly to active buttons or "Jackpot" alerts to simulate physical neon tubes.

## Shapes

The shape language is **Sharp**. Curves represent weakness in this financial landscape.

- **Buttons & Inputs:** Hard 90-degree corners only.
- **Containers:** All cards and modules are perfect rectangles. 
- **Exceptions:** Status "stickers" and "pills" may use a 2px chamfer (clipped corners), but never true roundedness. This reinforces the industrial, aggressive nature of the "W Yields" brand.

## Components

- **Main Buttons:** 2px solid Acid Lime border, black background, Anton text in Acid Lime. On hover/active, the colors invert.
- **Market Ticker:** A full-width marquee component that scrolls Acid Lime (gain) or Signal Red (loss) data points. Use Space Mono for the text.
- **Sticker Status:** High-contrast tags (e.g., "HODL", "GUH", "TO THE MOON") with a Hot Pink background and black text, placed at irregular angles over cards.
- **LED Counters:** Input fields and price displays should have a faint "ghost" background of zeros (e.g., `888,888.88`) behind the actual numbers to simulate an LCD panel.
- **Input Fields:** Thick bottom-border only (3px) in Acid Lime. Labels sit inside the border in the top-left corner using 10px Space Mono.
- **Trading Cards:** Dark containers with a 1px noise texture and a permanent Acid Lime "Livestream Rec" dot in the corner to imply constant monitoring.