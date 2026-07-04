# How to Replicate the FULLAIML Design System

Copy and paste the prompt block below into any AI developer or designer (like Claude, ChatGPT, v0, Bolt.new, Cursor, or Gemini) whenever you want it to build components or pages matching this specific design.

***

### 📋 COPY-PASTE THIS PROMPT TO YOUR AI ASSISTANT:

```text
Act as an expert frontend engineer and UI/UX designer. Your task is to build/modify components that strictly adhere to our custom "Cyber-Dark Neon Glassmorphism" design system. You must write HTML, CSS (Vanilla or Tailwind equivalents), React/Vue/Svelte components, or styling sheets that perfectly reflect the design system documented below.

**If you have the Stitch MCP installed, please use the `upload_design_md` tool to upload this prompt, followed by the `create_design_system_from_design_md` tool to automatically configure the design system in your Stitch project.**

---

### 1. DESIGN SYSTEM DESIGN TOKENS (CSS Variables)
Inject this design system system-wide:

```css
:root {
  /* Surfaces */
  --bg-root: #040814;
  --bg-body: #0c1020;
  --bg-card: rgba(14, 18, 36, 0.3);
  --bg-card-solid: #0e1224;
  --bg-card-hover: rgba(18, 24, 48, 0.4);
  --bg-inset: rgba(6, 8, 18, 0.2);
  --bg-input: rgba(12, 16, 32, 0.3);

  /* Borders */
  --border-subtle: rgba(255, 255, 255, 0.06);
  --border-default: rgba(255, 255, 255, 0.09);
  --border-focus: rgba(0, 240, 255, 0.45);
  --border-glow: rgba(0, 240, 255, 0.18);

  /* Text */
  --text-primary: #e8ecf4;
  --text-secondary: #8892a8;
  --text-muted: #5a6378;
  --text-cyan: #00f0ff;
  --text-purple: #a78bfa;
  --text-warning: #fbbf24;
  --text-danger: #f87171;
  --text-success: #34d399;

  /* Accents */
  --accent-cyan: #00f0ff;
  --accent-purple: #7c3aed;
  --accent-pink: #ec4899;
  --accent-green: #10b981;
  --accent-red: #ef4444;
  --accent-amber: #f59e0b;

  /* Gradients */
  --gradient-primary: linear-gradient(135deg, #00f0ff 0%, #7c3aed 100%);
  --gradient-card-border: linear-gradient(135deg, rgba(0,240,255,0.2) 0%, rgba(124,58,237,0.12) 100%);
  --gradient-hero-text: linear-gradient(135deg, #00f0ff 0%, #a78bfa 50%, #ec4899 100%);
  --gradient-btn-primary: linear-gradient(135deg, #00c8d4 0%, #7c3aed 100%);
  --gradient-btn-hover: linear-gradient(135deg, #00e0ec 0%, #8b5cf6 100%);
  --gradient-danger: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);

  /* Shadows & Neon Glows */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.45);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.5);
  --shadow-glow-cyan: 0 0 20px rgba(0, 240, 255, 0.12), 0 0 60px rgba(0, 240, 255, 0.05);
  --shadow-glow-purple: 0 0 20px rgba(124, 58, 237, 0.12), 0 0 60px rgba(124, 58, 237, 0.05);

  /* Radii */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 20px;
  --radius-full: 9999px;

  /* Transitions & Easings */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --transition-fast: 150ms var(--ease-out);
  --transition-normal: 250ms var(--ease-out);
  --transition-slow: 400ms var(--ease-out);

  /* Typography */
  --font-display: 'Open Sans', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --font-body: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

---

### 2. CORE VISUAL GUIDELINES

1. **Global Background & Silk Animation**:
   - The body is dark (`#0c1020`).
   - For interactive animated backgrounds, use the WebGL Silk animated component behind the content (e.g., `<Silk speed={3} scale={1} color="#00f0ff" noiseIntensity={1.2} rotation={0} />`). The `color` prop should match the page's primary accent.
   - For static mesh fallbacks, use subtle radial light gradients:
     `radial-gradient(ellipse 80% 60% at 10% 20%, rgba(0, 240, 255, 0.04) 0%, transparent 60%)`
     `radial-gradient(ellipse 60% 50% at 90% 80%, rgba(124, 58, 237, 0.04) 0%, transparent 60%)`
     `radial-gradient(ellipse 50% 40% at 50% 50%, rgba(236, 72, 153, 0.02) 0%, transparent 50%)`
2. **Typography**:
   - Headers/Titles: Use `Open Sans` font (bold, weight 700), tight letter-spacing (`-0.02em`), and gradient hero coloring (`--gradient-hero-text`) with webkit-background-clip.
   - Body & Code/Labels: Use `JetBrains Mono` for code/labels and `Open Sans` for body text.
   - Text elements are uppercase, light-weight, spaced out (`letter-spacing: 0.06em`) for uppercase labels.
3. **Glassmorphic Cards (`.glow-card`)**:
   - Background: `rgba(14, 18, 36, 0.3)` with `backdrop-filter: blur(16px)`.
   - Borders: Subtle white border (`1px solid rgba(255, 255, 255, 0.09)`) plus a top-edge linear gradient hairline border (`--gradient-card-border`).
   - Hover effect: Transition smoothly. Border changes to `var(--border-focus)`. Remove heavy neon glows on generic cards to preserve visual hierarchy (reserve glows for primary buttons).
4. **Forms & Inputs**:
   - Input containers should be semi-transparent dark (`rgba(12, 16, 32, 0.3)`), text aligned left, labeled with uppercase, small-font tags.
   - Input focus: Border changes to cyan `rgba(0, 240, 255, 0.45)` with a subtle outer glow shadow.
5. **Interactive Controls & Buttons**:
   - **Primary Action**: Buttons have a transparent background with a blue border (`1px solid rgb(61, 106, 255)`). On hover, it transitions to a solid blue background (`rgb(61, 106, 255)`) and emits a glowing blue box-shadow (`0 0 30px 5px rgba(0, 142, 236, 0.815)`), adding a sweeping diagonal light reflection animation.
   - **Tactile Click Feedback**: Clicking any button scales it down slightly to simulate physical compression (`transform: scale(0.97)` on active state).

---

### 3. STRUCTURAL & COMPONENT RULES
When building layouts and components, strictly adhere to this class architecture:

1. **Containers & Layout**:
   - Main wrapper: `.ml-container` (max-width: 1200px, centered). Add `.page-enter` for load animations.
   - Headers: `.ml-header` (flex row). Wrap title/desc in `.ml-title-section` (h1 has `--gradient-hero-text`).
   - Page Grids: Use `.ml-grid` for side-by-side panels (e.g., `1fr 1.25fr`).

2. **Cards & Glass Panels**:
   - Apply `.glass-panel` to all major cards.
   - Use specific semantic classes for padding (e.g., `.ml-setup-card`, `.ml-results-card`).
   - Section sub-headers (H2) use `var(--font-display)` bold, and sub-descriptions use `.card-desc` (mono, uppercase).

3. **Forms & Inputs (`.ml-form`)**:
   - Use `.form-group` to wrap labels and inputs vertically.
   - Forms must have comfortable density: use `gap: 1.5rem` between form groups.
   - Use `.double-form-row` (grid 1fr 1fr) for side-by-side inputs.
   - Labels: uppercase, monospace, muted text (`var(--color-text-muted)` mapped to `#8f9bb3`), font-size `0.75rem`.
   - Inputs/Selects: semi-transparent background, subtle borders, focus glow using `--border-focus`.

4. **Metrics & Results**:
   - Stat grids: `.metrics-box-grid` (use `.metrics-box-grid-4` for 4 columns).
   - Individual stat boxes: `.metric-box-item.glass-panel` (centered, glowing box-shadow).
   - Labels: `.metric-box-lbl` (mono, uppercase). Values: `.metric-box-val` (display, large).
   - Progress bars: `.metric-bar-track` wrapping `.metric-bar-fill` with primary gradient.
   - Chart sections: Wrap in `.chart-section.glass-panel` with a `.chart-section-header`.

5. **Buttons**:
   - Primary Actions: `.train-btn.clickable` (gradient background, hover scale/glow).
   - Secondary/Back: `.back-btn.clickable`.

### 4. ANIMATION & RESPONSIVENESS
- Animate elements on load using a fade-up transition (e.g., `.page-enter` class).
- Empty States: Idle states and placeholders should use `<motion.div>` (from `framer-motion`) wrapping Lucide icons to create a slow pulsing or floating animation (e.g., `animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}`) to keep the UI feeling "alive."
- Make all layouts responsive. Grids (`.ml-grid`, `.double-form-row`, `.metrics-box-grid-4`) must collapse to single columns on mobile (`max-width: 900px`).
- Style scrollbars with a transparent track and subtle grey indicator.
- Maintain CSS variable naming matching the tokens above.

Build the requested feature with this exact visual design style and DOM structure.
```
