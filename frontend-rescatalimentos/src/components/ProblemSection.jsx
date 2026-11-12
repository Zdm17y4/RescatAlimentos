const foodCategories = ['Frescos', 'Lácteos', 'Carnes', 'Abarrotes']

function ProblemSection() {
  return (
    <section className="problem-section section-padding" id="problema">
      <div className="problem-copy">
        <p className="eyebrow">Una conexión que hace falta</p>
        <h2>Alimentos disponibles. Comunidades que los necesitan.</h2>
        <span aria-hidden="true" className="heading-rule" />
        <p>
          En Lima Metropolitana, mercados mayoristas, supermercados y comercios
          pueden tener alimentos aptos para el consumo que están próximos a
          vencer o que no se venden por su apariencia. Al mismo tiempo,
          comedores populares y ollas comunes necesitan abastecimiento.
        </p>
        <p>
          RescatAlimentos propone conectar ambos lados con una plataforma que
          organiza las donaciones, prioriza la cercanía y facilita la logística
          de recojo. El proyecto considera comedores de zonas como San Juan de
          Lurigancho, Villa María del Triunfo y Carabayllo.
        </p>
      </div>
      <div className="problem-categories">
        <h3>Alimentos que pueden publicarse</h3>
        <ul>
          {foodCategories.map((category) => (
            <li key={category}>{category}</li>
          ))}
        </ul>
        <p>
          Cada lote incluye información para que el comedor pueda evaluar si
          puede recibirlo y aprovecharlo a tiempo.
        </p>
      </div>
    </section>
  )
}

export default ProblemSection
