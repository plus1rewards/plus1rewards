# Design Guidelines

## Border Radius Standards

**CRITICAL: NO PILL SHAPES (rounded-full)**

All UI elements must use consistent border radius values. **NEVER use `rounded-full` or pill shapes.**

### Standard Border Radius Values

- **Cards, Containers, Modals**: `rounded-xl` (12px) or `rounded-lg` (8px)
- **Buttons**: `rounded-lg` (8px)
- **Badges, Tags, Small Elements**: `9px` (use inline style: `style={{ borderRadius: '9px' }}`)
- **Input Fields**: `rounded-lg` (8px)
- **Avatars/Profile Pictures**: `rounded-full` (ONLY exception - actual circular profile images)

### Examples

#### ✅ CORRECT - Badges with 9px radius
```tsx
<span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800" style={{ borderRadius: '9px' }}>
  2 dep
</span>
```

#### ❌ WRONG - Pill shape badges
```tsx
<span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
  2 dep
</span>
```

#### ✅ CORRECT - Cards
```tsx
<div className="bg-white border border-gray-200 rounded-xl p-6">
  Content
</div>
```

#### ✅ CORRECT - Buttons
```tsx
<button className="px-4 py-2 bg-[#1a558b] text-white rounded-lg">
  Click Me
</button>
```

## Color Palette

### Primary Colors
- **Primary Blue**: `#1a558b` (brand color)
- **Secondary Green**: `#37d270` (success, positive actions)

### Status Colors
- **Active/Success**: `bg-green-500/20 text-green-600` or `bg-[#1a558b] text-white`
- **Warning/Pending**: `bg-yellow-500/20 text-yellow-600`
- **Error/Suspended**: `bg-red-500/20 text-red-600`
- **Info**: `bg-blue-500/20 text-blue-600`

### Neutral Colors
- **Background**: `bg-gray-50` or `bg-[#f5f8fc]`
- **Cards**: `bg-white`
- **Borders**: `border-gray-200`
- **Text Primary**: `text-gray-900`
- **Text Secondary**: `text-gray-600`
- **Text Muted**: `text-gray-400`

## Typography

### Font Weights
- **Black**: `font-black` (900) - Large numbers, headings
- **Bold**: `font-bold` (700) - Subheadings, labels
- **Semibold**: `font-semibold` (600) - Body emphasis
- **Medium**: `font-medium` (500) - Regular text
- **Normal**: `font-normal` (400) - Default

### Text Sizes
- **Headings**: `text-2xl` or `text-3xl`
- **Subheadings**: `text-lg` or `text-xl`
- **Body**: `text-sm` or `text-base`
- **Small**: `text-xs`
- **Tiny**: `text-[10px]`

## Spacing

### Padding
- **Cards**: `p-4 md:p-6`
- **Buttons**: `px-4 py-2` or `px-5 py-2.5`
- **Containers**: `px-6 py-4`

### Gaps
- **Small**: `gap-2`
- **Medium**: `gap-3` or `gap-4`
- **Large**: `gap-6`

## Shadows

- **Cards**: `shadow-sm` or `shadow-md`
- **Modals**: `shadow-2xl`
- **Hover**: `hover:shadow-md`

## Transitions

Always add smooth transitions:
```tsx
className="transition-colors duration-150"
className="transition-shadow duration-200"
className="transition-all duration-300"
```

## Responsive Design

Use responsive classes:
- `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- `text-sm md:text-base`
- `p-4 md:p-6`
- `gap-3 md:gap-4`

## Icons

Use Material Symbols Outlined:
```tsx
<span className="material-symbols-outlined">icon_name</span>
```

Common sizes:
- Small: `text-sm` or `text-base`
- Medium: `text-lg` or `text-xl`
- Large: `text-2xl` or `text-3xl`

## Buttons

### Primary Button
```tsx
<button className="px-4 py-2 bg-[#1a558b] text-white rounded-lg hover:opacity-90 transition-all font-bold">
  Primary Action
</button>
```

### Secondary Button
```tsx
<button className="px-4 py-2 border border-[#1a558b] bg-white text-[#1a558b] rounded-lg hover:bg-[#1a558b] hover:text-white transition-all font-bold">
  Secondary Action
</button>
```

### Icon Button
```tsx
<button className="p-2 text-[#1a558b] hover:bg-[#1a558b]/10 rounded-lg transition-colors">
  <span className="material-symbols-outlined">icon_name</span>
</button>
```

## Status Badges

Always use 9px radius:
```tsx
<span className="px-3 py-1 text-xs font-semibold bg-green-500/20 text-green-600" style={{ borderRadius: '9px' }}>
  ACTIVE
</span>
```

## Tables

- **Header**: `bg-gray-50 border-b border-gray-200`
- **Rows**: `hover:bg-gray-50 transition-colors`
- **Cells**: `px-6 py-4`
- **Borders**: `border-gray-200`

## Modals

```tsx
<div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}>
  <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
    {/* Content */}
  </div>
</div>
```

## Forms

### Input Fields
```tsx
<input
  type="text"
  className="w-full bg-white border border-gray-200 rounded-lg py-2.5 px-4 text-sm text-gray-900 focus:ring-2 focus:ring-[#1a558b] focus:border-[#1a558b] outline-none transition-all"
  placeholder="Enter text..."
/>
```

### Select Dropdowns
```tsx
<select className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm text-gray-900 focus:ring-1 focus:ring-[#1a558b] outline-none">
  <option>Option 1</option>
</select>
```

## Loading States

```tsx
<div className="animate-pulse">
  <div className="h-8 bg-gray-200 rounded mb-2"></div>
  <div className="h-4 bg-gray-200 rounded"></div>
</div>
```

## Empty States

```tsx
<div className="text-center py-12">
  <span className="material-symbols-outlined text-gray-400 text-4xl mb-2">inbox</span>
  <p className="text-gray-600">No data found</p>
</div>
```

---

**Remember: Consistency is key. Always follow these guidelines to maintain a cohesive design system across the platform.**
