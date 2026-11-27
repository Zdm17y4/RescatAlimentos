import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  ApiError,
  apiRequest,
  mapLote,
  mapSolicitudTransporte,
  mapUsuario,
} from './client.js'

function mockResponse({ ok = true, status = 200, text = '' } = {}) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    status,
    text: vi.fn().mockResolvedValue(text),
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('apiRequest', () => {
  it('envía JSON y token, y devuelve el resultado JSON', async () => {
    const fetchMock = mockResponse({
      ok: true,
      status: 201,
      text: JSON.stringify({ id: 'lot-1' }),
    })

    await expect(
      apiRequest('/lotes', {
        method: 'POST',
        token: 'signed-token',
        body: { category: 'Frescos' },
      }),
    ).resolves.toEqual({ id: 'lot-1' })

    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toMatch(/\/lotes$/)
    expect(options.method).toBe('POST')
    expect(options.headers.get('Accept')).toBe('application/json')
    expect(options.headers.get('Content-Type')).toBe('application/json')
    expect(options.headers.get('Authorization')).toBe('Bearer signed-token')
    expect(options.body).toBe('{"category":"Frescos"}')
  })

  it.each([
    [{ detail: 'Conflicto' }, 'Conflicto'],
    [{ detail: [{ msg: 'Campo requerido' }, {}] }, 'Campo requerido'],
    [{}, 'La solicitud falló (HTTP 503).'],
  ])('convierte errores HTTP en ApiError', async (payload, message) => {
    mockResponse({
      ok: false,
      status: 503,
      text: JSON.stringify(payload),
    })

    const error = await apiRequest('/lotes').catch((reason) => reason)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ message, status: 503 })
  })

  it('acepta respuestas vacías y rechaza JSON inválido', async () => {
    mockResponse()
    await expect(apiRequest('/health')).resolves.toBeNull()

    mockResponse({ text: 'not-json' })
    await expect(apiRequest('/health')).rejects.toThrow(
      'El backend devolvió una respuesta que no es JSON válida.',
    )
  })

  it('distingue problemas de conexión de otros errores de red', async () => {
    const connectionError = new TypeError('offline')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(connectionError))
    await expect(apiRequest('/lotes')).rejects.toThrow(
      'No se pudo conectar con el backend. Verifica que la API esté ejecutándose.',
    )

    const otherError = new Error('unexpected')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(otherError))
    await expect(apiRequest('/lotes')).rejects.toBe(otherError)
  })
})

describe('mapeo de respuestas de la API', () => {
  it('mapea lotes, solicitudes de transporte y usuarios', () => {
    expect(
      mapLote({
        id: 'lot-1',
        category: 'Frescos',
        description: 'Verduras',
        weight_kg: '2.5',
        expires_at: '2030-01-01T10:00:00Z',
        requires_cold_chain: true,
        image_url: null,
        status: 'DISPONIBLE',
        pickup_address: 'Mercado',
      }),
    ).toMatchObject({
      id: 'lot-1',
      pesoKg: 2.5,
      imagen: '',
      estado: 'DISPONIBLE',
      origen: 'API',
    })

    expect(
      mapSolicitudTransporte({
        id: 'request-1',
        lot_id: 'lot-1',
        description: 'Verduras',
        category: 'Frescos',
        weight_kg: '2.5',
        requires_cold_chain: false,
        pickup_address: 'Mercado',
        delivery_address: 'Comedor',
        status: 'DISPONIBLE',
      }),
    ).toMatchObject({
      id: 'request-1',
      loteId: 'lot-1',
      pesoKg: 2.5,
      puntoRecojo: 'Mercado',
      puntoEntrega: 'Comedor',
      distanciaKm: null,
    })

    expect(
      mapUsuario({
        id: 'user-1',
        email: 'donante@example.test',
        role: 'DONANTE',
        account_status: 'ACTIVO',
        address: null,
      }),
    ).toMatchObject({
      entidad: 'donante@example.test',
      perfil: 'Donante',
      referencia: 'Sin dirección registrada',
      estado: 'ACTIVO',
    })

    expect(
      mapUsuario({
        id: 'user-2',
        email: 'other@example.test',
        role: 'CUSTOM',
        account_status: 'ACTIVO',
        address: 'Dirección',
      }).perfil,
    ).toBe('CUSTOM')
  })
})
