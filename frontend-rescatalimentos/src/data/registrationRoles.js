export const registrationRoles = [
  {
    id: 'donante',
    title: 'Donante: comercio o mercado',
    route: '/registro/donante',
    description:
      'Publica excedentes en buen estado con categoría, peso, vencimiento, necesidad de frío y una foto.',
    profile:
      'RUC o DNI, razón social, dirección, giro comercial y datos del encargado.',
    action: 'Registrarme como donante',
    fields: [
      { name: 'documentId', label: 'RUC o DNI', autoComplete: 'off' },
      { name: 'businessName', label: 'Razón social o nombre comercial' },
      { name: 'address', label: 'Dirección de la sede' },
      { name: 'businessType', label: 'Giro comercial' },
      { name: 'contactName', label: 'Nombre del encargado' },
      { name: 'email', label: 'Correo electrónico', type: 'email' },
      {
        name: 'password',
        label: 'Contraseña',
        type: 'password',
        autoComplete: 'new-password',
      },
    ],
  },
  {
    id: 'comedor',
    title: 'Comedor u organización',
    route: '/registro/comedor',
    description:
      'Consulta lotes cercanos y reserva los que pueda aprovechar tu comunidad.',
    profile:
      'Nombre de la olla común, registro municipal o MIDIS, comensales diarios, capacidad de frío y WhatsApp responsable.',
    action: 'Registrar mi comedor',
    fields: [
      { name: 'organizationName', label: 'Nombre de la olla común o comedor' },
      {
        name: 'municipalCode',
        label: 'Código de registro municipal o MIDIS',
      },
      {
        name: 'dailyDiners',
        label: 'Número de comensales diarios',
        type: 'number',
        min: '1',
      },
      {
        name: 'coldStorage',
        label: 'Capacidad de frío',
        type: 'select',
        options: [
          ['refrigerator', 'Refrigeradora'],
          ['freezer', 'Congeladora'],
          ['both', 'Refrigeradora y congeladora'],
          ['none', 'Sin equipo de refrigeración'],
        ],
      },
      { name: 'contactName', label: 'Nombre de la persona responsable' },
      {
        name: 'whatsapp',
        label: 'WhatsApp del responsable',
        type: 'tel',
        autoComplete: 'tel',
      },
      { name: 'email', label: 'Correo electrónico', type: 'email' },
      {
        name: 'password',
        label: 'Contraseña',
        type: 'password',
        autoComplete: 'new-password',
      },
    ],
  },
  {
    id: 'voluntario',
    title: 'Voluntario de logística',
    route: '/registro/voluntario',
    description:
      'Apoya los recojos cuando un comedor necesita transporte.',
    profile:
      'DNI, tipo de movilidad, placa, capacidad de carga y disponibilidad de cajas térmicas o coolers.',
    action: 'Sumarme como voluntario',
    fields: [
      { name: 'documentId', label: 'DNI', autoComplete: 'off' },
      { name: 'fullName', label: 'Nombre completo', autoComplete: 'name' },
      {
        name: 'mobility',
        label: 'Tipo de movilidad',
        type: 'select',
        options: [
          ['mototaxi', 'Mototaxi'],
          ['van', 'Furgón'],
          ['car', 'Auto'],
          ['foot', 'A pie'],
        ],
      },
      {
        name: 'plate',
        label: 'Placa del vehículo',
        dependsOnMobility: true,
      },
      {
        name: 'capacityKg',
        label: 'Capacidad de carga (kg)',
        type: 'number',
        min: '0',
        step: '0.1',
      },
      {
        name: 'thermalEquipment',
        label: 'Cuento con caja térmica o cooler',
        type: 'checkbox',
      },
      { name: 'email', label: 'Correo electrónico', type: 'email' },
      {
        name: 'password',
        label: 'Contraseña',
        type: 'password',
        autoComplete: 'new-password',
      },
    ],
  },
]
