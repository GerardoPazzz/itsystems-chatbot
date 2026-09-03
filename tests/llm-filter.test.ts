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
        dirigido: 'Consultores funcionales'
      },
      {
        id: 's4hana-mm-fi-pp-virtual',
        nombre: 'MM / FI / PP',
        segmento: 'S4 HANA',
        modalidad: 'VIRTUAL',
        dirigido: 'Consultores funcionales'
      },
      {
        id: 'hana-abap-virtual',
        nombre: 'ABAP',
        segmento: 'HANA TECNICO',
        modalidad: 'VIRTUAL',
        dirigido: 'Desarrolladores ABAP'
      },
      {
        id: 'hana-sql-online',
        nombre: 'SQL',
        segmento: 'HANA TECNICO',
        modalidad: 'ONLINE',
        dirigido: 'Desarrolladores'
      },
      {
        id: 'productividad-excel-soluciones-virtual',
        nombre: 'EXCEL SOLUCIONES EMPRESARIALES',
        segmento: 'PRODUCTIVIDAD',
        modalidad: 'VIRTUAL',
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
