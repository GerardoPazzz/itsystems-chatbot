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
        id: 'sap-fi',
        nombre: 'SAP FI - Financial Accounting',
        descripcion: 'Curso integral de Contabilidad Financiera',
        duracion: '40 horas',
        nivel: 'Intermedio'
      },
      {
        id: 'sap-mm',
        nombre: 'SAP MM - Material Management',
        descripcion: 'Curso completo de Gestion de Materiales',
        duracion: '35 horas',
        nivel: 'Intermedio'
      },
      {
        id: 'sap-sd',
        nombre: 'SAP SD - Sales and Distribution',
        descripcion: 'Curso especializado en Ventas y Distribucion',
        duracion: '35 horas',
        nivel: 'Intermedio'
      },
      {
        id: 'sap-abap',
        nombre: 'Programacion SAP ABAP',
        descripcion: 'Curso completo de programacion ABAP',
        duracion: '45 horas',
        nivel: 'Avanzado'
      },
      {
        id: 'sap-cap',
        nombre: 'SAP Cloud Application Programming',
        descripcion: 'Desarrollo cloud nativo con CAP',
        duracion: '30 horas',
        nivel: 'Avanzado'
      }
    ],
    perfiles: [
      {
        id: 'consultor-funcional',
        nombre: 'Consultor Funcional SAP',
        descripcion: 'Especializado en configuracion y optimizacion'
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
        { role: 'user', content: 'SAP FI es requerido en el mercado?' }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: 'Sí, SAP FI es muy demandado...' }]
            }
          }]
        })
      });

      await llmService.getChatReply(messages);

      const callBody = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
      const systemInstruction = callBody.systemInstruction.parts[0].text;

      expect(systemInstruction).toContain('Reglas:');
      expect(callBody.contents[0].parts[0].text).toBe('SAP FI es requerido en el mercado?');
    });

    it('debe detectar pregunta especifica de SAP FI', async () => {
      const messages: Message[] = [
        { role: 'user', content: 'Cuanto dura el curso de SAP FI?' }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: 'El curso dura 40 horas...' }]
            }
          }]
        })
      });

      await llmService.getChatReply(messages);

      const callBody = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
      const systemInstruction = callBody.systemInstruction.parts[0].text;

      expect(systemInstruction).toContain('sap-fi');
      expect(systemInstruction).not.toContain('sap-mm');
      expect(systemInstruction).not.toContain('sap-sd');
    });

    it('debe detectar pregunta especifica de SAP MM', async () => {
      const messages: Message[] = [
        { role: 'user', content: 'Cuales son los prerrequisitos de SAP MM?' }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: 'Los prerrequisitos son...' }]
            }
          }]
        })
      });

      await llmService.getChatReply(messages);

      const callBody = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
      const systemInstruction = callBody.systemInstruction.parts[0].text;

      expect(systemInstruction).toContain('sap-mm');
      expect(systemInstruction).not.toContain('sap-fi');
    });

    it('debe detectar pregunta sobre perfiles/rutas', async () => {
      const messages: Message[] = [
        { role: 'user', content: 'Que cursos tiene el perfil Consultor Funcional?' }
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
        { role: 'user', content: 'Cual es la ruta para ser desarrollador SAP?' }
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

    it('debe detectar pregunta de mercado con "trabajo"', async () => {
      const messages: Message[] = [
        { role: 'user', content: 'Es fácil encontrar trabajo con SAP SD?' }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: 'SAP SD tiene buenas perspectivas...' }]
            }
          }]
        })
      });

      await llmService.getChatReply(messages);

      const callBody = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);

      expect(callBody.contents[0].parts[0].text).toBe('Es fácil encontrar trabajo con SAP SD?');
    });

    it('debe detectar "sueldo" como pregunta de mercado', async () => {
      const messages: Message[] = [
        { role: 'user', content: 'Cual es el sueldo promedio de un consultor SAP?' }
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

      expect(callBody.contents[0].parts[0].text).toBe('Cual es el sueldo promedio de un consultor SAP?');
    });

    it('debe detectar pregunta sobre ABAP', async () => {
      const messages: Message[] = [
        { role: 'user', content: 'Que es SAP ABAP?' }
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

      expect(systemInstruction).toContain('sap-abap');
    });

    it('debe detectar pregunta sobre CAP/Cloud', async () => {
      const messages: Message[] = [
        { role: 'user', content: 'Que es SAP CAP?' }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: 'CAP es...' }]
            }
          }]
        })
      });

      await llmService.getChatReply(messages);

      const callBody = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
      const systemInstruction = callBody.systemInstruction.parts[0].text;

      expect(systemInstruction).toContain('sap-cap');
    });
  });

  describe('Reglas del Sistema', () => {

    it('debe incluir las 5 reglas en el system prompt', async () => {
      const messages: Message[] = [
        { role: 'user', content: 'Hola' }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: 'Hola, como estas?' }]
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
      expect(systemInstruction).toContain('Sin frases como "creo que", "quizas"');
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
});
