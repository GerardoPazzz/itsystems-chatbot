import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { Message } from './memory.service';
import { config } from '../config';

const CATALOGO_FILE = resolve(process.cwd(), 'catalogo_cursos.json');

interface Course {
  id: string;
  nombre: string;
  descripcion?: string;
  duracion?: string;
  nivel?: string;
  perfil?: string;
  categoria?: string;
  prerrequisitos?: string[];
  modulos?: string[];
  certificacion?: string;
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
5. Se directo y profesional. Sin frases como "creo que", "quizas", "probablemente".`;

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

    const courseKeywords: Record<string, string[]> = {
      'sap-fi': ['fi', 'finanzas', 'contable', 'contabilidad', 'facturacion', 'bancaria', 'financial'],
      'sap-mm': ['mm', 'material', 'compra', 'proveedor', 'inventario', 'stock', 'logistica', 'supply', 'mrp'],
      'sap-sd': ['sd', 'ventas', 'distribucion', 'cliente', 'pedido', 'entrega', 'precio', 'sales'],
      'sap-abap': ['abap', 'programacion', 'codigo', 'reporte', 'desarrollo', 'development'],
      'sap-cap': ['cap', 'cloud', 'btp', 'node', 'java', 'nube', 'cloud-native'],
    };

    const detectedCourseIds: string[] = [];
    for (const [courseId, keywords] of Object.entries(courseKeywords)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        detectedCourseIds.push(courseId);
      }
    }

    if (detectedCourseIds.length > 0) {
      return { type: 'specific', courseIds: detectedCourseIds };
    }

    return { type: 'general', courseIds: [] };
  }

  private getRelevantCourses(courseIds: string[]): Course[] {
    if (!this.catalog) return [];

    if (courseIds.length === 0) {
      return this.catalog.cursos;
    }

    return this.catalog.cursos.filter(course => courseIds.includes(course.id));
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