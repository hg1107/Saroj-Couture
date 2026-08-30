---
name: Atelier Heritage
colors:
  surface: '#fcf9f4'
  surface-dim: '#dcdad5'
  surface-bright: '#fcf9f4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3ee'
  surface-container: '#f0ede9'
  surface-container-high: '#ebe8e3'
  surface-container-highest: '#e5e2dd'
  on-surface: '#1c1c19'
  on-surface-variant: '#4b463f'
  inverse-surface: '#31302d'
  inverse-on-surface: '#f3f0eb'
  outline: '#7d766e'
  outline-variant: '#cec5bc'
  surface-tint: '#635d57'
  primary: '#191611'
  on-primary: '#ffffff'
  primary-container: '#2e2a25'
  on-primary-container: '#97918a'
  inverse-primary: '#cdc5be'
  secondary: '#85522f'
  on-secondary: '#ffffff'
  secondary-container: '#febb8f'
  on-secondary-container: '#794926'
  tertiary: '#18160f'
  on-tertiary: '#ffffff'
  tertiary-container: '#2d2a23'
  on-tertiary-container: '#969187'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#eae1d9'
  primary-fixed-dim: '#cdc5be'
  on-primary-fixed: '#1f1b16'
  on-primary-fixed-variant: '#4b4640'
  secondary-fixed: '#ffdcc7'
  secondary-fixed-dim: '#fbb88d'
  on-secondary-fixed: '#311300'
  on-secondary-fixed-variant: '#693b1a'
  tertiary-fixed: '#e8e2d7'
  tertiary-fixed-dim: '#ccc6bb'
  on-tertiary-fixed: '#1e1b15'
  on-tertiary-fixed-variant: '#4a463f'
  background: '#fcf9f4'
  on-background: '#1c1c19'
  surface-variant: '#e5e2dd'
typography:
  display-lg:
    fontFamily: Libre Caslon Text
    fontSize: 48px
    fontWeight: '400'
    lineHeight: '1.1'
    letterSpacing: 0.05em
  headline-lg:
    fontFamily: Libre Caslon Text
    fontSize: 32px
    fontWeight: '400'
    lineHeight: '1.2'
    letterSpacing: 0.03em
  headline-md:
    fontFamily: Libre Caslon Text
    fontSize: 24px
    fontWeight: '400'
    lineHeight: '1.3'
    letterSpacing: 0.02em
  headline-lg-mobile:
    fontFamily: Libre Caslon Text
    fontSize: 28px
    fontWeight: '400'
    lineHeight: '1.2'
    letterSpacing: 0.03em
  body-lg:
    fontFamily: Karla
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Karla
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-sm:
    fontFamily: Karla
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: 0.01em
  label-lg:
    fontFamily: Karla
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.1em
  label-md:
    fontFamily: Karla
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.08em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 20px
  margin-desktop: 64px
  section-gap: 120px
---

## Brand & Style

The design system is rooted in the philosophy of "Quiet Luxury"—a celebration of craftsmanship, intentionality, and the human touch. It targets a discerning clientele who values bespoke quality over mass-market trends. The emotional response is one of tranquility, trust, and sophisticated warmth.

The design style is a blend of **Editorial Minimalism** and **Tactile Precision**. It avoids digital-native trends like glassmorphism or neomorphism in favor of traditional graphic design principles: masterful typography, disciplined grids, and an "architectural" use of whitespace. The interface acts as a gallery, stepping back to let high-quality portrait photography and fine tailoring details take center stage.

## Colors

The palette is derived from natural fibers and raw materials—linen, silk, and clay. 

- **Foundational Tones**: The base is a warm ivory (#FBF8F3), providing a softer, more organic feel than pure white. High-level surfaces and cards use pure white (#FFFFFF) to create subtle separation.
- **Typography & Brand**: Deep espresso (#2E2A25) provides high-contrast legibility while feeling more artisanal than a standard neutral black.
- **Action & Accent**: Muted clay brown (#A9714B) is used for primary calls to action, evoking the warmth of terracotta and leather.
- **Functional Accents**: A dusty beige (#C9BBA8) is reserved strictly for structural elements like 1px dividers and borders. 
- **System Exception**: The only departure from this palette is the WhatsApp Green (#25D366), used exclusively for the communication icon to maintain platform recognition.

## Typography

The typography strategy relies on the contrast between a literary, high-waisted serif and a functional, modern grotesque.

- **Headlines**: Libre Caslon Text (selected as the closest match to the brand's serif personality) is used for all editorial headings. It must always be set with generous letter spacing to evoke the feeling of a premium fashion masthead.
- **Body & UI**: Karla provides the necessary clarity for functional elements. Its slightly quirky, grotesque nature complements the handmade feel of the brand. Use weight 500 sparingly for emphasis or small labels.
- **Scale**: Large display type should be used heroically on desktop, but must scale down aggressively on mobile to maintain white space around the viewport edges.

## Layout & Spacing

This design system utilizes a **Fixed Grid** approach for desktop and a **Fluid Content** approach for mobile. 

- **Grid**: A 12-column grid on desktop with generous 64px outer margins. On mobile, the margin is reduced to 20px to maximize the impact of portrait photography.
- **Rhythm**: Vertical rhythm is driven by wide "breathing rooms." Section gaps should rarely be less than 80px on mobile and 120px on desktop.
- **Imagery**: All photography follows a strict 3:4 or 4:5 portrait ratio. Images should be framed with consistent padding to create a "matting" effect, similar to an art gallery.

## Elevation & Depth

Depth is conveyed through **Tonal Layering** and **Low-Contrast Outlines**. 

- **Shadows**: Strictly avoided. No element should cast a shadow.
- **Borders**: All depth is indicated by 1px solid lines using the Soft Highlight color (#C9BBA8). 
- **Layers**: Functional surfaces (like a booking modal or a card) sit on the Warm Ivory background as White blocks. The differentiation is achieved through color value and 1px borders rather than physical Z-axis elevation.

## Shapes

The shape language is disciplined and geometric. 

- **Corner Radius**: A minimal 2px radius is applied to all buttons, input fields, and cards. This is just enough to soften the "sharpness" of the screen without becoming a visible "rounded" design. 
- **Interactive Elements**: Buttons must never be pill-shaped. They should remain rectangular to maintain the architectural integrity of the layout.

## Components

- **Buttons**: Primary buttons use the Muted Clay Brown background with White text. Secondary buttons use a 1px border (#C9BBA8) with Espresso text. Both feature 2px corners and uppercase Karla labels with 0.1em letter spacing.
- **Input Fields**: Minimalist design. A 1px bottom border is preferred over a full box for a lighter feel. When a full box is required, use a 1px border in #C9BBA8.
- **Cards**: Pure white background, 1px border (#C9BBA8), 2px corner radius. Content inside cards must have generous padding (minimum 32px).
- **Chips/Tags**: Small, rectangular containers with a #F0E9DE background and #6B625A text. No icons unless strictly necessary.
- **Dividers**: 1px horizontal or vertical lines in #C9BBA8. Use these to separate distinct content blocks without adding visual weight.
- **Lists**: Clean, text-heavy lists with generous line-height (1.6) and 1px dividers between items. Use the Serif font for list titles to maintain the editorial feel.