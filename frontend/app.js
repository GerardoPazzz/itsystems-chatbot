const API_URL = 'http://localhost:3000/api/chat';
const API_URL_SAP = 'http://localhost:3000/api/sap/register';

const GUIAS_DRIVE = {
  'S4_MM_DEMO': 'https://drive.google.com/drive/folders/1xgecegsDtRC3bvNT0tUmmL9lkz4Verfd?usp=drive_link',
  'S4_SD_DEMO': 'https://drive.google.com/drive/folders/1xgecegsDtRC3bvNT0tUmmL9lkz4Verfd?usp=drive_link',
  'S4_PM_DEMO': 'https://drive.google.com/drive/folders/1xgecegsDtRC3bvNT0tUmmL9lkz4Verfd?usp=drive_link',
  'S4_FI_DEMO': 'https://drive.google.com/drive/folders/14I4jF5w6TinY5Or_gK4haDuq_zpTWXde?usp=drive_link',
  'S4_PP_DEMO': 'https://drive.google.com/drive/folders/14I4jF5w6TinY5Or_gK4haDuq_zpTWXde?usp=drive_link'
};

const state = {
  sessionId: '',
  isTyping: false,
  limitReached: false,
  llmModeEnabled: false,
  registrationMode: false,
  currentMenu: 'main'
};

const welcomeMessage = "Buenos dias! Soy el Asesor Academico Virtual de ITSYSTEMS. Cuentame, cual es tu objetivo profesional o area de interes en tecnologia? Para comenzar, puedo mostrarte nuestros perfiles disponibles: Consultor Funcional SAP, Desarrollador SAP, o Desarrollador SAP Cloud.";

const COURSES = {
  'sbo-b1-desarrollo-sdk-virtual': {
    name: 'B1 DESARROLLO (SDK)',
    shortDesc: 'Curso práctico de desarrollo de add-ons personalizados para SAP Business One usando el SDK...',
    descripcion: 'Curso práctico de desarrollo de add-ons personalizados para SAP Business One usando el SDK. Aprende a crear soluciones que se integren con B1 mediante servicios web y APIs REST.',
    modalidad: 'VIRTUAL',
    segmento: 'SBO',
    precio: 1700,
    precioCuotas: 1800,
    dirigido: 'Desarrolladores e implementadores de SAP Business One',
    habilidades: ['Desarrollo de Add-ons con SDK', 'Programación en SAP B1', 'Integraciones con API REST'],
    accesoAula: '2 meses',
    accesoSap: '2 meses',
    prerrequisitos: ['sbo-b1-implementacion-virtual'],
    certification: 'Certificado ITSYSTEMS'
  },
  'sbo-b1-implementacion-virtual': {
    name: 'B1 IMPLEMENTACION',
    shortDesc: 'Curso completo de metodología para implementar SAP Business One en empresas...',
    descripcion: 'Curso completo de metodología para implementar SAP Business One en empresas. Aprende el proceso desde el análisis de requerimientos y configuración inicial hasta la migración de datos y puesta en marcha.',
    modalidad: 'VIRTUAL',
    segmento: 'SBO',
    precio: 1400,
    precioCuotas: 1500,
    dirigido: 'Consultores funcionales e implementadores de SAP Business One',
    habilidades: ['Metodología de implementación SAP B1', 'Configuración de módulos', 'Migración de datos', 'Gestión de proyectos'],
    accesoAula: '1.5 meses',
    accesoSap: '1 mes',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS'
  },
  'sbo-b1-contable-virtual': {
    name: 'B1 CONTABLE',
    shortDesc: 'Curso especializado en configurar y operar el módulo contable de SAP Business One...',
    descripcion: 'Curso especializado en configurar y operar el módulo contable de SAP Business One. Aprende a manejar el plan de cuentas, crear asientos contables, generar reportes financieros y ejecutar procesos de cierre.',
    modalidad: 'VIRTUAL',
    segmento: 'SBO',
    precio: 1200,
    precioCuotas: 1300,
    dirigido: 'Contadores y profesionales financieros que trabajan con SAP B1',
    habilidades: ['Contabilidad en SAP Business One', 'Plan de cuentas y asientos', 'Reportes financieros', 'Cierre contable'],
    accesoAula: '1.5 meses',
    accesoSap: '1 mes',
    prerrequisitos: ['sbo-b1-implementacion-virtual'],
    certification: 'Certificado ITSYSTEMS'
  },
  'sbo-b1-administrativo-virtual': {
    name: 'B1 ADMINISTRATIVO',
    shortDesc: 'Curso operativo para aprender a usar SAP Business One en el día a día...',
    descripcion: 'Curso operativo para aprender a usar SAP Business One en el día a día. Aprende a crear y administrar usuarios, manejar documentos comerciales, realizar consultas operativas y generar reportes.',
    modalidad: 'VIRTUAL',
    segmento: 'SBO',
    precio: 600,
    precioCuotas: 700,
    dirigido: 'Personal administrativo y operativo de empresas con SAP B1',
    habilidades: ['Gestión de documentos', 'Operaciones day-to-day', 'Consultas y reportes operativos', 'Atención a usuarios'],
    accesoAula: '1.5 meses',
    accesoSap: '1 mes',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS'
  },
  'sbo-b1-administrativo-online': {
    name: 'B1 ADMINISTRATIVO',
    shortDesc: 'Curso en vivo con instructor para aprender operaciones diarias en SAP Business One...',
    descripcion: 'Curso en vivo con instructor para aprender operaciones diarias en SAP Business One. Sesiones interactivas donde aprendes a crear usuarios, manejar documentos, hacer consultas y generar reportes.',
    modalidad: 'ONLINE',
    segmento: 'SBO',
    precio: 600,
    precioCuotas: 700,
    dirigido: 'Personal administrativo y operativo de empresas con SAP B1',
    habilidades: ['Gestión de documentos', 'Operaciones day-to-day', 'Consultas y reportes operativos', 'Atención a usuarios'],
    accesoAula: 'sin acceso',
    accesoSap: 'lo que dure el curso',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS'
  },
  's4hana-mm-virtual': {
    name: 'MM (Gestión de Materiales)',
    shortDesc: 'Curso especializado en el módulo de Gestión de Materiales de SAP S/4HANA...',
    descripcion: 'Curso especializado en el módulo de Gestión de Materiales de SAP S/4HANA. Aprende sobre estructuras organizativas, datos maestros de materiales, procesos de compras, gestión de stock, recepción de mercancías y configuración de estrategias de aprovisionamiento.',
    modalidad: 'VIRTUAL',
    segmento: 'S4 HANA',
    precio: 600,
    precioCuotas: 700,
    dirigido: 'Consultores funcionales y profesionales de Supply Chain en S/4HANA',
    habilidades: ['Gestión de Materiales (MM)', 'Estrategias de compras', 'Gestión de stock', 'Configuración de aprovisionamiento'],
    accesoAula: '6 meses',
    accesoSap: '6 meses',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS',
    temario: [
      { sesion: 1, titulo: 'Datos maestros de material' },
      { sesion: 2, titulo: 'Aprovisionamiento por stock' },
      { sesion: 3, titulo: 'Aprovisionamiento por consumos y servicios' },
      { sesion: 4, titulo: 'Cotizaciones y contratos marco' },
      { sesion: 5, titulo: 'Gestión de stock' },
      { sesion: 6, titulo: 'SAP Fiori' }
    ]
  },
  's4hana-fi-virtual': {
    name: 'FI (Contabilidad y Finanzas)',
    shortDesc: 'Curso especializado en el módulo de Contabilidad Financiera de SAP S/4HANA...',
    descripcion: 'Curso especializado en el módulo de Contabilidad Financiera de SAP S/4HANA. Aprende sobre libro mayor, cuentas por cobrar, cuentas por pagar, gestión de activos fijos, bancos y procesos de cierre contable.',
    modalidad: 'VIRTUAL',
    segmento: 'S4 HANA',
    precio: 600,
    precioCuotas: 700,
    dirigido: 'Consultores funcionales y profesionales de Finanzas en S/4HANA',
    habilidades: ['Contabilidad Financiera (FI)', 'Libro Mayor', 'Cuentas por Cobrar/Pagar', 'Gestión de Activos Fijos'],
    accesoAula: '6 meses',
    accesoSap: '6 meses',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS',
    temario: [
      { sesion: 1, titulo: 'Libro Mayor y plan de cuentas' },
      { sesion: 2, titulo: 'Cuentas por Cobrar' },
      { sesion: 3, titulo: 'Cuentas por Pagar' },
      { sesion: 4, titulo: 'Pagos y Activos Fijos' },
      { sesion: 5, titulo: 'Gestión Bancaria' },
      { sesion: 6, titulo: 'SAP Fiori y Cierre contable' }
    ]
  },
  's4hana-pp-virtual': {
    name: 'PP (Planificación de Producción)',
    shortDesc: 'Curso especializado en el módulo de Planificación de Producción de SAP S/4HANA...',
    descripcion: 'Curso especializado en el módulo de Planificación de Producción de SAP S/4HANA. Aprende sobre estructuras organizativas de manufacturing, datos maestros de producción, planificación MRP, órdenes de fabricación y tipos de fabricación.',
    modalidad: 'VIRTUAL',
    segmento: 'S4 HANA',
    precio: 600,
    precioCuotas: 700,
    dirigido: 'Consultores funcionales y profesionales de Producción en S/4HANA',
    habilidades: ['Planificación de Producción (PP)', 'MRP', 'Órdenes de fabricación', 'Tipos de manufactura'],
    accesoAula: '6 meses',
    accesoSap: '6 meses',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS',
    temario: [
      { sesion: 1, titulo: 'Introducción a SAP PP' },
      { sesion: 2, titulo: 'Estructura organizativa y datos maestros' },
      { sesion: 3, titulo: 'Planificación MRP' },
      { sesion: 4, titulo: 'Órdenes de fabricación' },
      { sesion: 5, titulo: 'Proceso de fabricación' },
      { sesion: 6, titulo: 'Tipos de manufactura' }
    ]
  },
  's4hana-pm-virtual': {
    name: 'PM',
    shortDesc: 'Curso de gestión de mantenimiento de equipos e instalaciones industriales en SAP S/4HANA...',
    descripcion: 'Curso de gestión de mantenimiento de equipos e instalaciones industriales en SAP S/4HANA. Aprende a crear órdenes de trabajo, programar mantenimiento preventivo y correctivo, planificar recursos y analizar fallas.',
    modalidad: 'VIRTUAL',
    segmento: 'S4 HANA',
    precio: 700,
    precioCuotas: 800,
    dirigido: 'Profesionales de mantenimiento industrial y gestión de plantas',
    habilidades: ['Gestión de mantenimiento preventivo', 'Órdenes de trabajo', 'Planificación de recursos', 'Mantenimiento centrado en confiabilidad'],
    accesoAula: '6 meses',
    accesoSap: '6 meses',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS',
    temario: [
      { sesion: 1, titulo: 'Datos maestros de mantenimiento' },
      { sesion: 2, titulo: 'Mantenimiento correctivo' },
      { sesion: 3, titulo: 'Mantenimiento preventivo' },
      { sesion: 4, titulo: 'Órdenes y proyectos' },
      { sesion: 5, titulo: 'Informes de mantenimiento' },
      { sesion: 6, titulo: 'Fiori en mantenimiento' }
    ]
  },
  's4hana-ewm-virtual': {
    name: 'EWM (Extended Warehouse Management)',
    shortDesc: 'Curso de gestión avanzada de almacenes con SAP S/4HANA Extended Warehouse Management...',
    descripcion: 'Curso de gestión avanzada de almacenes con SAP S/4HANA Extended Warehouse Management. Aprende sobre estructuras organizativas, procesos de entrada y salida de mercancía, movimientos internos, inventarios y monitoreo de actividades.',
    modalidad: 'VIRTUAL',
    segmento: 'S4 HANA',
    precio: 700,
    precioCuotas: 800,
    dirigido: 'Profesionales de logística avanzada y gestión de almacenes',
    habilidades: ['Gestión de almacenes extendida (EWM)', 'Procesos de almacén', 'Movimientos internos', 'Inventarios EWM'],
    accesoAula: '6 meses',
    accesoSap: '6 meses',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS',
    temario: [
      { sesion: 1, titulo: 'Estructura organizativa' },
      { sesion: 2, titulo: 'Datos maestros' },
      { sesion: 3, titulo: 'Entrada de mercancía' },
      { sesion: 4, titulo: 'Salida de mercancía' },
      { sesion: 5, titulo: 'Procesos internos' },
      { sesion: 6, titulo: 'Inventarios' },
      { sesion: 7, titulo: 'Monitor de EWM' }
    ]
  },
  's4hana-ps-virtual': {
    name: 'PS (Gestión de Proyectos)',
    shortDesc: 'Curso de gestión de proyectos en SAP S/4HANA...',
    descripcion: 'Curso de gestión de proyectos en SAP S/4HANA. Aprende sobre estructuras organizativas de proyectos, datos maestros, planificación y presupuesto, ejecución y cierre de proyectos, e informes de seguimiento.',
    modalidad: 'VIRTUAL',
    segmento: 'S4 HANA',
    precio: 700,
    precioCuotas: 800,
    dirigido: 'Profesionales de gestión de proyectos y consultores funcionales',
    habilidades: ['Gestión de proyectos (PS)', 'Planificación de proyectos', 'Presupuestos', 'Control de proyectos'],
    accesoAula: '6 meses',
    accesoSap: '6 meses',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS',
    temario: [
      { sesion: 1, titulo: 'Estructura organizativa' },
      { sesion: 2, titulo: 'Datos maestros' },
      { sesion: 3, titulo: 'Asignaciones operativas' },
      { sesion: 4, titulo: 'Planificación y presupuesto' },
      { sesion: 5, titulo: 'Ejecución del proyecto' },
      { sesion: 6, titulo: 'Cierres del proyecto' },
      { sesion: 7, titulo: 'Informes del proyecto' }
    ]
  },
  's4hana-qm-virtual': {
    name: 'QM (Gestión de Calidad)',
    shortDesc: 'Curso de gestión de calidad en SAP S/4HANA...',
    descripcion: 'Curso de gestión de calidad en SAP S/4HANA. Aprende sobre planificación de calidad, inspección de materiales, liberación de lotes, certificados de calidad y gestión de avisos de calidad.',
    modalidad: 'VIRTUAL',
    segmento: 'S4 HANA',
    precio: 900,
    precioCuotas: 1000,
    dirigido: 'Profesionales de calidad, manufactura y gestión de información',
    habilidades: ['Gestión de Calidad (QM)', 'Inspecciones de calidad', 'Certificados de calidad', 'Avisos de calidad'],
    accesoAula: '6 meses',
    accesoSap: '6 meses',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS',
    temario: [
      { sesion: 1, titulo: 'Visión general de QM' },
      { sesion: 2, titulo: 'Planificación de calidad I' },
      { sesion: 3, titulo: 'Planificación de calidad II' },
      { sesion: 4, titulo: 'Inspección de insumos' },
      { sesion: 5, titulo: 'Inspección en proceso' },
      { sesion: 6, titulo: 'Inspección de producto terminado' },
      { sesion: 7, titulo: 'Certificados de calidad' },
      { sesion: 8, titulo: 'Avisos al proveedor' },
      { sesion: 9, titulo: 'Avisos de clientes' },
      { sesion: 10, titulo: 'Gestión de documentos' },
      { sesion: 11, titulo: 'Reportes y evaluaciones' }
    ]
  },
  's4hana-co-virtual': {
    name: 'CO (Controlling)',
    shortDesc: 'Curso de Controlling en SAP S/4HANA...',
    descripcion: 'Curso de Controlling en SAP S/4HANA. Aprende sobre análisis de márgenes, gestión de centros de costo, distribución de costos y controlling de productos.',
    modalidad: 'VIRTUAL',
    segmento: 'S4 HANA',
    precio: 700,
    precioCuotas: 800,
    dirigido: 'Consultores de Controlling y profesionales financieros',
    habilidades: ['Controlling (CO)', 'Centros de costo', 'Análisis de márgenes', 'Costos de producto'],
    accesoAula: '6 meses',
    accesoSap: '6 meses',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS',
    temario: []
  },
  's4hana-sd-virtual': {
    name: 'SD',
    shortDesc: 'Curso completo del ciclo de ventas en SAP S/4HANA. Aprende a crear cotizaciones...',
    descripcion: 'Curso completo del ciclo de ventas en SAP S/4HANA. Aprende a crear cotizaciones, procesar pedidos, gestionar entregas, ejecutar facturación y configurar determinación de precios.',
    modalidad: 'VIRTUAL',
    segmento: 'S4 HANA',
    precio: 800,
    precioCuotas: 900,
    dirigido: 'Profesionales de ventas, distribución y servicio al cliente',
    habilidades: ['Proceso de ventas end-to-end', 'Gestión de precios y condiciones', 'Entregas y facturación', 'Cobranzas y gestión de crédito'],
    accesoAula: '6 meses',
    accesoSap: '6 meses',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS',
    temario: [
      { sesion: 1, titulo: 'Estructura comercial' },
      { sesion: 2, titulo: 'Datos maestros de clientes' },
      { sesion: 3, titulo: 'Datos maestros de materiales' },
      { sesion: 4, titulo: 'Circuitos comerciales' },
      { sesion: 5, titulo: 'Gestión de entregas' },
      { sesion: 6, titulo: 'Facturación' },
      { sesion: 7, titulo: 'Fiori y CRM Hybris' }
    ]
  },
  's4hana-tm-virtual': {
    name: 'TM',
    shortDesc: 'Curso de gestión de transporte y logística en SAP S/4HANA...',
    descripcion: 'Curso de gestión de transporte y logística en SAP S/4HANA. Aprende a planificar rutas de distribución, optimizar carga de flotas, rastrear envíos y gestionar documentos de transporte.',
    modalidad: 'VIRTUAL',
    segmento: 'S4 HANA',
    precio: 1400,
    precioCuotas: 1500,
    dirigido: 'Profesionales de logística y transporte',
    habilidades: ['Gestión de transporte', 'Planificación de rutas', 'Optimización de flotas', 'Integración con EWM'],
    accesoAula: '6 meses',
    accesoSap: '6 meses',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS',
    temario: []
  },
  's4hana-ewm-online': {
    name: 'EWM (Extended Warehouse Management)',
    shortDesc: 'Curso de gestión avanzada de almacenes con SAP S/4HANA Extended Warehouse Management con instructor en vivo...',
    descripcion: 'Curso de gestión avanzada de almacenes con SAP S/4HANA Extended Warehouse Management con instructor en vivo. Aprende procesos de entrada, salida, movimientos internos e inventarios.',
    modalidad: 'ONLINE',
    segmento: 'S4 HANA',
    precio: 800,
    precioCuotas: 900,
    dirigido: 'Profesionales de logística avanzada y gestión de almacenes',
    habilidades: ['Gestión de almacenes extendida (EWM)', 'Procesos de almacén', 'Movimientos internos', 'Inventarios EWM'],
    accesoAula: 'sin acceso',
    accesoSap: '6 meses',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS',
    temario: [
      { sesion: 1, titulo: 'Estructura organizativa' },
      { sesion: 2, titulo: 'Datos maestros' },
      { sesion: 3, titulo: 'Entrada de mercancía' },
      { sesion: 4, titulo: 'Salida de mercancía' },
      { sesion: 5, titulo: 'Procesos internos' },
      { sesion: 6, titulo: 'Inventarios' },
      { sesion: 7, titulo: 'Monitor de EWM' }
    ]
  },
  's4hana-ps-online': {
    name: 'PS (Gestión de Proyectos)',
    shortDesc: 'Curso de gestión de proyectos en SAP S/4HANA con instructor en vivo...',
    descripcion: 'Curso de gestión de proyectos en SAP S/4HANA con instructor en vivo. Aprende sobre estructuras organizativas de proyectos, datos maestros, planificación y presupuesto, ejecución y cierre.',
    modalidad: 'ONLINE',
    segmento: 'S4 HANA',
    precio: 800,
    precioCuotas: 900,
    dirigido: 'Profesionales de gestión de proyectos y consultores funcionales',
    habilidades: ['Gestión de proyectos (PS)', 'Planificación de proyectos', 'Presupuestos', 'Control de proyectos'],
    accesoAula: 'sin acceso',
    accesoSap: '6 meses',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS',
    temario: [
      { sesion: 1, titulo: 'Estructura organizativa' },
      { sesion: 2, titulo: 'Datos maestros' },
      { sesion: 3, titulo: 'Asignaciones operativas' },
      { sesion: 4, titulo: 'Planificación y presupuesto' },
      { sesion: 5, titulo: 'Ejecución del proyecto' },
      { sesion: 6, titulo: 'Cierres del proyecto' },
      { sesion: 7, titulo: 'Informes del proyecto' }
    ]
  },
  's4hana-co-online': {
    name: 'CO (Controlling)',
    shortDesc: 'Curso de Controlling en SAP S/4HANA con instructor en vivo...',
    descripcion: 'Curso de Controlling en SAP S/4HANA con instructor en vivo. Aprende sobre análisis de márgenes, gestión de centros de costo, distribución de costos y controlling de productos.',
    modalidad: 'ONLINE',
    segmento: 'S4 HANA',
    precio: 700,
    precioCuotas: 800,
    dirigido: 'Consultores de Controlling y profesionales financieros',
    habilidades: ['Controlling (CO)', 'Centros de costo', 'Análisis de márgenes', 'Costos de producto'],
    accesoAula: 'sin acceso',
    accesoSap: '6 meses',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS',
    temario: []
  },
  's4hana-qm-online': {
    name: 'QM (Gestión de Calidad)',
    shortDesc: 'Curso de gestión de calidad en SAP S/4HANA con instructor en vivo...',
    descripcion: 'Curso de gestión de calidad en SAP S/4HANA con instructor en vivo. Aprende sobre planificación de calidad, inspección de materiales, liberación de lotes y certificados de calidad.',
    modalidad: 'ONLINE',
    segmento: 'S4 HANA',
    precio: 900,
    precioCuotas: 1000,
    dirigido: 'Profesionales de calidad, manufactura y gestión de información',
    habilidades: ['Gestión de Calidad (QM)', 'Inspecciones de calidad', 'Certificados de calidad', 'Avisos de calidad'],
    accesoAula: 'sin acceso',
    accesoSap: '6 meses',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS',
    temario: [
      { sesion: 1, titulo: 'Visión general de QM' },
      { sesion: 2, titulo: 'Planificación de calidad I' },
      { sesion: 3, titulo: 'Planificación de calidad II' },
      { sesion: 4, titulo: 'Inspección de insumos' },
      { sesion: 5, titulo: 'Inspección en proceso' },
      { sesion: 6, titulo: 'Inspección de producto terminado' },
      { sesion: 7, titulo: 'Certificados de calidad' },
      { sesion: 8, titulo: 'Avisos al proveedor' },
      { sesion: 9, titulo: 'Avisos de clientes' },
      { sesion: 10, titulo: 'Gestión de documentos' },
      { sesion: 11, titulo: 'Reportes y evaluaciones' }
    ]
  },
  's4hana-mm-online': {
    name: 'MM (Gestión de Materiales)',
    shortDesc: 'Curso especializado en el módulo de Gestión de Materiales de SAP S/4HANA con instructor en vivo...',
    descripcion: 'Curso especializado en el módulo de Gestión de Materiales de SAP S/4HANA con instructor en vivo. Aprende sobre estructuras organizativas, datos maestros de materiales, procesos de compras y gestión de stock.',
    modalidad: 'ONLINE',
    segmento: 'S4 HANA',
    precio: 600,
    precioCuotas: 700,
    dirigido: 'Consultores funcionales y profesionales de Supply Chain en S/4HANA',
    habilidades: ['Gestión de Materiales (MM)', 'Estrategias de compras', 'Gestión de stock', 'Configuración de aprovisionamiento'],
    accesoAula: 'sin acceso',
    accesoSap: '6 meses',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS',
    temario: [
      { sesion: 1, titulo: 'Datos maestros de material' },
      { sesion: 2, titulo: 'Aprovisionamiento por stock' },
      { sesion: 3, titulo: 'Aprovisionamiento por consumos y servicios' },
      { sesion: 4, titulo: 'Cotizaciones y contratos marco' },
      { sesion: 5, titulo: 'Gestión de stock' },
      { sesion: 6, titulo: 'SAP Fiori' }
    ]
  },
  's4hana-fi-online': {
    name: 'FI (Contabilidad y Finanzas)',
    shortDesc: 'Curso especializado en el módulo de Contabilidad Financiera de SAP S/4HANA con instructor en vivo...',
    descripcion: 'Curso especializado en el módulo de Contabilidad Financiera de SAP S/4HANA con instructor en vivo. Aprende sobre libro mayor, cuentas por cobrar, cuentas por pagar, gestión de activos fijos y cierre contable.',
    modalidad: 'ONLINE',
    segmento: 'S4 HANA',
    precio: 600,
    precioCuotas: 700,
    dirigido: 'Consultores funcionales y profesionales de Finanzas en S/4HANA',
    habilidades: ['Contabilidad Financiera (FI)', 'Libro Mayor', 'Cuentas por Cobrar/Pagar', 'Gestión de Activos Fijos'],
    accesoAula: 'sin acceso',
    accesoSap: '6 meses',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS',
    temario: [
      { sesion: 1, titulo: 'Libro Mayor y plan de cuentas' },
      { sesion: 2, titulo: 'Cuentas por Cobrar' },
      { sesion: 3, titulo: 'Cuentas por Pagar' },
      { sesion: 4, titulo: 'Pagos y Activos Fijos' },
      { sesion: 5, titulo: 'Gestión Bancaria' },
      { sesion: 6, titulo: 'SAP Fiori y Cierre contable' }
    ]
  },
  's4hana-pp-online': {
    name: 'PP (Planificación de Producción)',
    shortDesc: 'Curso especializado en el módulo de Planificación de Producción de SAP S/4HANA con instructor en vivo...',
    descripcion: 'Curso especializado en el módulo de Planificación de Producción de SAP S/4HANA con instructor en vivo. Aprende sobre estructuras organizativas de manufacturing, datos maestros de producción, planificación MRP y órdenes de fabricación.',
    modalidad: 'ONLINE',
    segmento: 'S4 HANA',
    precio: 600,
    precioCuotas: 700,
    dirigido: 'Consultores funcionales y profesionales de Producción en S/4HANA',
    habilidades: ['Planificación de Producción (PP)', 'MRP', 'Órdenes de fabricación', 'Tipos de manufactura'],
    accesoAula: 'sin acceso',
    accesoSap: '6 meses',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS',
    temario: [
      { sesion: 1, titulo: 'Introducción a SAP PP' },
      { sesion: 2, titulo: 'Estructura organizativa y datos maestros' },
      { sesion: 3, titulo: 'Planificación MRP' },
      { sesion: 4, titulo: 'Órdenes de fabricación' },
      { sesion: 5, titulo: 'Proceso de fabricación' },
      { sesion: 6, titulo: 'Tipos de manufactura' }
    ]
  },
  's4hana-pm-online': {
    name: 'PM',
    shortDesc: 'Curso en línea con instructor sobre gestión de mantenimiento industrial en S/4HANA...',
    descripcion: 'Curso en línea con instructor sobre gestión de mantenimiento industrial en S/4HANA. Sesiones en tiempo real donde aprendes órdenes de trabajo, mantenimiento preventivo, confiabilidad de activos y planificación de recursos.',
    modalidad: 'ONLINE',
    segmento: 'S4 HANA',
    precio: 700,
    precioCuotas: 800,
    dirigido: 'Profesionales de mantenimiento industrial y gestión de plantas',
    habilidades: ['Gestión de mantenimiento preventivo', 'Órdenes de trabajo', 'Planificación de recursos', 'Mantenimiento centrado en confiabilidad'],
    accesoAula: 'sin acceso',
    accesoSap: '6 meses',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS',
    temario: [
      { sesion: 1, titulo: 'Datos maestros de mantenimiento' },
      { sesion: 2, titulo: 'Mantenimiento correctivo' },
      { sesion: 3, titulo: 'Mantenimiento preventivo' },
      { sesion: 4, titulo: 'Órdenes y proyectos' },
      { sesion: 5, titulo: 'Informes de mantenimiento' },
      { sesion: 6, titulo: 'Fiori en mantenimiento' }
    ]
  },
  's4hana-sd-online': {
    name: 'SD',
    shortDesc: 'Curso en vivo del proceso comercial completo en SAP S/4HANA...',
    descripcion: 'Curso en vivo del proceso comercial completo en SAP S/4HANA. Aprende cotizaciones, pedidos, entregas, facturación y determinación de precios con sesiones interactivas.',
    modalidad: 'ONLINE',
    segmento: 'S4 HANA',
    precio: 2400,
    precioCuotas: 2500,
    dirigido: 'Profesionales de ventas, distribución y servicio al cliente',
    habilidades: ['Proceso de ventas end-to-end', 'Gestión de precios y condiciones', 'Entregas y facturación', 'Cobranzas y gestión de crédito'],
    accesoAula: 'sin acceso',
    accesoSap: '6 meses',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS',
    temario: [
      { sesion: 1, titulo: 'Estructura comercial' },
      { sesion: 2, titulo: 'Datos maestros de clientes' },
      { sesion: 3, titulo: 'Datos maestros de materiales' },
      { sesion: 4, titulo: 'Circuitos comerciales' },
      { sesion: 5, titulo: 'Gestión de entregas' },
      { sesion: 6, titulo: 'Facturación' },
      { sesion: 7, titulo: 'Fiori y CRM Hybris' }
    ]
  },
  's4hana-tm-online': {
    name: 'TM',
    shortDesc: 'Curso sincronico de gestión de transporte en SAP S/4HANA...',
    descripcion: 'Curso sincronico de gestión de transporte en SAP S/4HANA. Clases en vivo sobre planificación de rutas, optimización de flotas, costos logísticos y seguimiento de despachos.',
    modalidad: 'ONLINE',
    segmento: 'S4 HANA',
    precio: 1000,
    precioCuotas: 1200,
    dirigido: 'Profesionales de logística y transporte',
    habilidades: ['Gestión de transporte', 'Planificación de rutas', 'Optimización de flotas', 'Integración con EWM'],
    accesoAula: 'sin acceso',
    accesoSap: '6 meses',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS',
    temario: []
  },
  's4hana-mm-configuracion-online': {
    name: 'MM CONFIGURACIÓN',
    shortDesc: 'Curso avanzado de configuración del módulo de Gestión de Materiales en SAP S/4HANA...',
    descripcion: 'Curso avanzado de configuración del módulo de Gestión de Materiales en SAP S/4HANA. Aprende a configurar estrategias de compras, determinación automática de precios de materiales, optimización del aprovisionamiento y procesos de evaluación de proveedores.',
    modalidad: 'ONLINE',
    segmento: 'S4 HANA',
    precio: 900,
    precioCuotas: 1000,
    dirigido: 'Consultores funcionales especializados en configuración de MM',
    habilidades: ['Configuración avanzada de MM', 'Estrategias de aprovisionamiento', 'Optimización de compras', 'Integración con módulos'],
    accesoAula: 'sin acceso',
    accesoSap: '3 meses',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS',
    temario: [
      { sesion: 1, titulo: 'Pedidos automáticos' },
      { sesion: 2, titulo: 'Maestro de Planificaciones MRP' },
      { sesion: 3, titulo: 'Consignación y subcontratación' },
      { sesion: 4, titulo: 'Introducción a SAP Fiori' },
      { sesion: 5, titulo: 'Condiciones y liquidaciones' },
      { sesion: 6, titulo: 'Gestión de lotes' },
      { sesion: 7, titulo: 'Operaciones complementarias' }
    ]
  },
  'ecc-hcm-virtual': {
    name: 'HCM',
    shortDesc: 'Curso integral de gestión de capital humano en SAP ECC...',
    descripcion: 'Curso integral de gestión de capital humano en SAP ECC. Aprende administración de personal, procesamiento de nóminas y beneficios, desarrollo organizacional y gestión del tiempo.',
    modalidad: 'VIRTUAL',
    segmento: 'ECC',
    precio: 600,
    precioCuotas: 700,
    dirigido: 'Profesionales de recursos humanos y consultoría HCM',
    habilidades: ['Gestión de personal', 'Nómina y beneficios', 'Desarrollo organizacional', 'Time Management'],
    accesoAula: '3 meses',
    accesoSap: '3 meses',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS',
    temario: [
      { sesion: 1, titulo: 'Organización I' },
      { sesion: 2, titulo: 'Organización II' },
      { sesion: 3, titulo: 'Gestión de personal I' },
      { sesion: 4, titulo: 'Gestión de personal II' },
      { sesion: 5, titulo: 'Gestión de tiempo' },
      { sesion: 6, titulo: 'Gestión de nóminas' }
    ]
  },
  'ecc-mm-virtual': {
    name: 'MM (Gestión de Materiales)',
    shortDesc: 'Curso del módulo de Gestión de Materiales en SAP ECC...',
    descripcion: 'Curso del módulo de Gestión de Materiales en SAP ECC. Aprende sobre estructuras organizativas, datos maestros, procedimientos de compras, gestión de stock y recepción de facturas.',
    modalidad: 'VIRTUAL',
    segmento: 'ECC',
    precio: 500,
    precioCuotas: 600,
    dirigido: 'Consultores funcionales y profesionales de Supply Chain en SAP ECC',
    habilidades: ['Gestión de Materiales (MM)', 'Procedimientos de compras', 'Gestión de stock', 'Evaluación de proveedores'],
    accesoAula: '3 meses',
    accesoSap: '3 meses',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS',
    temario: [
      { sesion: 1, titulo: 'Estructura organizativa y datos maestros' },
      { sesion: 2, titulo: 'Compras estándar' },
      { sesion: 3, titulo: 'Compras de consumo y servicios' },
      { sesion: 4, titulo: 'Gestión de stock y facturas' },
      { sesion: 5, titulo: 'Procesos complementarios' }
    ]
  },
  'ecc-fi-virtual': {
    name: 'FI (Contabilidad y Finanzas)',
    shortDesc: 'Curso del módulo de Contabilidad Financiera en SAP ECC...',
    descripcion: 'Curso del módulo de Contabilidad Financiera en SAP ECC. Aprende sobre libro mayor, cuentas por cobrar, cuentas por pagar, gestión de activos fijos y bancos.',
    modalidad: 'VIRTUAL',
    segmento: 'ECC',
    precio: 500,
    precioCuotas: 600,
    dirigido: 'Consultores funcionales y profesionales de Finanzas en SAP ECC',
    habilidades: ['Contabilidad Financiera (FI)', 'Libro Mayor', 'Cuentas por Cobrar/Pagar', 'Gestión de Activos Fijos'],
    accesoAula: '3 meses',
    accesoSap: '3 meses',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS',
    temario: [
      { sesion: 1, titulo: 'Libro Mayor y plan de cuentas' },
      { sesion: 2, titulo: 'Cuentas por Cobrar' },
      { sesion: 3, titulo: 'Cuentas por Pagar' },
      { sesion: 4, titulo: 'Pagos y Activos Fijos' },
      { sesion: 5, titulo: 'Gestión Bancaria' },
      { sesion: 6, titulo: 'SAP Fiori y Cierre contable' }
    ]
  },
  'ecc-pp-virtual': {
    name: 'PP (Planificación de Producción)',
    shortDesc: 'Curso del módulo de Planificación de Producción en SAP ECC...',
    descripcion: 'Curso del módulo de Planificación de Producción en SAP ECC. Aprende sobre estructuras organizativas, datos maestros de producción, planificación MRP y órdenes de fabricación.',
    modalidad: 'VIRTUAL',
    segmento: 'ECC',
    precio: 500,
    precioCuotas: 600,
    dirigido: 'Consultores funcionales y profesionales de Producción en SAP ECC',
    habilidades: ['Planificación de Producción (PP)', 'MRP', 'Órdenes de fabricación', 'Tipos de manufactura'],
    accesoAula: '3 meses',
    accesoSap: '3 meses',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS',
    temario: [
      { sesion: 1, titulo: 'Introducción a SAP PP' },
      { sesion: 2, titulo: 'Estructura organizativa y datos maestros' },
      { sesion: 3, titulo: 'Planificación MRP' },
      { sesion: 4, titulo: 'Órdenes de fabricación' },
      { sesion: 5, titulo: 'Proceso de fabricación' },
      { sesion: 6, titulo: 'Tipos de manufactura' }
    ]
  },
  'ecc-qm-virtual': {
    name: 'QM (Gestión de Calidad)',
    shortDesc: 'Curso del módulo de Gestión de Calidad en SAP ECC...',
    descripcion: 'Curso del módulo de Gestión de Calidad en SAP ECC. Aprende sobre planificación de calidad, inspección de materiales, liberación de lotes y certificados de calidad.',
    modalidad: 'VIRTUAL',
    segmento: 'ECC',
    precio: 500,
    precioCuotas: 600,
    dirigido: 'Profesionales de calidad, manufactura y gestión de información en SAP ECC',
    habilidades: ['Gestión de Calidad (QM)', 'Inspecciones de calidad', 'Certificados de calidad', 'Avisos de calidad'],
    accesoAula: '3 meses',
    accesoSap: '3 meses',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS',
    temario: [
      { sesion: 1, titulo: 'Visión general de QM' },
      { sesion: 2, titulo: 'Planificación de calidad I' },
      { sesion: 3, titulo: 'Planificación de calidad II' },
      { sesion: 4, titulo: 'Inspección de insumos' },
      { sesion: 5, titulo: 'Inspección en proceso' },
      { sesion: 6, titulo: 'Inspección de producto terminado' },
      { sesion: 7, titulo: 'Certificados de calidad' },
      { sesion: 8, titulo: 'Avisos al proveedor' },
      { sesion: 9, titulo: 'Avisos de clientes' },
      { sesion: 10, titulo: 'Gestión de documentos' },
      { sesion: 11, titulo: 'Reportes y evaluaciones' }
    ]
  },
  'ecc-wm-virtual': {
    name: 'WM (Gestión de Almacén)',
    shortDesc: 'Curso del módulo de Gestión de Almacén en SAP ECC...',
    descripcion: 'Curso del módulo de Gestión de Almacén en SAP ECC. Aprende sobre estructuras organizativas, datos maestros, procesos de entrada y salida de mercancía, movimientos internos e inventarios.',
    modalidad: 'VIRTUAL',
    segmento: 'ECC',
    precio: 500,
    precioCuotas: 600,
    dirigido: 'Profesionales de logística y gestión de almacenes en SAP ECC',
    habilidades: ['Gestión de Almacenes (WM)', 'Procesos de almacén', 'Movimientos internos', 'Inventarios WM'],
    accesoAula: '3 meses',
    accesoSap: '3 meses',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS',
    temario: [
      { sesion: 1, titulo: 'Overview de SAP' },
      { sesion: 2, titulo: 'Estructura organizativa' },
      { sesion: 3, titulo: 'Datos maestros' },
      { sesion: 4, titulo: 'Ingresos de mercancía' },
      { sesion: 5, titulo: 'Salidas de mercancía' },
      { sesion: 6, titulo: 'Movimientos internos' },
      { sesion: 7, titulo: 'Inventarios' },
      { sesion: 8, titulo: 'Monitor de actividades' },
      { sesion: 9, titulo: 'Reportes del almacén' },
      { sesion: 10, titulo: 'Ejercicios integradores' }
    ]
  },
  'ecc-pm-virtual': {
    name: 'PM (Gestión de Mantenimiento)',
    shortDesc: 'Curso del módulo de Gestión de Mantenimiento de Planta en SAP ECC...',
    descripcion: 'Curso del módulo de Gestión de Mantenimiento de Planta en SAP ECC. Aprende sobre datos maestros de mantenimiento, mantenimiento correctivo, preventivo y planificación de recursos.',
    modalidad: 'VIRTUAL',
    segmento: 'ECC',
    precio: 500,
    precioCuotas: 600,
    dirigido: 'Profesionales de mantenimiento industrial y gestión de plantas en SAP ECC',
    habilidades: ['Gestión de mantenimiento (PM)', 'Órdenes de trabajo', 'Mantenimiento preventivo', 'Planificación de recursos'],
    accesoAula: '3 meses',
    accesoSap: '3 meses',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS',
    temario: [
      { sesion: 1, titulo: 'Datos maestros de mantenimiento' },
      { sesion: 2, titulo: 'Mantenimiento correctivo' },
      { sesion: 3, titulo: 'Mantenimiento preventivo' },
      { sesion: 4, titulo: 'Órdenes y proyectos' },
      { sesion: 5, titulo: 'Informes de mantenimiento' },
      { sesion: 6, titulo: 'Fiori en mantenimiento' }
    ]
  },
  'ecc-sd-virtual': {
    name: 'SD (Ventas y Distribución)',
    shortDesc: 'Curso del módulo de Ventas y Distribución en SAP ECC...',
    descripcion: 'Curso del módulo de Ventas y Distribución en SAP ECC. Aprende sobre estructuras comerciales, datos maestros de clientes y materiales, circuitos comerciales, entregas y facturación.',
    modalidad: 'VIRTUAL',
    segmento: 'ECC',
    precio: 500,
    precioCuotas: 600,
    dirigido: 'Profesionales de ventas, distribución y servicio al cliente en SAP ECC',
    habilidades: ['Ventas y Distribución (SD)', 'Proceso de ventas', 'Gestión de entregas', 'Facturación'],
    accesoAula: '3 meses',
    accesoSap: '3 meses',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS',
    temario: [
      { sesion: 1, titulo: 'Estructura comercial' },
      { sesion: 2, titulo: 'Datos maestros de clientes' },
      { sesion: 3, titulo: 'Datos maestros de materiales' },
      { sesion: 4, titulo: 'Circuitos comerciales' },
      { sesion: 5, titulo: 'Gestión de entregas' },
      { sesion: 6, titulo: 'Facturación' },
      { sesion: 7, titulo: 'Fiori y CRM Hybris' }
    ]
  },
  'ecc-co-virtual': {
    name: 'CO (Controlling)',
    shortDesc: 'Curso del módulo de Controlling en SAP ECC...',
    descripcion: 'Curso del módulo de Controlling en SAP ECC. Aprende sobre análisis de márgenes, gestión de centros de costo, distribución de costos y controlling de productos.',
    modalidad: 'VIRTUAL',
    segmento: 'ECC',
    precio: 500,
    precioCuotas: 600,
    dirigido: 'Consultores de Controlling y profesionales financieros en SAP ECC',
    habilidades: ['Controlling (CO)', 'Centros de costo', 'Análisis de márgenes', 'Costos de producto'],
    accesoAula: '3 meses',
    accesoSap: '3 meses',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS',
    temario: []
  },
  'hana-abap-online': {
    name: 'ABAP',
    shortDesc: 'Curso de programación ABAP con instructor en vivo para SAP S/4HANA...',
    descripcion: 'Curso de programación ABAP con instructor en vivo para SAP S/4HANA. Aprende a desarrollar reportes clásicos e interactivos, crear módulos de función, implementar enhancements y user-exits.',
    modalidad: 'ONLINE',
    segmento: 'HANA TECNICO',
    precio: 1100,
    precioCuotas: 1200,
    dirigido: 'Desarrolladores y programadores que desean especializarse en SAP',
    habilidades: ['Programación ABAP 7.5+', 'Desarrollo de reportes', 'Módulo de funciones y Badis', 'Enhancements y user-exits'],
    accesoAula: 'sin acceso',
    accesoSap: '6 meses',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS'
  },
  'hana-sql-online': {
    name: 'SQL',
    shortDesc: 'Curso especializado en consultas SQL para bases de datos SAP HANA con clases en vivo...',
    descripcion: 'Curso especializado en consultas SQL para bases de datos SAP HANA con clases en vivo. Aprende a crear vistas, procedimientos almacenados, funciones y optimizar el rendimiento de consultas.',
    modalidad: 'ONLINE',
    segmento: 'HANA TECNICO',
    precio: null,
    precioCuotas: null,
    dirigido: 'Desarrolladores y administradores de bases de datos SAP HANA',
    habilidades: ['SQL en HANA', 'Consultas advanced', 'Optimización de queries', 'Vistas y procedimientos'],
    accesoAula: 'sin acceso',
    accesoSap: 'lo que dure el curso',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS'
  },
  'hana-developer-btp-online': {
    name: 'DEVELOPER BTP',
    shortDesc: 'Curso de desarrollo en SAP Business Technology Platform con instructor en vivo...',
    descripcion: 'Curso de desarrollo en SAP Business Technology Platform con instructor en vivo. Aprende a crear aplicaciones cloud-native, configurar servicios de integración, implementar autenticación y desplegar soluciones en BTP.',
    modalidad: 'ONLINE',
    segmento: 'HANA TECNICO',
    precio: null,
    precioCuotas: null,
    dirigido: 'Desarrolladores que trabajan con SAP Business Technology Platform',
    habilidades: ['Desarrollo en BTP', 'Servicios de integración', 'Autenticación y autorización', 'Aplicaciones cloud-native'],
    accesoAula: 'sin acceso',
    accesoSap: 'lo que dure el curso',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS'
  },
  'hana-basis-online': {
    name: 'BASIS',
    shortDesc: 'Curso de administración del sistema SAP con sesiones en vivo...',
    descripcion: 'Curso de administración del sistema SAP con sesiones en vivo. Aprende instalación, configuración, gestión de usuarios y autorizaciones, administración de paisajes y monitoreo del sistema.',
    modalidad: 'ONLINE',
    segmento: 'HANA TECNICO',
    precio: null,
    precioCuotas: null,
    dirigido: 'Administradores de sistema y consultores técnicos Basis',
    habilidades: ['Administración del sistema SAP', 'Gestión de usuarios y autorizaciones', 'Transportes y paisaje', 'Monitoring y troubleshooting'],
    accesoAula: 'sin acceso',
    accesoSap: 'lo que dure el curso',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS'
  },
  'hana-abap-rap-online': {
    name: 'ABAP RAP',
    shortDesc: 'Curso moderno de RESTful Application Programming en ABAP para S/4HANA con instructor...',
    descripcion: 'Curso moderno de RESTful Application Programming en ABAP para S/4HANA con instructor. Aprende desarrollo de servicios OData v4, creación de CDS Views y definición de comportamientos con el modelo RAP.',
    modalidad: 'ONLINE',
    segmento: 'HANA TECNICO',
    precio: 1100,
    precioCuotas: 1200,
    dirigido: 'Desarrolladores ABAP que desejam aprender el modelo de programación moderno',
    habilidades: ['RAP (RESTful Application Programming)', 'Desarrollo OData v4', 'CDS Views', 'Behavior Definition'],
    accesoAula: 'sin acceso',
    accesoSap: 'lo que dure el curso',
    prerrequisitos: ['hana-abap-online'],
    certification: 'Certificado ITSYSTEMS'
  },
  'hana-hana-bd-online': {
    name: 'HANA BD',
    shortDesc: 'Curso de administración avanzada de bases de datos SAP HANA en modalidad online...',
    descripcion: 'Curso de administración avanzada de bases de datos SAP HANA en modalidad online. Aprende backup, recovery, seguridad, replication y alta disponibilidad.',
    modalidad: 'ONLINE',
    segmento: 'HANA TECNICO',
    precio: 2400,
    precioCuotas: 2500,
    dirigido: 'Administradores de bases de datos HANA y profesionales de data management',
    habilidades: ['Administración de HANA Database', 'Backup y recovery', 'Seguridad de datos', 'Performance tuning'],
    accesoAula: 'sin acceso',
    accesoSap: 'lo que dure el curso',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS'
  },
  'hana-fiori-online': {
    name: 'FIORI',
    shortDesc: 'Curso de desarrollo SAPUI5 y Fiori Elements con clases en vivo...',
    descripcion: 'Curso de desarrollo SAPUI5 y Fiori Elements con clases en vivo. Aprende a crear aplicaciones web responsivas, diseñar interfaces modernas y consumir servicios OData.',
    modalidad: 'ONLINE',
    segmento: 'HANA TECNICO',
    precio: 2400,
    precioCuotas: 2500,
    dirigido: 'Desarrolladores frontend y consultores UI5/Fiori',
    habilidades: ['SAPUI5 / Fiori Elements', 'Desarrollo de aplicaciones responsivas', 'OData services', 'UX design en SAP'],
    accesoAula: 'sin acceso',
    accesoSap: 'lo que dure el curso',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS'
  },
  'hana-basis-online-2': {
    name: 'BASIS',
    shortDesc: 'Curso avanzado de administración Basis con enfoque en transportes entre sistemas...',
    descripcion: 'Curso avanzado de administración Basis con enfoque en transportes entre sistemas y gestión de landscapes. Aprende a resolver problemas complejos, administrar múltiples entornos y optimizar el rendimiento del sistema SAP.',
    modalidad: 'ONLINE',
    segmento: 'HANA TECNICO',
    precio: 2400,
    precioCuotas: 2500,
    dirigido: 'Administradores de sistema y consultores técnicos Basis',
    habilidades: ['Administración del sistema SAP', 'Gestión de usuarios y autorizaciones', 'Transportes y paisaje', 'Monitoring y troubleshooting'],
    accesoAula: 'sin acceso',
    accesoSap: 'lo que dure el curso',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS'
  },
  'hana-abap-virtual': {
    name: 'ABAP',
    shortDesc: 'Curso completo de programación ABAP con acceso por seis meses al sistema SAP...',
    descripcion: 'Curso completo de programación ABAP con acceso por seis meses al sistema SAP para práctica continua. Aprende desarrollo de reportes, módulos de función, enhancements y programación OO.',
    modalidad: 'VIRTUAL',
    segmento: 'HANA TECNICO',
    precio: null,
    precioCuotas: null,
    dirigido: 'Desarrolladores y programadores que desean especializarse en SAP',
    habilidades: ['Programación ABAP 7.5+', 'Desarrollo de reportes', 'Módulo de funciones y Badis', 'Enhancements y user-exits'],
    accesoAula: '6 meses',
    accesoSap: '6 meses',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS'
  },
  'hana-hana-sql-virtual': {
    name: 'HANA SQL',
    shortDesc: 'Curso de consultas SQL específicas para SAP HANA con laboratorio práctico incluido...',
    descripcion: 'Curso de consultas SQL específicas para SAP HANA con laboratorio práctico incluido. Aprende consultas advanced, creación de vistas optimizadas, procedimientos almacenados y técnicas de optimización.',
    modalidad: 'VIRTUAL',
    segmento: 'HANA TECNICO',
    precio: null,
    precioCuotas: null,
    dirigido: 'Desarrolladores y administradores de bases de datos SAP HANA',
    habilidades: ['SQL en HANA', 'Consultas advanced', 'Optimización de queries', 'Vistas y procedimientos'],
    accesoAula: '1 mes y medio',
    accesoSap: '1 mes',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS'
  },
  'hana-btp-virtual': {
    name: 'BTP',
    shortDesc: 'Curso integral de SAP Business Technology Platform con acceso al entorno...',
    descripcion: 'Curso integral de SAP Business Technology Platform con acceso al entorno. Aprende arquitectura cloud-native, servicios de integración, autenticación, deployment en Cloud Foundry y desarrollo de aplicaciones serverless.',
    modalidad: 'VIRTUAL',
    segmento: 'HANA TECNICO',
    precio: null,
    precioCuotas: null,
    dirigido: 'Desarrolladores y arquitectos que trabajan con SAP Business Technology Platform',
    habilidades: ['Arquitectura BTP', 'Servicios de integración', 'Application Development', 'Cloud Foundry'],
    accesoAula: '3 meses',
    accesoSap: '-',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS',
    temario: [
      { sesion: 1, titulo: 'Introducción a BTP' },
      { sesion: 2, titulo: 'SAP HANA Cloud' },
      { sesion: 3, titulo: 'CAP Backend' },
      { sesion: 4, titulo: 'Programación FrontEnd' },
      { sesion: 5, titulo: 'SAP Build WorkZone' }
    ]
  },
  'hana-abap-rap-virtual': {
    name: 'ABAP RAP',
    shortDesc: 'Curso del modelo de programación RAP en ABAP con acceso al sistema para prácticas...',
    descripcion: 'Curso del modelo de programación RAP en ABAP con acceso al sistema para prácticas. Aprende desarrollo OData v4, CDS Views, Behavior Definition y las nuevas técnicas de desarrollo en S/4HANA.',
    modalidad: 'VIRTUAL',
    segmento: 'HANA TECNICO',
    precio: null,
    precioCuotas: null,
    dirigido: 'Desarrolladores ABAP que desejam aprender el modelo de programación moderno',
    habilidades: ['RAP (RESTful Application Programming)', 'Desarrollo OData v4', 'CDS Views', 'Behavior Definition'],
    accesoAula: '3 meses',
    accesoSap: '1 mes',
    prerrequisitos: ['hana-abap-virtual'],
    certification: 'Certificado ITSYSTEMS'
  },
  'hana-hana-bd-adm-virtual': {
    name: 'HANA BD ADM',
    shortDesc: 'Curso de administración de bases de datos SAP HANA con laboratorio práctico...',
    descripcion: 'Curso de administración de bases de datos SAP HANA con laboratorio práctico. Aprende backup, recovery, seguridad, replication, alta disponibilidad y monitoreo.',
    modalidad: 'VIRTUAL',
    segmento: 'HANA TECNICO',
    precio: null,
    precioCuotas: null,
    dirigido: 'Administradores de bases de datos HANA y profesionales de data management',
    habilidades: ['Administración de HANA Database', 'Backup y recovery', 'Seguridad de datos', 'Performance tuning'],
    accesoAula: '6 meses',
    accesoSap: '2 meses',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS'
  },
  'hana-dev-fiori-s4-virtual': {
    name: 'DEV. FIORI S4',
    shortDesc: 'Curso de desarrollo Fiori específico para S/4HANA con acceso al sistema...',
    descripcion: 'Curso de desarrollo Fiori específico para S/4HANA con acceso al sistema. Aprende SAPUI5 advanced, servicios OData, Floorplan Manager y diseño de aplicaciones Fiori.',
    modalidad: 'VIRTUAL',
    segmento: 'HANA TECNICO',
    precio: 2220,
    precioCuotas: 2331,
    dirigido: 'Desarrolladores que crean aplicaciones Fiori en S/4HANA',
    habilidades: ['Desarrollo Fiori en S/4HANA', 'SAPUI5 advanced', 'OData services para Fiori', 'Análisis y diseño de apps'],
    accesoAula: '1 mes y medio',
    accesoSap: '1 mes',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS',
    temario: [
      { sesion: 1, titulo: 'Introducción a SAP Fiori' },
      { sesion: 2, titulo: 'Administración de Apps' },
      { sesion: 3, titulo: 'UI5 I' },
      { sesion: 4, titulo: 'UI5 II y proyecto' },
      { sesion: 5, titulo: 'Desarrollo UI5 y pruebas' }
    ]
  },
  'hana-basis-virtual': {
    name: 'BASIS',
    shortDesc: 'Curso de administración Basis con acceso completo al sistema para prácticas...',
    descripcion: 'Curso de administración Basis con acceso completo al sistema para prácticas. Aprende instalación, configuración, gestión de usuarios, Transportes, Solution Manager y monitoreo.',
    modalidad: 'VIRTUAL',
    segmento: 'HANA TECNICO',
    precio: 1750,
    precioCuotas: 1850,
    dirigido: 'Administradores de sistema y consultores técnicos Basis',
    habilidades: ['Administración del sistema SAP', 'Gestión de usuarios y autorizaciones', 'Transportes y paisaje', 'Monitoring y troubleshooting'],
    accesoAula: '3 meses',
    accesoSap: '-',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS'
  },
  'hana-abap-virtual': {
    name: 'ABAP',
    shortDesc: 'Curso completo de programación ABAP con acceso por seis meses al sistema SAP...',
    descripcion: 'Curso completo de programación ABAP con acceso por seis meses al sistema SAP para práctica continua. Aprende desarrollo de reportes, módulos de función, enhancements y programación OO.',
    modalidad: 'VIRTUAL',
    segmento: 'HANA TECNICO',
    precio: null,
    precioCuotas: null,
    dirigido: 'Desarrolladores y programadores que desean especializarse en SAP',
    habilidades: ['Programación ABAP 7.5+', 'Desarrollo de reportes', 'Módulo de funciones y Badis', 'Enhancements y user-exits'],
    accesoAula: '6 meses',
    accesoSap: '6 meses',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS',
    temario: [
      { sesion: 1, titulo: 'Introducción a ABAP' },
      { sesion: 2, titulo: 'Pantallas de selección' },
      { sesion: 3, titulo: 'Tablas internas y ALV' },
      { sesion: 4, titulo: 'Módulos de funciones' },
      { sesion: 5, titulo: 'Smart Forms' },
      { sesion: 6, titulo: 'Core Data Services' }
    ]
  },
  'hana-abap-online': {
    name: 'ABAP',
    shortDesc: 'Curso de programación ABAP con instructor en vivo para SAP S/4HANA...',
    descripcion: 'Curso de programación ABAP con instructor en vivo para SAP S/4HANA. Aprende a desarrollar reportes clásicos e interactivos, crear módulos de función, implementar enhancements y user-exits.',
    modalidad: 'ONLINE',
    segmento: 'HANA TECNICO',
    precio: 1100,
    precioCuotas: 1200,
    dirigido: 'Desarrolladores y programadores que desean especializarse en SAP',
    habilidades: ['Programación ABAP 7.5+', 'Desarrollo de reportes', 'Módulo de funciones y Badis', 'Enhancements y user-exits'],
    accesoAula: 'sin acceso',
    accesoSap: '6 meses',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS',
    temario: [
      { sesion: 1, titulo: 'Introducción a ABAP' },
      { sesion: 2, titulo: 'Pantallas de selección' },
      { sesion: 3, titulo: 'Tablas internas y ALV' },
      { sesion: 4, titulo: 'Módulos de funciones' },
      { sesion: 5, titulo: 'Smart Forms' },
      { sesion: 6, titulo: 'Core Data Services' }
    ]
  },
  'hana-abap-rap-virtual': {
    name: 'ABAP RAP',
    shortDesc: 'Curso del modelo de programación RAP en ABAP con acceso al sistema para prácticas...',
    descripcion: 'Curso del modelo de programación RAP en ABAP con acceso al sistema para prácticas. Aprende desarrollo OData v4, CDS Views, Behavior Definition y las nuevas técnicas de desarrollo en S/4HANA.',
    modalidad: 'VIRTUAL',
    segmento: 'HANA TECNICO',
    precio: null,
    precioCuotas: null,
    dirigido: 'Desarrolladores ABAP que desejam aprender el modelo de programación moderno',
    habilidades: ['RAP (RESTful Application Programming)', 'Desarrollo OData v4', 'CDS Views', 'Behavior Definition'],
    accesoAula: '3 meses',
    accesoSap: '1 mes',
    prerrequisitos: ['hana-abap-virtual'],
    certification: 'Certificado ITSYSTEMS',
    temario: [
      { sesion: 1, titulo: 'Introducción a ABAP RAP' },
      { sesion: 2, titulo: 'Operaciones estándar CDS' },
      { sesion: 3, titulo: 'Comportamiento en ABAP' },
      { sesion: 4, titulo: 'EML' },
      { sesion: 5, titulo: 'BDL' },
      { sesion: 6, titulo: 'Servicios de negocio' },
      { sesion: 7, titulo: 'UI y Fiori Elements' }
    ]
  },
  'hana-abap-rap-online': {
    name: 'ABAP RAP',
    shortDesc: 'Curso moderno de RESTful Application Programming en ABAP para S/4HANA con instructor...',
    descripcion: 'Curso moderno de RESTful Application Programming en ABAP para S/4HANA con instructor. Aprende desarrollo de servicios OData v4, creación de CDS Views y definición de comportamientos con el modelo RAP.',
    modalidad: 'ONLINE',
    segmento: 'HANA TECNICO',
    precio: 1100,
    precioCuotas: 1200,
    dirigido: 'Desarrolladores ABAP que desejam aprender el modelo de programación moderno',
    habilidades: ['RAP (RESTful Application Programming)', 'Desarrollo OData v4', 'CDS Views', 'Behavior Definition'],
    accesoAula: 'sin acceso',
    accesoSap: 'lo que dure el curso',
    prerrequisitos: ['hana-abap-online'],
    certification: 'Certificado ITSYSTEMS',
    temario: [
      { sesion: 1, titulo: 'Introducción a ABAP RAP' },
      { sesion: 2, titulo: 'Operaciones estándar CDS' },
      { sesion: 3, titulo: 'Comportamiento en ABAP' },
      { sesion: 4, titulo: 'EML' },
      { sesion: 5, titulo: 'BDL' },
      { sesion: 6, titulo: 'Servicios de negocio' },
      { sesion: 7, titulo: 'UI y Fiori Elements' }
    ]
  },
  'hana-sql-online': {
    name: 'SQL',
    shortDesc: 'Curso especializado en consultas SQL para bases de datos SAP HANA con clases en vivo...',
    descripcion: 'Curso especializado en consultas SQL para bases de datos SAP HANA con clases en vivo. Aprende a crear vistas, procedimientos almacenados, funciones y optimizar el rendimiento de consultas.',
    modalidad: 'ONLINE',
    segmento: 'HANA TECNICO',
    precio: null,
    precioCuotas: null,
    dirigido: 'Desarrolladores y administradores de bases de datos SAP HANA',
    habilidades: ['SQL en HANA', 'Consultas advanced', 'Optimización de queries', 'Vistas y procedimientos'],
    accesoAula: 'sin acceso',
    accesoSap: 'lo que dure el curso',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS',
    temario: [
      { sesion: 1, titulo: 'Fundamentos de BD' },
      { sesion: 2, titulo: 'SELECT y filtrado' },
      { sesion: 3, titulo: 'JOIN y reportes' },
      { sesion: 4, titulo: 'Mantenimiento de datos' }
    ]
  },
  'hana-hana-sql-virtual': {
    name: 'HANA SQL',
    shortDesc: 'Curso de consultas SQL específicas para SAP HANA con laboratorio práctico incluido...',
    descripcion: 'Curso de consultas SQL específicas para SAP HANA con laboratorio práctico incluido. Aprende consultas advanced, creación de vistas optimizadas, procedimientos almacenados y técnicas de optimización.',
    modalidad: 'VIRTUAL',
    segmento: 'HANA TECNICO',
    precio: null,
    precioCuotas: null,
    dirigido: 'Desarrolladores y administradores de bases de datos SAP HANA',
    habilidades: ['SQL en HANA', 'Consultas advanced', 'Optimización de queries', 'Vistas y procedimientos'],
    accesoAula: '1 mes y medio',
    accesoSap: '1 mes',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS',
    temario: [
      { sesion: 1, titulo: 'HANA Cloud y CDS' },
      { sesion: 2, titulo: 'SQL Script' },
      { sesion: 3, titulo: 'Implementación y Modelado' }
    ]
  },
  'hana-basis-online': {
    name: 'BASIS',
    shortDesc: 'Curso de administración del sistema SAP con sesiones en vivo...',
    descripcion: 'Curso de administración del sistema SAP con sesiones en vivo. Aprende instalación, configuración, gestión de usuarios y autorizaciones, administración de paisajes y monitoreo del sistema.',
    modalidad: 'ONLINE',
    segmento: 'HANA TECNICO',
    precio: null,
    precioCuotas: null,
    dirigido: 'Administradores de sistema y consultores técnicos Basis',
    habilidades: ['Administración del sistema SAP', 'Gestión de usuarios y autorizaciones', 'Transportes y paisaje', 'Monitoring y troubleshooting'],
    accesoAula: 'sin acceso',
    accesoSap: 'lo que dure el curso',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS',
    temario: []
  },
  'hana-basis-online-2': {
    name: 'BASIS',
    shortDesc: 'Curso avanzado de administración Basis con enfoque en transportes entre sistemas...',
    descripcion: 'Curso avanzado de administración Basis con enfoque en transportes entre sistemas y gestión de landscapes. Aprende a resolver problemas complejos, administrar múltiples entornos y optimizar el rendimiento del sistema SAP.',
    modalidad: 'ONLINE',
    segmento: 'HANA TECNICO',
    precio: 2400,
    precioCuotas: 2500,
    dirigido: 'Administradores de sistema y consultores técnicos Basis',
    habilidades: ['Administración del sistema SAP', 'Gestión de usuarios y autorizaciones', 'Transportes y paisaje', 'Monitoring y troubleshooting'],
    accesoAula: 'sin acceso',
    accesoSap: 'lo que dure el curso',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS',
    temario: []
  },
  'hana-fiori-online': {
    name: 'FIORI',
    shortDesc: 'Curso de desarrollo SAPUI5 y Fiori Elements con clases en vivo...',
    descripcion: 'Curso de desarrollo SAPUI5 y Fiori Elements con clases en vivo. Aprende a crear aplicaciones web responsivas, diseñar interfaces modernas y consumir servicios OData.',
    modalidad: 'ONLINE',
    segmento: 'HANA TECNICO',
    precio: 2400,
    precioCuotas: 2500,
    dirigido: 'Desarrolladores frontend y consultores UI5/Fiori',
    habilidades: ['SAPUI5 / Fiori Elements', 'Desarrollo de aplicaciones responsivas', 'OData services', 'UX design en SAP'],
    accesoAula: 'sin acceso',
    accesoSap: 'lo que dure el curso',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS',
    temario: [
      { sesion: 1, titulo: 'Introducción a Fiori' },
      { sesion: 2, titulo: 'Administración de Apps' },
      { sesion: 3, titulo: 'UI5 I' },
      { sesion: 4, titulo: 'UI5 II y proyecto' },
      { sesion: 5, titulo: 'Desarrollo UI5 y pruebas' }
    ]
  },
  'hana-hana-bd-online': {
    name: 'HANA BD',
    shortDesc: 'Curso de administración avanzada de bases de datos SAP HANA en modalidad online...',
    descripcion: 'Curso de administración avanzada de bases de datos SAP HANA en modalidad online. Aprende backup, recovery, seguridad, replication y alta disponibilidad.',
    modalidad: 'ONLINE',
    segmento: 'HANA TECNICO',
    precio: 2400,
    precioCuotas: 2500,
    dirigido: 'Administradores de bases de datos HANA y profesionales de data management',
    habilidades: ['Administración de HANA Database', 'Backup y recovery', 'Seguridad de datos', 'Performance tuning'],
    accesoAula: 'sin acceso',
    accesoSap: 'lo que dure el curso',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS',
    temario: [
      { sesion: 1, titulo: 'Introducción' },
      { sesion: 2, titulo: 'Instalación' },
      { sesion: 3, titulo: 'Administración' },
      { sesion: 4, titulo: 'Backup and Recovery' },
      { sesion: 5, titulo: 'Gestión de usuarios' }
    ]
  },
  'hana-hana-bd-adm-virtual': {
    name: 'HANA BD ADM',
    shortDesc: 'Curso de administración de bases de datos SAP HANA con laboratorio práctico...',
    descripcion: 'Curso de administración de bases de datos SAP HANA con laboratorio práctico. Aprende backup, recovery, seguridad, replication, alta disponibilidad y monitoreo.',
    modalidad: 'VIRTUAL',
    segmento: 'HANA TECNICO',
    precio: null,
    precioCuotas: null,
    dirigido: 'Administradores de bases de datos HANA y profesionales de data management',
    habilidades: ['Administración de HANA Database', 'Backup y recovery', 'Seguridad de datos', 'Performance tuning'],
    accesoAula: '6 meses',
    accesoSap: '2 meses',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS',
    temario: [
      { sesion: 1, titulo: 'Introducción' },
      { sesion: 2, titulo: 'Instalación' },
      { sesion: 3, titulo: 'Administración' },
      { sesion: 4, titulo: 'Backup and Recovery' },
      { sesion: 5, titulo: 'Gestión de usuarios' }
    ]
  },
  'hana-developer-btp-online': {
    name: 'DEVELOPER BTP',
    shortDesc: 'Curso de desarrollo en SAP Business Technology Platform con instructor en vivo...',
    descripcion: 'Curso de desarrollo en SAP Business Technology Platform con instructor en vivo. Aprende a crear aplicaciones cloud-native, configurar servicios de integración, implementar autenticación y desplegar soluciones en BTP.',
    modalidad: 'ONLINE',
    segmento: 'HANA TECNICO',
    precio: null,
    precioCuotas: null,
    dirigido: 'Desarrolladores que trabajan con SAP Business Technology Platform',
    habilidades: ['Desarrollo en BTP', 'Servicios de integración', 'Autenticación y autorización', 'Aplicaciones cloud-native'],
    accesoAula: 'sin acceso',
    accesoSap: 'lo que dure el curso',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS',
    temario: [
      { sesion: 1, titulo: 'Introducción a BTP' },
      { sesion: 2, titulo: 'SAP HANA Cloud' },
      { sesion: 3, titulo: 'CAP Backend' },
      { sesion: 4, titulo: 'Programación FrontEnd' },
      { sesion: 5, titulo: 'SAP Build WorkZone' }
    ]
  },
  'productividad-ia-empresarial-online': {
    name: 'IA EMPRESARIAL',
    shortDesc: 'Curso de inteligencia artificial generativa aplicada al entorno empresarial con instructor...',
    descripcion: 'Curso de inteligencia artificial generativa aplicada al entorno empresarial con instructor en vivo. Aprende a crear prompts efectivos, automatizar tareas knowledge, usar herramientas de IA para análisis y integrarlas en procesos de negocio.',
    modalidad: 'ONLINE',
    segmento: 'PRODUCTIVIDAD',
    precio: 518,
    precioCuotas: 555,
    dirigido: 'Profesionales y empresas que desean integrar IA en sus procesos',
    habilidades: ['Fundamentos de IA generativa', 'Prompts efectivos', 'Automatización de tareas', 'Análisis de datos con IA'],
    accesoAula: 'sin acceso',
    accesoSap: 'sin acceso',
    prerrequisitos: ['productividad-excel-soluciones-virtual'],
    certification: 'Certificado ITSYSTEMS',
    temario: [
      { sesion: 1, titulo: 'Fundamentos de la IA moderna' },
      { sesion: 2, titulo: 'Diseño de Prompts profesionales' },
      { sesion: 3, titulo: 'Casos de uso profesionales' },
      { sesion: 4, titulo: 'Diseño de agentes IA' },
      { sesion: 5, titulo: 'Decisión y responsabilidad con IA' },
      { sesion: 6, titulo: 'Integración y Agentic World' }
    ]
  },
  'productividad-contab-no-contadores-virtual': {
    name: 'CONTAB. para no contadores',
    shortDesc: 'Curso de fundamentos contables sin tecnicismos para profesionales de otras áreas...',
    descripcion: 'Curso de fundamentos contables sin tecnicismos para profesionales de otras áreas. Aprende a interpretar estados financieros, analizar información contable y comunicarte efectivamente con el área financiera.',
    modalidad: 'VIRTUAL',
    segmento: 'PRODUCTIVIDAD',
    precio: 250,
    precioCuotas: 300,
    dirigido: 'Profesionales de otras áreas que necesitan entender conceptos contables',
    habilidades: ['Fundamentos de contabilidad', 'Estados financieros básicos', 'Toma de decisiones basada en números', 'Comunicación con el área financiera'],
    accesoAula: '6 meses',
    accesoSap: 'sin acceso',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS',
    temario: [
      { sesion: 1, titulo: 'Conceptos básicos contables' },
      { sesion: 2, titulo: 'Plan de cuentas y dinámica' },
      { sesion: 3, titulo: 'Estado de situación financiera' },
      { sesion: 4, titulo: 'Estado de resultados' },
      { sesion: 5, titulo: 'Ratios e indicadores' },
      { sesion: 6, titulo: 'Régimen tributario' },
      { sesion: 7, titulo: 'Normas Internacionales' },
      { sesion: 8, titulo: 'Gestión e integración SAP' }
    ]
  },
  'productividad-excel-soluciones-virtual': {
    name: 'EXCEL SOLUCIONES EMPRESARIALES',
    shortDesc: 'Curso completo de Excel a nivel avanzado para análisis empresarial...',
    descripcion: 'Curso completo de Excel a nivel avanzado para análisis empresarial. Aprende fórmulas complejas, tablas dinámicas, macros VBA, Power Query y técnicas de visualización de datos.',
    modalidad: 'VIRTUAL',
    segmento: 'PRODUCTIVIDAD',
    precio: 250,
    precioCuotas: 300,
    dirigido: 'Profesionales que trabajan con datos y hojas de cálculo',
    habilidades: ['Fórmulas y funciones advanced', 'Tablas dinámicas', 'Macros y automatización', 'Visualización de datos'],
    accesoAula: '6 meses',
    accesoSap: 'sin acceso',
    prerrequisitos: [],
    certification: 'Certificado ITSYSTEMS',
    temario: [
      { sesion: 1, titulo: 'Bases de datos y formato' },
      { sesion: 2, titulo: 'Comisiones y validaciones' },
      { sesion: 3, titulo: 'Consulta de compras' },
      { sesion: 4, titulo: 'Gestión de compras' },
      { sesion: 5, titulo: 'Inventarios I' },
      { sesion: 6, titulo: 'Inventarios II' },
      { sesion: 7, titulo: 'Recursos Humanos' },
      { sesion: 8, titulo: 'Tablas dinámicas' },
      { sesion: 9, titulo: 'Finanzas y cobranzas' },
      { sesion: 10, titulo: 'Flujo de caja y evaluación' }
    ]
  },
  'productividad-taller-automatizacion-virtual': {
    name: 'TALLER AUTOMATIZACION DE DATOS',
    shortDesc: 'Curso práctico de automatización de tareas repetitivas usando macros y Power Query...',
    descripcion: 'Curso práctico de automatización de tareas repetitivas usando macros y Power Query. Aprende a construir flujos de trabajo automatizados que reducen tiempo manual, minimizan errores y optimizan procesos.',
    modalidad: 'VIRTUAL',
    segmento: 'PRODUCTIVIDAD',
    precio: 100,
    precioCuotas: 100,
    dirigido: 'Profesionales que manejan datos repetitivos y buscan automatizar procesos',
    habilidades: ['Power Query', 'Automatización con macros', 'Limpieza y transformación de datos', 'Flujos de trabajo automatizados'],
    accesoAula: '6 meses',
    accesoSap: 'sin acceso',
    prerrequisitos: ['productividad-excel-soluciones-virtual'],
    certification: 'Certificado ITSYSTEMS'
  }
};

const PROFILES = {
  'consultor-sbo': {
    name: 'Consultor SAP Business One',
    shortDesc: 'Profesional especializado en la implementación, configuración y soporte del módulo SAP Business One...',
    descripcion: 'Profesional especializado en la implementación, configuración y soporte del módulo SAP Business One. Maneja aspectos funcionales de los diferentes módulos de B1 incluyendo contabilidad, ventas, compras e inventario.',
    cursosObligatorios: ['sbo-b1-implementacion-virtual'],
    cursosSugeridos: ['sbo-b1-implementacion-virtual', 'sbo-b1-contable-virtual', 'sbo-b1-administrativo-virtual', 'sbo-b1-desarrollo-sdk-virtual'],
    rutaSugerida: ['sbo-b1-implementacion-virtual', 'sbo-b1-contable-virtual', 'sbo-b1-administrativo-virtual', 'sbo-b1-desarrollo-sdk-virtual'],
    justificacion: 'Se inicia con Implementación para entender la metodología de puesta en marcha de SAP B1. Luego se construye sobre esa base con Contable para profundizar en el módulo financiero, Administrativo para cubrir operaciones day-to-day, y finalmente Desarrollo SDK para capacidades de personalización.'
  },
  'consultor-sbo-online': {
    name: 'Consultor SAP Business One Online',
    shortDesc: 'Profesional especializado en operaciones diarias y administración de SAP Business One con clases en vivo...',
    descripcion: 'Profesional especializado en operaciones diarias y administración de SAP Business One con clases en vivo. Maneja aspectos operativos del sistema incluyendo gestión de usuarios, documentos y consultas.',
    cursosObligatorios: ['sbo-b1-administrativo-online'],
    cursosSugeridos: ['sbo-b1-administrativo-online'],
    rutaSugerida: ['sbo-b1-administrativo-online'],
    justificacion: 'Curso orientado a operaciones diarias en SAP B1 con sesiones en vivo por instructor. Ideal para usuarios que necesitan aprender el sistema de manera interactiva.'
  },
  'consultor-s4hana': {
    name: 'Consultor SAP S/4HANA',
    shortDesc: 'Profesional especializado en la configuración y optimización de procesos de negocio en SAP S/4HANA...',
    descripcion: 'Profesional especializado en la configuración y optimización de procesos de negocio en SAP S/4HANA. Maneja módulos funcionales como MM, FI, PP, SD, PM, CO, QM, EWM, TM según el área de especialización.',
    cursosObligatorios: ['s4hana-mm-virtual', 's4hana-fi-virtual', 's4hana-pp-virtual'],
    cursosSugeridos: ['s4hana-mm-virtual', 's4hana-fi-virtual', 's4hana-pp-virtual', 's4hana-pm-virtual', 's4hana-sd-virtual', 's4hana-ewm-virtual', 's4hana-qm-virtual', 's4hana-ps-virtual'],
    rutaSugerida: ['s4hana-mm-virtual', 's4hana-fi-virtual', 's4hana-pp-virtual', 's4hana-sd-virtual', 's4hana-pm-virtual', 's4hana-ewm-virtual'],
    justificacion: 'Se comienza con MM/FI/PP por ser los núcleos fundamentales de cualquier implementación S/4HANA. SD agrega el ciclo de ventas, PM cubre mantenimiento y EWM cierra la visión logística.'
  },
  'consultor-s4hana-online': {
    name: 'Consultor SAP S/4HANA Online',
    shortDesc: 'Profesional especializado en SAP S/4HANA con clases en vivo...',
    descripcion: 'Profesional especializado en SAP S/4HANA con clases en vivo. Maneja módulos funcionales en modalidad sincronica con instructor, incluyendo MM, FI, PP, SD, PM, TM, QM y configuración avanzada.',
    cursosObligatorios: ['s4hana-mm-online', 's4hana-fi-online', 's4hana-pp-online'],
    cursosSugeridos: ['s4hana-mm-online', 's4hana-fi-online', 's4hana-pp-online', 's4hana-pm-online', 's4hana-sd-online', 's4hana-ewm-online', 's4hana-qm-online', 's4hana-ps-online'],
    rutaSugerida: ['s4hana-mm-online', 's4hana-fi-online', 's4hana-pp-online', 's4hana-sd-online', 's4hana-pm-online', 's4hana-ewm-online'],
    justificacion: 'Cursos en vivo que permiten interacción directa con el instructor. Se comienza con los módulos fundamentales MM/FI/PP y se avanza hacia especializaciones en ventas, mantenimiento y logística.'
  },
  'desarrollador-hana-online': {
    name: 'Desarrollador SAP HANA Online',
    shortDesc: 'Profesional especializado en desarrollo dentro del ecosistema SAP HANA con clases en vivo...',
    descripcion: 'Profesional especializado en desarrollo dentro del ecosistema SAP HANA con clases en vivo. Maneja programación ABAP, ABAP RAP, desarrollo Fiori, UI5 y servicios en BTP.',
    cursosObligatorios: ['hana-abap-online'],
    cursosSugeridos: ['hana-abap-online', 'hana-abap-rap-online', 'hana-fiori-online', 'hana-developer-btp-online'],
    rutaSugerida: ['hana-abap-online', 'hana-abap-rap-online', 'hana-fiori-online', 'hana-developer-btp-online'],
    justificacion: 'ABAP es el lenguaje base del desarrollo SAP. ABAP RAP introduce el modelo moderno de programación. Fiori y Developer BTP completan la formación para desarrollo cloud-native y frontend.'
  },
  'desarrollador-hana-virtual': {
    name: 'Desarrollador SAP HANA Virtual',
    shortDesc: 'Profesional especializado en desarrollo ABAP y Fiori con acceso al sistema para práctica continua...',
    descripcion: 'Profesional especializado en desarrollo ABAP y Fiori con acceso al sistema para práctica continua. Maneja programación ABAP, ABAP RAP, desarrollo Fiori para S/4HANA y servicios en BTP.',
    cursosObligatorios: ['hana-abap-virtual'],
    cursosSugeridos: ['hana-abap-virtual', 'hana-abap-rap-virtual', 'hana-dev-fiori-s4-virtual', 'hana-btp-virtual'],
    rutaSugerida: ['hana-abap-virtual', 'hana-abap-rap-virtual', 'hana-dev-fiori-s4-virtual', 'hana-btp-virtual'],
    justificacion: 'ABAP es el lenguaje base. ABAP RAP introduce el modelo moderno de S/4HANA. DEV FIORI S4 especializa en aplicaciones frontend. BTP abre las capacidades cloud-native.'
  },
  'administrador-hana-online': {
    name: 'Administrador SAP HANA Online',
    shortDesc: 'Profesional especializado en administración y gestión de bases de datos SAP HANA con clases en vivo...',
    descripcion: 'Profesional especializado en administración y gestión de bases de datos SAP HANA con clases en vivo. Maneja SQL, administración Basis, bases de datos HANA y monitoreo del sistema.',
    cursosObligatorios: ['hana-sql-online'],
    cursosSugeridos: ['hana-sql-online', 'hana-basis-online', 'hana-hana-bd-online', 'hana-basis-online-2'],
    rutaSugerida: ['hana-sql-online', 'hana-basis-online', 'hana-hana-bd-online', 'hana-basis-online-2'],
    justificacion: 'SQL es la base para cualquier administrador HANA. BASIS cubre la administración del sistema SAP. HANA BD complementa con administración de la base de datos. La segunda versión de BASIS profundiza en temas avanzados.'
  },
  'administrador-hana-virtual': {
    name: 'Administrador SAP HANA Virtual',
    shortDesc: 'Profesional especializado en administración de sistemas SAP y bases de datos HANA...',
    descripcion: 'Profesional especializado en administración de sistemas SAP y bases de datos HANA con acceso al sistema para práctica. Maneja SQL, administración Basis, HANA Database Administration y BTP.',
    cursosObligatorios: ['hana-hana-sql-virtual'],
    cursosSugeridos: ['hana-hana-sql-virtual', 'hana-basis-virtual', 'hana-hana-bd-adm-virtual', 'hana-btp-virtual'],
    rutaSugerida: ['hana-hana-sql-virtual', 'hana-basis-virtual', 'hana-hana-bd-adm-virtual', 'hana-btp-virtual'],
    justificacion: 'HANA SQL inicia en consultas y administración de base de datos. BASIS proporciona habilidades de administración del sistema SAP completo. HANA BD ADM profundiza en la base de datos. BTP abre el conocimiento cloud.'
  },
  'consultor-ecc': {
    name: 'Consultor SAP ECC',
    shortDesc: 'Profesional especializado en SAP ECC (ERP Central Component), el sistema heredado de SAP...',
    descripcion: 'Profesional especializado en SAP ECC (ERP Central Component), el sistema heredado de SAP. Maneja la amplia gama de módulos disponibles incluyendo Finanza, Logística, Supply Chain y Recursos Humanos.',
    cursosObligatorios: ['ecc-mm-virtual', 'ecc-fi-virtual'],
    cursosSugeridos: ['ecc-mm-virtual', 'ecc-fi-virtual', 'ecc-pp-virtual', 'ecc-qm-virtual', 'ecc-wm-virtual', 'ecc-pm-virtual', 'ecc-sd-virtual', 'ecc-co-virtual', 'ecc-hcm-virtual'],
    rutaSugerida: ['ecc-mm-virtual', 'ecc-fi-virtual', 'ecc-pp-virtual', 'ecc-sd-virtual', 'ecc-wm-virtual', 'ecc-hcm-virtual'],
    justificacion: 'Se comienza con MM y FI por ser los módulos fundamentales. PP agrega capacidades de manufactura, SD el ciclo de ventas, WM la gestión de almacenes y HCM cierra con recursos humanos.'
  },
  'consultor-productividad': {
    name: 'Consultor de Productividad',
    shortDesc: 'Profesional especializado en herramientas y técnicas para optimizar procesos empresariales...',
    descripcion: 'Profesional especializado en herramientas y técnicas para optimizar procesos empresariales. Maneja automatización de datos, Excel avanzado y contabilidad básica para no contadores.',
    cursosObligatorios: ['productividad-excel-soluciones-virtual'],
    cursosSugeridos: ['productividad-excel-soluciones-virtual', 'productividad-taller-automatizacion-virtual', 'productividad-contab-no-contadores-virtual'],
    rutaSugerida: ['productividad-excel-soluciones-virtual', 'productividad-taller-automatizacion-virtual', 'productividad-contab-no-contadores-virtual'],
    justificacion: 'Se inicia con Excel para establecer fundamentos de manejo de datos. Taller de Automatización agrega capacidades de scripting y automatización. Contabilidad para no contadores proporciona visión financiera básica.'
  },
  'consultor-productividad-online': {
    name: 'Consultor de Productividad Online',
    shortDesc: 'Profesional especializado en inteligencia artificial aplicada al entorno empresarial con clases en vivo...',
    descripcion: 'Profesional especializado en inteligencia artificial aplicada al entorno empresarial con clases en vivo. Aprende a crear prompts efectivos, automatizar tareas y usar herramientas de IA generativa.',
    cursosObligatorios: ['productividad-ia-empresarial-online'],
    cursosSugeridos: ['productividad-ia-empresarial-online'],
    rutaSugerida: ['productividad-ia-empresarial-online'],
    justificacion: 'Curso especializado en IA generativa empresarial con sesiones en vivo. Aprende a integrar herramientas de IA en procesos de negocio de manera práctica.'
  },
  'consultor-tecnico-hibrido': {
    name: 'Consultor Técnico Híbrido',
    shortDesc: 'Profesional que combina consultoría funcional en S/4HANA con habilidades técnicas de administración...',
    descripcion: 'Profesional que combina consultoría funcional en S/4HANA con habilidades técnicas de administración HANA. Capaz de entregar soluciones completas sin depender de otros especialistas.',
    cursosObligatorios: ['s4hana-mm-virtual', 's4hana-fi-virtual', 's4hana-pp-virtual'],
    cursosSugeridos: ['s4hana-mm-virtual', 's4hana-fi-virtual', 's4hana-pp-virtual', 'hana-abap-virtual', 'hana-abap-rap-virtual', 'hana-hana-sql-virtual', 'hana-basis-virtual'],
    rutaSugerida: ['s4hana-mm-virtual', 's4hana-fi-virtual', 's4hana-pp-virtual', 'hana-abap-virtual', 'hana-abap-rap-virtual', 'hana-hana-sql-virtual', 'hana-basis-virtual'],
    justificacion: 'Se comienza con el núcleo funcional de S/4HANA (MM/FI/PP). Luego se adquiere capacidad técnica con ABAP y RAP para personalizaciones. SQL y BASIS complementan para administración y optimización.'
  },
  'consultor-datos-empresariales': {
    name: 'Consultor de Datos Empresariales',
    shortDesc: 'Profesional especializado en gestión y análisis de datos empresariales...',
    descripcion: 'Profesional especializado en gestión y análisis de datos empresariales. Combina habilidades de administración HANA con herramientas de productividad para análisis y visualización de datos.',
    cursosObligatorios: ['hana-sql-online'],
    cursosSugeridos: ['hana-sql-online', 'hana-hana-sql-virtual', 'productividad-excel-soluciones-virtual', 'productividad-taller-automatizacion-virtual', 'productividad-ia-empresarial-online'],
    rutaSugerida: ['productividad-excel-soluciones-virtual', 'productividad-taller-automatizacion-virtual', 'hana-sql-online', 'hana-hana-sql-virtual', 'productividad-ia-empresarial-online'],
    justificacion: 'Excel establece fundamentos de análisis. Automatización agrega capacidades de procesamiento. SQL HANA permite consultas advanced. IA Empresarial integra herramientas modernas de inteligencia artificial.'
  },
  'consultor-automation-ai': {
    name: 'Consultor de Automation y AI',
    shortDesc: 'Profesional especializado en diseñar soluciones de automatización inteligente...',
    descripcion: 'Profesional especializado en diseñar soluciones de automatización inteligente usando herramientas de productividad y la nube de SAP. Combina Excel, automatización, IA y desarrollo en BTP.',
    cursosObligatorios: ['productividad-excel-soluciones-virtual'],
    cursosSugeridos: ['productividad-excel-soluciones-virtual', 'productividad-taller-automatizacion-virtual', 'productividad-ia-empresarial-online', 'hana-btp-virtual', 'hana-developer-btp-online'],
    rutaSugerida: ['productividad-excel-soluciones-virtual', 'productividad-taller-automatizacion-virtual', 'productividad-ia-empresarial-online', 'hana-btp-virtual', 'hana-developer-btp-online'],
    justificacion: 'Excel proporciona fundamentos de datos. Automatización agrega capacidades de scripting. IA Empresarial introduce inteligencia artificial. BTP y Developer BTP permiten escalar soluciones a la nube.'
  }
};

const decisionTree = {
  main: {
    options: [
      { id: 'cursos', label: 'Informacion de cursos' },
      { id: 'roles', label: 'Roles disponibles' },
      { id: 'asesor', label: 'Contactar con un asesor' },
      { id: 'registro', label: 'Quiero registrarme en SAP' }
    ]
  },
  cursos: {
    title: 'Nuestros Cursos SAP',
    response: 'Contamos con cursos tecnicos y funcionales en el ecosistema SAP. Cada curso te prepara para roles especificos en el mercado laboral.'
  },
  roles: {
    title: 'Perfiles Profesionales',
    response: 'Preparamos a nuestros estudiantes para roles de alta demanda en el mercado SAP.'
  },
  registro: {
    title: 'Registro en SAP',
    response: 'La integracion con el sistema de matriculas SAP estara disponible muy pronto. Te notificaremos cuando este lista.'
  }
};

function groupCoursesByName() {
  const grouped = {};
  Object.entries(COURSES).forEach(([id, course]) => {
    if (!grouped[course.name]) {
      grouped[course.name] = [];
    }
    grouped[course.name].push({ id, ...course });
  });
  return grouped;
}

function normalizeProfileName(name) {
  const modalidadMatch = name.match(/\s*(Online|Virtual)\s*$/i);
  const modalidad = modalidadMatch ? modalidadMatch[1].toUpperCase() : 'VIRTUAL';
  const normalizedName = name.replace(/\s*(Online|Virtual)\s*$/i, '').trim();
  return { normalizedName, modalidad };
}

function groupProfilesByName() {
  const grouped = {};
  Object.entries(PROFILES).forEach(([id, profile]) => {
    const { normalizedName, modalidad } = normalizeProfileName(profile.name);
    if (!grouped[normalizedName]) {
      grouped[normalizedName] = [];
    }
    grouped[normalizedName].push({ id, ...profile, modalidad });
  });
  return grouped;
}

function showModalitySubmenu(courseName, variants, isProfile = false) {
  elements.quickActions.innerHTML = '';

  const subMenu = document.createElement('div');
  subMenu.className = 'sub-menu';

  const title = document.createElement('div');
  title.className = 'sub-menu-title';
  title.textContent = `${courseName} - Selecciona modalidad`;
  subMenu.appendChild(title);

  const grid = document.createElement('div');
  grid.className = 'sub-menu-grid';

  variants.forEach(variant => {
    const btn = document.createElement('button');
    btn.className = 'sub-btn';
    if (isProfile) {
      btn.textContent = variant.modalidad || 'VIRTUAL';
    } else {
      btn.textContent = variant.modalidad;
    }
    btn.addEventListener('click', () => {
      if (isProfile) {
        showProfileDetail(variant.id);
      } else {
        showCourseDetail(variant.id);
      }
    });
    grid.appendChild(btn);
  });

  subMenu.appendChild(grid);

  const backBtn = document.createElement('button');
  backBtn.className = 'back-btn';
  backBtn.innerHTML = isProfile ? '&larr; Volver a perfiles' : '&larr; Volver a cursos';
  backBtn.addEventListener('click', () => {
    if (isProfile) {
      renderQuickActions('roles');
    } else {
      renderQuickActions('cursos');
    }
  });
  subMenu.appendChild(backBtn);

  elements.quickActions.appendChild(subMenu);
}

const elements = {
  messagesContainer: document.getElementById('messages'),
  messageInput: document.getElementById('message-input'),
  sendButton: document.getElementById('send-btn'),
  typingIndicator: document.getElementById('typing-indicator'),
  limitModal: document.getElementById('limit-modal'),
  btnRestart: document.getElementById('btn-restart'),
  btnAdvisor: document.getElementById('btn-advisor'),
  quickActions: document.getElementById('quick-actions'),
  registrationModal: document.getElementById('registration-modal'),
  registrationForm: document.getElementById('registration-form'),
  btnCancelRegistration: document.getElementById('btn-cancel-registration')
};

function init() {
  state.sessionId = crypto.randomUUID();
  state.limitReached = false;
  state.llmModeEnabled = false;
  state.registrationMode = false;
  state.currentMenu = 'main';
  console.log('Session ID:', state.sessionId);

  renderMessage(welcomeMessage, 'bot', true);
  renderQuickActions('main');
  setupEventListeners();
  setupUsernameValidation();
}

function setupEventListeners() {
  elements.sendButton.addEventListener('click', handleSend);
  elements.messageInput.addEventListener('keydown', handleKeyDown);
  elements.btnRestart.addEventListener('click', handleRestart);
  elements.btnAdvisor.addEventListener('click', handleAdvisor);
  elements.registrationForm.addEventListener('submit', handleFormSubmit);
  elements.btnCancelRegistration.addEventListener('click', closeRegistrationModal);
}

function handleKeyDown(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    handleSend();
  }
}

function renderQuickActions(menuKey) {
  elements.quickActions.innerHTML = '';

  if (menuKey === 'main') {
    elements.quickActions.classList.remove('hidden');
    const grid = document.createElement('div');
    grid.className = 'quick-actions-grid';

    decisionTree.main.options.forEach(option => {
      const btn = document.createElement('button');
      btn.className = 'quick-btn';
      btn.textContent = option.label;
      btn.dataset.action = option.id;
      btn.addEventListener('click', () => handleQuickAction(option.id));
      grid.appendChild(btn);
    });

    elements.quickActions.appendChild(grid);
    return;
  }

  const menu = decisionTree[menuKey];
  if (!menu) return;

  elements.quickActions.classList.remove('hidden');

  const subMenu = document.createElement('div');
  subMenu.className = 'sub-menu';

  const title = document.createElement('div');
  title.className = 'sub-menu-title';
  title.textContent = menu.title;
  subMenu.appendChild(title);

  const grid = document.createElement('div');
  grid.className = 'sub-menu-grid';

  if (menuKey === 'cursos') {
    const groupedCourses = groupCoursesByName();
    Object.entries(groupedCourses).forEach(([name, variants]) => {
      const btn = document.createElement('button');
      btn.className = 'sub-btn';
      btn.textContent = name;
      if (variants.length === 1) {
        btn.addEventListener('click', () => showCourseDetail(variants[0].id));
      } else {
        btn.addEventListener('click', () => showModalitySubmenu(name, variants, false));
      }
      grid.appendChild(btn);
    });
  } else if (menuKey === 'roles') {
    const groupedProfiles = groupProfilesByName();
    Object.entries(groupedProfiles).forEach(([name, variants]) => {
      const btn = document.createElement('button');
      btn.className = 'sub-btn';
      btn.textContent = name;
      if (variants.length === 1) {
        btn.addEventListener('click', () => showProfileDetail(variants[0].id));
      } else {
        btn.addEventListener('click', () => showModalitySubmenu(name, variants, true));
      }
      grid.appendChild(btn);
    });
  }

  subMenu.appendChild(grid);

  const divider = document.createElement('hr');
  divider.className = 'menu-divider';
  subMenu.appendChild(divider);

  const llmBtn = document.createElement('button');
  llmBtn.className = 'llm-mode-btn';
  llmBtn.textContent = 'Pregunta personalizada sobre cursos';
  llmBtn.addEventListener('click', () => {
    enableLlmMode('Tengo una pregunta sobre los cursos SAP');
  });
  subMenu.appendChild(llmBtn);

  const backBtn = document.createElement('button');
  backBtn.className = 'back-btn';
  backBtn.innerHTML = '&larr; Volver al menu principal';
  backBtn.addEventListener('click', () => {
    state.currentMenu = 'main';
    elements.quickActions.innerHTML = '';
    renderQuickActions('main');
  });
  subMenu.appendChild(backBtn);

  elements.quickActions.appendChild(subMenu);
}

function handleQuickAction(actionId) {
  state.currentMenu = actionId;

  const userMessages = {
    cursos: 'Quiero informacion sobre los cursos',
    roles: 'Quiero conocer los roles disponibles',
    asesor: 'Quiero contactar con un asesor',
    registro: 'Quiero registrarme en un curso SAP'
  };

  renderMessage(userMessages[actionId], 'user');

  if (actionId === 'asesor') {
    renderMessage('Seras redirigido a un asesor de ITSYSTEMS. Puedes contactarnos via WhatsApp para una atencion personalizada.', 'bot');
    setTimeout(() => {
      window.open('https://wa.me/51999666333?text=Hola,%20me%20gustaria%20recibir%20asesoria%20sobre%20los%20cursos%20SAP%20de%20ITSYSTEMS', '_blank');
    }, 500);
    return;
  }

  if (actionId === 'registro') {
    openRegistrationModal();
    return;
  }

  const menu = decisionTree[actionId];
  const botMessage = document.createElement('div');
  botMessage.className = 'message bot';
  botMessage.innerHTML = `
    <div class="message-content">
      <p>${menu.response}</p>
    </div>
  `;
  elements.messagesContainer.appendChild(botMessage);
  scrollToBottom();

  renderQuickActions(actionId);
}

function showCourseDetail(courseId) {
  const course = COURSES[courseId];
  if (!course) return;

  renderMessage(course.name, 'user');

  const precioTexto = course.precio !== null ? `S/. ${course.precio.toLocaleString()}` : 'Consultar precio';
  const precioCuotasTexto = course.precioCuotas !== null ? `S/. ${course.precioCuotas.toLocaleString()}` : 'Consultar precio';
  const prerrequisitosTexto = course.prerrequisitos.length > 0
    ? course.prerrequisitos.map(id => COURSES[id]?.name || id).join(', ')
    : 'Ninguno';

  let temarioHtml = '';
  if (course.temario && course.temario.length > 0) {
    const temarioItems = course.temario.map((s, i) => {
      const temaNum = i + 1;
      let resumen = s.titulo.split('(')[0].trim();
      resumen = resumen.length > 45 ? resumen.substring(0, 42) + '...' : resumen;
      return `<li><strong>${temaNum}.</strong> ${resumen}</li>`;
    }).join('');
    temarioHtml = `<div style="margin-top: 10px; background: #f5f5f5; padding: 10px; border-radius: 5px;"><strong>Módulos o temario:</strong><ul style="margin: 5px 0; padding-left: 20px; list-style: none;">${temarioItems}</ul></div>`;
  } else {
    temarioHtml = `<p style="margin-top: 10px;"><strong>Módulos o temario:</strong> <em>(Aún en planeación)</em></p>`;
  }

  const botMessage = document.createElement('div');
  botMessage.className = 'message bot';
  botMessage.innerHTML = `
    <div class="message-content">
      <p><strong>${course.name}</strong> [${course.modalidad}]</p>
      <p>${course.descripcion}</p>
      <p><strong>Dirigido a:</strong> ${course.dirigido}</p>
      <p><strong>Habilidades:</strong> ${course.habilidades.slice(0, 3).join(', ')}...</p>
      <p><strong>Precio:</strong> ${precioTexto} (contado) | ${precioCuotasTexto} (cuotas)</p>
      <p><strong>Acceso:</strong> Aula virtual: ${course.accesoAula} | SAP: ${course.accesoSap}</p>
      <p><strong>Prerrequisitos:</strong> ${prerrequisitosTexto}</p>
      <p><strong>Certificacion:</strong> ${course.certification}</p>
      ${temarioHtml}
    </div>
  `;
  elements.messagesContainer.appendChild(botMessage);
  scrollToBottom();

  showBackOnlyMenu('cursos');
}

function showProfileDetail(profileId) {
  const profile = PROFILES[profileId];
  if (!profile) return;

  renderMessage(profile.name, 'user');

  const rutaNumerada = profile.rutaSugerida.map((id, i) => `${i + 1}. ${COURSES[id]?.name || id}`).join('\n');
  const obligatoriosNombres = profile.cursosObligatorios.map(id => COURSES[id]?.name || id).join(', ');

  const botMessage = document.createElement('div');
  botMessage.className = 'message bot';
  botMessage.innerHTML = `
    <div class="message-content">
      <p><strong>${profile.name}</strong></p>
      <p>${profile.descripcion}</p>
      <p><strong>Cursos obligatorios:</strong> ${obligatoriosNombres}</p>
      <p><strong>Ruta sugerida:</strong></p>
      <pre style="margin: 10px 0;">${rutaNumerada}</pre>
      <p><strong>Justificacion:</strong> ${profile.justificacion}</p>
    </div>
  `;
  elements.messagesContainer.appendChild(botMessage);
  scrollToBottom();

  showBackOnlyMenu('roles');
}

function showBackOnlyMenu(parentMenu) {
  elements.quickActions.innerHTML = '';
  elements.quickActions.classList.remove('hidden');

  const backBtn = document.createElement('button');
  backBtn.className = 'back-btn';
  backBtn.innerHTML = '&larr; Volver al menu principal';
  backBtn.addEventListener('click', () => {
    state.currentMenu = 'main';
    elements.quickActions.innerHTML = '';
    renderQuickActions('main');
  });
  elements.quickActions.appendChild(backBtn);
}

function renderRegistrationMenu() {
  elements.quickActions.innerHTML = '';
  elements.quickActions.classList.remove('hidden');

  const subMenu = document.createElement('div');
  subMenu.className = 'sub-menu';

  const title = document.createElement('div');
  title.className = 'sub-menu-title';
  title.textContent = 'Registro en SAP';
  subMenu.appendChild(title);

  const grid = document.createElement('div');
  grid.className = 'sub-menu-grid';

  const enterUserBtn = document.createElement('button');
  enterUserBtn.className = 'sub-btn';
  enterUserBtn.textContent = 'Ingresar usuario';
  enterUserBtn.addEventListener('click', () => enableRegistrationMode());
  grid.appendChild(enterUserBtn);

  const backBtn = document.createElement('button');
  backBtn.className = 'back-btn';
  backBtn.innerHTML = '&larr; Volver al menu principal';
  backBtn.addEventListener('click', () => {
    state.currentMenu = 'main';
    elements.quickActions.innerHTML = '';
    renderQuickActions('main');
  });

  subMenu.appendChild(grid);
  subMenu.appendChild(backBtn);
  elements.quickActions.appendChild(subMenu);
}

function enableRegistrationMode() {
  state.registrationMode = true;
  elements.quickActions.classList.add('hidden');
  elements.messageInput.disabled = false;
  elements.sendButton.disabled = false;
  elements.messageInput.placeholder = 'Ingresa tu ID de usuario SAP';
  elements.messageInput.focus();

  renderMessage('Quiero registrarme con mi usuario SAP', 'user');

  const backToMenuBtn = document.createElement('button');
  backToMenuBtn.className = 'llm-mode-back-btn';
  backToMenuBtn.innerHTML = '&larr; Volver al menu de registro';
  backToMenuBtn.addEventListener('click', () => {
    state.registrationMode = false;
    elements.messageInput.disabled = true;
    elements.sendButton.disabled = true;
    elements.messageInput.value = '';
    elements.messageInput.placeholder = 'Escribe tu mensaje...';
    backToMenuBtn.remove();
    renderRegistrationMenu();
  });

  const chatContainer = document.querySelector('.chat-container');
  chatContainer.insertBefore(backToMenuBtn, elements.quickActions);
}

function openRegistrationModal() {
  elements.registrationModal.classList.remove('hidden');
  elements.registrationForm.reset();

  const usernameInput = document.getElementById('reg-sap-usuario');
  const usernameError = document.getElementById('username-error');
  const emailInput = document.getElementById('reg-email');
  const emailError = document.getElementById('email-error');
  const telefonoInput = document.getElementById('reg-telefono');
  const telefonoError = document.getElementById('telefono-error');
  const submitBtn = document.querySelector('#registration-modal .modal-btn.primary');

  const inputs = [usernameInput, emailInput, telefonoInput];
  const errors = [usernameError, emailError, telefonoError];

  inputs.forEach(input => {
    if (input) input.classList.remove('input-error', 'input-valid');
  });
  errors.forEach(error => {
    if (error) error.textContent = '';
  });

  if (submitBtn) submitBtn.disabled = true;
}

function setupUsernameValidation() {
  const usernameInput = document.getElementById('reg-sap-usuario');
  const usernameError = document.getElementById('username-error');
  const emailInput = document.getElementById('reg-email');
  const emailError = document.getElementById('email-error');
  const telefonoInput = document.getElementById('reg-telefono');
  const telefonoError = document.getElementById('telefono-error');
  const submitBtn = document.querySelector('#registration-modal .modal-btn.primary');

  function validateForm() {
    const usernameOk = usernameInput && usernameInput.value.length >= 5 && usernameInput.value.length <= 8;
    const emailOk = emailInput && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value);
    const telefonoOk = telefonoInput && telefonoInput.value.length >= 9;
    if (submitBtn) {
      submitBtn.disabled = !(usernameOk && emailOk && telefonoOk);
    }
  }

  if (usernameInput) {
    usernameInput.addEventListener('input', function() {
      const value = this.value;
      const length = value.length;

      if (length === 0) {
        this.classList.remove('input-error', 'input-valid');
        if (usernameError) usernameError.textContent = '';
      } else if (length < 5) {
        this.classList.add('input-error');
        this.classList.remove('input-valid');
        if (usernameError) usernameError.textContent = 'Mínimo 5 caracteres';
      } else if (length > 8) {
        this.classList.add('input-error');
        this.classList.remove('input-valid');
        if (usernameError) usernameError.textContent = 'Máximo 8 caracteres';
      } else {
        this.classList.remove('input-error');
        this.classList.add('input-valid');
        if (usernameError) usernameError.textContent = '';
      }
      validateForm();
    });
  }

  if (emailInput) {
    emailInput.addEventListener('input', function() {
      const value = this.value;
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

      if (value.length === 0) {
        this.classList.remove('input-error', 'input-valid');
        if (emailError) emailError.textContent = '';
      } else if (!isValid) {
        this.classList.add('input-error');
        this.classList.remove('input-valid');
        if (emailError) emailError.textContent = 'Ingrese un correo valido';
      } else {
        this.classList.remove('input-error');
        this.classList.add('input-valid');
        if (emailError) emailError.textContent = '';
      }
      validateForm();
    });
  }

  if (telefonoInput) {
    telefonoInput.addEventListener('input', function() {
      const value = this.value;
      const length = value.length;

      if (length === 0) {
        this.classList.remove('input-error', 'input-valid');
        if (telefonoError) telefonoError.textContent = '';
      } else if (length < 9) {
        this.classList.add('input-error');
        this.classList.remove('input-valid');
        if (telefonoError) telefonoError.textContent = 'Mínimo 9 dígitos';
      } else {
        this.classList.remove('input-error');
        this.classList.add('input-valid');
        if (telefonoError) telefonoError.textContent = '';
      }
      validateForm();
    });
  }
}

function closeRegistrationModal() {
  elements.registrationModal.classList.add('hidden');
}

function handleFormSubmit(event) {
  event.preventDefault();

  const formData = new FormData(elements.registrationForm);
  const formDataObj = {};
  formData.forEach((value, key) => {
    formDataObj[key] = value;
  });

  closeRegistrationModal();

  renderMessage('He completado el formulario de registro en SAP', 'user');

  showTyping();

  sendToSAPRegister(formDataObj);
}

async function sendToSAPRegister(formData) {
  const sapUsername = formData.sap_username.toLowerCase();
  const roleId = formData.roleId;

  try {
    const response = await fetch(API_URL_SAP, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const data = await response.json();
    hideTyping();

    if (data.success) {
      let successMessage;
      if (data.requiresFiori) {
        successMessage = `¡Registro exitoso! Tu usuario <strong>${sapUsername}</strong> ha sido registrado en SAP.

<strong>Flujo de acceso:</strong>
<ol>
  <li>Instalar SAP Logon</li>
  <li>Adjuntar las credenciales correspondientes a ITSYSTEMS</li>
  <li>Ingresar con tu username y contraseña</li>
</ol>

<strong>Credenciales:</strong>
<ul>
  <li><strong>Usuario:</strong> ${sapUsername}</li>
  <li><strong>Contraseña:</strong> ITS${sapUsername}</li>
</ul>

<strong>Como alternativa, puedes acceder desde Fiori:</strong>
<a href="https://s4hana.sapapp.store/webgui" target="_blank" class="message-link">https://s4hana.sapapp.store/webgui</a>`;
      } else {
        successMessage = `¡Registro exitoso! Tu usuario <strong>${sapUsername}</strong> ha sido registrado en SAP.

<strong>Flujo de acceso:</strong>
<ol>
  <li>Instalar SAP Logon</li>
  <li>Adjuntar las credenciales correspondientes a ITSYSTEMS</li>
  <li>Ingresar con tu username y contraseña</li>
</ol>

<strong>Credenciales:</strong>
<ul>
  <li><strong>Usuario:</strong> ${sapUsername}</li>
  <li><strong>Contraseña:</strong> ITS${sapUsername}</li>
</ul>

<strong>Accede desde:</strong>
<a href="https://s4hana.itscloud.store/webgui" target="_blank" class="message-link">https://s4hana.itscloud.store/webgui</a>`;
      }

      const guiaDrive = GUIAS_DRIVE[roleId];
      if (guiaDrive) {
        successMessage += `
<br>
<strong>Descarga la guía de instalación:</strong>
<a href="${guiaDrive}" target="_blank" class="message-link">📥 Ver Guía en Drive</a>`;
      }

      renderMessage(successMessage, 'bot');
    } else {
      renderMessage(data.error || 'Ocurrio un error al procesar tu solicitud. Por favor intenta nuevamente o contacta a un asesor.', 'bot');
    }

    showBackOnlyMenu('registro');
  } catch (error) {
    hideTyping();
    renderMessage('Ocurrio un error al procesar tu solicitud. Por favor intenta nuevamente o contacta a un asesor.', 'bot');
    showBackOnlyMenu('registro');
  }
}

function enableLlmMode(initialMessage = null) {
  state.llmModeEnabled = true;
  elements.quickActions.classList.add('hidden');
  elements.messageInput.disabled = false;
  elements.sendButton.disabled = false;

  const backToMenuBtn = document.createElement('button');
  backToMenuBtn.className = 'llm-mode-back-btn';
  backToMenuBtn.innerHTML = '&larr; Volver al menu principal';
  backToMenuBtn.addEventListener('click', () => {
    state.llmModeEnabled = false;
    elements.messageInput.disabled = true;
    elements.sendButton.disabled = true;
    elements.messageInput.value = '';
    backToMenuBtn.remove();
    renderQuickActions('main');
  });

  const chatContainer = document.querySelector('.chat-container');
  chatContainer.insertBefore(backToMenuBtn, elements.quickActions);

  if (initialMessage) {
    elements.messageInput.value = initialMessage;
  }

  elements.messageInput.focus();

  renderMessage('Perfecto! A partir de ahora puedes hacerme cualquier pregunta y la respondere con la ayuda de inteligencia artificial.', 'bot');
}

async function handleSend() {
  if (state.registrationMode) {
    const username = elements.messageInput.value.trim();
    if (username) {
      clearInput();
      await sendToSAPRegister(username);
    }
    return;
  }

  if (state.llmModeEnabled) {
    await sendToLLM();
  }
}

async function sendToLLM() {
  const message = elements.messageInput.value.trim();

  if (!message || state.isTyping || state.limitReached) {
    return;
  }

  clearInput();
  renderMessage(message, 'user');
  showTyping();

  try {
    const response = await sendToAPI(message);
    hideTyping();
    renderMessage(response.reply, 'bot');

    if (response.limitReached) {
      state.limitReached = true;
      showLimitModal();
    }
  } catch (error) {
    hideTyping();
    renderMessage(`Error de conexion con el servidor. Asegurate de que el backend este corriendo en puerto 3000. Detalle: ${error.message}`, 'bot', false, true);
  }

  scrollToBottom();
  elements.messageInput.focus();
}

async function sendToAPI(message) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sessionId: state.sessionId,
      message: message
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
}

function formatMessage(text) {
  let formatted = text;

  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  formatted = formatted.replace(/^(\d+)\.\s+(.+)$/gm, '<li>$2</li>');
  formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ol>$1</ol>');

  formatted = formatted.replace(/^[\*\-]\s+(.+)$/gm, '<li>$1</li>');
  const hasBulletList = /<li>.*<\/li>/.test(formatted);
  if (hasBulletList && !formatted.includes('<ol>')) {
    formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  }

  const urlPattern = /https?:\/\/[^\s<"]+/g;
  formatted = formatted.replace(urlPattern, function(url) {
    if (formatted.includes('href="' + url + '"')) {
      return url;
    }
    return '<a href="' + url + '" target="_blank" class="message-link">' + url + '</a>';
  });

  formatted = formatted.replace(/\n\n/g, '</p><p>');
  formatted = formatted.replace(/\n/g, '<br>');

  if (!formatted.startsWith('<')) {
    formatted = '<p>' + formatted + '</p>';
  }

  return formatted;
}

function renderMessage(text, sender, isWelcome = false, isError = false) {
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message', sender);

  if (isWelcome) {
    messageDiv.classList.add('welcome');
  }

  if (isError) {
    messageDiv.classList.add('error');
  }

  const contentDiv = document.createElement('div');
  contentDiv.classList.add('message-content');

  if (isError) {
    contentDiv.innerHTML = `<strong>Error:</strong> ${text}`;
  } else {
    contentDiv.innerHTML = formatMessage(text);
  }

  messageDiv.appendChild(contentDiv);
  elements.messagesContainer.appendChild(messageDiv);

  scrollToBottom();
}

function showTyping() {
  state.isTyping = true;
  elements.typingIndicator.classList.remove('hidden');
  elements.messageInput.disabled = true;
  elements.sendButton.disabled = true;
  scrollToBottom();
}

function hideTyping() {
  state.isTyping = false;
  elements.typingIndicator.classList.add('hidden');
  if (!state.limitReached && (state.llmModeEnabled || state.registrationMode)) {
    elements.messageInput.disabled = false;
    elements.sendButton.disabled = false;
  }
}

function showLimitModal() {
  elements.messageInput.disabled = true;
  elements.sendButton.disabled = true;
  elements.limitModal.classList.remove('hidden');
}

function hideLimitModal() {
  elements.limitModal.classList.add('hidden');
}

function handleRestart() {
  state.sessionId = crypto.randomUUID();
  state.limitReached = false;
  state.llmModeEnabled = false;
  state.registrationMode = false;
  state.currentMenu = 'main';
  console.log('New Session ID:', state.sessionId);

  elements.messagesContainer.innerHTML = '';
  hideLimitModal();
  elements.quickActions.innerHTML = '';
  renderMessage(welcomeMessage, 'bot', true);
  renderQuickActions('main');
  elements.messageInput.disabled = true;
  elements.sendButton.disabled = true;
  elements.messageInput.placeholder = 'Escribe tu mensaje...';
}

function handleAdvisor() {
  alert('Pronto podras comunicarte con un asesor de ITSYSTEMS. Gracias por tu paciencia.');
}

function clearInput() {
  elements.messageInput.value = '';
}

function scrollToBottom() {
  elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
}

document.addEventListener('DOMContentLoaded', init);
