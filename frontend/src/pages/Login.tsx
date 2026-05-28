import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { login } from '../api/auth'
import { useAuth } from '../contexts/AuthContext'
import { getMe } from '../api/auth'

export default function Login() {
  const [loginVal, setLoginVal] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { setUser } = useAuth()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const token = await login(loginVal, password)
      localStorage.setItem('token', token.access_token)
      const user = await getMe()
      setUser(user)
      navigate('/')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Login ou senha incorretos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4">
            <Zap size={32} className="text-yellow-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">BOM System</h1>
          <p className="text-white/60 text-sm mt-1">Gestão de Lista de Materiais</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Entrar no sistema</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Login</label>
              <input
                type="text"
                className="input"
                placeholder="Seu login"
                value={loginVal}
                onChange={(e) => setLoginVal(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="label">Senha</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPw(!showPw)}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Entrando...
                </span>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-6">
            Gestão de BOM · Fotovoltaico · BESS · Geração Elétrica
          </p>
        </div>
      </div>
    </div>
  )
}
