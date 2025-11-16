const plugin = require('tailwindcss/plugin');

const sizes = {
  '2xs': '1.4rem',
  xs: '1.8rem',
  sm: '2.0rem',
  md: '2.3rem',
  lg: '2.6rem',
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '[data-resolved-appearance="dark"]'],
  content: [
    './*.{html,ts,tsx}',
    './commands/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
    './init/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './routes/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      keyframes: {
        blinkRing: {
          '0%, 49%': { '--tw-ring-color': 'var(--primary)' },
          '50%, 99%': { '--tw-ring-color': 'transparent' },
          '100%': { '--tw-ring-color': 'var(--primary)' },
        },
        pulseError: {
          '0%': { boxShadow: '0 0 0 0 rgba(247, 90, 90, 0.5)' },
          '50%': { boxShadow: '0 0 0 8px rgba(247, 90, 90, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(247, 90, 90, 0)' },
        },
        portPulse: {
          '0%': { boxShadow: '0 0 8px rgba(44, 119, 223, 0.5)' },
          '50%': { boxShadow: '0 0 12px rgba(44, 119, 223, 0.8)' },
          '100%': { boxShadow: '0 0 8px rgba(44, 119, 223, 0.5)' },
        },
      },
      animation: {
        blinkRing: 'blinkRing 150ms step-start 400ms infinite',
        'pulse-error': 'pulseError 1.5s infinite',
        'port-pulse': 'portPulse 1s infinite',
      },
      opacity: {
        disabled: '0.3',
      },
      fontSize: {
        xs: '0.8rem',
      },
      height: sizes,
      width: sizes,
      minHeight: sizes,
      minWidth: sizes,
      lineHeight: {
        // HACK: Minus 2 to account for borders inside inputs
        xs: 'calc(1.75rem - 2px)',
        sm: 'calc(2.0rem - 2px)',
        md: 'calc(2.5rem - 2px)',
      },
      transitionProperty: {
        grid: 'grid',
      },
    },
    fontFamily: {
      mono: [
        'var(--font-family-editor)',
        'JetBrains Mono',
        'ui-monospace',
        'SFMono-Regular',
        'Menlo',
        'Monaco',
        'Fira Code',
        'Ubuntu Mono',
        'Consolas',
        'Liberation Mono',
        'Courier New',
        'DejaVu Sans Mono',
        'Hack',
        'monospace',
      ],
      sans: [
        'var(--font-family-interface)',
        'Inter UI',
        '-apple-system',
        'BlinkMacSystemFont',
        'Segoe UI',
        'Roboto',
        'Oxygen-Sans',
        'Ubuntu',
        'Cantarell',
        'Helvetica Neue',
        'sans-serif',
        'Apple Color Emoji',
        'Segoe UI Emoji',
        'Segoe UI Symbol',
      ],
    },
    fontSize: {
      '4xs': '0.6rem',
      '3xs': '0.675rem',
      '2xs': '0.75rem',
      xs: '0.8rem',
      sm: '0.9rem',
      base: '1rem',
      lg: '1.12rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '2rem',
      '4xl': '2.5rem',
      '5xl': '3rem',
      editor: 'var(--editor-font-size)',
      shrink: '0.8em',
    },
    boxShadow: {
      DEFAULT: '0 1px 3px 0 var(--shadow)',
      lg: '0 10px 15px -3px var(--shadow)',
      'node': '0 4px 20px rgba(0, 0, 0, 0.08)',
      'node-hover': '0 12px 25px rgba(44, 119, 223, 0.2)',
      'context-menu': '0 6px 20px rgba(0, 0, 0, 0.15)',
    },
    colors: {
      transparent: 'transparent',
      placeholder: 'var(--textSubtlest)',
      shadow: 'var(--shadow)',
      backdrop: 'var(--backdrop)',
      selection: 'var(--selection)',

      // New theme values

      surface: 'var(--surface)',
      'surface-highlight': 'var(--surfaceHighlight)',
      'surface-active': 'var(--surfaceActive)',

      text: 'var(--text)',
      'text-subtle': 'var(--textSubtle)',
      'text-subtlest': 'var(--textSubtlest)',

      border: 'var(--border)',
      'border-subtle': 'var(--borderSubtle)',
      'border-focus': 'var(--borderFocus)',

      primary: 'var(--primary)',
      danger: 'var(--danger)',
      secondary: 'var(--secondary)',
      success: 'var(--success)',
      info: 'var(--info)',
      notice: 'var(--notice)',
      warning: 'var(--warning)',

      // n8n-inspired workflow UI colors
      'n8n-primary': '#2c77df',
      'n8n-primary-light': '#e6f0ff',
      'n8n-dark': '#1e2b3c',
      'n8n-canvas': '#f6f9fc',
      'n8n-sidebar': '#f0f4f9',
      'n8n-panel': '#f8fafd',
      'n8n-success': '#38b153',
      'n8n-warning': '#ff9f29',
      'n8n-error': '#f75a5a',

      // Node type colors
      'node-trigger': '#10b981',
      'node-action': '#8b5cf6',
      'node-logic': '#f59e0b',
    },
  },
  plugins: [
    require('@tailwindcss/container-queries'),
    plugin(function ({ addVariant }) {
      addVariant('hocus', ['&:hover', '&:focus-visible', '&.focus:focus']);
      addVariant('focus-visible-or-class', ['&:focus-visible', '&.focus:focus']);
    }),
  ],
};
