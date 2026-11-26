import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { apiRequest, mapLote } from '../api/client.js'
import { useAuth } from '../context/useAuth.js'

function formatearVencimiento(valor) {
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return 'Fecha no disponible'
  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(fecha)
}

function NavegacionPrototipo({ detalle = false }) {
  return (
    <nav aria-label="Navegación del prototipo" className="prototipo-nav">
      <Link
        aria-current={detalle ? undefined : 'page'}
        className="button button-primary"
        to="/comedor/dashboard"
      >
        Ver lotes disponibles
      </Link>
    </nav>
  )
}

function DetalleLote({
  lote,
  reservarLote,
}) {
  const [reservado, setReservado] = useState(false)
  const [mostrarOpcionesMovilidad, setMostrarOpcionesMovilidad] = useState(false)
  const [mostrarDireccionEntrega, setMostrarDireccionEntrega] = useState(false)
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [requestError, setRequestError] = useState('')
  const [saving, setSaving] = useState(false)
  const [transportRequested, setTransportRequested] = useState(false)

  async function reservar(requestTransport) {
    setRequestError('')
    if (requestTransport && !deliveryAddress.trim()) {
      setRequestError('Ingresa la dirección de entrega para solicitar transporte.')
      return
    }

    setSaving(true)
    try {
      await reservarLote(lote.id, {
        request_transport: requestTransport,
        delivery_address: requestTransport ? deliveryAddress.trim() : null,
      })
      setReservado(true)
      setTransportRequested(requestTransport)
    } catch (error) {
      setRequestError(error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="access-page section-padding prototipo-page">
      <header className="access-heading">
        <p className="eyebrow">Comedor · Conectado al backend</p>
        <h1>Detalle del lote</h1>
        <p>Revisa la información antes de aceptar la reserva.</p>
      </header>
      <NavegacionPrototipo detalle />
      {requestError && (
        <p className="form-error-summary" role="alert">
          {requestError}
        </p>
      )}
      <article className="lote-detalle-panel">
        {lote.imagen ? (
          <img alt={`Fotografía de ${lote.descripcion}`} src={lote.imagen} />
        ) : (
          <div aria-hidden="true" className="lote-imagen-vacia">
            Sin fotografía disponible
          </div>
        )}
        <div className="lote-detalle-contenido">
          <span className="lote-badge">{lote.categoria}</span>
          <h2>{lote.descripcion}</h2>
          <p className="lote-peso">{lote.pesoKg} kg</p>
          <dl className="lote-detalles lote-detalles-amplios">
            <div>
              <dt>Donante</dt>
              <dd>{lote.donante}</dd>
            </div>
            <div>
              <dt>Vencimiento</dt>
              <dd>{formatearVencimiento(lote.vencimiento)}</dd>
            </div>
            <div>
              <dt>Cadena de frío</dt>
              <dd>{lote.requiereFrio ? 'Requerida' : 'No requerida'}</dd>
            </div>
            <div>
              <dt>Distancia aproximada</dt>
              <dd>No disponible</dd>
            </div>
            <div>
              <dt>Estado</dt>
              <dd>{lote.estado === 'DISPONIBLE' ? 'Disponible' : 'Reservado'}</dd>
            </div>
          </dl>
          <p className="lote-origen">Información obtenida del backend</p>
          {reservado && (
            <p className="form-message" role="status">
              {transportRequested
                ? 'Reserva confirmada y solicitud de transporte creada.'
                : 'Reserva confirmada.'}
            </p>
          )}
          {!reservado && lote.estado === 'DISPONIBLE' ? (
            mostrarOpcionesMovilidad ? (
              <div className="reserva-opciones">
                <p>¿Cómo recogerá el lote el comedor?</p>
                <button
                  className="button button-primary"
                  disabled={saving}
                  onClick={() => reservar(false)}
                  type="button"
                >
                  Usar movilidad propia
                </button>
                {!mostrarDireccionEntrega ? (
                  <button
                    className="button prototipo-button-secondary"
                    onClick={() => setMostrarDireccionEntrega(true)}
                    type="button"
                  >
                    Solicitar apoyo de transporte
                  </button>
                ) : (
                  <div>
                    <label className="lote-campo" htmlFor="deliveryAddress">
                      Dirección de entrega
                      <input
                        id="deliveryAddress"
                        onChange={(event) => setDeliveryAddress(event.target.value)}
                        value={deliveryAddress}
                      />
                    </label>
                    <button
                      className="button prototipo-button-secondary"
                      disabled={saving}
                      onClick={() => reservar(true)}
                      type="button"
                    >
                      {saving ? 'Reservando…' : 'Confirmar reserva y transporte'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                className="button button-primary"
                onClick={() => setMostrarOpcionesMovilidad(true)}
                type="button"
              >
                Aceptar y reservar lote
              </button>
            )
          ) : !reservado && lote.estado !== 'DISPONIBLE' ? (
            <p className="lote-reservado" role="status">
              Este lote ya está reservado y no está disponible para otra reserva.
            </p>
          ) : null}
          <Link className="back-link prototipo-back-link" to="/comedor/dashboard">
            Volver a los lotes disponibles
          </Link>
        </div>
      </article>
    </main>
  )
}

function ComedorDashboardPage() {
  const { id } = useParams()
  const { session } = useAuth()
  const [lotes, setLotes] = useState([])
  const [loteDetalle, setLoteDetalle] = useState(null)
  const [requestState, setRequestState] = useState({
    key: '',
    loading: true,
    error: '',
  })
  const requestKey = id || 'lotes'
  const loading =
    requestState.key !== requestKey || requestState.loading
  const errorApi = requestState.key === requestKey ? requestState.error : ''

  useEffect(() => {
    let active = true
    const path = id ? `/lotes/${encodeURIComponent(id)}` : '/lotes'
    apiRequest(path, { token: session.token })
      .then((result) => {
        if (!active) return
        if (id) setLoteDetalle(mapLote(result))
        else setLotes(result.map(mapLote))
        setRequestState({ key: requestKey, loading: false, error: '' })
      })
      .catch((error) => {
        if (!active) return
        if (id) setLoteDetalle(null)
        else setLotes([])
        setRequestState({
          key: requestKey,
          loading: false,
          error: error.message,
        })
      })
    return () => {
      active = false
    }
  }, [id, requestKey, session.token])

  async function reservarLote(loteId, body) {
    const reservation = await apiRequest(
      `/lotes/${encodeURIComponent(loteId)}/reservas`,
      { method: 'POST', token: session.token, body },
    )
    setLoteDetalle((current) =>
      current ? { ...current, estado: 'RESERVADO' } : current,
    )
    return reservation
  }

  if (id) {
    if (loading) {
      return <main className="access-page section-padding"><p role="status">Cargando lote…</p></main>
    }
    if (errorApi || !loteDetalle) {
      return (
        <main className="access-page section-padding prototipo-page">
          <section className="login-panel">
            <p className="eyebrow">No se pudo cargar el lote</p>
            <h1>{errorApi || 'Esta publicación no está disponible.'}</h1>
            <Link className="button button-primary" to="/comedor/dashboard">
              Volver al listado
            </Link>
          </section>
        </main>
      )
    }
    return (
      <DetalleLote
        lote={loteDetalle}
        reservarLote={reservarLote}
      />
    )
  }

  return (
    <main className="access-page section-padding prototipo-page">
      <header className="access-heading">
        <p className="eyebrow">Comedor · Conectado al backend</p>
        <h1>Lotes disponibles</h1>
        <p>Publicaciones disponibles consultadas desde la API.</p>
      </header>
      <NavegacionPrototipo />
      {errorApi && (
        <p className="form-error-summary" role="alert">
          {errorApi}
        </p>
      )}
      {loading ? (
        <p role="status">Cargando lotes…</p>
      ) : lotes.length ? (
        <section aria-label="Lotes de alimentos disponibles" className="lotes-grid">
          {lotes.map((lote) => (
            <article className="lote-card" key={lote.id}>
              {lote.imagen ? (
                <img alt={`Fotografía de ${lote.descripcion}`} src={lote.imagen} />
              ) : (
                <div aria-hidden="true" className="lote-imagen-vacia">
                  {lote.categoria}
                </div>
              )}
              <div className="lote-card-content">
                <div className="lote-card-heading">
                  <span className="lote-badge">{lote.categoria}</span>
                  <span className="lote-distancia">Distancia no disponible</span>
                </div>
                <h2>{lote.descripcion}</h2>
                <p className="lote-peso">{lote.pesoKg} kg</p>
                <dl className="lote-detalles">
                  <div>
                    <dt>Vence</dt>
                    <dd>{formatearVencimiento(lote.vencimiento)}</dd>
                  </div>
                  <div>
                    <dt>Cadena de frío</dt>
                    <dd>{lote.requiereFrio ? 'Requerida' : 'No requerida'}</dd>
                  </div>
                  <div>
                    <dt>Donante</dt>
                    <dd>{lote.donante}</dd>
                  </div>
                </dl>
                <span className="lote-origen">Publicado en el backend</span>
                <Link className="button button-primary lote-ver-detalle" to={`/comedor/lote/${lote.id}`}>
                  Ver detalle y reservar
                </Link>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <p className="prototipo-empty" role="status">
          No hay lotes disponibles en este momento.
        </p>
      )}
    </main>
  )
}

export default ComedorDashboardPage
