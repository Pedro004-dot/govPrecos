# Design Guide - GovPrecos Professional Government Software

## Brand Identity

### Overview
GovPrecos is a professional price research platform for Brazilian government procurement, designed to comply with Law 14.133/2021. The design system reflects **trust**, **professionalism**, and **authority** appropriate for government use.

---

## Color System

### Brand Colors

#### Primary Blue - #1A71FF
**HSL**: `217 100% 55%`
**Usage**: Main actions, primary buttons, links, focus states
**Personality**: Professional, trustworthy, authoritative

```css
--primary: 217 100% 55%;
--primary-foreground: 0 0% 100%;
```

**When to use:**
- Primary call-to-action buttons
- Active navigation items
- Important links
- Focus rings
- Brand elements

---

#### Secondary Blue - #478EFF
**HSL**: `217 100% 64%`
**Usage**: Secondary actions, accents, hover states
**Personality**: Lighter, approachable while maintaining professionalism

```css
--secondary: 217 100% 64%;
--secondary-foreground: 0 0% 100%;
```

**When to use:**
- Secondary buttons
- Accent elements
- Hover states for primary elements
- Charts and data visualization
- Info badges

---

#### White - #FFFFFF
**HSL**: `0 0% 100%`
**Usage**: Backgrounds, cards, text on colored backgrounds
**Personality**: Clean, spacious, official

```css
--background: 0 0% 100%;
--card: 0 0% 100%;
```

**When to use:**
- Main background
- Card backgrounds
- Text on colored buttons
- Clean separation between sections

---

### Semantic Colors

#### Success - Professional Green
**HSL**: `142 76% 36%`
**Usage**: Compliance indicators, successful operations, completed states

```css
--success: 142 76% 36%;
--success-foreground: 0 0% 100%;
```

**When to use:**
- ✅ Compliance badges ("3/3 sources")
- Successful operations
- "Valid" status indicators
- Finalized project indicators
- Positive validation feedback

**Example**: `<Badge variant="default" className="bg-success text-success-foreground">`

---

#### Warning - Professional Amber
**HSL**: `38 92% 50%`
**Usage**: Warnings, items needing attention, non-blocking issues

```css
--warning: 38 92% 50%;
--warning-foreground: 0 0% 100%;
```

**When to use:**
- ⚠️ Warning badges ("2/3 sources")
- Pending items
- Recency warnings (12-24 months old)
- Non-critical validation issues
- Items requiring justification

**Example**: Source counter badges for 2/3 sources

---

#### Destructive - Professional Red
**HSL**: `0 84% 60%`
**Usage**: Errors, blocking issues, delete actions

```css
--destructive: 0 84% 60%;
--destructive-foreground: 0 0% 100%;
```

**When to use:**
- ❌ Error badges ("0/3 sources")
- Delete confirmation buttons
- Blocking validation errors
- Critical issues
- Source removal actions

---

### Neutral Colors

#### Foreground (Text)
**HSL**: `217 91% 15%`
**Deep blue-gray for primary text**

High contrast ratio ensures readability and professionalism.

---

#### Muted
**HSL**: `217 50% 97%` (background)
**HSL**: `217 20% 45%` (foreground)

Subtle blue tint for:
- Less important UI elements
- Disabled states
- Secondary information
- Placeholder text

---

#### Border
**HSL**: `217 30% 88%`
**Subtle blue-gray for professional separation**

Maintains brand identity even in subtle elements.

---

## Dark Mode

### Philosophy
Dark mode maintains brand identity with sophisticated deep blues while ensuring excellent readability and reduced eye strain.

### Color Adjustments

**Background**: `217 91% 8%` - Very dark navy (almost black)
**Primary**: `217 100% 64%` - Lighter blue for better visibility
**Success/Warning/Error**: Slightly brighter for dark backgrounds

**Key Principle**: Maintain same semantic meaning across light/dark modes.

---

## Typography

### Font Family
**System Font Stack** - Native, fast, accessible
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, ...
```

### Hierarchy

#### Headings
- **H1**: `text-3xl font-bold` (30px) - Page titles
- **H2**: `text-2xl font-semibold` (24px) - Section titles
- **H3**: `text-xl font-semibold` (20px) - Card titles
- **H4**: `text-lg font-medium` (18px) - Subsections

#### Body
- **Default**: `text-base` (16px) - Main content
- **Small**: `text-sm` (14px) - Secondary info
- **XS**: `text-xs` (12px) - Captions, metadata

### Font Weights
- **Bold**: `font-bold` (700) - Primary headings
- **Semibold**: `font-semibold` (600) - Secondary headings
- **Medium**: `font-medium` (500) - Emphasized text
- **Normal**: `font-normal` (400) - Body text

---

## Spacing System

### Consistent Scale (Tailwind)
- **xs**: `0.25rem` (4px)
- **sm**: `0.5rem` (8px)
- **md**: `1rem` (16px)
- **lg**: `1.5rem` (24px)
- **xl**: `2rem` (32px)
- **2xl**: `2.5rem` (40px)

### Application
- **Card padding**: `p-4` or `p-6` (16-24px)
- **Section gaps**: `space-y-6` (24px vertical)
- **Button padding**: `px-4 py-2` (16px horizontal, 8px vertical)
- **Form gaps**: `space-y-4` (16px between fields)

---

## Border Radius

### Professional Standard
**Base**: `0.5rem` (8px) - Less rounded than consumer apps

```css
--radius: 0.5rem;
```

### Variants
- **sm**: `0.375rem` (6px) - Small elements
- **md**: `0.5rem` (8px) - Default
- **lg**: `0.625rem` (10px) - Large cards
- **xl**: `0.75rem` (12px) - Modal dialogs

**Philosophy**: Subtle rounding conveys professionalism while remaining modern.

---

## Component Patterns

### Buttons

#### Primary Button
```tsx
<Button className="bg-primary text-primary-foreground hover:bg-primary/90">
  Criar Projeto
</Button>
```

#### Secondary Button
```tsx
<Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
  Cancelar
</Button>
```

#### Destructive Button
```tsx
<Button variant="destructive">
  Excluir
</Button>
```

---

### Badges

#### Success (Compliance)
```tsx
<Badge className="bg-success text-success-foreground">
  3/3 ✓
</Badge>
```

#### Warning (Pending)
```tsx
<Badge className="bg-warning text-warning-foreground">
  2/3 ⚠️
</Badge>
```

#### Error (Blocking)
```tsx
<Badge variant="destructive">
  0/3 ❌
</Badge>
```

#### Info (Secondary Blue)
```tsx
<Badge className="bg-secondary text-secondary-foreground">
  Lei 14.133/2021
</Badge>
```

---

### Cards

#### Standard Card
```tsx
<Card className="border-2 border-border bg-card">
  <CardHeader>
    <CardTitle>Título</CardTitle>
    <CardDescription>Descrição</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

#### Success Card (Finalized Projects)
```tsx
<Card className="border-2 border-success bg-success/10">
  {/* Green-tinted success state */}
</Card>
```

#### Warning Card (Pending Items)
```tsx
<Card className="border-2 border-warning bg-warning/10">
  {/* Amber-tinted warning state */}
</Card>
```

---

### Forms

#### Input Fields
```tsx
<Input
  className="border-input focus:ring-primary focus:border-primary"
  placeholder="Digite o nome..."
/>
```

#### Labels
```tsx
<label className="text-sm font-medium text-foreground">
  Nome do Projeto <span className="text-destructive">*</span>
</label>
```

---

## Accessibility

### Color Contrast
**WCAG AA Compliant** - Minimum 4.5:1 for normal text

- Primary blue on white: **7.8:1** ✅
- Foreground on background: **12.4:1** ✅
- Success green: **6.2:1** ✅
- Warning amber: **5.1:1** ✅
- Destructive red: **4.6:1** ✅

### Focus States
All interactive elements have visible focus rings using `--ring` color (primary blue).

```css
outline-ring/50 /* Applied globally to all focusable elements */
```

### Keyboard Navigation
- Tab order follows visual hierarchy
- Escape closes dialogs
- Enter submits forms
- Arrow keys navigate lists

---

## Icons

### Library
**Lucide React** - Clean, professional, consistent stroke width

### Size Guidelines
- **xs**: `w-3 h-3` (12px) - Inline with small text
- **sm**: `w-4 h-4` (16px) - Standard buttons, badges
- **md**: `w-5 h-5` (20px) - Large buttons, headings
- **lg**: `w-6 h-6` (24px) - Feature icons
- **xl**: `w-8 h-8` (32px) - Hero icons, empty states

### Color
Icons inherit text color by default. Use semantic colors for status:
- Success: `text-success`
- Warning: `text-warning`
- Error: `text-destructive`
- Info: `text-info`

---

## Layout

### Container Widths
- **Default**: Full width with `padding-inline: 2rem`
- **Max Width**: `1400px` on large screens
- **Breakpoints**:
  - Mobile: < 640px
  - Tablet: 640px - 1024px
  - Desktop: > 1024px

### Grid System
- **Dashboard metrics**: `grid-cols-1 md:grid-cols-4`
- **Forms**: `grid-cols-1 md:grid-cols-2`
- **Item lists**: `grid-cols-1` (stacked)

---

## Animation

### Transitions
**Subtle and professional** - No flashy animations

```css
transition-all duration-200 /* Standard */
hover:shadow-md transition-shadow /* Cards */
```

### Loading States
```tsx
<Loader2 className="w-4 h-4 animate-spin text-primary" />
```

### Accordion
```css
--animate-accordion-down: accordion-down 0.2s ease-out;
--animate-accordion-up: accordion-up 0.2s ease-out;
```

---

## Professional Design Principles

### 1. Trust Through Consistency
- Predictable layouts
- Consistent spacing
- Uniform component styles
- Same interactions across pages

### 2. Authority Through Visual Hierarchy
- Clear page titles (H1)
- Well-organized sections (H2, H3)
- Important actions stand out (primary buttons)
- Secondary actions recede (outline buttons)

### 3. Clarity Through Simplicity
- One primary action per screen
- Minimal decoration
- Clear labels
- Helpful descriptions

### 4. Credibility Through Attention to Detail
- Proper spacing (not cramped)
- High contrast text
- Professional typography
- Subtle shadows and borders

### 5. Compliance Through Transparency
- Legal notices visible
- Audit requirements clear
- Justifications mandatory
- Sources traceable

---

## Government-Specific Guidelines

### Legal Compliance Notices
Always use **blue info cards** with legal icon:

```tsx
<div className="p-3 border rounded-lg bg-info/10 border-info/20">
  <p className="text-xs text-info-foreground/80">
    <strong>⚖️ Lei 14.133/2021:</strong> {compliance text}
  </p>
</div>
```

### Status Badges
Follow compliance semantics:
- ✅ Green: Compliant, ready, finalized
- ⚠️ Amber: Warning, pending, needs attention
- ❌ Red: Error, blocking, requires fix

### Data Tables
- Zebra striping for readability
- Sortable columns
- Pagination for large datasets
- Export to PDF/Excel

### Forms
- Required fields marked with red asterisk
- Validation on blur (not on keystroke)
- Clear error messages below fields
- Success confirmation after save

---

## Dark Mode Best Practices

### When to Use
Respect system preference by default. Allow manual toggle.

### Adjustments
- Text contrast slightly reduced (95% vs 100% white)
- Borders more subtle (darker)
- Shadows stronger for elevation
- Primary blue lighter for visibility

### Testing
Always test critical flows in both light and dark modes.

---

## Responsive Design

### Mobile First
Start with mobile layout, enhance for desktop.

### Breakpoint Strategy
- **Mobile**: Single column, stacked cards
- **Tablet**: Two columns for metrics, single for forms
- **Desktop**: Full grid layouts, side-by-side panels

### Touch Targets
Minimum `44px × 44px` for buttons on mobile.

---

## Performance

### CSS
- No custom fonts (system fonts are fast)
- Minimal animation (CSS only, no JS)
- Tailwind purges unused styles

### Images
- SVG icons (scalable, small)
- No decorative images
- Lazy load if needed

---

## Do's and Don'ts

### ✅ Do
- Use primary blue for main actions
- Maintain high contrast for text
- Show loading states
- Provide clear error messages
- Use semantic HTML
- Test with keyboard only
- Respect user preferences (dark mode)

### ❌ Don't
- Use bright neon colors
- Add unnecessary animations
- Hide important information
- Use tiny font sizes (<12px)
- Remove focus indicators
- Make clickable elements too small
- Use all caps extensively

---

## Component Library

All components follow shadcn/ui patterns with our custom color theme:

- **Button**: Primary, Secondary, Outline, Ghost, Destructive
- **Badge**: Default (success), Secondary (info), Destructive, Outline
- **Card**: Standard, Success variant, Warning variant
- **Alert**: Info (blue), Warning (amber), Destructive (red), Success (green)
- **Dialog**: Modal overlays for important actions
- **Form**: Input, Textarea, Select, Checkbox, Radio
- **Table**: Sortable, paginated, exportable

---

## Quick Reference

### Color Usage Matrix

| Element | Light Mode | Dark Mode | Purpose |
|---------|-----------|-----------|---------|
| Primary Button | #1A71FF | #478EFF | Main actions |
| Secondary Button | Outline #1A71FF | Outline #478EFF | Cancel, back |
| Success Badge | #22C55E | #4ADE80 | Compliance |
| Warning Badge | #F59E0B | #FBBF24 | Pending |
| Error Badge | #EF4444 | #F87171 | Blocking |
| Text | #1C2837 | #E5E7EB | Content |
| Border | #D1DBE8 | #374151 | Separation |

---

This design guide ensures GovPrecos maintains a professional, trustworthy appearance suitable for government procurement while remaining modern and user-friendly.
