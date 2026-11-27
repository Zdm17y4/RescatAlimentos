import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { apiRequest } from '../api/client.js'
import { AuthContext } from '../context/authContext.js'
import AdminDashboardPage from './AdminDashboardPage.jsx'
import ComedorDashboardPage from './ComedorDashboardPage.jsx'
import LogisticaDashboardPage from './LogisticaDashboardPage.jsx'
import {
  LoginPage,
  RegistrationPage,
  RegistrationSelectionPage,
} from './PublicAccessPages.jsx'
import PublicarLotePage from './PublicarLotePage.jsx'

vi.mock('../api/client.js', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, apiRequest: vi.fn() }
})

const session = { token: 'test-token', role: 'DONANTE' }

function renderWithAuth(children, { entry = '/', auth = {} } = {}) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <AuthContext.Provider
        value={{
          session,
          login: vi.fn(),
          register: vi.fn(),
          logout: vi.fn(),
          routesByRole: {},
          ...auth,
        }}
      >
        {children}
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}

function renderPublicRoutes({ entry, auth }) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <AuthContext.Provider value={auth}>
        <Routes>
          <Route path="/registro" element={<RegistrationSelectionPage />} />
          <Route path="/registro/:role" element={<RegistrationPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/donante/publicar-lote" element={<p>Panel de donante</p>} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}

function renderComedor(entry = '/comedor/dashboard') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <AuthContext.Provider value={{ session }}>
        <Routes>
          <Route path="/comedor/dashboard" element={<ComedorDashboardPage />} />
          <Route path="/comedor/lote/:id" element={<ComedorDashboardPage />} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}

function createLot(overrides = {}) {
  return {
    id: 'lot-1',
    donor_id: 'donor-1',
    category: 'Frescos',
    description: 'Verduras de estación',
    weight_kg: '12.5',
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    requires_cold_chain: false,
    pickup_address: 'Mercado Central',
    image_url: null,
    status: 'DISPONIBLE',
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  cleanup()
})

describe('registro e inicio de sesión', () => {
  it('presenta los perfiles disponibles y registra una cuenta', async () => {
    const register = vi.fn().mockResolvedValue({})
    renderPublicRoutes({
      entry: '/registro',
      auth: { session: null, login: vi.fn(), register },
    })

    expect(screen.getByRole('heading', { name: '¿Cómo quieres participar?' })).toBeTruthy()
    fireEvent.click(screen.getByRole('link', { name: 'Registrarme como donante' }))

    fireEvent.change(screen.getByLabelText('Correo electrónico'), {
      target: { value: 'donante@example.test' },
    })
    fireEvent.change(screen.getByLabelText('Dirección de la sede'), {
      target: { value: '  Mercado  ' },
    })
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'clave-segura-123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    await screen.findByRole('status')
    expect(register).toHaveBeenCalledWith({
      email: 'donante@example.test',
      password: 'clave-segura-123',
      role: 'DONANTE',
      address: 'Mercado',
    })
  })

  it('muestra errores de registro y redirige un perfil no reconocido', async () => {
    const register = vi.fn().mockRejectedValue(new Error('Correo duplicado'))
    renderPublicRoutes({
      entry: '/registro/donante',
      auth: { session: null, login: vi.fn(), register },
    })
    fireEvent.change(screen.getByLabelText('Correo electrónico'), {
      target: { value: 'donante@example.test' },
    })
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'clave-segura-123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    await screen.findByRole('alert')

    cleanup()
    renderPublicRoutes({
      entry: '/registro/no-valido',
      auth: { session: null, login: vi.fn(), register },
    })
    await screen.findByRole('heading', { name: '¿Cómo quieres participar?' })
  })

  it('inicia sesión y muestra errores de credenciales', async () => {
    const login = vi.fn().mockResolvedValue({ role: 'DONANTE' })
    renderPublicRoutes({
      entry: '/login',
      auth: { session: null, login, register: vi.fn() },
    })

    fireEvent.change(screen.getByLabelText('Correo electrónico'), {
      target: { value: 'donante@example.test' },
    })
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'clave-segura-123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))

    await screen.findByText('Panel de donante')
    expect(login).toHaveBeenCalledWith({
      email: 'donante@example.test',
      password: 'clave-segura-123',
    })

    cleanup()
    const rejectedLogin = vi.fn().mockRejectedValue(new Error('Acceso denegado'))
    renderPublicRoutes({
      entry: '/login',
      auth: { session: null, login: rejectedLogin, register: vi.fn() },
    })
    fireEvent.change(screen.getByLabelText('Correo electrónico'), {
      target: { value: 'donante@example.test' },
    })
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'clave-segura-123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    await screen.findByRole('alert')
  })
})

describe('publicación de lotes', () => {
  it('valida campos requeridos antes de enviar', () => {
    renderWithAuth(<PublicarLotePage />)

    fireEvent.click(screen.getByRole('button', { name: 'Publicar lote' }))

    expect(screen.getByText('Selecciona una categoría.')).toBeTruthy()
    expect(screen.getByText('Ingresa un peso mayor que 0 kg.')).toBeTruthy()
    expect(
      screen.getByText('Revisa los campos indicados antes de publicar el lote.'),
    ).toBeTruthy()
    expect(apiRequest).not.toHaveBeenCalled()
  })

  it('publica un lote válido y muestra el resultado del backend', async () => {
    vi.mocked(apiRequest).mockResolvedValue({})
    renderWithAuth(<PublicarLotePage />)

    fireEvent.change(screen.getByLabelText('Categoría'), {
      target: { value: 'Frescos' },
    })
    fireEvent.change(screen.getByLabelText('Nombre o descripción breve'), {
      target: { value: 'Verduras frescas' },
    })
    fireEvent.change(screen.getByLabelText('Peso (kg)'), {
      target: { value: '12.5' },
    })
    fireEvent.change(screen.getByLabelText('Fecha y hora de vencimiento'), {
      target: {
        value: new Date(Date.now() + 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 16),
      },
    })
    fireEvent.change(screen.getByLabelText('Dirección de recojo'), {
      target: { value: 'Mercado Central' },
    })
    fireEvent.change(screen.getByLabelText('URL de fotografía (opcional)'), {
      target: { value: 'https://example.test/lot.jpg' },
    })
    fireEvent.click(screen.getByLabelText('Este lote requiere cadena de frío'))
    fireEvent.click(screen.getByRole('button', { name: 'Publicar lote' }))

    await screen.findByText('Lote publicado correctamente y guardado en el backend.')
    expect(apiRequest).toHaveBeenCalledWith(
      '/lotes',
      expect.objectContaining({
        method: 'POST',
        token: session.token,
        body: expect.objectContaining({
          category: 'Frescos',
          description: 'Verduras frescas',
          weight_kg: 12.5,
          requires_cold_chain: true,
          pickup_address: 'Mercado Central',
          image_url: 'https://example.test/lot.jpg',
        }),
      }),
    )
  })
})

describe('operaciones de comedor', () => {
  it('consulta lotes, abre el detalle y reserva con movilidad propia', async () => {
    const lot = createLot()
    vi.mocked(apiRequest)
      .mockResolvedValueOnce([lot])
      .mockResolvedValueOnce(lot)
      .mockResolvedValueOnce({ id: 'reservation-1' })
    renderComedor()

    await screen.findByText('Verduras de estación')
    fireEvent.click(screen.getByRole('link', { name: 'Ver detalle y reservar' }))
    await screen.findByRole('heading', { name: 'Detalle del lote' })
    fireEvent.click(screen.getByRole('button', { name: 'Aceptar y reservar lote' }))
    fireEvent.click(screen.getByRole('button', { name: 'Usar movilidad propia' }))

    await screen.findByText('Reserva confirmada.')
    expect(apiRequest).toHaveBeenLastCalledWith(
      '/lotes/lot-1/reservas',
      expect.objectContaining({
        method: 'POST',
        body: { request_transport: false, delivery_address: null },
      }),
    )
  })

  it('requiere dirección al pedir transporte y muestra lotes vacíos', async () => {
    const lot = createLot()
    vi.mocked(apiRequest)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(lot)
    const { unmount } = renderComedor()
    await screen.findByText('No hay lotes disponibles en este momento.')
    unmount()

    renderComedor('/comedor/lote/lot-1')
    await screen.findByRole('heading', { name: 'Detalle del lote' })
    fireEvent.click(screen.getByRole('button', { name: 'Aceptar y reservar lote' }))
    fireEvent.click(screen.getByRole('button', { name: 'Solicitar apoyo de transporte' }))
    fireEvent.click(
      screen.getByRole('button', { name: 'Confirmar reserva y transporte' }),
    )
    expect(
      screen.getByText('Ingresa la dirección de entrega para solicitar transporte.'),
    ).toBeTruthy()
  })
})

describe('paneles de operaciones', () => {
  it('aprueba una cuenta pendiente desde administración', async () => {
    vi.mocked(apiRequest)
      .mockResolvedValueOnce([
        {
          id: 'user-1',
          email: 'comedor@example.test',
          role: 'COMEDOR',
          account_status: 'PENDIENTE',
          address: null,
        },
      ])
      .mockResolvedValueOnce({ id: 'user-1' })
    renderWithAuth(<AdminDashboardPage />)

    await screen.findByText('comedor@example.test')
    fireEvent.click(screen.getByRole('button', { name: 'Aprobar' }))
    await waitFor(() => {
      expect(screen.getByText('No hay cuentas pendientes de revisión.')).toBeTruthy()
    })
  })

  it('acepta una solicitud logística y refleja el estado asignado', async () => {
    const request = {
      id: 'transport-1',
      lot_id: 'lot-1',
      category: 'Frescos',
      description: 'Verduras',
      weight_kg: '5',
      requires_cold_chain: true,
      pickup_address: 'Mercado',
      delivery_address: 'Comedor',
      status: 'DISPONIBLE',
    }
    vi.mocked(apiRequest)
      .mockResolvedValueOnce([request])
      .mockResolvedValueOnce({ ...request, status: 'ASIGNADA' })
    renderWithAuth(<LogisticaDashboardPage />)

    await screen.findByText('Verduras')
    fireEvent.click(screen.getByRole('button', { name: 'Aceptar ruta' }))
    await screen.findByText('Solicitud asignada a tu cuenta.')
    expect(apiRequest).toHaveBeenLastCalledWith(
      '/transporte/solicitudes/transport-1/aceptacion',
      expect.objectContaining({ method: 'POST', token: session.token }),
    )
  })
})
