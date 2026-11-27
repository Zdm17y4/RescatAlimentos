import { useState } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../api/client.js'
import { useAuth } from '../context/useAuth.js'

const categorias = ['Frescos', 'Lácteos', 'Carnes', 'Abarrotes']
const valoresIniciales = {
  categoria: '',
  descripcion: '',
  pesoKg: '',
  vencimiento: '',
  requiereFrio: false,
  pickupAddress: '',
  imageUrl: '',
}

function formatearVencimiento(valor) {
  if (!valor) return 'La fecha y hora aparecerán aquí'
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return 'La fecha y hora aparecerán aquí'
  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(fecha)
}

function PublicarLotePage() {
  const { session } = useAuth()
  const [valores, setValores] = useState(valoresIniciales)
  const [errores, setErrores] = useState({})
  const [mensaje, setMensaje] = useState('')
  const [errorApi, setErrorApi] = useState('')
  const [publicando, setPublicando] = useState(false)

  function actualizarCampo(evento) {
    const { checked, name, type, value } = evento.target
    setValores((actuales) => ({
      ...actuales,
      [name]: type === 'checkbox' ? checked : value,
    }))
    setErrores((actuales) => ({ ...actuales, [name]: '' }))
    setMensaje('')
  }

  function validarFormulario() {
    const nuevosErrores = {}
    if (!valores.categoria) nuevosErrores.categoria = 'Selecciona una categoría.'
    if (!valores.descripcion.trim()) {
      nuevosErrores.descripcion = 'Escribe el nombre o una descripción breve.'
    }

    const peso = Number(valores.pesoKg)
    if (!valores.pesoKg || !Number.isFinite(peso) || peso <= 0) {
      nuevosErrores.pesoKg = 'Ingresa un peso mayor que 0 kg.'
    }

    const vencimiento = new Date(valores.vencimiento).getTime()
    if (!valores.vencimiento || !Number.isFinite(vencimiento)) {
      nuevosErrores.vencimiento = 'Indica la fecha y hora de vencimiento.'
    } else if (vencimiento <= Date.now()) {
      nuevosErrores.vencimiento =
        'El vencimiento debe ser posterior al momento de publicación.'
    }

    if (!valores.pickupAddress.trim()) {
      nuevosErrores.pickupAddress = 'Indica la dirección de recojo.'
    }
    if (valores.imageUrl.trim()) {
      try {
        const url = new URL(valores.imageUrl)
        if (!['http:', 'https:'].includes(url.protocol)) {
          throw new Error('URL inválida')
        }
      } catch {
        nuevosErrores.imageUrl = 'Ingresa una URL de imagen válida (http o https).'
      }
    }
    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  async function enviarFormulario(evento) {
    evento.preventDefault()
    setMensaje('')
    setErrorApi('')
    if (!validarFormulario()) {
      setMensaje('Revisa los campos indicados antes de publicar el lote.')
      return
    }

    setPublicando(true)
    try {
      await apiRequest('/lotes', {
        method: 'POST',
        token: session.token,
        body: {
          category: valores.categoria,
          description: valores.descripcion.trim(),
          weight_kg: Number(valores.pesoKg),
          expires_at: new Date(valores.vencimiento).toISOString(),
          requires_cold_chain: valores.requiereFrio,
          pickup_address: valores.pickupAddress.trim(),
          image_url: valores.imageUrl.trim() || null,
        },
      })
      setMensaje('Lote publicado correctamente y guardado en el backend.')
      setValores(valoresIniciales)
      setErrores({})
    } catch (error) {
      setErrorApi(error.message)
    } finally {
      setPublicando(false)
    }
  }

  function campoConError(nombre) {
    return errores[nombre] ? `${nombre}-error` : undefined
  }

  return (
    <main className="access-page section-padding prototipo-page">
      <header className="access-heading">
        <p className="eyebrow">Donante · Conectado al backend</p>
        <h1>Publicar un lote</h1>
        <p>
          Comparte alimentos aptos para el consumo. La publicación estará
          disponible para que un comedor la consulte y reserve.
        </p>
      </header>

      <nav aria-label="Navegación del prototipo" className="prototipo-nav">
        <Link aria-current="page" className="button button-primary" to="/donante/publicar-lote">
          Publicar lote
        </Link>
      </nav>

      <div className="publicar-layout">
        <section aria-labelledby="formulario-lote-titulo" className="prototipo-panel">
          <h2 id="formulario-lote-titulo">Datos del alimento</h2>
          <p className="form-panel-intro">
            Indica la fecha y hora de vencimiento real del alimento. Debe ser posterior al momento de publicación.
          </p>
          <form className="lote-form" noValidate onSubmit={enviarFormulario}>
            {mensaje && (
              <p
                className="form-message"
                role="status"
              >
                {mensaje}
              </p>
            )}
            {errorApi && (
              <p className="form-error-summary" role="alert">
                {errorApi}
              </p>
            )}

            <label className="lote-campo" htmlFor="categoria">
              Categoría
              <select
                aria-describedby={campoConError('categoria')}
                aria-invalid={Boolean(errores.categoria)}
                id="categoria"
                name="categoria"
                onChange={actualizarCampo}
                value={valores.categoria}
              >
                <option value="">Selecciona una categoría</option>
                {categorias.map((categoria) => (
                  <option key={categoria} value={categoria}>
                    {categoria}
                  </option>
                ))}
              </select>
              {errores.categoria && (
                <span className="field-error" id="categoria-error">
                  {errores.categoria}
                </span>
              )}
            </label>

            <label className="lote-campo" htmlFor="descripcion">
              Nombre o descripción breve
              <input
                aria-describedby={campoConError('descripcion')}
                aria-invalid={Boolean(errores.descripcion)}
                id="descripcion"
                maxLength={100}
                name="descripcion"
                onChange={actualizarCampo}
                placeholder="Ej. Verduras de estación surtidas"
                type="text"
                value={valores.descripcion}
              />
              {errores.descripcion && (
                <span className="field-error" id="descripcion-error">
                  {errores.descripcion}
                </span>
              )}
            </label>

            <label className="lote-campo" htmlFor="pesoKg">
              Peso (kg)
              <input
                aria-describedby={campoConError('pesoKg')}
                aria-invalid={Boolean(errores.pesoKg)}
                id="pesoKg"
                min="0.1"
                name="pesoKg"
                onChange={actualizarCampo}
                placeholder="Ej. 12"
                step="0.1"
                type="number"
                value={valores.pesoKg}
              />
              {errores.pesoKg && (
                <span className="field-error" id="pesoKg-error">
                  {errores.pesoKg}
                </span>
              )}
            </label>

            <label className="lote-campo" htmlFor="vencimiento">
              Fecha y hora de vencimiento
              <input
                aria-describedby={campoConError('vencimiento')}
                aria-invalid={Boolean(errores.vencimiento)}
                id="vencimiento"
                name="vencimiento"
                onChange={actualizarCampo}
                type="datetime-local"
                value={valores.vencimiento}
              />
              {errores.vencimiento && (
                <span className="field-error" id="vencimiento-error">
                  {errores.vencimiento}
                </span>
              )}
            </label>

            <label className="lote-checkbox" htmlFor="requiereFrio">
              <input
                checked={valores.requiereFrio}
                id="requiereFrio"
                name="requiereFrio"
                onChange={actualizarCampo}
                type="checkbox"
              />
              <span>Este lote requiere cadena de frío</span>
            </label>

            <label className="lote-campo" htmlFor="pickupAddress">
              Dirección de recojo
              <input
                aria-describedby={campoConError('pickupAddress')}
                aria-invalid={Boolean(errores.pickupAddress)}
                id="pickupAddress"
                name="pickupAddress"
                onChange={actualizarCampo}
                type="text"
                value={valores.pickupAddress}
              />
              {errores.pickupAddress && (
                <span className="field-error" id="pickupAddress-error">
                  {errores.pickupAddress}
                </span>
              )}
            </label>

            <label className="lote-campo" htmlFor="imageUrl">
              URL de fotografía (opcional)
              <input
                aria-describedby={campoConError('imageUrl')}
                aria-invalid={Boolean(errores.imageUrl)}
                id="imageUrl"
                name="imageUrl"
                onChange={actualizarCampo}
                placeholder="https://..."
                type="url"
                value={valores.imageUrl}
              />
              {errores.imageUrl && (
                <span className="field-error" id="imageUrl-error">
                  {errores.imageUrl}
                </span>
              )}
            </label>
            <button
              className="button button-primary"
              disabled={publicando}
              type="submit"
            >
              {publicando ? 'Publicando…' : 'Publicar lote'}
            </button>
          </form>
        </section>

        <aside aria-label="Vista previa del lote" className="prototipo-preview">
          <p className="eyebrow">Así lo verá un comedor</p>
          <article className="lote-card lote-preview-card">
            {valores.imageUrl ? (
              <img alt={`Vista previa de ${valores.descripcion || 'la fotografía del lote'}`} src={valores.imageUrl} />
            ) : (
              <div aria-hidden="true" className="lote-imagen-vacia">
                Sin fotografía
              </div>
            )}
            <div className="lote-card-content">
              <div className="lote-card-heading">
                <span className="lote-badge">{valores.categoria || 'Categoría'}</span>
                <span className="lote-distancia">Distancia no disponible</span>
              </div>
              <h2>{valores.descripcion || 'Nombre del alimento'}</h2>
              <p className="lote-peso">{valores.pesoKg || '—'} kg</p>
              <dl className="lote-detalles">
                <div>
                  <dt>Vence</dt>
                  <dd>{formatearVencimiento(valores.vencimiento)}</dd>
                </div>
                <div>
                  <dt>Cadena de frío</dt>
                  <dd>{valores.requiereFrio ? 'Requerida' : 'No requerida'}</dd>
                </div>
                <div>
                  <dt>Donante</dt>
                  <dd>Tu cuenta</dd>
                </div>
              </dl>
              <span className="lote-origen">Vista previa · no se guarda hasta publicar</span>
            </div>
          </article>
        </aside>
      </div>
    </main>
  )
}

export default PublicarLotePage
