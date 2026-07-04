# FullAIML Design System

This document outlines the complete design system for the FullAIML project. It serves as a blueprint for replicating the premium, dark-themed, glassmorphic aesthetic in any other React/Vite project.

## 1. Aesthetic Overview

FullAIML utilizes a **"Premium Dark Cyber"** aesthetic. Key characteristics include:
- **Deep Dark Backgrounds**: Layers of dark blue/black (`#040814` to `#0c1020`) with subtle radial gradient highlights.
- **Glassmorphism**: Translucent, blurred card surfaces (`backdrop-blur-md`) with subtle white/transparent borders.
- **Neon Accents**: High-contrast, vibrant cyan (`#00f0ff`) and purple (`#a78bfa` / `#7c3aed`) glows and shadows.
- **Fluid Motion**: High-performance, spring-based interactions (custom cursor, sliding navigation pills) and soft entrance animations.
- **Immersive Environment**: A WebGL-rendered animated "Silk" background that provides depth without distracting from content.

## 2. Core Dependencies

To replicate this environment, install the following packages:

```bash
npm install tailwindcss @tailwindcss/vite
npm install framer-motion lucide-react
npm install three @react-three/fiber
```

## 3. Design Tokens & Global CSS

The design relies heavily on Tailwind CSS v4 and custom CSS variables defined in `index.css`.

### Typography
- **Display/Sans**: `DM Sans` (Weights: 400, 500, 700)
- **Mono**: `JetBrains Mono` (Weights: 400, 500, 700)

### Color Palette

**Backgrounds (Surfaces)**
- Root Background: `#040814`
- Body Background: `#0c1020`
- Glass Card: `rgba(14, 18, 36, 0.3)`
- Solid Card: `#0e1224`
- Input Field: `rgba(12, 16, 32, 0.3)`

**Text Colors**
- Primary: `#e8ecf4`
- Secondary: `#8892a8`
- Muted: `#8f9bb3`

**Accents & Glows**
- Cyan (Primary): `#00f0ff`
- Purple: `#7c3aed` / `#a78bfa`
- Pink: `#ec4899`
- Success: `#10b981`
- Danger: `#ef4444`

**Borders**
- Default (Subtle Glass): `rgba(255, 255, 255, 0.09)`
- Focus/Hover: `rgba(0, 240, 255, 0.45)`

### Gradients
- **Primary Line**: `linear-gradient(135deg, #00f0ff 0%, #7c3aed 100%)`
- **Hero Text**: `linear-gradient(135deg, #00f0ff 0%, #a78bfa 50%, #ec4899 100%)`

### Core CSS Setup (`index.css`)
Your global CSS must establish the `@theme` variables for Tailwind v4 and the `body` background structure:

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
@import "tailwindcss";

@theme {
  --color-bg-body: #0c1020;
  --color-bg-card: rgba(14, 18, 36, 0.3);
  /* Add all color variables from above here */
  
  --font-display: "DM Sans", sans-serif;
  --font-mono: "JetBrains Mono", monospace;
  
  --shadow-glow-cyan: 0 0 20px rgba(0, 240, 255, 0.12), 0 0 60px rgba(0, 240, 255, 0.05);
}

@layer base {
  body {
    @apply bg-bg-body text-text-primary font-body antialiased;
    background-image:
      radial-gradient(ellipse 80% 60% at 10% 20%, rgba(0, 240, 255, 0.04) 0%, transparent 60%),
      radial-gradient(ellipse 60% 50% at 90% 80%, rgba(124, 58, 237, 0.04) 0%, transparent 60%),
      radial-gradient(ellipse 50% 40% at 50% 50%, rgba(236, 72, 153, 0.02) 0%, transparent 50%);
    background-attachment: fixed;
  }
}

@layer utilities {
  .glass-panel, .glow-card {
    @apply bg-bg-card backdrop-blur-md border border-white/10 rounded-md relative transition-all duration-300 ease-out;
  }
  .glass-panel:hover, .glow-card:hover {
    @apply border-[#00f0ff]/45;
  }
}
```

## 4. Key UI Components

### 1. Silk Background (`Silk.jsx`)
A WebGL-rendered animated fluid texture using React Three Fiber.
**Implementation:**
- Requires `@react-three/fiber` and `three`.
- Renders a plane spanning the viewport.
- Uses custom GLSL shaders (Vertex & Fragment) to generate a flowing noise pattern.
- **Props**: `speed` (e.g., 5.3), `color` (e.g., "#7B7481"), `noiseIntensity` (1.6).
- **Placement**: Fixed behind all content, typically `opacity-40` with `pointer-events-none`.

### 2. Custom Spring Cursor (`Cursor.jsx` & `useCursor.js`)
Replaces the native OS cursor with a high-performance, two-part spring physics cursor.
**Implementation:**
- Hides the default cursor (`document.body.style.cursor = 'none'`).
- **Dot (Layer 1)**: Small white dot that tracks the mouse instantly (`translate3d`).
- **Ring (Layer 2)**: A minimal `rgba(255, 255, 255, 0.30)` circle that follows the dot.
- **Physics**: Uses a position history buffer (`TARGET_DELAY = 80ms`) and spring physics (stiffness `0.045`, damping `0.82`) so the dot clearly leaves the ring behind during fast movement, and the ring glides to catch up.
- **Hover States**: Enlarges and glows sky blue when hovering clickable elements.
- **Magnetic Effect**: When hovering over interactive elements, the cursor gently pulls toward the element's center (15% strength within an 80px radius).
- **Pressed State**: On mousedown, the cursor ring compresses slightly and its glow intensifies. If pressed without hovering, it uses a subtle white tone.
- **Idle State**: Cycles through a subtle RGB "breathing" glow when stationary for >800ms.

### 3. Animated Navbar (`Navbar.jsx`)
A floating, frosted glass navigation bar.
**Implementation:**
- `backdrop-blur-2xl backdrop-saturate-[1.6]`
- **Scroll Behavior**: Transitions from a wide, transparent header to a compact, rounded pill with a border and shadow when the user scrolls down.
- **Active Pill Slider**: Uses `requestAnimationFrame` and `getBoundingClientRect` to animate a highlighted background pill `div` behind the currently active route link.

### 4. Layout Wrapper (`Layout.jsx`)
Coordinates the global structure and page transitions.
**Implementation:**
- Renders the `Silk` background at `z-0`.
- Wraps the main scroll container.
- Uses Framer Motion (`<AnimatePresence>` and `<m.div>`) to trigger a smooth fade-in and slight slide-up (`fadeInUp`) animation on route changes.

### 5. Toast Notifications (`Toast.css`)
Cyber-themed alerts.
**Implementation:**
- Dark cards with cyan/green/red gradient borders.
- Absolute positioned radial gradient "glows" that pulse.
- An animated bottom progress bar indicating time remaining.

### 6. Interactive Buttons (`.generate-btn`)
**Implementation:**
- Gradient backgrounds (`linear-gradient(135deg, #00c8d4 0%, #7c3aed 100%)`).
- On hover: Box shadows intensify, gradient shifts slightly, and the button translates up by `1px`.

## 5. Replication Guide (Step-by-Step)

If you hand this guide to an AI agent (like Antigravity) for a new project, they should follow these steps:

1. **Initialize Project:** Create a Vite + React project.
2. **Install Dependencies:** `npm i tailwindcss @tailwindcss/vite framer-motion lucide-react three @react-three/fiber`
3. **Configure Tailwind:** Setup the `@theme` variables in `index.css` exactly as defined above, injecting the core color palette and typography.
4. **Setup Base CSS:** Apply the fixed radial gradients to the `body` and add the `.glass-panel` utility classes.
5. **Port Components:**
   - Copy the `Silk.jsx` component (GLSL shaders + Canvas).
   - Copy the `Cursor/` directory (`Cursor.jsx`, `Cursor.css`, `useCursor.js`).
   - Copy `Navbar.jsx` (ensuring the pill slider logic is intact).
6. **Construct Layout:** Build a `Layout.jsx` that places `<Silk />` as the fixed background and uses `Framer Motion` to wrap the `children` prop for page transitions.
7. **Wrap App:** In `App.jsx`, render `<Cursor />` outside the main router tree, and wrap all routes in the `<Layout>` component.
8. **Enforce UX Rules:**
   - All cards should use the `.glass-panel` or `.glow-card` classes.
   - All primary buttons should utilize the gradient styles and glow hover effects.
   - Loading states should use the animated shimmer background (`.shimmer-loader`).
