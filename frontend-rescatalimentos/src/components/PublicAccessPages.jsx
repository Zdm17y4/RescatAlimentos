import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'
import { registrationRoles } from '../data/registrationRoles.js'

const ROLE_ROUTES = {
  DONANTE: '/donante/publicar-lote',
  COMEDOR: '/comedor/dashboard',
  DRIVER: '/logistica/dashboard',
  ADMIN: '/admin/usuarios',
}

function PageIntro({ eyebrow, title, description }) {
  return (
    <header className="access-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  )
}

function RegistrationSelectionPage() {
  return (
    <main className="access-page section-padding">
      <PageIntro
        description="Elige el perfil que mejor representa tu participación. El perfil define las operaciones que podrás realizar en la plataforma."
        eyebrow="Registro de la red"
        title="¿Cómo quieres participar?"
      />
      <div className="registration-grid">
        {registrationRoles.map((role) => (
          <article className="registration-card" key={role.id}>
            <h2>{role.title}</h2>
            <p>{role.description}</p>
            <p className="registration-card-fields">
              <strong>Datos solicitados:</strong> {role.profile}
            </p>
            <Link className="button button-primary" to={role.route}>
              {role.action}
            </Link>
          </article>
        ))}
      </div>
      <p className="approval-note">
        Según la propuesta, los registros quedan pendientes de revisión
        administrativa antes de activar el acceso.
      </p>
      <p className="access-switch">
        ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
      </p>
    </main>
  )
}

function RegistrationPage() {
  const { role: roleId } = useParams()
  const role = registrationRoles.find((item) => item.id === roleId)
  const { register } = useAuth()
  const [values, setValues] = useState({})
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!role) return <Navigate replace to="/registro" />

  function handleChange(event) {
    const { checked, name, type, value } = event.target
    setValues((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    setError('')
    setSubmitting(true)
    try {
      const payload = {
        email: values.email.trim(),
        password: values.password,
        role: role.apiRole,
      }
      if (values.address?.trim()) payload.address = values.address.trim()
      await register(payload)
      setMessage(
        'Registro enviado. Tu cuenta queda pendiente de aprobación administrativa antes de iniciar sesión.',
      )
      setValues({})
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="access-page section-padding">
      <div className="form-page-layout">
        <aside className="form-page-aside">
          <p className="eyebrow">Registro especializado</p>
          <h1>{role.title}</h1>
          <p>{role.description}</p>
          <Link className="back-link" to="/registro">
            ← Cambiar perfil
          </Link>
        </aside>
        <section className="registration-form-panel">
          <h2>Datos de registro</h2>
          <p className="form-panel-intro">
            La API actual guarda correo, contraseña, perfil y, si la indicas,
            dirección.
          </p>
          <form className="role-form" onSubmit={handleSubmit}>
            {message && (
              <p className="form-message" role="status">
                {message}
              </p>
            )}
            {error && (
              <p className="form-error-summary" role="alert">
                {error}
              </p>
            )}
            {role.fields.map((field) => {
              if (field.type === 'select') {
                return (
                  <label key={field.name}>
                    {field.label}
                    <select
                      name={field.name}
                      onChange={handleChange}
                      required={field.required !== false}
                      value={values[field.name] || ''}
                    >
                      <option disabled value="">
                        Selecciona una opción
                      </option>
                      {field.options.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                )
              }

              return (
                <label key={field.name}>
                  {field.label}
                  <input
                    autoComplete={field.autoComplete}
                    min={field.min}
                    name={field.name}
                    onChange={handleChange}
                    minLength={field.name === 'password' ? 8 : undefined}
                    required={field.required !== false}
                    step={field.step}
                    type={field.type || 'text'}
                    value={values[field.name] || ''}
                  />
                </label>
              )
            })}
            <button
              className="button button-primary"
              disabled={submitting}
              type="submit"
            >
              {submitting ? 'Enviando…' : 'Crear cuenta'}
            </button>
          </form>
          <p className="approval-note">
            El flujo propuesto requiere revisión administrativa antes de
            activar una cuenta.
          </p>
        </section>
      </div>
    </main>
  )
}

function LoginPage() {
  const { login } = useAuth()
  const [errorCredenciales, setErrorCredenciales] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(event) {
    event.preventDefault()
    const datos = new FormData(event.currentTarget)
    setErrorCredenciales('')
    setSubmitting(true)
    try {
      const session = await login({
        email: String(datos.get('email')).trim(),
        password: String(datos.get('password')),
      })
      navigate(ROLE_ROUTES[session.role], { replace: true })
    } catch (requestError) {
      setErrorCredenciales(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="access-page section-padding">
      <section className="login-panel">
        <PageIntro
          description="Inicia sesión con una cuenta activa registrada en RescatAlimentos."
          eyebrow="Acceso a la plataforma"
          title="Inicia sesión"
        />
        <form className="role-form" onSubmit={handleSubmit}>
          <label>
            Correo electrónico
            <input
              autoComplete="username"
              name="email"
              type="email"
              required
            />
          </label>
          <label>
            Contraseña
            <input
              autoComplete="current-password"
              name="password"
              required
              type="password"
            />
          </label>
          <button
            className="button button-primary"
            disabled={submitting}
            type="submit"
          >
            {submitting ? 'Ingresando…' : 'Iniciar sesión'}
          </button>
          {errorCredenciales && (
            <p className="form-error-summary" role="alert">
              {errorCredenciales}
            </p>
          )}
        </form>
        <p className="access-switch">
          ¿Aún no tienes cuenta?{' '}
          <button type="button" onClick={() => navigate('/registro')}>
            Regístrate según tu perfil
          </button>
        </p>
      </section>
    </main>
  )
}

export { LoginPage, RegistrationPage, RegistrationSelectionPage }
