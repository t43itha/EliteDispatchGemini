# EliteDispatch Brand Guidelines

## Brand Identity

**EliteDispatch** is a premium chauffeur dispatch management platform. The brand embodies professionalism, reliability, and modern efficiency while maintaining a warm, approachable feel through strategic use of color and microinteractions.

### Brand Voice
- **Professional**: Clean, precise, trustworthy
- **Modern**: Contemporary, tech-forward, efficient
- **Approachable**: Warm accents, friendly interactions
- **Premium**: Refined details, polished finish

---

## Color System

### Primary Colors

#### Brand Blue
The primary brand color representing trust, professionalism, and reliability.

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `brand-50` | #eff6ff | #0c1929 | Subtle backgrounds |
| `brand-100` | #dbeafe | #1e3a5f | Hover states |
| `brand-200` | #bfdbfe | #2563eb20 | Borders |
| `brand-500` | #3b82f6 | #3b82f6 | Primary actions |
| `brand-600` | #2563eb | #60a5fa | Active states |
| `brand-700` | #1d4ed8 | #93c5fd | Text on light bg |

#### Accent Green (WhatsApp Integration)
A distinctive green accent that references WhatsApp integration and success states.

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `accent-500` | #25D366 | #25D366 | WhatsApp buttons |
| `accent-600` | #128C7E | #34d399 | Hover states |
| `whatsapp` | #25D366 | #25D366 | WhatsApp-specific |

### Semantic Colors

#### Text Hierarchy
```css
--text-primary: Light: #0f172a | Dark: #f8fafc
--text-secondary: Light: #475569 | Dark: #94a3b8
--text-tertiary: Light: #94a3b8 | Dark: #64748b
```

#### Backgrounds
```css
--background: Light: #f8fafc | Dark: #0a0a0a
--background-subtle: Light: #f1f5f9 | Dark: #171717
--surface: Light: #ffffff | Dark: #141414
--surface-elevated: Light: #ffffff | Dark: #1a1a1a
```

#### Status Colors
| Status | Color | Usage |
|--------|-------|-------|
| Success | `#10b981` | Completed, available, paid |
| Warning | `#f59e0b` | Pending, busy |
| Error | `#ef4444` | Cancelled, offline, errors |
| Info | `#3b82f6` | Information, assigned |

---

## Typography

### Font Stack
```css
font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

### Hierarchy

| Level | Size | Weight | Letter Spacing | Usage |
|-------|------|--------|----------------|-------|
| H1 | 2.5rem | 900 (Black) | -0.025em | Page titles |
| H2 | 1.875rem | 900 (Black) | -0.025em | Section headers |
| H3 | 1.25rem | 700 (Bold) | -0.01em | Card titles |
| Body | 0.875rem | 500 (Medium) | normal | Content |
| Small | 0.75rem | 600 (Semibold) | 0.025em | Labels, badges |
| Micro | 0.625rem | 700 (Bold) | 0.05em | Status tags |

### Logo Typography
```
ELITE    DISPATCH
─────    ────────
Black    Light (300)
```

---

## Components

### Buttons

#### Variants
1. **Primary** (Blue): Main CTAs, form submissions
2. **Secondary** (Gray): Cancel, back actions
3. **Ghost**: Minimal visual weight, icon buttons
4. **Danger** (Red): Destructive actions
5. **WhatsApp** (Green): WhatsApp integration
6. **Outline**: Secondary prominence

#### Sizes
- **Small**: `px-3 py-1.5` - Inline actions
- **Medium**: `px-5 py-2.5` - Standard buttons
- **Large**: `px-6 py-3` - Primary CTAs
- **Icon**: `p-2.5` - Icon-only buttons

#### Interactions
- Magnetic hover effect (follows cursor)
- Scale on hover: 1.02
- Scale on tap: 0.98
- Transition: 200ms ease

### Cards

#### Variants
1. **Default**: `bg-surface border-border` - Standard cards
2. **Elevated**: Stronger shadow - Floating panels
3. **Glass**: Blur backdrop - Overlays
4. **Gradient Border**: Animated gradient - Featured content

#### Structure
```
┌─────────────────────────────┐
│ CardHeader                   │
│ ─────────────────────────── │
│ CardBody                     │
│                             │
│ ─────────────────────────── │
│ CardFooter                   │
└─────────────────────────────┘
```

### Badges

#### Status Badges
| Status | Background | Text | Border |
|--------|-----------|------|--------|
| Pending | amber-50 | amber-700 | amber-200 |
| Assigned | brand-50 | brand-700 | brand-200 |
| Completed | emerald-50 | emerald-700 | emerald-200 |
| Cancelled | gray-50 | gray-500 | gray-200 |
| Available | emerald-50 | emerald-700 | emerald-200 |
| Busy | amber-50 | amber-700 | amber-200 |
| Offline | gray-50 | gray-500 | gray-200 |

### Inputs

- Border radius: 12px (rounded-xl)
- Height: 48px
- Focus ring: 2px brand-500/50
- Error state: Red border + ring
- Icon support: Left or right positioning

---

## Spacing System

Based on 4px increments:

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Icon gaps |
| `space-2` | 8px | Inline spacing |
| `space-3` | 12px | Component padding |
| `space-4` | 16px | Card padding |
| `space-6` | 24px | Section spacing |
| `space-8` | 32px | Large gaps |
| `space-10` | 40px | Page padding |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-md` | 8px | Small elements |
| `rounded-lg` | 12px | Buttons, inputs |
| `rounded-xl` | 16px | Inputs, badges |
| `rounded-2xl` | 20px | Cards, modals |
| `rounded-3xl` | 24px | Large cards |
| `rounded-full` | 9999px | Avatars, pills |

---

## Shadows

| Token | Light Mode | Dark Mode |
|-------|-----------|-----------|
| `shadow-sm` | Subtle elevation | Darker subtle |
| `shadow-card` | Standard card | Muted card |
| `shadow-soft` | Diffused soft | Dark soft |
| `shadow-glow` | Colored glow | Colored glow |

---

## Animation

### Timing Functions
```css
--ease-out: cubic-bezier(0.16, 1, 0.3, 1)
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55)
```

### Duration
- **Fast**: 150ms - Button feedback
- **Default**: 200ms - Most transitions
- **Slow**: 300ms - Larger animations
- **Slower**: 500ms - Page transitions

### Common Animations
1. **fadeIn**: Opacity 0 → 1
2. **slideUp**: Translate + fade
3. **scaleIn**: Scale 0.95 → 1 + fade
4. **shimmer**: Gradient movement (loading)
5. **float**: Subtle vertical oscillation

---

## Dark Mode

The system supports automatic dark mode detection via `prefers-color-scheme` media query, with manual override option.

### Key Differences
| Element | Light | Dark |
|---------|-------|------|
| Background | #f8fafc | #0a0a0a |
| Surface | #ffffff | #141414 |
| Text | #0f172a | #f8fafc |
| Borders | #e2e8f0 | #262626 |
| Cards | White + shadow | Dark + subtle border |

### Implementation
```tsx
// ThemeProvider manages theme state
const { theme, setTheme, resolvedTheme } = useTheme();

// CSS classes applied to document root
<html class="light"> or <html class="dark">
```

---

## Toast Notifications

### Types
1. **Success** (Green): Confirmations, completions
2. **Error** (Red): Failures, validation errors
3. **Info** (Blue): General information
4. **Warning** (Amber): Cautions, alerts
5. **WhatsApp** (Green): Dispatch confirmations

### Behavior
- Appear from top-right
- Auto-dismiss: 5 seconds
- Max visible: 5 toasts
- Stacked with gap
- Dismissible via close button

---

## Iconography

Using **Lucide React** icons throughout the application.

### Standard Sizes
- Small: 16px (inline)
- Default: 20px (buttons)
- Medium: 24px (navigation)
- Large: 32px+ (features)

### Common Icons
| Icon | Usage |
|------|-------|
| `Car` | Logo, vehicles |
| `LayoutDashboard` | Dashboard |
| `CalendarPlus` | Bookings |
| `Users` | Drivers |
| `ShoppingBag` | Concierge |
| `MapPin` | Locations |
| `Clock` | Time |
| `MessageSquare` | WhatsApp |

---

## Responsive Breakpoints

| Breakpoint | Width | Usage |
|------------|-------|-------|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Large desktop |
| `2xl` | 1536px | Wide screens |

### Layout Strategy
- Mobile-first approach
- Sidebar hidden on mobile (<768px)
- Bottom navigation on mobile
- Floating action button on all sizes

---

## Usage Examples

### Button Usage
```tsx
import { Button } from '@/components/ui';

<Button variant="primary" size="lg">
  Create Booking
</Button>

<Button variant="whatsapp" icon={<MessageSquare />}>
  Contact Driver
</Button>
```

### Toast Usage
```tsx
import { useToast } from '@/providers/ToastProvider';

const toast = useToast();

// Success
toast.success('Booking created successfully');

// WhatsApp dispatch
toast.whatsapp('Job dispatched to John');

// Error
toast.error('Failed to assign driver');
```

### Theme Toggle
```tsx
import { ThemeToggle } from '@/components/ui';

// Compact version for headers
<ThemeToggle variant="compact" />

// Full version with labels
<ThemeToggle />
```

---

## File Structure

```
src/
├── components/
│   └── ui/
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Badge.tsx
│       ├── Input.tsx
│       ├── ThemeToggle.tsx
│       └── index.ts
├── providers/
│   ├── ThemeProvider.tsx
│   ├── ToastProvider.tsx
│   └── index.ts
├── styles/
│   └── theme.css
├── lib/
│   └── utils.ts
└── index.css
```

---

*Last updated: November 2024*
*Version: 1.0*
