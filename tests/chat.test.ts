import request from 'supertest';
import express from 'express';
import chatRoutes from '../src/routes/chat.routes';

const app = express();
app.use(express.json());
app.use('/api', chatRoutes);

jest.mock('../src/services/llm.service', () => {
  return {
    LLMService: jest.fn().mockImplementation(() => ({
      getChatReply: jest.fn().mockImplementation((messages) => {
        const lastMessage = messages[messages.length - 1].content;
        if (lastMessage.includes('cursos')) {
          return Promise.resolve('Tenemos dos cursos: SAP BTP (25 horas) e Introduccion a SAP HANA Cloud (20 horas).');
        }
        if (lastMessage.includes('SAP BTP')) {
          return Promise.resolve('SAP BTP tiene una duracion de 25 horas y es virtual asincrono.');
        }
        if (lastMessage.includes('precio')) {
          return Promise.resolve('No dispongo de informacion sobre precios en el catalogo. Los cursos disponibles son SAP BTP e Introduccion a SAP HANA Cloud.');
        }
        return Promise.resolve('Respuesta generica de prueba.');
      })
    }))
  };
});

jest.mock('../src/services/memory.service', () => {
  return {
    MemoryService: jest.fn().mockImplementation(() => ({
      loadSessions: jest.fn().mockResolvedValue(undefined),
      appendMessage: jest.fn().mockImplementation((sessionId, role, content) => {
        return Promise.resolve({
          messages: [{ role: 'system', content: 'Test' }, { role, content }],
          limitReached: false
        });
      }),
      saveAndClear: jest.fn().mockResolvedValue(undefined)
    }))
  };
});

describe('Chat Controller - Tests de Endpoint', () => {

  describe('testChatEndpointBodyValido', () => {
    it('POST /api/chat debe responder con 200 cuando el body es valido', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({ sessionId: 'test-001', message: 'Cuales son los cursos?' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('reply');
    });
  });

  describe('testChatEndpointSinSessionId', () => {
    it('POST /api/chat debe responder con 400 si falta sessionId', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'Hola' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('testChatEndpointSinMessage', () => {
    it('POST /api/chat debe responder con 400 si falta message', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({ sessionId: 'test-001' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('testChatEndpointSessionIdVacio', () => {
    it('POST /api/chat debe responder con 400 si sessionId esta vacio', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({ sessionId: '', message: 'Hola' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('testChatEndpointMessageVacio', () => {
    it('POST /api/chat debe responder con 400 si message esta vacio', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({ sessionId: 'test-001', message: '' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('testChatEndpointFormatosInvalidos', () => {
    it('POST /api/chat debe responder con 400 si sessionId no es string', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({ sessionId: 123, message: 'Hola' });

      expect(response.status).toBe(400);
    });

    it('POST /api/chat debe responder con 400 si message no es string', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({ sessionId: 'test-001', message: { text: 'Hola' } });

      expect(response.status).toBe(400);
    });
  });

  describe('testChatRespuestaTieneReply', () => {
    it('POST /api/chat debe devolver un objeto con propiedad reply', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({ sessionId: 'test-002', message: 'Que cursos ofrecen?' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('reply');
      expect(typeof response.body.reply).toBe('string');
      expect(response.body.reply.length).toBeGreaterThan(0);
    });
  });
});
