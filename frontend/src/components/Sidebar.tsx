import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  FolderOpen,
  Users,
  Settings,
  LogOut,
  Zap,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface NavItem {
  label: string
  to?: string
  icon: React.ReactNode
  children?: { label: string; to: string }[]
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    to: '/',
    icon: <LayoutDashboard size={18} />,
  },
  {
    label: 'Materiais',
    icon: <Package size={18} />,
    children: [
      { label: 'Lista de Materiais', to: '/materiais' },
      { label: 'Famílias / Subfamílias', to: '/materiais/familias' },
    ],
  },
  {
    label: 'Projetos',
    icon: <FolderOpen size={18} />,
    children: [
      { label: 'Lista de Projetos', to: '/projetos' },
      { label: 'Clientes', to: '/projetos/clientes' },
    ],
  },
  {
    label: 'Usuários',
    to: '/usuarios',
    icon: <Users size={18} />,
    adminOnly: true,
  },
]

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth()
  const [expanded, setExpanded] = useState<string[]>(['Materiais', 'Projetos'])

  const toggle = (label: string) =>
    setExpanded((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    )

  return (
    <aside className="w-60 bg-brand-900 min-h-screen flex flex-col text-white">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Zap size={22} className="text-yellow-400" />
          <div>
            <div className="font-bold text-sm leading-tight">BOM System</div>
            <div className="text-xs text-white/50">Gestão de Materiais</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          if (item.adminOnly && !isAdmin) return null

          if (item.children) {
            const isOpen = expanded.includes(item.label)
            return (
              <div key={item.label}>
                <button
                  onClick={() => toggle(item.label)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    {item.icon}
                    {item.label}
                  </span>
                  {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                {isOpen && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l border-white/10 pl-3">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.to}
                        to={child.to}
                        className={({ isActive }) =>
                          `block px-3 py-1.5 text-sm rounded-lg transition-colors ${
                            isActive
                              ? 'bg-brand-600 text-white'
                              : 'text-white/60 hover:text-white hover:bg-white/10'
                          }`
                        }
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          return (
            <NavLink
              key={item.to}
              to={item.to!}
              end
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors ${
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-xs font-bold">
            {user?.nome?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{user?.nome}</div>
            <div className="text-xs text-white/50 capitalize">{user?.perfil}</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </aside>
  )
}
