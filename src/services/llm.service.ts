import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { Message } from './memory.service';
import { config } from '../config';

const CATALOGO_FILE = resolve(process.cwd(), 'frontend', 'catalogo_cursos.json');

interface Course {
  id: string;
  nombre: string;
  descripcion?: string;
  segmento?: string;
  modalidad?: string;
  duracion?: string;
  precio?: {
    contado?: number | null | string;
    cuotas?: number | null | string;
  };
  recursos?: {
    acceso_aula_virtual?: string;
    acceso_sap?: string;
  };
  notificacion_academico?: string | null;
  prerrequisitos_recomendados?: string[];
  dirigido?: string;
  habilidades_adquiridas?: string[];
  temario?: { sesion?: number; titulo?: string }[];
}

interface Profile {
  id: string;
  nombre: string;
  descripcion?: string;
  cursos_sugeridos?: string[];
  cursos_obligatorios?: string[];
  ruta_sugerida?: string[];
  justificacion_ruta?: string;
}

interface Catalogo {
  cursos: Course[];
  perfiles: Profile[];
  informacion_general?: object;
}

interface GeminiContent {
  role: string;
  parts: { text: string }[];
}

interface GeminiGenerateRequest {
  contents: GeminiContent[];
  systemInstruction?: {
    parts: { text: string }[];
  };
  generationConfig?: {
    maxOutputTokens?: number;
    temperature?: number;
  };
}

interface GeminiCandidate {
  content?: {
    parts?: { text?: string }[];
  };
}

interface GeminiGenerateResponse {
  candidates?: GeminiCandidate[];
  error?: {
    message?: string;
    code?: number;
  };
}

type QuestionType = 'market' | 'specific' | 'profile' | 'general' | 'registro';

interface CategoryResult {
  type: QuestionType;
  courseIds: string[];
  profileId?: string;
  demoModule?: string;
  detailModule?: string;
}

export interface IntentResult {
  intent: QuestionType;
  demoModule?: string;
  roleId?: string;
  moduleCode?: string;
  showDemoAction: boolean;
}

interface DemoContextState {
  active: boolean;
  module?: string;
  shownModule?: string;
  updatedAt: number;
}

interface IntentAnalysis {
  category: CategoryResult;
  demoModule?: string;
  showDemoAction: boolean;
}

export const DEMO_MODULES: Record<string, { roleId: string; code: string }> = {
  'MM': { roleId: 'S4_MM_DEMO', code: 'MM' },
  'SD': { roleId: 'S4_SD_DEMO', code: 'SD' },
  'FI': { roleId: 'S4_FI_DEMO', code: 'FI' },
  'PP': { roleId: 'S4_PP_DEMO', code: 'PP' },
  'PM': { roleId: 'S4_PM_DEMO', code: 'PM' }
};

const DEMO_MODULE_KEYWORDS: Record<string, string[]> = {
  'MM': ['mm', 'materiales', 'gestion de materiales', 'almacen', 'compras', 'procurement', 'inventory'],
  'SD': ['sd', 'ventas', 'distribucion', 'ventas y distribucion'],
  'FI': ['fi', 'finanzas', 'contabilidad', 'contabilidad financiera'],
  'PP': ['pp', 'produccion', 'planificacion de produccion', 'manufactura'],
  'PM': ['pm', 'mantenimiento', 'mantenimiento de plantas']
};

const REGISTRO_KEYWORDS = [
  'registro', 'registrarme', 'registrarse', 'registrar', 'demo', 'probar', 'prueba',
  'inscripcion', 'inscribirme', 'inscribirse', 'alta', 'darse de alta', 'sign up',
  'signup', 'obtener acceso', 'crear cuenta', 'cuenta demo'
];

// Consultas que invalidan el contexto de demo heredado: si el usuario pregunta
// por precio/duracion/temario de un curso, o pide informacion sobre formacion,
// no debe ofrecerse el boton de demo.
const QUERY_KEYWORDS = [
  'precio', 'precios', 'costo', 'costos', 'cuanto', 'valor', 'cuotas', 'cuanto cuesta',
  'duracion', 'horas', 'cuanto dura', 'cuantas horas',
  'temario', 'contenido', 'que incluye',
  'requisitos', 'prerrequisitos',
  'horario', 'modalidad', 'certificado', 'instructor',
  'informacion', 'diferencia', 'diferencias', 'comparacion', 'opinion', 'opiniones',
  // Formacion: las demos y los cursos son productos distintos.
  'curso', 'cursos', 'capacitacion', 'formacion', 'entrenamiento', 'certificacion',
  // Verbos de consulta: el usuario pide informacion, no el acceso a la demo.
  'cuentame', 'informame', 'explica', 'explícame', 'explicame', 'enseñame', 'ensename',
  'detalles', 'dime', 'sabes', 'que es', 'cual es', 'ejemplo', 'hablame'
];

// Verbos de solicitud: indican que el usuario pide el acceso, no que pregunta.
const REQUEST_VERB_KEYWORDS = [
  'quiero', 'quisiera', 'me gustaria', 'dame', 'danos', 'otorgame', 'activame',
  'habilitame', 'reserva', 'reservame', 'consigue', 'consigueme', 'abrime'
];

// Palabras que piden un atributo concreto del curso: activan el contexto detallado.
const ATTRIBUTE_KEYWORDS = [
  'precio', 'precios', 'costo', 'costos', 'cuanto cuesta', 'cuanto vale', 'valor', 'cuotas',
  'temario', 'contenido', 'que incluye', 'incluye', 'sesiones', 'que abarca',
  'duracion', 'horas', 'cuanto dura', 'cuantas horas',
  'requisitos', 'prerrequisitos', 'certificado', 'certificacion',
  'horario', 'modalidad', 'dirigido', 'a quien va dirigido', 'habilidades'
];

const CONTEXT_WINDOW = 3;
const DEMO_CONTEXT_TTL_MS = 30 * 60 * 1000;

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function containsKeyword(normalizedText: string, keyword: string): boolean {
  const normalizedKeyword = normalizeText(keyword).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // La 's' final opcional permite plurales: "demos" -> "demo", "pruebas" -> "prueba".
  return new RegExp(`(^|[^a-z0-9])${normalizedKeyword}s?([^a-z0-9]|$)`, 'i').test(normalizedText);
}

function detectDemoModule(normalizedMessage: string): string | undefined {
  let bestModule: string | undefined;
  let bestPosition = Number.MAX_SAFE_INTEGER;

  for (const [moduleKey, keywords] of Object.entries(DEMO_MODULE_KEYWORDS)) {
    for (const keyword of keywords) {
      const normalizedKeyword = normalizeText(keyword);
      const position = normalizedMessage.indexOf(normalizedKeyword);
      if (position !== -1 && position < bestPosition) {
        bestPosition = position;
        bestModule = moduleKey;
      }
    }
  }

  return bestModule;
}

const RULES = `Eres el Asesor Academico Virtual de ITSYSTEMS.

Reglas:
 1. Solo responde sobre temas del catalogo. Preguntas de mercado laboral puedes responderlas con tu conocimiento general.
 2. ITSYSTEMS ofrece CURSOS de formacion en SAP (consultar catalogo) y ACCOUNT DEMO de SAP (acceso de prueba sin costo y temporal).
    - ACCOUNT DEMO: Acceso de prueba al sistema SAP, SIN COSTO, TEMPORAL (7 dias de duracion). Disponible en 5 modulos: S4 MM (Gestion de Materiales), S4 SD (Ventas y Distribucion), S4 PM (Mantenimiento), S4 FI (Finanzas), S4 PP (Produccion). Una vez registrado podras ver videos demos ya preparados.
    - CURSOS: Formacion completa disponible en el catalogo. Cada curso tiene su propio temario, duracion y precio.
    - NO confudas los ACCOUNT DEMO con los CURSOS del catalogo. Son cosas distintas.
    - Si preguntan por "demo", "prueba", "prueba gratuita", "demo gratuita", "acceso de prueba", "SAP de prueba", "ver SAP", "probar SAP", etc., informa sobre los ACCOUNT DEMO disponibles y no los confundas con los cursos de formacion.
3. NO des rutas de estudio a menos que el usuario te lo pida expliicitamente.
 4. Cuando el usuario pida una ruta, incluye el orden de cursos y una breve justificacion de por que van en ese orden.
5. Se directo y profesional. Sin frases como "creo que", "quizas", "probablemente".
6. Cuando menciones precios, indica que son aproximados en soles peruanos y estan sujetos a confirmacion. Si el precio es null o "S.P.", indica "consultar precio".
 7. FORMATO DE RESPUESTA (OBLIGATORIO):
   - NO uses markdown (#, **, *, -, >, etc.) - el chat no lo renderiza.
   - USA TEXTO PLANO con estos separadores:
     - Guiones (-) para listas de items
     - Dos puntos (:) para separar titulo de contenido
     - Lineas en blanco para separar secciones (maximo 2)
   - Manten cada respuesta en MAXIMO 2-3 PARRAFOS.
   - Ofrece "¿Quieres que profundice en algun tema?" SOLO si queda informacion relevante sin mostrar. No lo repitas en todas las respuestas.
   - NUNCA dejes una oracion a medias.
 8. RESPUESTAS CONCISAS (esta regla tiene prioridad sobre la regla 9):
   - Cuando pregunten por "cursos", "capacitaciones" o "perfiles", da un RESUMEN de 2-3 lineas.
   - Indica de forma breve cual es el siguiente paso (por ejemplo, "¿Cual te interesa?"). Varia la redaccion, no repitas siempre la misma frase de cierre.
   - NO des todos los detalles de golpe.
 9. ESTRUCTURA DE LISTAS (OBLIGATORIO para listas de cursos o perfiles):
   Cuando listen cursos o perfiles, usen este formato exacto:

   [TITULO EN MAYUSCULAS]
   - Item 1: descripcion breve
   - Item 2: descripcion breve
   - Item 3: descripcion breve

   - Si la lista tiene mas de 6 elementos, muestra SOLO los 6 mas relevantes y di que hay mas disponibles bajo demanda.
   No usar simbolos de markdown. Usar solo texto plano con guiones y dos puntos.
10. OBJETIVIDAD (OBLIGATORIO):
   - Basa tu respuesta SOLO en los datos del catalogo que te entrego. No inventes precios, duraciones, temarios, requisitos ni caracteristicas.
   - Si el dato no aparece en el catalogo, di "consultar" o "no tengo ese dato" en lugar de suponerlo.
   - Responde solo lo que te preguntan. No repitas informacion que ya te dio el usuario.`;

export class LLMService {
  private model: string;
  private maxTokens: number;
  private temperature: number;
  private maxHistory: number;
  private catalog: Catalogo | null;
  private catalogLoaded: boolean;
  private demoContexts: Map<string, DemoContextState>;

  constructor() {
    this.model = config.gemini.model;
    this.maxTokens = config.gemini.maxTokens;
    this.temperature = config.gemini.temperature;
    this.maxHistory = config.gemini.maxHistory;
    this.catalog = null;
    this.catalogLoaded = false;
    this.demoContexts = new Map();
    this.loadCatalog();
  }

  private async loadCatalog(): Promise<void> {
    try {
      const data = await readFile(CATALOGO_FILE, 'utf-8');
      this.catalog = JSON.parse(data);
      this.catalogLoaded = true;
    } catch (error: any) {
      console.error('Error al cargar catalogo:', error.message);
      this.catalog = null;
      this.catalogLoaded = true;
    }
  }

  private detectCategory(message: string): CategoryResult {
    const lowerMessage = normalizeText(message);

    const hasRegistroKeywords = REGISTRO_KEYWORDS.some(keyword => containsKeyword(lowerMessage, keyword));

    if (hasRegistroKeywords) {
      const demoModule = detectDemoModule(lowerMessage);
      return { type: 'registro', courseIds: [], demoModule };
    }

    const profileKeywords = ['perfil', 'perfiles', 'ruta', 'rutas', 'ruta de estudio', 'rutas de estudio', 'camino', 'caminos', 'aprender desde cero'];
    const hasProfileKeywords = profileKeywords.some(keyword => containsKeyword(lowerMessage, keyword));

    if (hasProfileKeywords) {
      return { type: 'profile', courseIds: [] };
    }

    const marketKeywords = ['mercado', 'demanda', 'trabajo', 'requerido', 'oportunidad', 'carrera', 'salary', 'sueldo', 'empleo', 'profesional'];
    const hasMarketKeywords = marketKeywords.some(keyword => containsKeyword(lowerMessage, keyword));

    if (hasMarketKeywords) {
      return { type: 'market', courseIds: [] };
    }

    const segmentKeywords: Record<string, string[]> = {
      'SBO': ['sbo', 'business one', 'b1', 'sap b1', 'sdk', 'businessone'],
      'S4 HANA': ['s4hana', 's4 hana', 's/4hana', 's/4 hana', 'hana'],
      'ECC': ['ecc', 'hcm'],
      'HANA TECNICO': ['abap', 'basis', 'fiori', 'btp', 'hana', 'sql', 'rap', 'developer', 'adm', 'cloud', 'hana bd', 'hana sql', 'dev fiori', 'developer'],
      'PRODUCTIVIDAD': ['productividad', 'excel', 'ia', 'inteligencia artificial', 'automatizacion', 'contabilidad', 'no contadores', 'contab', 'power query', 'macros']
    };

    const courseNameKeywords: Record<string, string[]> = {
      // SBO
      'sbo-b1-desarrollo-sdk-virtual': ['b1 desarrollo', 'sdk', 'desarrollo sdk', 'b1 sdk', 'desarrollo b1'],
      'sbo-b1-implementacion-virtual': ['b1 implementacion', 'implementacion b1', 'b1 impl', 'implementar b1'],
      'sbo-b1-contable-virtual': ['b1 contable', 'contable b1', 'contabilidad b1', 'b1 contabilidad'],
      'sbo-b1-administrativo-virtual': ['b1 administrativo', 'administrativo b1', 'b1 admin', 'admin b1'],
      'sbo-b1-administrativo-online': ['b1 administrativo online', 'b1 admin online', 'administrativo online b1'],
      // S4 HANA - Individual modules
      's4hana-mm-virtual': ['s4hana mm', 'mm s4hana', 'materiales s4', 'compras s4hana', 'gestion materiales s4'],
      's4hana-fi-virtual': ['s4hana fi', 'fi s4hana', 'finanzas s4', 'contabilidad s4hana', 'libro mayor s4'],
      's4hana-pp-virtual': ['s4hana pp', 'pp s4hana', 'produccion s4', 'manufactura s4hana', 'planificacion produccion'],
      's4hana-pm-virtual': ['s4hana pm', 'pm s4hana', 'mantenimiento s4', 'planta s4hana'],
      's4hana-sd-virtual': ['s4hana sd', 'sd s4hana', 'ventas s4', 'distribucion s4hana'],
      's4hana-tm-virtual': ['s4hana tm', 'tm s4hana', 'transporte s4', 'logistica s4hana'],
      's4hana-ewm-virtual': ['s4hana ewm', 'ewm s4hana', 'warehouse s4hana', 'almacen extendido'],
      's4hana-ps-virtual': ['s4hana ps', 'ps s4hana', 'proyectos s4hana', 'gestion proyectos'],
      's4hana-qm-virtual': ['s4hana qm', 'qm s4hana', 'calidad s4hana', 'gestion calidad'],
      's4hana-co-virtual': ['s4hana co', 'co s4hana', 'controlling s4hana'],
      's4hana-mm-online': ['s4hana mm online', 'mm online', 'materiales online'],
      's4hana-fi-online': ['s4hana fi online', 'fi online', 'finanzas online'],
      's4hana-pp-online': ['s4hana pp online', 'pp online', 'produccion online'],
      's4hana-pm-online': ['s4hana pm online', 'pm online', 'mantenimiento online'],
      's4hana-sd-online': ['s4hana sd online', 'sd online', 'ventas online'],
      's4hana-tm-online': ['s4hana tm online', 'tm online', 'transporte online'],
      's4hana-ewm-online': ['s4hana ewm online', 'ewm online', 'warehouse online'],
      's4hana-ps-online': ['s4hana ps online', 'ps online', 'proyectos online'],
      's4hana-qm-online': ['s4hana qm online', 'qm online', 'calidad online'],
      's4hana-co-online': ['s4hana co online', 'co online', 'controlling online'],
      's4hana-mm-configuracion-online': ['mm configuracion', 'configuracion mm', 'mm config online'],
      // ECC
      'ecc-hcm-virtual': ['ecc hcm', 'hcm ecc', 'recursos humanos ecc', 'rrhh ecc', 'human capital'],
      'ecc-mm-virtual': ['ecc mm', 'mm ecc', 'materiales ecc'],
      'ecc-fi-virtual': ['ecc fi', 'fi ecc', 'finanzas ecc'],
      'ecc-pp-virtual': ['ecc pp', 'pp ecc', 'produccion ecc'],
      'ecc-qm-virtual': ['ecc qm', 'qm ecc', 'calidad ecc'],
      'ecc-wm-virtual': ['ecc wm', 'wm ecc', 'almacen ecc'],
      'ecc-pm-virtual': ['ecc pm', 'pm ecc', 'mantenimiento ecc'],
      'ecc-sd-virtual': ['ecc sd', 'sd ecc', 'ventas ecc'],
      'ecc-co-virtual': ['ecc co', 'co ecc', 'controlling ecc'],
      // HANA TECNICO - Desarrollo
      'hana-abap-online': ['abap online', 'abap en vivo', 'curso abap online'],
      'hana-abap-virtual': ['abap virtual', 'abap asincrono', 'curso abap', 'abap 7.5', 'abap 7.4'],
      'hana-abap-rap-online': ['abap rap online', 'rap online', 'restful abap online'],
      'hana-abap-rap-virtual': ['abap rap virtual', 'rap', 'restful abap', 'abap rap'],
      'hana-fiori-online': ['fiori online', 'ui5 online', 'sapui5', 'fiori', 'desarrollo fiori'],
      'hana-fiori-virtual': ['fiori s4', 'fiori s/4hana', 'dev fiori', 'fiori s4 virtual', 'desarrollo fiori s4'],
      'hana-btp-online': ['developer btp', 'desarrollador btp', 'btp developer', 'desarrollo btp online'],
      'hana-btp-virtual': ['btp', 'business technology', 'sap btp', 'cloud foundry'],
      // HANA TECNICO - Administracion
      'hana-sql-online': ['sql online', 'hana sql online', 'sql en vivo', 'consultas sql'],
      'hana-sql-virtual': ['hana sql virtual', 'hana sql', 'sql hana', 'hana database'],
      'hana-basis-online': ['basis online', 'administracion sap online', 'admin basis'],
      'hana-basis-virtual': ['basis virtual', 'administracion basis', 'admin basis virtual'],
      'hana-basis-online-2': ['basis avanzado', 'basis online 2'],
      'hana-hana-bd-online': ['hana bd', 'administracion hana', 'hana database'],
      'hana-hana-bd-virtual': ['hana bd adm', 'hana admin', 'administracion hana database'],
      // PRODUCTIVIDAD
      'productividad-ia-empresarial-online': ['ia empresarial', 'ia online', 'inteligencia artificial online', 'chatgpt', 'ia generativa', 'ai', 'machine learning'],
      'productividad-contab-no-contadores-virtual': ['contabilidad no contadores', 'conta para no contadores', 'contabilidad basica', 'contadores'],
      'productividad-excel-soluciones-virtual': ['excel avanzado', 'excel empresarial', 'excel soluciones', 'tablas dinamicas', 'macros excel'],
      'productividad-taller-automatizacion-virtual': ['automatizacion datos', 'power query', 'macros', 'vba', 'automatizacion excel']
    };

    const detectedSegmentIds: string[] = [];
    for (const [segment, keywords] of Object.entries(segmentKeywords)) {
      if (keywords.some(keyword => containsKeyword(lowerMessage, keyword))) {
        detectedSegmentIds.push(segment);
      }
    }

    const detectedCourseIds: string[] = [];
    for (const [courseId, keywords] of Object.entries(courseNameKeywords)) {
      if (keywords.some(keyword => containsKeyword(lowerMessage, keyword))) {
        detectedCourseIds.push(courseId);
      }
    }

    const allDetected = [...new Set([...detectedSegmentIds, ...detectedCourseIds])];

    // Si pide un atributo concreto (precio, temario, duracion...) sobre un modulo
    // especifico, se activa el contexto detallado de ese modulo.
    const hasAttributeKeywords = ATTRIBUTE_KEYWORDS.some(keyword => containsKeyword(lowerMessage, keyword));
    const detailModule = hasAttributeKeywords ? detectDemoModule(lowerMessage) : undefined;

    if (allDetected.length > 0) {
      return { type: 'specific', courseIds: allDetected, detailModule };
    }

    return { type: 'general', courseIds: [], detailModule };
  }

  /**
   * Busca en el catalogo los cursos asociados a un modulo (MM, SD, FI, PP, PM)
   * para poder responder con el detalle cuando se pide un atributo concreto.
   */
  private findCoursesByModule(module: string): Course[] {
    if (!this.catalog) return [];

    const matches = this.catalog.cursos.filter(course => {
      const normalizedName = normalizeText(course.nombre);
      return detectDemoModule(normalizedName) === module;
    });

    return matches.slice(0, 6);
  }

  private getRelevantCourses(courseIds: string[]): Course[] {
    if (!this.catalog) return [];

    if (courseIds.length === 0) {
      return this.catalog.cursos;
    }

    const segments = ['SBO', 'S4 HANA', 'ECC', 'HANA TECNICO', 'PRODUCTIVIDAD'];
    const detectedSegments = courseIds.filter(id => segments.includes(id));
    const detectedCourseIds = courseIds.filter(id => !segments.includes(id));

    return this.catalog.cursos.filter(course => {
      if (course.segmento && detectedSegments.includes(course.segmento)) {
        return true;
      }
      if (detectedCourseIds.includes(course.id)) {
        return true;
      }
      return false;
    });
  }

  private getRelevantProfiles(): Profile[] {
    if (!this.catalog) return [];
    return this.catalog.perfiles || [];
  }

  private getRegistroInfo(): { modulosDemo: string[]; duracionDias: number } {
    return {
      modulosDemo: [
        'S4 MM - Gestion de Materiales',
        'S4 SD - Ventas y Distribucion',
        'S4 PM - Mantenimiento',
        'S4 FI - Finanzas',
        'S4 PP - Produccion'
      ],
      duracionDias: 7
    };
  }

  private buildSystemPrompt(courses: Course[], profiles: Profile[], categoryType?: QuestionType, demoModule?: string, detailMode: boolean = false): string {
    let context = RULES;

    if (categoryType === 'registro') {
      const registroInfo = this.getRegistroInfo();

      if (demoModule) {
        const modulo = DEMO_MODULES[demoModule];
        const nombreModulo = modulo ? `SAP ${modulo.code}` : 'SAP';
        context += `\n\nCONTEXTO ESPECIAL - REGISTRO DEMO CON MODULO:\n`;
        context += `El usuario pidio una DEMO del modulo ${nombreModulo}.\n`;
        context += `Responde en MAXIMO 2 lineas, incluyendo:\n`;
        context += `- Que la demo de ${nombreModulo} es sin costo y temporal (${registroInfo.duracionDias} dias)\n`;
        context += `- Que solo se puede solicitar una demo por registro\n`;
        context += `NO listes los otros modulos. NO uses markdown. NO uses listas.\n`;
        context += `NO termines con "¿Quieres que profundice en algun tema?". El usuario ya tiene un boton para registrarse, asi que no hace falta ofrecer mas informacion.`;
      } else {
        context += `\n\nCONTEXTO ESPECIAL - REGISTRO DEMO:\n`;
        context += `El usuario ha mostrado interes en REGISTRARSE para una cuenta DEMO de SAP.\n`;
        context += `Para registrarte, usa la opcion "Registrar" en el chatbot.\n`;
        context += `\nMODULOS DISPONIBLES PARA DEMO:\n`;
        context += registroInfo.modulosDemo.map(m => `- ${m}`).join('\n');
        context += `\n\nDuracion de la cuenta DEMO: ${registroInfo.duracionDias} dias.\n`;
        context += `El usuario debe completar el formulario de registro para obtener sus credenciales SAP.\n`;
        context += `Cada usuario puede solicitar solo una demo a la vez.\n`;
        context += `Responde de forma clara y directa, invitando al usuario a usar la opcion "Registrar".`;
      }
    } else {
      if (courses.length > 0) {
        context += this.buildCourseContext(courses, detailMode);
      }

      if (profiles.length > 0) {
        context += this.buildProfileContext(profiles);
      }
    }

    return context;
  }

  /**
   * Construye el contexto de cursos segun su cantidad:
   * - pocos cursos -> detalle completo (descripcion, temario, habilidades, precio)
   * - muchos cursos  -> resumen compacto (id, nombre, modalidad, precio, descripcion corta)
   */
  private buildCourseContext(courses: Course[], detailMode: boolean): string {
    const useDetail = detailMode || courses.length <= 3;

    if (useDetail) {
      const detail = courses.map(course => ({
        id: course.id,
        nombre: course.nombre,
        segmento: course.segmento,
        modalidad: course.modalidad,
        duracion: course.duracion,
        descripcion: course.descripcion,
        precio: course.precio,
        dirigido: course.dirigido,
        temario: (course.temario || []).map((t: any) => t.titulo),
        habilidades_adquiridas: course.habilidades_adquiridas
      }));

      return `\n\nCursos disponibles (detalle):\n${JSON.stringify(detail, null, 2)}`;
    }

    const summary = courses.map(course => {
      const precio = course.precio?.contado
        ? `precio contado ${course.precio.contado}, cuotas ${course.precio.cuotas ?? 'consultar'}`
        : 'precio: consultar';
      const descripcion = (course.descripcion || '').slice(0, 160);
      const duracion = course.duracion || 'duracion: consultar';
      return `- ${course.id}: ${course.nombre} | ${course.segmento} | ${course.modalidad} | ${duracion} | ${precio} | ${descripcion}`;
    });

    return `\n\nCursos disponibles (resumen):\n${summary.join('\n')}`;
  }

  private buildProfileContext(profiles: Profile[]): string {
    const compact = profiles.map(profile => ({
      id: profile.id,
      nombre: profile.nombre,
      descripcion: profile.descripcion,
      cursos_sugeridos: profile.cursos_sugeridos,
      cursos_obligatorios: profile.cursos_obligatorios
    }));

    return `\n\nPerfiles disponibles:\n${JSON.stringify(compact, null, 2)}`;
  }

  private getDemoContext(sessionId: string | undefined): DemoContextState | undefined {
    if (!sessionId) return undefined;
    const ctx = this.demoContexts.get(sessionId);
    if (!ctx) return undefined;
    if (Date.now() - ctx.updatedAt > DEMO_CONTEXT_TTL_MS) {
      this.demoContexts.delete(sessionId);
      return undefined;
    }
    return ctx;
  }

  private activateDemoContext(sessionId: string | undefined, module?: string): void {
    if (!sessionId) return;
    const current = this.getDemoContext(sessionId);
    this.demoContexts.set(sessionId, {
      active: true,
      module: module ?? current?.module,
      shownModule: current?.shownModule,
      updatedAt: Date.now()
    });
  }

  private markDemoActionShown(sessionId: string | undefined, module: string): void {
    if (!sessionId) return;
    const current = this.getDemoContext(sessionId);
    this.demoContexts.set(sessionId, {
      active: current?.active ?? true,
      module: current?.module ?? module,
      shownModule: module,
      updatedAt: Date.now()
    });
  }

  clearDemoContext(sessionId: string): void {
    this.demoContexts.delete(sessionId);
  }

  private extractSignals(messages: Message[]): {
    rawCurrent: string;
    normalizedCurrent: string;
    hasRegistroCurrent: boolean;
    hasRegistroWindow: boolean;
    hasRegistroPrevious: boolean;
    hasRequestVerb: boolean;
    moduleCurrent?: string;
    moduleContext?: string;
  } | null {
    const userMessages = messages.filter(m => m.role === 'user');
    const current = userMessages[userMessages.length - 1];

    if (!current) return null;

    const normalizedCurrent = normalizeText(current.content);
    const windowMessages = userMessages.slice(-CONTEXT_WINDOW);
    const previousMessages = userMessages.slice(-CONTEXT_WINDOW - 1, -1);

    let moduleContext: string | undefined;
    for (let i = previousMessages.length - 1; i >= 0; i--) {
      const found = detectDemoModule(normalizeText(previousMessages[i].content));
      if (found) {
        moduleContext = found;
        break;
      }
    }

    const previousUser = userMessages.length >= 2 ? userMessages[userMessages.length - 2] : undefined;

    return {
      rawCurrent: current.content,
      normalizedCurrent,
      hasRegistroCurrent: REGISTRO_KEYWORDS.some(keyword => containsKeyword(normalizedCurrent, keyword)),
      hasRegistroWindow: windowMessages.some(msg =>
        REGISTRO_KEYWORDS.some(keyword => containsKeyword(normalizeText(msg.content), keyword))
      ),
      hasRegistroPrevious: previousUser
        ? REGISTRO_KEYWORDS.some(keyword => containsKeyword(normalizeText(previousUser.content), keyword))
        : false,
      hasRequestVerb: REQUEST_VERB_KEYWORDS.some(keyword => containsKeyword(normalizedCurrent, keyword)),
      moduleCurrent: detectDemoModule(normalizedCurrent),
      moduleContext
    };
  }

  private analyze(messages: Message[], sessionId?: string): IntentAnalysis {
    const signals = this.extractSignals(messages);

    if (!signals) {
      return { category: { type: 'general', courseIds: [] }, showDemoAction: false };
    }

    const {
      rawCurrent, normalizedCurrent, hasRegistroCurrent, hasRegistroWindow,
      hasRegistroPrevious, hasRequestVerb, moduleCurrent, moduleContext
    } = signals;

    const context = this.getDemoContext(sessionId);

    const isQuery = QUERY_KEYWORDS.some(keyword => containsKeyword(normalizedCurrent, keyword));
    const queryBlocksAction = isQuery && !hasRegistroCurrent;

    const registroIntent = hasRegistroCurrent || hasRegistroWindow || !!context?.active;

    if (registroIntent && !queryBlocksAction) {
      const demoModule = moduleCurrent ?? context?.module ?? moduleContext;

      // El boton de demo solo se genera en el mensaje donde el usuario lo solicita.
      // Mencionar un modulo no es suficiente: la conversacion puede haber cambiado
      // de rumbo, y en ese caso no debe volver a ofrecerse el acceso.
      const showDemoAction = !!demoModule && (
        hasRegistroCurrent ||                       // peticion explicita ("quiero una demo de MM")
        (context?.shownModule !== demoModule && (
          (hasRequestVerb && !!moduleCurrent) ||   // peticion eliptica ("quiero en sap mm")
          hasRegistroPrevious                       // continuation inmediata de una peticion ("y la de SD?")
        ))
      );

      return {
        category: { type: 'registro', courseIds: [], demoModule },
        demoModule,
        showDemoAction
      };
    }

    return { category: this.detectCategory(rawCurrent), showDemoAction: false };
  }

  detectIntent(messages: Message[] | string, sessionId?: string): IntentResult {
    const messageList: Message[] = typeof messages === 'string'
      ? [{ role: 'user', content: messages }]
      : messages;

    const signals = this.extractSignals(messageList);

    if (signals?.hasRegistroCurrent) {
      this.activateDemoContext(sessionId, signals.moduleCurrent ?? signals.moduleContext);
    }

    const analysis = this.analyze(messageList, sessionId);

    if (analysis.showDemoAction && analysis.demoModule) {
      this.markDemoActionShown(sessionId, analysis.demoModule);
    }

    const result: IntentResult = {
      intent: analysis.category.type,
      demoModule: analysis.demoModule,
      showDemoAction: analysis.showDemoAction
    };

    if (analysis.demoModule && DEMO_MODULES[analysis.demoModule]) {
      result.roleId = DEMO_MODULES[analysis.demoModule].roleId;
      result.moduleCode = DEMO_MODULES[analysis.demoModule].code;
    }

    return result;
  }

  async getChatReply(messages: Message[], sessionId?: string): Promise<string> {
    if (!this.catalogLoaded) {
      await this.loadCatalog();
    }

    const userAssistantMessages = messages.filter(m => m.role !== 'system');
    const recentMessages = userAssistantMessages.slice(-this.maxHistory);
    const currentMessage = recentMessages[recentMessages.length - 1]?.content || '';

    const analysis = this.analyze(messages, sessionId);
    const category = analysis.category;

    let courses: Course[] = [];
    let profiles: Profile[] = [];

    switch (category.type) {
      case 'specific':
        courses = this.getRelevantCourses(category.courseIds);
        break;
      case 'profile':
        profiles = this.getRelevantProfiles();
        break;
      case 'market':
        courses = [];
        profiles = [];
        break;
      case 'registro':
        courses = [];
        profiles = [];
        break;
      case 'general':
      default:
        courses = this.getRelevantCourses(category.courseIds);
        break;
    }

    let detailMode = false;

    if (category.detailModule && category.type !== 'registro' && category.type !== 'market') {
      const moduleCourses = this.findCoursesByModule(category.detailModule);
      if (moduleCourses.length > 0) {
        courses = moduleCourses;
        detailMode = true;
      }
    }

    const systemPrompt = this.buildSystemPrompt(courses, profiles, category.type, category.demoModule, detailMode);

    const contents: GeminiContent[] = recentMessages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : msg.role,
      parts: [{ text: msg.content }]
    }));

    const payload: GeminiGenerateRequest = {
      contents,
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      generationConfig: {
        maxOutputTokens: this.maxTokens,
        temperature: this.temperature
      }
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${config.gemini.apiKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Gemini API error:', response.status, errorBody);
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json() as GeminiGenerateResponse;

      if (data.error) {
        console.error('Gemini error:', data.error.message);
        throw new Error(`Gemini error: ${data.error.message}`);
      }

      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!reply) {
        throw new Error('Respuesta invalida de Gemini: sin contenido.');
      }

      return reply;
    } catch (error: any) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error('Error de conexion con Gemini:', error.message);
        throw new Error('No se pudo conectar con Gemini. Verifica tu conexion a internet.');
      }
      throw error;
    }
  }
}