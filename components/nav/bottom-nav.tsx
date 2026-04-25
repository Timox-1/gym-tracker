'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/today', label: 'Сегодня', icon: '🏋️' },
  { href: '/history', label: 'История', icon: '📋' },
  { href: '/progress', label: 'Прогресс', icon: '📈' },
  { href: '/program', label: 'Программа', icon: '⚙️' },
] as const

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800">
      <div className="flex">
        {NAV.map(({ href, label, icon }) => (
          <Link key={href} href={href}
            className={`flex-1 flex flex-col items-center py-3 gap-1 transition-colors ${
              pathname.startsWith(href) ? 'text-blue-400' : 'text-gray-500'
            }`}>
            <span className="text-2xl">{icon}</span>
            <span className="text-xs font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
