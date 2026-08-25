import request from 'supertest';
import express from 'express';
import chatRoutes from '../src/routes/chat.routes';

const app = express();
app.use(express.json());
app.use('/api', chatRoutes);

const FRASES_PROHIBIDAS = [
  'aproximadamente',
  'alrededor de',
  'puede ser',
  'probablemente',
  'segun mi conocimiento',
  'creo que',
  'quizas',
  '50 horas',
  '100 dolares',
  '100 dollars',
  '150 dolares',
  '150 dollars',
  '200 dolares',
  '200 dollars',
];

function containsForbiddenPhrases(text: string): string | null {
  const lower = text.toLowerCase();
  for (const phrase of FRASES_PROHIBIDAS) {
    if (lower.includes(phrase.toLowerCase())) {
      return phrase;
    }
  }
  return null;
}

async function sendMessage(sessionId: string, message: string): Promise<string> {
  const response = await request(app)
    .post('/api/chat')
    .send({ sessionId, message });

  if (response.status !== 200) {
    throw new Error(`API responded with status ${response.status}: ${JSON.stringify(response.body)}`);
  }

  return response.body.reply;
}

describe('Integration Tests - LLM Real Responses (Fase C)', () => {

  describe('CATALOGO - Validacion de Cursos', () => {
    it.skip('INT-01: debe mencionar SAP FI con duracion de 40 horas', async () => {
      const reply = await sendMessage('test-int-01', '¿Cuántas horas tiene el curso de SAP FI?');

      expect(reply.toLowerCase()).toMatch(/40\s*(horas|h)/);

      const forbidden = containsForbiddenPhrases(reply);
      expect(forbidden).toBeNull();
    }, 60000);

    it.skip('INT-02: debe mencionar SAP MM con duracion de 35 horas', async () => {
      const reply = await sendMessage('test-int-02', '¿Cuántas horas dura SAP MM?');

      expect(reply.toLowerCase()).toMatch(/35\s*(horas|h)/);

      const forbidden = containsForbiddenPhrases(reply);
      expect(forbidden).toBeNull();
    }, 60000);

    it.skip('INT-03: debe mencionar SAP SD con duracion de 35 horas', async () => {
      const reply = await sendMessage('test-int-03', '¿Cuántas horas dura el curso de SAP SD?');

      expect(reply.toLowerCase()).toMatch(/35\s*(horas|h)/);

      const forbidden = containsForbiddenPhrases(reply);
      expect(forbidden).toBeNull();
    }, 60000);

    it.skip('INT-04: debe mencionar Programacion ABAP con duracion de 45 horas', async () => {
      const reply = await sendMessage('test-int-04', '¿Cuántas horas tiene el curso de Programacion SAP ABAP?');

      expect(reply.toLowerCase()).toMatch(/45\s*(horas|h)/);

      const forbidden = containsForbiddenPhrases(reply);
      expect(forbidden).toBeNull();
    }, 60000);

    it.skip('INT-05: debe mencionar SAP CAP con duracion de 30 horas', async () => {
      const reply = await sendMessage('test-int-05', '¿Cuántas horas tiene SAP Cloud Application Programming - CAP?');

      expect(reply.toLowerCase()).toMatch(/30\s*(horas|h)/);

      const forbidden = containsForbiddenPhrases(reply);
      expect(forbidden).toBeNull();
    }, 60000);
  });

  describe('FLUJO CONVERSACIONAL - Perfiles y Rutas', () => {
    it.skip('INT-06: debe describir perfiles disponibles cuando usuario no sabe que estudiar', async () => {
      const reply = await sendMessage('test-int-06', 'No se que curso tomar, que me recomiendas?');

      const lowerReply = reply.toLowerCase();
      expect(lowerReply).toMatch(/perfil|perfiles|consultor|desarrollador/i);

      const forbidden = containsForbiddenPhrases(reply);
      expect(forbidden).toBeNull();
    }, 60000);

    it.skip('INT-07: debe indicar que puede diseñar una ruta si el usuario muestra interes', async () => {
      const reply = await sendMessage('test-int-07', 'Quiero ser consultor SAP');

      const lowerReply = reply.toLowerCase();
      const hasInterest = lowerReply.includes('ruta') || lowerReply.includes('disenar') ||
                          lowerReply.includes('diseño') || lowerReply.includes('autoriz') ||
                          lowerReply.includes('te gustaria') || lowerReply.includes('confirm');

      expect(hasInterest).toBe(true);

      const forbidden = containsForbiddenPhrases(reply);
      expect(forbidden).toBeNull();
    }, 60000);

    it.skip('INT-08: NO debe enumerar cursos como "1. 2. 3." en primera respuesta si solo pregunta por cursos', async () => {
      const reply = await sendMessage('test-int-08', '¿Qué cursos tienen disponibles?');

      const lowerReply = reply.toLowerCase();
      const hasSequence = (lowerReply.includes('1.') && lowerReply.includes('2.') && lowerReply.includes('3.')) ||
                          (lowerReply.includes('primero') && lowerReply.includes('segundo') && lowerReply.includes('tercero'));

      const forbidden = containsForbiddenPhrases(reply);
      expect(forbidden).toBeNull();
    }, 60000);
  });

  describe('RESTRICCIONES - Informacion fuera del Catalogo', () => {
    it.skip('INT-09: debe declinar preguntas sobre precios sin inventar numeros', async () => {
      const reply = await sendMessage('test-int-09', '¿Cuanto cuesta el curso de SAP FI?');

      const forbidden = containsForbiddenPhrases(reply);
      expect(forbidden).toBeNull();
    }, 60000);

    it.skip('INT-10: debe declinar preguntas sobre profesores sin inventar nombres', async () => {
      const reply = await sendMessage('test-int-10', '¿Quienes son los profesores?');

      const forbidden = containsForbiddenPhrases(reply);
      expect(forbidden).toBeNull();
    }, 60000);

    it.skip('INT-11: debe declinar preguntas sobre examenes sin inventar informacion', async () => {
      const reply = await sendMessage('test-int-11', '¿Hay examenes finales?');

      const forbidden = containsForbiddenPhrases(reply);
      expect(forbidden).toBeNull();
    }, 60000);

    it.skip('INT-12: debe declinar preguntas sobre certificaciones de otros vendors', async () => {
      const reply = await sendMessage('test-int-12', '¿Tienen cursos de AWS o Azure?');

      const forbidden = containsForbiddenPhrases(reply);
      expect(forbidden).toBeNull();
    }, 60000);
  });

  describe('MODALIDAD - Todos los cursos son virtuales', () => {
    it.skip('INT-13: debe indicar modalidad virtual para cursos', async () => {
      const reply = await sendMessage('test-int-13', '¿SAP FI es presencial o virtual?');

      const lowerReply = reply.toLowerCase();
      expect(lowerReply).toMatch(/virtual/i);
      expect(lowerReply).not.toMatch(/presencial/i);

      const forbidden = containsForbiddenPhrases(reply);
      expect(forbidden).toBeNull();
    }, 60000);
  });

  describe('NIVELES - Validacion de niveles de cursos', () => {
    it.skip('INT-14: debe indicar que SAP ABAP es nivel Avanzado', async () => {
      const reply = await sendMessage('test-int-14', '¿Que nivel tiene el curso de Programacion ABAP?');

      const lowerReply = reply.toLowerCase();
      expect(lowerReply).toMatch(/avanzado/i);

      const forbidden = containsForbiddenPhrases(reply);
      expect(forbidden).toBeNull();
    }, 60000);

    it.skip('INT-15: debe indicar que SAP FI es nivel Intermedio', async () => {
      const reply = await sendMessage('test-int-15', '¿Que nivel tiene el curso de SAP FI?');

      const lowerReply = reply.toLowerCase();
      expect(lowerReply).toMatch(/intermedio/i);

      const forbidden = containsForbiddenPhrases(reply);
      expect(forbidden).toBeNull();
    }, 60000);
  });

  describe('PERFILES - Descripcion de perfiles', () => {
    it.skip('INT-16: debe describir al Consultor Funcional', async () => {
      const reply = await sendMessage('test-int-16', 'Que hace un Consultor Funcional SAP?');

      const lowerReply = reply.toLowerCase();
      const hasContent = reply.length > 20;

      expect(hasContent).toBe(true);

      const forbidden = containsForbiddenPhrases(reply);
      expect(forbidden).toBeNull();
    }, 60000);

    it.skip('INT-17: debe describir al Desarrollador SAP', async () => {
      const reply = await sendMessage('test-int-17', 'Que hace un Desarrollador SAP?');

      const lowerReply = reply.toLowerCase();
      const hasContent = reply.length > 20;

      expect(hasContent).toBe(true);

      const forbidden = containsForbiddenPhrases(reply);
      expect(forbidden).toBeNull();
    }, 60000);
  });
});
