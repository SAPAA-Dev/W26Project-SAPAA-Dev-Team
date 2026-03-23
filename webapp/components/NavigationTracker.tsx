'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

let isClientNavigation = false

export default function NavigationTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (!isClientNavigation) {
      // Fresh page load so reset the stack
      sessionStorage.setItem('navStack', JSON.stringify([pathname]))
      isClientNavigation = true
      return
    }

    const stack: string[] = JSON.parse(sessionStorage.getItem('navStack') || '[]')

    if (stack[stack.length - 1] !== pathname) {
      stack.push(pathname)
      sessionStorage.setItem('navStack', JSON.stringify(stack))
    }
  }, [pathname])

  return null
}