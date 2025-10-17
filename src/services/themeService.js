export const themes = {
  dark: {
    name: 'Dark',
    colors: {
      'bg-primary': '#0a0e27',
      'bg-secondary': '#131729',
      'bg-tertiary': '#1a1f3a',
      'text-primary': '#e4e6eb',
      'text-secondary': '#b0b3b8',
      'text-muted': '#71757d',
      'accent-primary': '#3b82f6',
      'accent-secondary': '#2563eb',
      'border-color': '#2d3348',
      'hover-bg': '#1e2335'
    }
  },
  light: {
    name: 'Light',
    colors: {
      'bg-primary': '#ffffff',
      'bg-secondary': '#f8f9fa',
      'bg-tertiary': '#e9ecef',
      'text-primary': '#1a1a1a',
      'text-secondary': '#4a4a4a',
      'text-muted': '#6c757d',
      'accent-primary': '#3b82f6',
      'accent-secondary': '#2563eb',
      'border-color': '#dee2e6',
      'hover-bg': '#f1f3f5'
    }
  },
  ocean: {
    name: 'Ocean',
    colors: {
      'bg-primary': '#0a1929',
      'bg-secondary': '#0f2942',
      'bg-tertiary': '#1a3a52',
      'text-primary': '#e3f2fd',
      'text-secondary': '#b3d9f2',
      'text-muted': '#7cb8d9',
      'accent-primary': '#00b4d8',
      'accent-secondary': '#0096c7',
      'border-color': '#2d4f66',
      'hover-bg': '#1e3a4f'
    }
  },
  forest: {
    name: 'Forest',
    colors: {
      'bg-primary': '#0d1b0d',
      'bg-secondary': '#162916',
      'bg-tertiary': '#1f3a1f',
      'text-primary': '#e8f5e9',
      'text-secondary': '#c8e6c9',
      'text-muted': '#81c784',
      'accent-primary': '#4caf50',
      'accent-secondary': '#388e3c',
      'border-color': '#2d4a2d',
      'hover-bg': '#1a2e1a'
    }
  },
  sunset: {
    name: 'Sunset',
    colors: {
      'bg-primary': '#1a0f0a',
      'bg-secondary': '#2a1810',
      'bg-tertiary': '#3a2418',
      'text-primary': '#fff4e6',
      'text-secondary': '#ffe0b2',
      'text-muted': '#ffb74d',
      'accent-primary': '#ff6f00',
      'accent-secondary': '#e65100',
      'border-color': '#4a3228',
      'hover-bg': '#2e1e15'
    }
  },
  purple: {
    name: 'Purple',
    colors: {
      'bg-primary': '#1a0a1f',
      'bg-secondary': '#2a1533',
      'bg-tertiary': '#3a2047',
      'text-primary': '#f3e5f5',
      'text-secondary': '#e1bee7',
      'text-muted': '#ba68c8',
      'accent-primary': '#9c27b0',
      'accent-secondary': '#7b1fa2',
      'border-color': '#4a2e5c',
      'hover-bg': '#2e1a3d'
    }
  }
}

export class ThemeService {
  constructor() {
    this.storageKey = 'wiki-plus-theme'
  }

  getCurrentTheme() {
    try {
      const stored = localStorage.getItem(this.storageKey)
      return stored || 'dark'
    } catch (error) {
      console.error('Error reading theme:', error)
      return 'dark'
    }
  }

  setTheme(themeId) {
    try {
      const theme = themes[themeId]
      if (!theme) {
        console.error('Theme not found:', themeId)
        return false
      }

      // Apply CSS variables
      const root = document.documentElement
      Object.entries(theme.colors).forEach(([key, value]) => {
        root.style.setProperty(`--${key}`, value)
      })

      // Save to localStorage
      localStorage.setItem(this.storageKey, themeId)
      return true
    } catch (error) {
      console.error('Error setting theme:', error)
      return false
    }
  }

  getAvailableThemes() {
    return Object.entries(themes).map(([id, theme]) => ({
      id,
      name: theme.name
    }))
  }
}
