import { useEffect, useState } from 'react'
import { apiRequest, mapUsuario } from '../api/client.js'
import { useAuth } from '../context/useAuth.js'

function AdminDashboardPage() {
  const { session } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorApi, setErrorApi] = useState('')
  const [processingId, setProcessingId] = useState('')
  const pendientes = usuarios.filter(
    (usuario) => usuario.estado === 'PENDIENTE',
  ).length

  useEffect(() => {
    let active = true
    apiRequest('/admin/usuarios/pendientes', { token: session.token })
      .then((result) => {
        if (active) setUsuarios(result.map(mapUsuario))
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

  async function cambiarEstado(usuario, action) {
    const reason =
      action === 'rechazar'
        ? window.prompt('Indica el motivo del rechazo:')
        : null
    if (action === 'rechazar' && !reason?.trim()) return

    setErrorApi('')
    setProcessingId(usuario.id)
    try {
      const result = await apiRequest(
        `/admin/usuarios/${encodeURIComponent(usuario.id)}/${action}`,
        {
          method: 'POST',
          token: session.token,
          body: action === 'rechazar' ? { reason: reason.trim() } : undefined,
        },
      )
      setUsuarios((current) =>
        current.filter((item) => item.id !== result.id),
      )
    } catch (error) {
      setErrorApi(error.message)
    } finally {
      setProcessingId('')
    }
  }

  return (
    <main className="access-page section-padding prototipo-page">
      <header className="access-heading">
        <p className="eyebrow">Administración · Conectado al backend</p>
        <h1>Revisión de cuentas</h1>
        <p>
          Revisa las cuentas pendientes de activación en el backend.
        </p>
      </header>

      {errorApi && (
        <p className="form-error-summary" role="alert">
          {errorApi}
        </p>
      )}

      <section aria-label="Indicadores de revisión" className="admin-metricas">
        <article className="admin-metrica">
          <span>Solicitudes pendientes</span>
          <strong>{pendientes}</strong>
        </article>
      </section>

      <section aria-labelledby="admin-solicitudes-titulo" className="admin-solicitudes">
        <div className="admin-solicitudes-heading">
          <h2 id="admin-solicitudes-titulo">Solicitudes de registro</h2>
          <p>Registros reales recibidos por la API.</p>
        </div>
        {loading ? (
          <p role="status">Cargando solicitudes…</p>
        ) : usuarios.length ? (
          <div className="admin-solicitudes-grid">
            {usuarios.map((usuario) => (
              <article className="admin-solicitud" key={usuario.id}>
                <div className="admin-solicitud-heading">
                  <div>
                    <span className="lote-badge">{usuario.perfil}</span>
                    <h3>{usuario.entidad}</h3>
                  </div>
                  <span
                    className={`admin-estado admin-estado-${usuario.estado.toLowerCase()}`}
                    role="status"
                  >
                    {usuario.estado === 'ACTIVO'
                      ? 'Activa'
                      : usuario.estado === 'RECHAZADO'
                        ? 'Rechazada'
                        : 'Pendiente'}
                  </span>
                </div>
                <p>{usuario.referencia}</p>
                {usuario.estado === 'PENDIENTE' ? (
                  <div className="admin-acciones">
                    <button
                      className="button button-primary"
                      disabled={processingId === usuario.id}
                      onClick={() => cambiarEstado(usuario, 'aprobar')}
                      type="button"
                    >
                      Aprobar
                    </button>
                    <button
                      className="button prototipo-button-secondary"
                      disabled={processingId === usuario.id}
                      onClick={() => cambiarEstado(usuario, 'rechazar')}
                      type="button"
                    >
                      Rechazar
                    </button>
                  </div>
                ) : (
                  <p className="form-message">
                    Decisión registrada en el backend.
                  </p>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p className="prototipo-empty" role="status">
            No hay cuentas pendientes de revisión.
          </p>
        )}
      </section>
    </main>
  )
}

export default AdminDashboardPage
