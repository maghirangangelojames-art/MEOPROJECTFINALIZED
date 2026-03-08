# 🎨 Quick CSS/Component Reference Card

## 🎬 Animations

### Page Load Animations
```jsx
// Fade animations
<div className="animate-fade-in">Content</div>              // 0.4s
<div className="animate-fade-in-delayed">Content</div>      // 0.8s (delayed start)
<div className="animate-fade-in-slow">Content</div>         // 1.2s

// Entrance animations
<div className="animate-zoom-in">Pop-in effect</div>
<div className="animate-slide-in-up-bounce">Bounce up</div>
```

### Directional Animations
```jsx
<div className="animate-slide-in-left">From left</div>
<div className="animate-slide-in-right">From right</div>
<div className="animate-slide-in-up">From bottom</div>
<div className="animate-slide-in-down">From top</div>
```

### Continuous Animations
```jsx
<div className="animate-float">Floating up/down</div>
<div className="animate-float-slow">Slow floating</div>
<div className="animate-subtle-glow">Glowing aura</div>
<div className="animate-pulse">Pulsing effect</div>
```

### Special Animations
```jsx
<div className="animate-scale-in">Scale from small</div>
<div className="animate-flip">Rotation flip</div>
<div className="animate-shake">Shake effect</div>
```

### Automatic Stagger (for lists/grids)
```jsx
<div className="stagger-container">
  <Card>Item 1</Card>  {/* Animates at 0s */}
  <Card>Item 2</Card>  {/* Animates at 0.1s */}
  <Card>Item 3</Card>  {/* Animates at 0.2s */}
</div>
```

---

## 🎴 Card Styles

```jsx
// Basic elevated card
<div className="card-elevated">Content</div>

// Hover with lift effect
<div className="card-hover">Hoverable content</div>

// Interactive with click feedback
<div className="card-interactive">Clickable card</div>

// Animated glow effect
<div className="card-glow">Highlighted card</div>

// Modern gradient card
<div className="card-gradient">Premium card</div>
```

---

## 🔘 Button Styles

```jsx
// Primary CTA button
<button className="btn-primary-meo">Submit</button>

// Large primary button (hero CTAs)
<button className="btn-lg-primary-meo">Get Started</button>

// Secondary option
<button className="btn-secondary-meo">Cancel</button>

// Ghost/minimal button
<button className="btn-ghost-meo">Learn More</button>

// Outline button
<button className="btn-outline">Alternative Action</button>
```

---

## 🏷️ Badge & Status

### Animated Badges
```jsx
import { AnimatedBadge } from '@/components/AnimatedComponents';

<AnimatedBadge variant="success">Approved ✓</AnimatedBadge>
<AnimatedBadge variant="warning">Pending</AnimatedBadge>
<AnimatedBadge variant="error">Rejected</AnimatedBadge>
<AnimatedBadge variant="info">In Progress</AnimatedBadge>
<AnimatedBadge variant="default">New</AnimatedBadge>

// With animation
<AnimatedBadge variant="success" animated={true}>
  Processing...
</AnimatedBadge>
```

### Progress Indicators
```jsx
import { AnimatedProgressBar } from '@/components/AnimatedComponents';

// Basic progress bar
<AnimatedProgressBar percentage={75} />

// With color and animation
<AnimatedProgressBar 
  percentage={65} 
  color="yellow"
  animated={true}
  showLabel={true}
/>

// Colors: "blue" | "green" | "red" | "yellow"
```

---

## 🎨 Gradients

### Brand Gradients
```jsx
<div className="gradient-meo">Blue MEO gradient</div>
<div className="gradient-meo-light">Light blue gradient</div>
<div className="gradient-meo-animated">Animated gradient shift</div>
<div className="gradient-hero">Hero section gradient</div>
<div className="gradient-accent">Cyan accent gradient</div>
```

---

## 💨 Glass Morphism

```jsx
// Light glass effect
<div className="glass">Content with blur</div>

// Strong glass effect
<div className="glass-lg">Premium with more blur</div>

// Manual blur control
<div className="backdrop-blur-sm">Light blur</div>
<div className="backdrop-blur">Medium blur</div>
<div className="backdrop-blur-lg">Heavy blur</div>
```

---

## 🌙 Shadow Effects

### Professional Shadows
```jsx
<div className="shadow-subtle">Minimal shadow</div>
<div className="shadow-soft">Light shadow</div>
<div className="shadow-medium">Standard shadow</div>
<div className="shadow-large">Deep shadow</div>

// Glow effects
<div className="shadow-glow-blue">Blue glow</div>
<div className="shadow-glow-blue-lg">Large blue glow</div>
```

---

## 📝 Form Elements

```jsx
// Modern input styling
<input className="input-modern" placeholder="Enter text" />

// With focus effects
<input 
  className="input-modern focus:ring-blue-500/30"
  placeholder="Professional input"
/>

// Inside a glass container
<div className="glass p-6">
  <input className="input-modern" />
</div>
```

---

## ⏳ Loading States

```jsx
import { 
  SkeletonLoader, 
  LoadingDots, 
  CardSkeleton 
} from '@/components/LoadingAnimation';

// Text skeleton (3 lines)
<SkeletonLoader variant="text" count={3} />

// Circle skeleton (for avatars)
<SkeletonLoader variant="circle" />

// Full card skeleton
<CardSkeleton count={3} />

// Animated dots
<LoadingDots color="bg-blue-600" />
<LoadingDots color="bg-green-600" />
```

---

## 🧩 Animated Components

### AnimatedCard
```jsx
import { AnimatedCard } from '@/components/AnimatedComponents';

<AnimatedCard 
  hover="lift"              // "lift" | "glow" | "scale" | "none"
  gradient={true}           // Use gradient styling
  interactive={true}        // Makes it clickable
  onClick={() => {}}        // Click handler
>
  Card content here
</AnimatedCard>
```

### FloatingActionButton
```jsx
import { FloatingActionButton } from '@/components/AnimatedComponents';

<FloatingActionButton
  color="blue"              // "blue" | "green" | "red"
  animated={true}           // Floating animation
  onClick={() => {}}        // Click handler
>
  <PlusIcon />              // Icon or content
</FloatingActionButton>
```

---

## 🎯 Text & Typography

```jsx
// Text gradient (brand colors)
<h1 className="text-gradient text-5xl">Branded Title</h1>

// Accent gradient
<span className="text-gradient-accent">Accent text</span>

// Professional heading
<h2 className="text-3xl font-semibold">Standard heading</h2>
```

---

## 🔄 Transitions

```jsx
// Smooth transitions
<div className="transition-smooth">Content</div>
<div className="transition-smooth-slow">Slow transition</div>
<div className="transition-fast">Quick transition</div>

// Hover effects
<div className="smooth-hover">Smooth on interact</div>
<div className="scale-on-hover">Scales on hover</div>
<div className="lift-on-hover">Lifts on hover</div>
```

---

## 📱 Responsive Utilities

```jsx
// Hide on mobile
<div className="hide-on-mobile">Desktop only</div>

// Show only on mobile
<div className="show-on-mobile">Mobile only</div>

// Performance optimization
<div className="will-change-transform">Animated element</div>
<div className="will-change-opacity">Fading element</div>
```

---

## 🌗 Dark Mode

All components automatically support dark mode. Just add `dark:` variants:

```jsx
<div className="bg-white dark:bg-black text-black dark:text-white">
  Dark mode aware
</div>
```

---

## ♿ Accessibility

All animations respect prefers-reduced-motion:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 🎬 Animation Timing Values

| Timing | Duration | Use Case |
|--------|----------|----------|
| Fast | 150ms | Quick feedback |
| Regular | 250-300ms | Hover effects |
| Smooth | 400-500ms | Page transitions |
| Slow | 800ms+ | Entrance animations |

---

## 💾 Import Statements

```jsx
// Components
import { AnimatedCard, AnimatedBadge, AnimatedProgressBar, FloatingActionButton } 
  from '@/components/AnimatedComponents';

import { SkeletonLoader, LoadingDots, CardSkeleton } 
  from '@/components/LoadingAnimation';

import EnhancedPageTransition 
  from '@/components/EnhancedPageTransition';

// Types (if needed)
import type { SkeletonLoaderProps, AnimatedCardProps } 
  from '@/components/AnimatedComponents';
```

---

## 🎨 Color Palette

```
Primary Blue: #0D47A1 (bg-blue-700 in Tailwind)
Light Blue: #1565C0 (bg-blue-800)
Accent Teal: #00897B
Dark Text: #37474F
```

Use with Tailwind classes:
```jsx
<div className="bg-blue-700 hover:bg-blue-800">Primary</div>
<div className="text-blue-700">Blue text</div>
<div className="border-blue-700">Blue border</div>
<div className="ring-blue-400/60">Blue focus ring</div>
```

---

## ⚡ Performance Tips

1. Use `stagger-container` instead of individual animations
2. Limit animations to critical UI (hero, CTAs, status)
3. Use `will-change` for frequently animated elements
4. Prefer CSS animations over JavaScript
5. Test with DevTools Lighthouse

---

## 🧪 Quick Testing

```bash
# Check animations are working
Open DevTools > Elements > Look for animation class

# Test dark mode
Toggle theme in UI or DevTools

# Test reduced motion
DevTools > Rendering > Emulate CSS media feature prefers-reduced-motion

# Check performance
DevTools > Performance > Record animation
```

---

Generated: March 8, 2026  
Version: 1.0  
Status: Ready for Production
