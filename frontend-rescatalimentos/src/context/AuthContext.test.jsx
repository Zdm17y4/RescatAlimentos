import { useState } from 'react'
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import {
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react'
import { apiRequest } from '../api/client.js'
import { AuthProvider } from './AuthContext.jsx'
import { useAuth } from './useAuth.js'

vi.mock('../api/client.js', () => ({ apiRequest: vi.fn() }))

function createToken(claims) {
  return `header.${btoa(JSON.stringify(claims))}.signature`
}

function AuthControls() {
  const { session, login, register, logout } = useAuth()
  const [error, setError] = useState('')

  function runLogin() {
    login({ email: 'user@example.test', password: 'password' }).catch(
      (reason) => setError(reason.message),
    )
  }

  async function runRegister() {
    const result = await register({ role: 'DONANTE' })
    setError(result.message)
  }

  return (
    <div>
      <output data-testid="session">
        {session ? JSON.stringify(session) : 'signed out'}
      </output>
      <output data-testid="error">{error}</output>
      <button onClick={runLogin}>Log in</button>
      <button onClick={runRegister}>Register</button>
      <button onClick={logout}>Log out</button>
    </div>
  )
}

function renderAuthControls() {
  return render(
    <AuthProvider>
      <AuthControls />
    </AuthProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  cleanup()
})

describe('AuthProvider', () => {
  it('inicia sesión con el rol del token y permite cerrar sesión', async () => {
    const token = createToken({
      sub: 'user-1',
      role: 'COMEDOR',
      exp: Math.floor(Date.now() / 1000) + 60,
    })
    vi.mocked(apiRequest).mockResolvedValue({ access_token: token })
    renderAuthControls()

    fireEvent.click(screen.getByText('Log in'))

    const session = await screen.findByTestId('session')
    expect(JSON.parse(session.textContent)).toEqual({
      userId: 'user-1',
      role: 'COMEDOR',
      token,
    })
    expect(apiRequest).toHaveBeenCalledWith('/auth/login', {
      method: 'POST',
      body: { email: 'user@example.test', password: 'password' },
    })

    fireEvent.click(screen.getByText('Log out'))
    expect(screen.getByTestId('session').textContent).toBe('signed out')
  })

  it('envía registros al endpoint de autenticación', async () => {
    vi.mocked(apiRequest).mockResolvedValue({ message: 'Cuenta pendiente' })
    renderAuthControls()

    fireEvent.click(screen.getByText('Register'))

    await screen.findByText('Cuenta pendiente')
    expect(apiRequest).toHaveBeenCalledWith('/auth/registro', {
      method: 'POST',
      body: { role: 'DONANTE' },
    })
  })

  it('no crea una sesión para un token vencido', async () => {
    const token = createToken({
      sub: 'user-1',
      role: 'COMEDOR',
      exp: Math.floor(Date.now() / 1000) - 60,
    })
    vi.mocked(apiRequest).mockResolvedValue({ access_token: token })
    renderAuthControls()

    fireEvent.click(screen.getByText('Log in'))

    await screen.findByText('El backend devolvió un token inválido o vencido.')
    expect(screen.getByTestId('session').textContent).toBe('signed out')
  })

  it('rechaza tokens sin payload', async () => {
    vi.mocked(apiRequest).mockResolvedValue({ access_token: 'invalid-token' })
    renderAuthControls()

    fireEvent.click(screen.getByText('Log in'))

    await screen.findByText('El backend devolvió un token inválido.')
    expect(screen.getByTestId('session').textContent).toBe('signed out')
  })
})
