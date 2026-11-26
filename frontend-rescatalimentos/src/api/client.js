const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || '/api/v1'
).replace(/\/+$/, '')

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function getErrorMessage(payload, status) {
  const detail = payload?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).filter(Boolean).join(' ')
  }
  return `La solicitud falló (HTTP ${status}).`
}

export async function apiRequest(path, { method = 'GET', token, body } = {}) {
  const headers = new Headers({ Accept: 'application/json' })
  if (body !== undefined) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        'No se pudo conectar con el backend. Verifica que la API esté ejecutándose.',
        { cause: error },
      )
    }
    throw error
  }

  const text = await response.text()
  let payload = null
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch (error) {
      throw new Error(
        'El backend devolvió una respuesta que no es JSON válida.',
        { cause: error },
      )
    }
  }

  if (!response.ok) {
    throw new ApiError(getErrorMessage(payload, response.status), response.status)
  }
  return payload
}

export function mapLote(lote) {
  return {
    id: lote.id,
    categoria: lote.category,
    descripcion: lote.description,
    pesoKg: Number(lote.weight_kg),
    vencimiento: lote.expires_at,
    requiereFrio: lote.requires_cold_chain,
    imagen: lote.image_url || '',
    donante: 'Donante registrado',
    distanciaKm: null,
    estado: lote.status,
    origen: 'API',
    pickupAddress: lote.pickup_address,
  }
}

export function mapSolicitudTransporte(solicitud) {
  return {
    id: solicitud.id,
    loteId: solicitud.lot_id,
    descripcion: solicitud.description,
    categoria: solicitud.category,
    pesoKg: Number(solicitud.weight_kg),
    requiereFrio: solicitud.requires_cold_chain,
    donante: 'Donante registrado',
    puntoRecojo: solicitud.pickup_address,
    puntoEntrega: solicitud.delivery_address,
    distanciaKm: null,
    estado: solicitud.status,
  }
}

export function mapUsuario(usuario) {
  const roles = {
    DONANTE: 'Donante',
    COMEDOR: 'Comedor',
    DRIVER: 'Voluntario de logística',
    ADMIN: 'Administrador',
  }
  return {
    id: usuario.id,
    entidad: usuario.email,
    perfil: roles[usuario.role] || usuario.role,
    referencia: usuario.address || 'Sin dirección registrada',
    estado: usuario.account_status,
  }
}