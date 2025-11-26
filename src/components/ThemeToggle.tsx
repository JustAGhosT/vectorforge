import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Moon, Sun } from '@phosphor-icons/react'

type Theme = 'light' | 'dark' | 'system'

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme') as Theme | null
      return stored || 'system'
    }
    return 'system'
  })

  const isDark = theme === 'dark' || 
    (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [isDark, theme])

  // Listen for system theme changes only when using 'system' preference
  useEffect(() => {
    if (theme !== 'system') return
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      // Force re-render to apply system theme change
      setTheme('system')
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  const toggleTheme = () => {
    // Cycle through: light -> dark -> system -> light
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('system')
    else setTheme('light')
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-9 w-9"
      title={`Current: ${theme} mode. Click to change.`}
    >
      {isDark ? (
        <Sun className="h-5 w-5" weight="bold" />
      ) : (
        <Moon className="h-5 w-5" weight="bold" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
