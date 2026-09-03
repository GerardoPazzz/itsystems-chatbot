import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { Message } from './memory.service';
import { config } from '../config';

const CATALOGO_FILE = resolve(process.cwd(), 'catalogo_cursos.json');

interface Course {
  id: string;
  nombre: string;
  descripcion?: string;
  segmento?: string;
  modalidad?: string;
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

type QuestionType = 'market' | 'specific' | 'profile' | 'general';

interface CategoryResult {
  type: QuestionType;
  courseIds: string[];
  profileId?: string;
}

const RULES = `Eres el Asesor Academico Virtual de ITSYSTEMS.

Reglas:
1. Solo responde sobre temas del catalogo. Preguntas de mercado laboral puedes responderlas con tu conocimiento general.
2. Si preguntan sobre un tema fuera del catalogo, indica que no manejamos ese tema y ofrece los perfiles disponibles.
3. NO des rutas de estudio a menos que el usuario te lo pida expliicitamente.
4. Cuando el usuario pida una ruta, incluye el orden de cursos y una breve justificacion de por que van en ese orden.
5. Se directo y profesional. Sin frases como "creo que", "quizas", "probablemente".
6. Cuando menciones precios, indica que son aproximados en soles peruanos y estan sujetos a confirmacion. Si el precio es null o "S.P.", indica "consultar precio".`;

export class LLMService {
  private model: string;
  private maxTokens: number;
  private temperature: number;
  private maxHistory: number;
  private catalog: Catalogo | null;
  private catalogLoaded: boolean;

  constructor() {
    this.model = config.gemini.model;
    this.maxTokens = config.gemini.maxTokens;
    this.temperature = config.gemini.temperature;
    this.maxHistory = config.gemini.maxHistory;
    this.catalog = null;
    this.catalogLoaded = false;
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
    const lowerMessage = message.toLowerCase();

    const profileKeywords = ['perfil', 'perfiles', 'ruta', 'rutas', 'ruta de estudio', 'rutas de estudio', 'camino', 'caminos', 'aprender desde cero'];
    const hasProfileKeywords = profileKeywords.some(keyword => lowerMessage.includes(keyword));

    if (hasProfileKeywords) {
      return { type: 'profile', courseIds: [] };
    }

    const marketKeywords = ['mercado', 'demanda', 'trabajo', 'requerido', 'oportunidad', 'carrera', 'salary', 'sueldo', 'empleo', 'profesional'];
    const hasMarketKeywords = marketKeywords.some(keyword => lowerMessage.includes(keyword));

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
      // S4 HANA
      's4hana-mm-fi-pp-virtual': ['mm fi pp', 'mm/fi/pp', 'materiales finanzas', 'compras finanzas', 'mm fi pp virtual', 's4hana mm'],
      's4hana-pm-virtual': ['pm', 'mantenimiento', 'pm virtual', 's4hana pm'],
      's4hana-co-ewm-virtual': ['co ewm', 'controlling warehouse', 'ewm co', 'co ewm virtual'],
      's4hana-qm-ps-ii-virtual': ['qm ps', 'calidad proyectos', 'qm ps ii', 'qm ps ii virtual'],
      's4hana-sd-virtual': ['sd', 'ventas', 'distribucion', 'sd virtual', 's4hana sd'],
      's4hana-tm-virtual': ['tm', 'transporte', 'logistica', 'tm virtual', 's4hana tm'],
      's4hana-ewm-ps-co-qm-online': ['ewm ps co qm online', 'calidad proyectos online', 'ewm online', 'ps co qm'],
      's4hana-mm-fi-pp-online': ['mm fi pp online', 's4hana mm fi pp online', 'materiales finanzas online'],
      's4hana-pm-online': ['pm online', 'mantenimiento online', 's4hana pm online'],
      's4hana-sd-online': ['sd online', 'ventas online', 's4hana sd online'],
      's4hana-tm-online': ['tm online', 'transporte online', 's4hana tm online'],
      's4hana-mm-configuracion-online': ['mm configuracion', 'configuracion mm', 'mm config online'],
      // ECC
      'ecc-hcm-virtual': ['hcm', 'recursos humanos', 'rrhh', 'human capital'],
      'ecc-mm-pp-qm-wm-pm-sd-co-fi-virtual': ['ecc', 'sap ecc', 'modulos ecc', 'todos los modulos'],
      // HANA TECNICO - Desarrollo
      'hana-abap-online': ['abap online', 'abap en vivo', 'curso abap online'],
      'hana-abap-virtual': ['abap virtual', 'abap asincrono', 'curso abap', 'abap 7.5', 'abap 7.4'],
      'hana-abap-rap-online': ['abap rap online', 'rap online', 'restful abap online'],
      'hana-abap-rap-virtual': ['abap rap virtual', 'rap', 'restful abap', 'abap rap'],
      'hana-fiori-online': ['fiori online', 'ui5 online', 'sapui5', 'fiori', 'desarrollo fiori'],
      'hana-dev-fiori-s4-virtual': ['fiori s4', 'fiori s/4hana', 'dev fiori', 'fiori s4 virtual', 'desarrollo fiori s4'],
      'hana-developer-btp-online': ['developer btp', 'desarrollador btp', 'btp developer', 'desarrollo btp online'],
      'hana-btp-virtual': ['btp', 'business technology', 'sap btp', 'cloud foundry'],
      // HANA TECNICO - Administracion
      'hana-sql-online': ['sql online', 'hana sql online', 'sql en vivo', 'consultas sql'],
      'hana-hana-sql-virtual': ['hana sql virtual', 'hana sql', 'sql hana', 'hana database'],
      'hana-basis-online': ['basis online', 'administracion sap online', 'admin basis'],
      'hana-basis-virtual': ['basis virtual', 'administracion basis', 'admin basis virtual'],
      'hana-basis-online-2': ['basis avanzado', 'basis online 2'],
      'hana-hana-bd-online': ['hana bd', 'administracion hana', 'hana database'],
      'hana-hana-bd-adm-virtual': ['hana bd adm', 'hana admin', 'administracion hana database'],
      // PRODUCTIVIDAD
      'productividad-ia-empresarial-online': ['ia empresarial', 'ia online', 'inteligencia artificial online', 'chatgpt', 'ia generativa', 'ai', 'machine learning'],
      'productividad-contab-no-contadores-virtual': ['contabilidad no contadores', 'conta para no contadores', 'contabilidad basica', 'contadores'],
      'productividad-excel-soluciones-virtual': ['excel avanzado', 'excel empresarial', 'excel soluciones', 'tablas dinamicas', 'macros excel'],
      'productividad-taller-automatizacion-virtual': ['automatizacion datos', 'power query', 'macros', 'vba', 'automatizacion excel']
    };

    const detectedSegmentIds: string[] = [];
    for (const [segment, keywords] of Object.entries(segmentKeywords)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        detectedSegmentIds.push(segment);
      }
    }

    const detectedCourseIds: string[] = [];
    for (const [courseId, keywords] of Object.entries(courseNameKeywords)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        detectedCourseIds.push(courseId);
      }
    }

    const allDetected = [...new Set([...detectedSegmentIds, ...detectedCourseIds])];

    if (allDetected.length > 0) {
      return { type: 'specific', courseIds: allDetected };
    }

    return { type: 'general', courseIds: [] };
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

  private buildSystemPrompt(courses: Course[], profiles: Profile[]): string {
    let context = RULES;

    if (courses.length > 0) {
      context += `\n\nCursos disponibles:\n${JSON.stringify(courses, null, 2)}`;
    }

    if (profiles.length > 0) {
      context += `\n\nPerfiles disponibles:\n${JSON.stringify(profiles, null, 2)}`;
    }

    return context;
  }

  async getChatReply(messages: Message[]): Promise<string> {
    if (!this.catalogLoaded) {
      await this.loadCatalog();
    }

    const userAssistantMessages = messages.filter(m => m.role !== 'system');
    const recentMessages = userAssistantMessages.slice(-this.maxHistory);
    const currentMessage = recentMessages[recentMessages.length - 1]?.content || '';

    const category = this.detectCategory(currentMessage);

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
      case 'general':
      default:
        courses = this.getRelevantCourses(category.courseIds);
        break;
    }

    const systemPrompt = this.buildSystemPrompt(courses, profiles);

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