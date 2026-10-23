import { LLMService } from '../src/services/llm.service';
import { Message } from '../src/services/memory.service';

jest.mock('../src/config', () => ({
  config: {
    gemini: {
      apiKey: 'test-api-key',
      model: 'gemini-3.5-flash-lite',
      maxTokens: 500,
      temperature: 0.7,
      maxHistory: 6
    }
  }
}));

jest.mock('fs/promises', () => ({
  readFile: jest.fn().mockResolvedValue(JSON.stringify({
    cursos: [
      {
        id: 'sbo-b1-implementacion-virtual',
        nombre: 'B1 IMPLEMENTACION',
        segmento: 'SBO',
        modalidad: 'VIRTUAL',
        duracion: '30 horas',
        dirigido: 'Consultores funcionales'
      },
      {
        id: 's4hana-mm-virtual',
        nombre: 'MM (Gestión de Materiales)',
        segmento: 'S4 HANA',
        modalidad: 'VIRTUAL',
        duracion: '30 horas',
        dirigido: 'Consultores funcionales'
      },
      {
        id: 's4hana-fi-virtual',
        nombre: 'FI (Contabilidad y Finanzas)',
        segmento: 'S4 HANA',
        modalidad: 'VIRTUAL',
        duracion: '30 horas',
        dirigido: 'Consultores financieros'
      },
      {
        id: 's4hana-pp-virtual',
        nombre: 'PP (Planificación de Producción)',
        segmento: 'S4 HANA',
        modalidad: 'VIRTUAL',
        duracion: '30 horas',
        dirigido: 'Consultores de producción'
      },
      {
        id: 'hana-abap-virtual',
        nombre: 'ABAP',
        segmento: 'HANA TECNICO',
        modalidad: 'VIRTUAL',
        duracion: '30 horas',
        dirigido: 'Desarrolladores ABAP'
      },
      {
        id: 'hana-sql-online',
        nombre: 'SQL',
        segmento: 'HANA TECNICO',
        modalidad: 'ONLINE',
        duracion: '24 horas',
        dirigido: 'Desarrolladores'
      },
      {
        id: 'productividad-excel-soluciones-virtual',
        nombre: 'EXCEL SOLUCIONES EMPRESARIALES',
        segmento: 'PRODUCTIVIDAD',
        modalidad: 'VIRTUAL',
        duracion: '30 horas',
        dirigido: 'Profesionales'
      }
    ],
    perfiles: [
      {
        id: 'consultor-s4hana',
        nombre: 'Consultor Funcional SAP S/4HANA',
        descripcion: 'Especializado en S/4HANA'
      }
    ]
  }))
}));

global.fetch = jest.fn();

describe('LLM Service - Filtrado por Categoria', () => {

  let llmService: LLMService;

  beforeEach(() => {
    jest.clearAllMocks();
    llmService = new LLMService();
  });

  describe('detectCategory', () => {

    it('debe detectar pregunta de mercado cuando contiene "mercado"', async () => {
      const messages: Message[] = [
        { role: 'user', content: 'SAP S/4HANA es requerido en el mercado?' }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: 'Sí, SAP S/4HANA es muy demandado...' }]
            }
          }]
        })
      });

      await llmService.getChatReply(messages);

      const callBody = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
      const systemInstruction = callBody.systemInstruction.parts[0].text;

      expect(systemInstruction).toContain('Reglas:');
      expect(callBody.contents[0].parts[0].text).toBe('SAP S/4HANA es requerido en el mercado?');
    });

    it('debe detectar segmento SBO con "SAP Business One"', async () => {
      const messages: Message[] = [
        { role: 'user', content: 'Qué cursos de SAP Business One tienen?' }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: 'Tenemos cursos de B1...' }]
            }
          }]
        })
      });

      await llmService.getChatReply(messages);

      const callBody = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
      const systemInstruction = callBody.systemInstruction.parts[0].text;

      expect(systemInstruction).toContain('SBO');
    });

    it('debe detectar segmento S4 HANA con "S/4HANA"', async () => {
      const messages: Message[] = [
        { role: 'user', content: 'Cuéntame sobre SAP S/4HANA' }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: 'S/4HANA es...' }]
            }
          }]
        })
      });

      await llmService.getChatReply(messages);

      const callBody = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
      const systemInstruction = callBody.systemInstruction.parts[0].text;

      expect(systemInstruction).toContain('S4 HANA');
    });

    it('debe detectar segmento HANA TECNICO con "ABAP"', async () => {
      const messages: Message[] = [
        { role: 'user', content: 'Quiero aprender ABAP' }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: 'ABAP es...' }]
            }
          }]
        })
      });

      await llmService.getChatReply(messages);

      const callBody = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
      const systemInstruction = callBody.systemInstruction.parts[0].text;

      expect(systemInstruction).toContain('HANA TECNICO');
    });

    it('debe detectar segmento PRODUCTIVIDAD con "Excel"', async () => {
      const messages: Message[] = [
        { role: 'user', content: 'Tienen cursos de Excel empresarial?' }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: 'Sí, tenemos...' }]
            }
          }]
        })
      });

      await llmService.getChatReply(messages);

      const callBody = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
      const systemInstruction = callBody.systemInstruction.parts[0].text;

      expect(systemInstruction).toContain('PRODUCTIVIDAD');
    });

    it('debe detectar segmento HANA TECNICO con "basis" para administracion', async () => {
      const messages: Message[] = [
        { role: 'user', content: 'Quiero aprender administracion basis' }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: 'BASIS es...' }]
            }
          }]
        })
      });

      await llmService.getChatReply(messages);

      const callBody = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
      const systemInstruction = callBody.systemInstruction.parts[0].text;

      expect(systemInstruction).toContain('HANA TECNICO');
    });

    it('debe detectar pregunta sobre perfiles/rutas', async () => {
      const messages: Message[] = [
        { role: 'user', content: 'Qué cursos tiene el perfil Consultor S/4HANA?' }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: 'El perfil incluye...' }]
            }
          }]
        })
      });

      await llmService.getChatReply(messages);

      const callBody = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
      const systemInstruction = callBody.systemInstruction.parts[0].text;

      expect(systemInstruction).toContain('Perfiles disponibles');
    });

    it('debe detectar palabra "ruta" y devolver perfil', async () => {
      const messages: Message[] = [
        { role: 'user', content: 'Cuál es la ruta para ser desarrollador ABAP?' }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: 'Para ser desarrollador...' }]
            }
          }]
        })
      });

      await llmService.getChatReply(messages);

      const callBody = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
      const systemInstruction = callBody.systemInstruction.parts[0].text;

      expect(systemInstruction).toContain('Perfiles disponibles');
    });

    it('debe detectar pregunta de mercado con "demanda"', async () => {
      const messages: Message[] = [
        { role: 'user', content: 'Hay demanda de consultores SAP?' }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: 'Sí, hay mucha demanda...' }]
            }
          }]
        })
      });

      await llmService.getChatReply(messages);

      const callBody = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
      const systemInstruction = callBody.systemInstruction.parts[0].text;

      expect(systemInstruction).toContain('Reglas:');
      expect(callBody.contents[0].parts[0].text).toBe('Hay demanda de consultores SAP?');
    });

    it('debe detectar pregunta de mercado con "sueldo"', async () => {
      const messages: Message[] = [
        { role: 'user', content: 'Cuál es el sueldo de un consultor SAP?' }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: 'Los sueldos varían...' }]
            }
          }]
        })
      });

      await llmService.getChatReply(messages);

      const callBody = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);

      expect(callBody.contents[0].parts[0].text).toBe('Cuál es el sueldo de un consultor SAP?');
    });

    it('debe detectar segmento HANA TECNICO con "sql" para base de datos', async () => {
      const messages: Message[] = [
        { role: 'user', content: 'Necesito aprender base de datos SQL' }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: 'SQL es...' }]
            }
          }]
        })
      });

      await llmService.getChatReply(messages);

      const callBody = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
      const systemInstruction = callBody.systemInstruction.parts[0].text;

      expect(systemInstruction).toContain('HANA TECNICO');
    });

    it('debe detectar segmento PRODUCTIVIDAD con "excel"', async () => {
      const messages: Message[] = [
        { role: 'user', content: 'Quiero aprender excel avanzado' }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: 'Tenemos un curso...' }]
            }
          }]
        })
      });

      await llmService.getChatReply(messages);

      const callBody = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
      const systemInstruction = callBody.systemInstruction.parts[0].text;

      expect(systemInstruction).toContain('PRODUCTIVIDAD');
    });

    it('debe detectar BTP con "cloud foundry"', async () => {
      const messages: Message[] = [
        { role: 'user', content: 'Qué es Cloud Foundry en SAP BTP?' }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: 'Cloud Foundry es...' }]
            }
          }]
        })
      });

      await llmService.getChatReply(messages);

      const callBody = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
      const systemInstruction = callBody.systemInstruction.parts[0].text;

      expect(systemInstruction).toContain('HANA TECNICO');
    });

    it('debe detectar SQL con "hana database"', async () => {
      const messages: Message[] = [
        { role: 'user', content: 'Necesito aprender HANA Database' }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: 'Para HANA Database...' }]
            }
          }]
        })
      });

      await llmService.getChatReply(messages);

      const callBody = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
      const systemInstruction = callBody.systemInstruction.parts[0].text;

      expect(systemInstruction).toContain('HANA TECNICO');
    });
  });

  describe('Reglas del Sistema', () => {

    it('debe incluir las 6 reglas en el system prompt', async () => {
      const messages: Message[] = [
        { role: 'user', content: 'Hola' }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: 'Hola, cómo estás?' }]
            }
          }]
        })
      });

      await llmService.getChatReply(messages);

      const callBody = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
      const systemInstruction = callBody.systemInstruction.parts[0].text;

      expect(systemInstruction).toContain('Reglas:');
      expect(systemInstruction).toContain('Solo responde sobre temas del catalogo');
      expect(systemInstruction).toContain('NO des rutas de estudio');
      expect(systemInstruction).toContain('Cuando el usuario pida una ruta');
      expect(systemInstruction).toContain('Se directo y profesional');
      expect(systemInstruction).toContain('precios');
    });

    it('debe usar maxOutputTokens de config', async () => {
      const messages: Message[] = [
        { role: 'user', content: 'Hola' }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: 'Hola!' }]
            }
          }]
        })
      });

      await llmService.getChatReply(messages);

      const callBody = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);

      expect(callBody.generationConfig.maxOutputTokens).toBe(500);
    });

    it('debe mantener el prompt compacto al injectar el catalogo', async () => {
      const messages: Message[] = [
        { role: 'user', content: 'Que capacitaciones dictan' }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: 'Tenemos 54 capacitaciones.' }]
            }
          }]
        })
      });

      await llmService.getChatReply(messages);

      const callBody = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
      const systemInstruction = callBody.systemInstruction.parts[0].text;

      // El catalogo completo (54 cursos) ocupaba ~114 KB. Ahora debe ser un resumen.
      expect(systemInstruction.length).toBeLessThan(30 * 1024);
      expect(systemInstruction).toContain('Cursos disponibles (resumen)');
    });

    it('debe inyectar el detalle cuando se pide un atributo de un modulo', async () => {
      const messages: Message[] = [
        { role: 'user', content: 'dame el temario del curso de MM' }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: 'El temario es...' }]
            }
          }]
        })
      });

      await llmService.getChatReply(messages);

      const callBody = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
      const systemInstruction = callBody.systemInstruction.parts[0].text;

      expect(systemInstruction).toContain('Cursos disponibles (detalle)');
      expect(systemInstruction).toContain('temario');
    });

    it('debe incluir la regla de objetividad en el system prompt', async () => {
      const messages: Message[] = [
        { role: 'user', content: 'Hola' }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: 'Hola!' }]
            }
          }]
        })
      });

      await llmService.getChatReply(messages);

      const callBody = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
      const systemInstruction = callBody.systemInstruction.parts[0].text;

      expect(systemInstruction).toContain('OBJETIVIDAD');
      expect(systemInstruction).toContain('No inventes precios');
    });

    it('debe incluir la duracion en el detalle del curso', async () => {
      const messages: Message[] = [
        { role: 'user', content: 'dame el temario del curso de MM' }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: 'El temario es...' }]
            }
          }]
        })
      });

      await llmService.getChatReply(messages);

      const callBody = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
      const systemInstruction = callBody.systemInstruction.parts[0].text;

      expect(systemInstruction).toContain('"duracion"');
    });

    it('debe incluir la duracion en el resumen del catalogo', async () => {
      const messages: Message[] = [
        { role: 'user', content: 'Que capacitaciones dictan' }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: 'Tenemos 54 capacitaciones.' }]
            }
          }]
        })
      });

      await llmService.getChatReply(messages);

      const callBody = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
      const systemInstruction = callBody.systemInstruction.parts[0].text;

      expect(systemInstruction).toContain('Cursos disponibles (resumen)');
      expect(systemInstruction).toMatch(/duracion: consultar|\d+ horas/);
    });

    it('debe usar temperature de config', async () => {
      const messages: Message[] = [
        { role: 'user', content: 'Hola' }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: 'Hola!' }]
            }
          }]
        })
      });

      await llmService.getChatReply(messages);

      const callBody = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);

      expect(callBody.generationConfig.temperature).toBe(0.7);
    });
  });

  describe('Manejo de Errores', () => {

    it('debe lanzar error cuando la API retorna error', async () => {
      const messages: Message[] = [
        { role: 'user', content: 'Hola' }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => JSON.stringify({ error: { message: 'Model not found' } })
      });

      await expect(llmService.getChatReply(messages)).rejects.toThrow('Gemini API error: 404');
    });

    it('debe lanzar error cuando no hay contenido en respuesta', async () => {
      const messages: Message[] = [
        { role: 'user', content: 'Hola' }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: []
            }
          }]
        })
      });

      await expect(llmService.getChatReply(messages)).rejects.toThrow('Respuesta invalida de Gemini: sin contenido.');
    });
  });

  describe('detectIntent - Intencion de registro DEMO', () => {

    const ask = (content: string): Message[] => [{ role: 'user', content }];

    it('debe detectar intencion registro con modulo MM', () => {
      const result = llmService.detectIntent(ask('quiero una demo de MM'));

      expect(result.intent).toBe('registro');
      expect(result.demoModule).toBe('MM');
      expect(result.roleId).toBe('S4_MM_DEMO');
      expect(result.moduleCode).toBe('MM');
    });

    it('debe detectar el modulo por su nombre funcional (materiales -> MM)', () => {
      const result = llmService.detectIntent(ask('necesito una demo de materiales'));

      expect(result.intent).toBe('registro');
      expect(result.demoModule).toBe('MM');
    });

    it('debe detectar el modulo SD con "ventas"', () => {
      const result = llmService.detectIntent(ask('necesito prueba de ventas'));

      expect(result.intent).toBe('registro');
      expect(result.demoModule).toBe('SD');
      expect(result.roleId).toBe('S4_SD_DEMO');
    });

    it('debe detectar el modulo FI con "finanzas"', () => {
      const result = llmService.detectIntent(ask('demo de finanzas'));

      expect(result.demoModule).toBe('FI');
      expect(result.roleId).toBe('S4_FI_DEMO');
    });

    it('debe detectar el modulo PP con "produccion"', () => {
      const result = llmService.detectIntent(ask('demo de produccion'));

      expect(result.demoModule).toBe('PP');
      expect(result.roleId).toBe('S4_PP_DEMO');
    });

    it('debe detectar el modulo PM con "mantenimiento"', () => {
      const result = llmService.detectIntent(ask('quiero probar mantenimiento'));

      expect(result.demoModule).toBe('PM');
      expect(result.roleId).toBe('S4_PM_DEMO');
    });

    it('debe devolver registro sin modulo cuando no se menciona ninguno', () => {
      const result = llmService.detectIntent(ask('quiero registrarme'));

      expect(result.intent).toBe('registro');
      expect(result.demoModule).toBeUndefined();
      expect(result.roleId).toBeUndefined();
    });

    it('debe devolver solo el primer modulo cuando se mencionan varios', () => {
      const result = llmService.detectIntent(ask('quiero demo de MM y finanzas'));

      expect(result.demoModule).toBe('MM');
    });

    it('debe conservar la intencion de registro aunque mentione trabajo', () => {
      const result = llmService.detectIntent(ask('quiero una demo de MM para trabajar'));

      expect(result.intent).toBe('registro');
      expect(result.demoModule).toBe('MM');
    });

    it('debe detectar registro con palabra acentuada (inscripcion)', () => {
      const result = llmService.detectIntent(ask('quiero información sobre la inscripción'));

      expect(result.intent).toBe('registro');
    });

    it('no debe detectar registro por palabras que contienen los keywords', () => {
      const result = llmService.detectIntent(ask('no me falta nada, todo esta bien'));

      expect(result.intent).not.toBe('registro');
    });

    it('no debe asignar modulo cuando el mensaje no pide demo', () => {
      const result = llmService.detectIntent(ask('quiero saber sobre el curso de MM'));

      expect(result.demoModule).toBeUndefined();
    });
  });

  describe('detectIntent - Contexto de conversacion', () => {

    const convo = (sessionId?: string) => {
      const messages: Message[] = [
        { role: 'user', content: 'que cursos tengo demos disponibles?' },
        { role: 'assistant', content: 'Tenemos demos de MM, SD, FI, PP y PM.' },
        { role: 'user', content: 'quiero en sap mm' }
      ];
      return llmService.detectIntent(messages, sessionId);
    };

    it('debe activar demo cuando la intencion viene del contexto y el mensaje actual trae modulo', () => {
      const result = convo();

      expect(result.intent).toBe('registro');
      expect(result.demoModule).toBe('MM');
      expect(result.roleId).toBe('S4_MM_DEMO');
    });

    it('debe usar el prompt corto de modulo cuando la intencion viene del contexto', async () => {
      const messages: Message[] = [
        { role: 'user', content: 'que cursos tengo demos disponibles?' },
        { role: 'assistant', content: 'Tenemos MM, SD, FI, PP y PM.' },
        { role: 'user', content: 'quiero en sap mm' }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: 'La demo de SAP MM es sin costo.' }] } }]
        })
      });

      await llmService.getChatReply(messages);

      const callBody = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
      const systemInstruction = callBody.systemInstruction.parts[0].text;

      expect(systemInstruction).toContain('REGISTRO DEMO CON MODULO');
      expect(systemInstruction).toContain('SAP MM');
      expect(systemInstruction).toContain('solo se puede solicitar una demo por registro');
      expect(systemInstruction).not.toContain('S4 SD - Ventas y Distribucion');
    });

    it('debe activar demo con contexto persistente de sesion mas alla de la ventana', () => {
      const sessionId = 'sesion-contexto-001';

      llmService.detectIntent([{ role: 'user', content: 'que demos hay?' }], sessionId);

      const resultado = llmService.detectIntent([
        { role: 'user', content: 'que demos hay?' },
        { role: 'assistant', content: 'MM, SD, FI, PP, PM' },
        { role: 'user', content: 'cuentame sobre el curso de BTP' },
        { role: 'assistant', content: '...' },
        { role: 'user', content: 'y la de FI?' },
        { role: 'assistant', content: '...' },
        { role: 'user', content: 'quiero esa' }
      ], sessionId);

      expect(resultado.intent).toBe('registro');
    });

    it('NO debe activar demo si el mensaje actual es una consulta de precio del curso', () => {
      const messages: Message[] = [
        { role: 'user', content: 'quiero una demo de MM' },
        { role: 'assistant', content: '...' },
        { role: 'user', content: '¿cuánto cuesta el curso de MM?' }
      ];

      const result = llmService.detectIntent(messages);

      expect(result.intent).not.toBe('registro');
      expect(result.demoModule).toBeUndefined();
    });

    it('NO debe activar demo ante una consulta de duracion o temario', () => {
      const messages: Message[] = [
        { role: 'user', content: 'quiero una demo de MM' },
        { role: 'assistant', content: '...' },
        { role: 'user', content: '¿que temario tiene el curso de materiales?' }
      ];

      const result = llmService.detectIntent(messages);

      expect(result.demoModule).toBeUndefined();
    });

    it('debe heredar el modulo del contexto cuando el mensaje actual no lo menciona', () => {
      const messages: Message[] = [
        { role: 'user', content: 'quiero una demo de finanzas' },
        { role: 'assistant', content: '...' },
        { role: 'user', content: 'quiero registrarme' }
      ];

      const result = llmService.detectIntent(messages);

      expect(result.intent).toBe('registro');
      expect(result.demoModule).toBe('FI');
    });

    it('NO debe arrastrar el contexto entre sesiones distintas', () => {
      llmService.detectIntent([{ role: 'user', content: 'quiero una demo de MM' }], 'sesion-A');

      const result = llmService.detectIntent(
        [{ role: 'user', content: 'quiero en sap mm' }],
        'sesion-B'
      );

      expect(result.intent).not.toBe('registro');
    });
  });

  describe('showDemoAction - Boton unico por solicitud', () => {

    it('debe mostrar el boton en la primera solicitud de demo', () => {
      const result = llmService.detectIntent([{ role: 'user', content: 'quiero una demo de MM' }], 'sesion-unica-1');

      expect(result.intent).toBe('registro');
      expect(result.demoModule).toBe('MM');
      expect(result.showDemoAction).toBe(true);
    });

    it('NO debe volver a mostrar el boton si se menciona el mismo modulo', () => {
      const sessionId = 'sesion-unica-2';

      const primero = llmService.detectIntent([{ role: 'user', content: 'quiero una demo de MM' }], sessionId);
      expect(primero.showDemoAction).toBe(true);

      const segundo = llmService.detectIntent([
        { role: 'user', content: 'quiero una demo de MM' },
        { role: 'assistant', content: '...' },
        { role: 'user', content: 'cuentame mas sobre MM' }
      ], sessionId);

      // "cuentame mas sobre MM" es una consulta de informacion, no una solicitud de demo.
      expect(segundo.intent).not.toBe('registro');
      expect(segundo.showDemoAction).toBe(false);
    });

    it('debe volver a mostrar el boton si se solicita un modulo distinto', () => {
      const sessionId = 'sesion-unica-3';

      llmService.detectIntent([{ role: 'user', content: 'quiero una demo de MM' }], sessionId);

      const otro = llmService.detectIntent([
        { role: 'user', content: 'quiero una demo de MM' },
        { role: 'assistant', content: '...' },
        { role: 'user', content: 'y la de SD?' }
      ], sessionId);

      expect(otro.demoModule).toBe('SD');
      expect(otro.showDemoAction).toBe(true);
    });

    it('debe volver a mostrar el boton ante una solicitud explicita nueva', () => {
      const sessionId = 'sesion-unica-4';

      llmService.detectIntent([{ role: 'user', content: 'quiero una demo de MM' }], sessionId);

      const nuevo = llmService.detectIntent([
        { role: 'user', content: 'quiero una demo de MM' },
        { role: 'assistant', content: '...' },
        { role: 'user', content: 'quiero una demo de MM' }
      ], sessionId);

      expect(nuevo.showDemoAction).toBe(true);
    });

    it('NO debe mostrar el boton cuando el mensaje es una consulta de precio', () => {
      const sessionId = 'sesion-unica-5';

      llmService.detectIntent([{ role: 'user', content: 'quiero una demo de MM' }], sessionId);

      const consulta = llmService.detectIntent([
        { role: 'user', content: 'quiero una demo de MM' },
        { role: 'assistant', content: '...' },
        { role: 'user', content: '¿cuánto cuesta el curso de SD?' }
      ], sessionId);

      expect(consulta.showDemoAction).toBe(false);
    });

    it('debe mostrar el boton cuando la intencion viene del contexto y es la primera vez', () => {
      const sessionId = 'sesion-unica-6';

      llmService.detectIntent([{ role: 'user', content: 'que demos hay?' }], sessionId);

      const resultado = llmService.detectIntent([
        { role: 'user', content: 'que demos hay?' },
        { role: 'assistant', content: 'MM, SD, FI, PP, PM' },
        { role: 'user', content: 'quiero en sap mm' }
      ], sessionId);

      expect(resultado.demoModule).toBe('MM');
      expect(resultado.showDemoAction).toBe(true);
    });

    it('NO debe mostrar el boton si la conversacion ya cambio de rumbo a cursos', () => {
      const sessionId = 'sesion-rumbo-1';

      llmService.detectIntent([{ role: 'user', content: 'quiero una demo de MM' }], sessionId);

      const desvio = llmService.detectIntent([
        { role: 'user', content: 'quiero una demo de MM' },
        { role: 'assistant', content: '...' },
        { role: 'user', content: 'cuentame sobre el curso de SD' }
      ], sessionId);

      expect(desvio.showDemoAction).toBe(false);
    });

    it('NO debe mostrar el boton en un mensaje posterior a un desvio hacia formacion', () => {
      const sessionId = 'sesion-rumbo-2';

      llmService.detectIntent([{ role: 'user', content: 'quiero una demo de MM' }], sessionId);

      llmService.detectIntent([
        { role: 'user', content: 'quiero una demo de MM' },
        { role: 'assistant', content: '...' },
        { role: 'user', content: 'cuentame sobre el curso de SD' }
      ], sessionId);

      const posterior = llmService.detectIntent([
        { role: 'user', content: 'quiero una demo de MM' },
        { role: 'assistant', content: '...' },
        { role: 'user', content: 'cuentame sobre el curso de SD' },
        { role: 'assistant', content: '...' },
        { role: 'user', content: 'y de PP?' }
      ], sessionId);

      expect(posterior.showDemoAction).toBe(false);
    });

    it('debe mostrar el boton ante una peticion eliptica con verbo de solicitud', () => {
      const sessionId = 'sesion-rumbo-3';

      llmService.detectIntent([{ role: 'user', content: 'que cursoss hay?' }], sessionId);

      const peticion = llmService.detectIntent([
        { role: 'user', content: 'que demos hay?' },
        { role: 'assistant', content: 'MM, SD, FI, PP, PM' },
        { role: 'user', content: 'quiero en sap mm' }
      ], sessionId);

      expect(peticion.demoModule).toBe('MM');
      expect(peticion.showDemoAction).toBe(true);
    });

    it('debe mostrar el boton si el mensaje es continuacion inmediata de la solicitud para otro modulo', () => {
      const sessionId = 'sesion-rumbo-4';

      llmService.detectIntent([{ role: 'user', content: 'quiero una demo de MM' }], sessionId);

      const continuacion = llmService.detectIntent([
        { role: 'user', content: 'quiero una demo de MM' },
        { role: 'assistant', content: '...' },
        { role: 'user', content: 'y de PP?' }
      ], sessionId);

      expect(continuacion.demoModule).toBe('PP');
      expect(continuacion.showDemoAction).toBe(true);
    });
  });
});
