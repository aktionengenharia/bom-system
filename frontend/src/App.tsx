import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import MaterialsList from './pages/materials/MaterialsList'
import MaterialDetail from './pages/materials/MaterialDetail'
import FamiliasList from './pages/materials/FamiliasList'
import ProjectsList from './pages/projects/ProjectsList'
import ProjectBOM from './pages/projects/ProjectBOM'
import ClientesList from './pages/projects/ClientesList'
import UsersList from './pages/users/UsersList'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/materiais" element={<MaterialsList />} />
              <Route path="/materiais/familias" element={<FamiliasList />} />
              <Route path="/materiais/:id" element={<MaterialDetail />} />
              <Route path="/projetos" element={<ProjectsList />} />
              <Route path="/projetos/clientes" element={<ClientesList />} />
              <Route path="/projetos/:id/bom" element={<ProjectBOM />} />
              <Route path="/usuarios" element={<UsersList />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { fontSize: '14px' },
            success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
            error: { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  )
}
