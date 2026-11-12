const platformViews = [
  {
    title: 'Panel del donante',
    routes: ['/donante/publicar-lote'],
    description:
      'Formulario de dos columnas para elegir categoría, registrar peso y fecha/hora de vencimiento, indicar si requiere cadena de frío y adjuntar una foto. Incluye una vista previa para los comedores.',
  },
  {
    title: 'Espacio del comedor',
    routes: [
      '/comedor/dashboard',
      '/comedor/solicitar-apoyo',
      '/comedor/confirmar-recepcion/:id',
    ],
    description:
      'Consulta lotes en un feed o mapa de cercanía, reserva alimentos y usa un asistente de tres pasos para pedir transporte, insumos no perecibles o brigadas. La recepción registra peso, temperatura, empaques y PIN.',
  },
  {
    title: 'Panel de logística',
    routes: ['/logistica/dashboard', '/logistica/rutas'],
    description:
      'Revisa rutas activas, acepta asignaciones y consulta los datos necesarios para recoger y entregar cada lote.',
  },
  {
    title: 'Panel de administración',
    routes: ['/admin/analitica', '/admin/usuarios'],
    description:
      'Revisa kilos por semana, raciones equivalentes, discrepancias de pesaje y reportes de auditoría. También contempla la aprobación o rechazo de cuentas registradas.',
  },
]

function PlatformViewsSection() {
  return (
    <section className="platform-views-section section-padding" id="vistas-principales">
      <div className="section-heading">
        <p className="eyebrow">Después del registro</p>
        <h2>Un espacio para cada etapa del rescate</h2>
        <span aria-hidden="true" className="heading-rule" />
        <p className="section-intro">
          Estas son las vistas operativas descritas para la plataforma. Los
          paneles privados forman parte del desarrollo y aún no están conectados
          en este prototipo.
        </p>
      </div>
      <div className="platform-views-grid">
        {platformViews.map((view) => (
          <article className="platform-view-card" key={view.title}>
            <h3>{view.title}</h3>
            <div aria-label="Rutas previstas" className="route-list">
              {view.routes.map((route) => (
                <code key={route}>{route}</code>
              ))}
            </div>
            <p>{view.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default PlatformViewsSection
