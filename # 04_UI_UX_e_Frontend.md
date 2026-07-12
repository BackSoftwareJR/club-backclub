# 04_UI_UX_e_Frontend.md
**Target Audience:** Autonomous AI Developer Agent (Paul) / Cursor Execution Environment.
**Document Purpose:** Define the frontend architecture, styling paradigms, animation libraries, and the dynamic templating engine. The goal is to achieve an ultra-premium, "Luxury" feel inspired by Apple's HIG.

## 1. Frontend Stack & Execution Environment
*   **Core Engine:** React 19 bootstrapped with Vite. Vite is MANDATORY for its lightning-fast local Hot Module Replacement (HMR). Implement file-based routing (e.g., via TanStack Router or `vite-plugin-pages`) to mirror Next.js architectural patterns.
*   **Styling:** Tailwind CSS integrated with native CSS variables for dynamic runtime theming.
*   **Animations:** GSAP (GreenSock) for complex, scroll-linked cinematic animations and Framer Motion for fluid layout transitions and micro-interactions.
*   **Components:** Source base complex UI components from `21st.dev` or use Headless UI / Radix UI to ensure accessibility without compromising the custom "Luxury" aesthetic.

## 2. Design Language: "Luxury" & Apple HIG
The UI must inspire trust, exclusivity, and financial solidity. Do not use cartoonish illustrations, aggressive colors, or cluttered layouts.
*   **Glassmorphism:** Use translucid panels (`backdrop-blur-xl`, `bg-white/10` or `bg-black/40`) to separate UI layers (e.g., the Wallet card hovering over the Club background).
*   **Typography:** Strict typographic hierarchy. Large, clean serif/sans-serif pairings (e.g., Playfair Display for headings, Inter/San Francisco for UI numbers). Deep negative space (ample padding/margins).
*   **Micro-interactions:** Every tap must have a consequence. Buttons must have subtle scale-down effects on active state. Number counters (like the wallet balance) must animate/roll when the value changes, not snap instantly.

## 3. Dynamic Theming Engine (White-Labeling)
The frontend must support 5-6 distinct layout templates and custom color palettes injected at runtime based on the Club's configuration.

*   **The Theme Provider:** Upon successful NFC+PIN login, fetch the `theme_config` JSON from the API.
*   **CSS Variable Injection:** Map the JSON color hex codes to CSS root variables.
    ```javascript
    // Example Agent Implementation Logic:
    document.documentElement.style.setProperty('--primary-color', themeConfig.colors.primary);
    ```
*   **Tailwind Configuration:** Tailwind MUST be configured to read these variables (e.g., `bg-primary` maps to `var(--primary-color)`).
*   **Template Router:** Implement a `LayoutResolver` component. Based on `theme_config.template_id`, dynamically import and render one of the predefined structural layouts (e.g., Template 1: Side Navbar; Template 2: iOS-style Bottom Tab Bar; Template 3: Full-screen immersive scroll).

## 4. Dynamic UI Generation for Products
The UI must never assume a product is sold by a standard "quantity of 1". It must parse the `price_config` JSON to render the appropriate input control.

*   **Logic Matrix for Input Components:**
    *   If `selling_mode === 'unit'`: Render a minimalist stepper component (+ / - buttons).
    *   If `selling_mode === 'weight'` or `'volume'`: Render a fluid horizontal slider (range input) dynamically labeled with the `unit_label` (e.g., "Grams" or "Liters") and reflecting the `step_value`.
    *   If `selling_mode === 'custom_text'`: Render a sleek, underline-only text input field for the user to type specific requests.
*   **Real-time Calculation:** The UI must display the dynamically calculated total price (Cost = Input Value * `price_per_step`) floating above the "Confirm Purchase" button, updating instantly as the user scrubs the slider or clicks the stepper.

## 5. Cinematic Transaction Feedback
The moment of purchase (the extraction of funds) is the psychological core of the Vice Tax.
*   **Pre-Purchase:** Display a clear, elegant confirmation modal (Glassmorphism overlay).
*   **Execution:** When "Confirm" is tapped, disable the button and show a highly polished loading state (e.g., a subtle glowing ring).
*   **Success State:** Upon 200 OK from the API, trigger a rewarding cinematic animation (e.g., a subtle green pulse, a checkmark drawn with SVG path animation) and smoothly animate the Wallet Balance counter decrementing. Do NOT use generic browser alert boxes under any circumstances.