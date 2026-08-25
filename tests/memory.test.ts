import { MemoryService } from '../src/services/memory.service';
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { resolve } from 'path';

const SESIONES_PATH = resolve(process.cwd(), 'sesiones.json');

async function cleanupSessions(): Promise<void> {
  try {
    if (existsSync(SESIONES_PATH)) {
      await writeFile(SESIONES_PATH, '{}', 'utf-8');
    }
  } catch (error) {
  }
}

describe('MemoryService - Tests de Memoria de Sesiones', () => {

  beforeEach(async () => {
    await cleanupSessions();
  });

  afterEach(async () => {
    await cleanupSessions();
  });

  describe('testCreacionSesionNueva', () => {
    it('debe crear una sesion nueva vacia', async () => {
      const memoryService = new MemoryService();
      const sessionId = 'test-session-unico-001';
      await memoryService.loadSessions();

      const session = memoryService.getOrCreateSession(sessionId);

      expect(session).toBeDefined();
      expect(Array.isArray(session)).toBe(true);
      expect(session.length).toBe(0);
    });
  });

  describe('testAgregarMensajeUsuario', () => {
    it('debe agregar un mensaje de usuario a la sesion', async () => {
      const memoryService = new MemoryService();
      const sessionId = 'test-session-unico-002';
      await memoryService.loadSessions();

      const result = await memoryService.appendMessage(sessionId, 'user', 'Hola, que cursos ofrecen?');

      expect(result.messages.length).toBe(1);
      expect(result.messages[0].role).toBe('user');
      expect(result.messages[0].content).toBe('Hola, que cursos ofrecen?');
    });
  });

  describe('testAgregarMensajeAssistant', () => {
    it('debe agregar un mensaje de assistant a la sesion', async () => {
      const memoryService = new MemoryService();
      const sessionId = 'test-session-unico-003';
      await memoryService.loadSessions();

      await memoryService.appendMessage(sessionId, 'user', 'Hola');
      const result = await memoryService.appendMessage(sessionId, 'assistant', 'Hola, en que puedo ayudarte?');

      expect(result.messages.length).toBe(2);
      expect(result.messages[0].role).toBe('user');
      expect(result.messages[1].role).toBe('assistant');
      expect(result.messages[1].content).toBe('Hola, en que puedo ayudarte?');
    });
  });

  describe('testLimiteHistorial', () => {
    it('debe podar mensajes cuando excede el limite de 10 pares', async () => {
      const memoryService = new MemoryService();
      const sessionId = 'test-session-unico-004';
      await memoryService.loadSessions();

      for (let i = 1; i <= 25; i++) {
        await memoryService.appendMessage(sessionId, 'user', `Pregunta ${i}`);
        await memoryService.appendMessage(sessionId, 'assistant', `Respuesta ${i}`);
      }

      const session = memoryService.getOrCreateSession(sessionId);
      const interactionMessages = session.length;

      expect(interactionMessages).toBeLessThanOrEqual(21);
    });
  });

  describe('testSesionesMultiples', () => {
    it('debe manejar multiples sesiones independientes', async () => {
      const memoryService = new MemoryService();
      await memoryService.loadSessions();

      await memoryService.appendMessage('session-X', 'user', 'Mensaje X');
      await memoryService.appendMessage('session-Y', 'user', 'Mensaje Y');

      const sessionX = memoryService.getOrCreateSession('session-X');
      const sessionY = memoryService.getOrCreateSession('session-Y');

      expect(sessionX.length).toBe(1);
      expect(sessionY.length).toBe(1);
      expect(sessionX[0].content).toBe('Mensaje X');
      expect(sessionY[0].content).toBe('Mensaje Y');
    });
  });

  describe('testPersistenciaArchivo', () => {
    it('debe persistir sesiones en archivo', async () => {
      const memoryService = new MemoryService();
      const sessionId = 'test-session-unico-005';
      await memoryService.loadSessions();

      await memoryService.appendMessage(sessionId, 'user', 'Mensaje persistente');
      await memoryService.saveAndClear();

      expect(existsSync(SESIONES_PATH)).toBe(true);
    });
  });
});
