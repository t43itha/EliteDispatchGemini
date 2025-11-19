# EliteDispatch Design System & Style Guide

## 1. Brand Identity
**Name:** EliteDispatch
**Vibe:** Modern, Clean, "Soft Pop", Professional, Mobile-First.
**Core Metaphor:** A premium, frictionless operating system for high-end chauffeurs.

---

## 2. Typography
**Font Family:** `Plus Jakarta Sans`
**Usage:** sans-serif

| Element | Tailwind Class | Weight | Tracking | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Display H1** | `text-3xl font-black tracking-tighter` | 900 | Tighter | Main page titles |
| **Heading H2** | `text-2xl font-bold tracking-tight` | 700 | Tight | Section headers |
| **Heading H3** | `text-xl font-bold tracking-tight` | 700 | Tight | Card titles |
| **Body** | `text-sm font-medium` | 500 | Normal | Standard text |
| **Label** | `text-xs font-bold uppercase tracking-wider` | 700 | Wider | Form labels, small headers |
| **Data** | `font-bold text-slate-900` | 700 | Normal | Numerical values, prices |

---

## 3. Color Palette (Tailwind Configuration)

### Primary (Brand Blue)
Used for primary actions, active states, and key indicators.
- **50:** `#eff6ff` (Backgrounds)
- **500:** `#3b82f6` (Focus rings)
- **600:** `#2563eb` (Buttons, Active Icons)
- **900:** `#1e3a8a` (Strong accents)

### Accent (Violet)
Used for Concierge services and secondary highlights.
- **50:** `#f5f3ff`
- **500:** `#8b5cf6`
- **600:** `#7c3aed`

### Neutrals (Slate)
- **Background:** `#f8fafc` (Page BG)
- **Surface:** `#ffffff` (Cards, Modals)
- **Text Primary:** `slate-900`
- **Text Secondary:** `slate-500`
- **Text Muted:** `slate-400`
- **Borders:** `slate-100` or `slate-200`

### Semantic / Status
- **Success/Available:** Emerald (`text-emerald-600`, `bg-emerald-50`)
- **Warning/Pending:** Amber (`text-amber-600`, `bg-amber-50`)
- **Error/Dropoff:** Red (`text-red-500`, `bg-red-50`)
- **WhatsApp:** `#25D366` (Official Brand Color)

---

## 4. UI Components & "Soft Pop" Aesthetic

The "Soft Pop" look is defined by generous white space, soft shadows, rounded corners, and subtle borders.

### Shadows
*   **Soft (Hover):** `shadow-soft` (`0 4px 20px -2px rgba(29, 78, 216, 0.05)`)
*   **Card (Default):** `shadow-card`
*   **Glow (Active):** `shadow-glow` (Used on FABs and active states)

### BorderRadius
*   **Cards/Modals:** `rounded-3xl`
*   **Buttons/Inputs:** `rounded-2xl` or `rounded-xl`
*   **Badges:** `rounded-full`

### Buttons
**Primary:**
```tsx
<button className="bg-brand-600 text-white font-bold rounded-2xl shadow-lg shadow-brand-500/30 hover:bg-brand-700 transition-all active:scale-[0.98]">
  Action
</button>
```

**Secondary/Ghost:**
```tsx
<button className="bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-colors">
  Cancel
</button>
```

### Inputs
Inputs should feel tactile and soft, sitting "inside" the page slightly.
```tsx
<input className="bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all outline-none font-medium text-slate-700" />
```

### Cards
```tsx
<div className="bg-surface p-6 rounded-3xl shadow-card border border-slate-100/50 hover:shadow-soft transition-shadow">
  {/* Content */}
</div>
```

---

## 5. Localization & Language (UK Standards)

**Region:** United Kingdom (en-GB)

### Terminology
*   **Color** → **Colour** (e.g., Vehicle Colour)
*   **License** → **Licence** (e.g., Licence Plate)
*   **Center** → **Centre**
*   **Check** → **Cheque** (if applicable)
*   **Cell Phone** → **Mobile**

### Formatting
*   **Currency:** GBP (£) - e.g., `£150.00`
*   **Date:** DD/MM/YYYY - e.g., `24/10/2025`
*   **Time:** 24-hour format preferred in data, 12-hour allowed in UI if clear. e.g., `14:30`.
*   **Phone:** UK Format `+44 7700 900123`

---

## 6. Iconography
**Library:** `lucide-react`
**Style:** Stroke width 2px (default).
**Color:** Usually matches text color or `slate-400` for inactive icons.

---

## 7. Animation
Use purely CSS/Tailwind-based transitions.
*   **Modals:** `animate-in fade-in zoom-in duration-300`
*   **Hover:** `transition-all duration-300`
*   **Active:** `active:scale-[0.98]` (Tactile feedback)
