'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  FileText,
  Calendar,
  BarChart3,
  FileBarChart,
  Settings,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: '仪表盘', icon: LayoutDashboard },
  { href: '/employees', label: '离职员工', icon: Users },
  { href: '/questionnaires', label: '问卷管理', icon: FileText },
  { href: '/follow-ups', label: '回访管理', icon: Calendar },
  { href: '/analytics', label: '数据分析', icon: BarChart3 },
  { href: '/reports', label: '报告中心', icon: FileBarChart },
  { href: '/settings', label: '系统设置', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r bg-white h-screen sticky top-0">
      <div className="p-6 border-b">
        <h1 className="text-xl font-semibold text-slate-900">离职跟踪系统</h1>
      </div>
      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
