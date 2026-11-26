import { useState } from 'react'
import { apiRequest } from '../api/client.js'
import { AuthContext } from './authContext.js'

const ROUTES_BY_ROLE = {
  DONANTE: '/donante/publicar-lote',
  COMEDOR: '/comedor/dashboard',
  DRIVER: '/logistica/dashboard',
  ADMIN: '/admin/usuarios',
}

function getSessionFromToken(token) {
  const encodedPayload = token.split('.')[1]
  if (!encodedPayload) throw new Error('El backend devolvió un token inválido.')

  const base64 = encodedPayload.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
  const claims = JSON.parse(window.atob(padded))

  if (
    !claims.sub ||
    !ROUTES_BY_ROLE[claims.role] ||
    !Number.isFinite(claims.exp) ||
    claims.exp <= Math.floor(Date.now() / 1000)
  ) {
    throw new Error('El backend devolvió un token inválido o vencido.')
  }

  return { userId: claims.sub, role: claims.role }
}

function AuthProvider({ children }) {
  const [session, setSession] = useState(null)

  async function login(credentials) {
    const result = await apiRequest('/auth/login', {
      method: 'POST',
      body: credentials,
    })
    const user = getSessionFromToken(result.access_token)
    const newSession = { ...user, token: result.access_token }
    setSession(newSession)
    return newSession
  }

  async function register(data) {
    return apiRequest('/auth/registro', { method: 'POST', body: data })
  }

  function logout() {
    setSession(null)
  }

  return (
    <AuthContext.Provider
      value={{ session, login, register, logout, routesByRole: ROUTES_BY_ROLE }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export { AuthProvider }