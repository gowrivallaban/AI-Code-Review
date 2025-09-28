# Tailwind CSS v4 Setup for GitHub PR Review UI

This project uses Tailwind CSS v4 with Vite for styling. The setup follows the official Tailwind CSS documentation for Vite integration.

## Configuration Files

### 1. `postcss.config.js`
```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};
```

### 2. `tailwind.config.js`
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Custom GitHub-themed colors
        github: {
          50: '#f6f8fa',
          100: '#eaeef2',
          200: '#d0d7de',
          300: '#afb8c1',
          400: '#8c959f',
          500: '#6e7781',
          600: '#57606a',
          700: '#424a53',
          800: '#32383f',
          900: '#24292f',
        },
        // Status colors
        success: { 50: '#f0fff4', 500: '#22c55e', 600: '#16a34a' },
        warning: { 50: '#fffbeb', 500: '#f59e0b', 600: '#d97706' },
        error: { 50: '#fef2f2', 500: '#ef4444', 600: '#dc2626' },
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
```

### 3. `vite.config.ts`
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.js',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/components': resolve(__dirname, './src/components'),
      '@/services': resolve(__dirname, './src/services'),
      '@/hooks': resolve(__dirname, './src/hooks'),
      '@/types': resolve(__dirname, './src/types'),
      '@/utils': resolve(__dirname, './src/utils')
    }
  },
  build: {
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['react-markdown', 'react-syntax-highlighter'],
        }
      }
    }
  }
})
```

### 4. `src/index.css`
The main CSS file imports Tailwind and includes custom component styles:

```css
@import "tailwindcss";

/* Custom component styles and utilities */
```

## Key Features

### 1. **Tailwind CSS v4 Integration**
- Uses the new `@import "tailwindcss"` syntax
- Configured with PostCSS for optimal processing
- Includes custom color palette for GitHub-themed UI

### 2. **Custom Component Classes**
- `.btn-primary`, `.btn-secondary`, `.btn-danger` - Button variants
- `.card`, `.card-header` - Card components
- `.code-block` - Code syntax highlighting
- `.diff-addition`, `.diff-deletion` - Git diff styling
- `.spinner` - Loading animations

### 3. **Utility Classes**
- `.text-balance` - Balanced text wrapping
- `.scrollbar-hide` - Hide scrollbars
- Custom scrollbar styling for webkit browsers

### 4. **Performance Optimizations**
- CSS code splitting enabled
- Manual chunks for vendor and UI libraries
- Proper PostCSS configuration for build optimization

## Usage Examples

### Basic Styling
```jsx
<div className="p-6 bg-white rounded-lg shadow-md">
  <h1 className="text-2xl font-bold text-gray-900">Title</h1>
  <p className="text-gray-600 mt-2">Description text</p>
</div>
```

### Custom Components
```jsx
<button className="btn-primary">Save Changes</button>
<div className="card">
  <div className="card-header">
    <h2 className="text-lg font-semibold">Card Title</h2>
  </div>
  <p>Card content goes here</p>
</div>
```

### GitHub-themed Colors
```jsx
<div className="bg-github-50 border border-github-200 p-4">
  <span className="text-github-700">GitHub-styled content</span>
</div>
```

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Dependencies

- `tailwindcss`: ^4.1.13
- `@tailwindcss/postcss`: ^4.1.13
- `autoprefixer`: ^10.4.21
- `postcss`: ^8.5.6

## Notes

- Tailwind CSS v4 uses a different approach than v3, with simplified configuration
- The `@import "tailwindcss"` directive replaces the traditional `@tailwind` directives
- Custom styles are written in regular CSS rather than using `@apply` directives for better v4 compatibility
- All Tailwind utility classes are available and work as expected in components