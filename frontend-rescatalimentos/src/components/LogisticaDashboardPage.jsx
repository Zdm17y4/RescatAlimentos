import { useEffect, useState } from 'react'
import { apiRequest, mapSolicitudTransporte } from '../api/client.js'
import { useAuth } from '../context/useAuth.js'

function LogisticaDashboardPage() {
  const { session } = useAuth()
  const [solicitudes, setSolicitudes] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorApi, setErrorApi] = useState('')
  const [acceptingId, setAcceptingId] = useState('')

  useEffect(() => {
    let active = true
    apiRequest('/transporte/solicitudes', { token: session.token })
      .then((result) => {
        if (active) setSolicitudes(result.map(mapSolicitudTransporte))
      })
      .catch((error) => {
        if (active) setErrorApi(error.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [session.token])

  async function aceptarRuta(id) {
    setErrorApi('')
    setAcceptingId(id)
    try {
      const result = await apiRequest(
        `/transporte/solicitudes/${encodeURIComponent(id)}/aceptacion`,
        { method: 'POST', token: session.token },
      )
      setSolicitudes((current) =>
        current.map((item) =>
          item.id === id ? mapSolicitudTransporte(result) : item,
        ),
      )
    } catch (error) {
      setErrorApi(error.message)
    } finally {
      setAcceptingId('')
    }
  }

  return (
    <main className="access-page section-padding prototipo-page">
      <header className="access-heading">
        <p className="eyebrow">Logística · Conectado al backend</p>
        <h1>Solicitudes de transporte</h1>
        <p>
          Revisa las solicitudes disponibles registradas en el backend.
        </p>
      </header>
      {errorApi && (
        <p className="form-error-summary" role="alert">
          {errorApi}
        </p>
      )}
      {loading ? (
        <p role="status">Cargando solicitudes…</p>
      ) : solicitudes.length ? (
        <section
          aria-label="Solicitudes de transporte"
          className="rutas-grid"
        >
          {solicitudes.map((solicitud) => (
            <article className="ruta-card" key={solicitud.id}>
              <div className="ruta-card-heading">
                <span className="lote-badge">{solicitud.categoria}</span>
                <span className={`ruta-estado ruta-estado-${solicitud.estado.toLowerCase()}`}>
                  {solicitud.estado === 'DISPONIBLE' ? 'Disponible' : 'Asignada'}
                </span>
              </div>
              <h2>{solicitud.descripcion}</h2>
              <p className="lote-peso">{solicitud.pesoKg} kg</p>
              <dl className="ruta-detalles">
                <div>
                  <dt>Punto de recojo</dt>
                  <dd>{solicitud.puntoRecojo}</dd>
                </div>
                <div>
                  <dt>Punto de entrega</dt>
                  <dd>{solicitud.puntoEntrega}</dd>
                </div>
                <div>
                  <dt>Distancia</dt>
                  <dd>No disponible</dd>
                </div>
                <div>
                  <dt>Conservación</dt>
                  <dd>
                    {solicitud.requiereFrio
                      ? 'Requiere cooler o caja térmica'
                      : 'No requiere cadena de frío'}
                  </dd>
                </div>
              </dl>
              {solicitud.estado === 'DISPONIBLE' ? (
                <button
                  className="button button-primary"
                  disabled={acceptingId === solicitud.id}
                  onClick={() => aceptarRuta(solicitud.id)}
                  type="button"
                >
                  {acceptingId === solicitud.id ? 'Aceptando…' : 'Aceptar ruta'}
                </button>
              ) : (
                <p className="form-message" role="status">
                  Solicitud asignada a tu cuenta.
                </p>
              )}
              <span className="lote-origen">Solicitud del backend</span>
            </article>
          ))}
        </section>
      ) : (
        <p className="prototipo-empty" role="status">
          No hay solicitudes de transporte disponibles.
        </p>
      )}
    </main>
  )
}

export default LogisticaDashboardPage
