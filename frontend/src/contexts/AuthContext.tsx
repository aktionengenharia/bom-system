import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '../types'
import { getMe } from '../api/auth'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  setUser: (user: User | null) => void
  logout: () => void
  isAdmin: boolean
  canEdit: boolean
  canUpdatePrices: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      getMe()
        .then((u) => setUserState(u))
        .catch(() => {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  const setUser = (u: User | null) => {
    setUserState(u)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUserState(null)
    window.location.href = '/login'
  }

  const isAdmin = user?.perfil === 'administrador'
  const canEdit = ['administrador', 'engenharia', 'projetista'].includes(user?.perfil ?? '')
  const canUpdatePrices = ['administrador', 'engenharia', 'suprimentos'].includes(user?.perfil ?? '')

  return (
    <AuthContext.Provider value={{ user, isLoading, setUser, logout, isAdmin, canEdit, canUpdatePrices }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
