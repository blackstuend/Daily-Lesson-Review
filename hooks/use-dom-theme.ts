'use client'

import { useEffect, useState } from 'react'

type ThemeMode = 'light' | 'dark'

const getThemeFromDom = (): ThemeMode => {
  if (typeof window === 'undefined') {
    return 'light'
  }

  const root = document.documentElement
  const attr = root.getAttribute('data-theme')

  if (attr === 'light' || attr === 'dark') {
    return attr
  }

  if (root.classList.contains('dark')) {
    return 'dark'
  }

  if (root.classList.contains('light')) {
    return 'light'
  }

  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }

  return 'light'
}

export const getCurrentTheme = getThemeFromDom

export function useDomTheme() {
  const [theme, setTheme] = useState<ThemeMode | null>(null)

  useEffect(() => {
    const updateTheme = () => setTheme(getThemeFromDom())

    updateTheme()

    const observer = new MutationObserver(updateTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme'],
    })

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    media.addEventListener('change', updateTheme)

    return () => {
      observer.disconnect()
      media.removeEventListener('change', updateTheme)
    }
  }, [])

  return theme
}
