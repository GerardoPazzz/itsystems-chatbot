import { Request, Response } from 'express';
import { LLMService } from '../services/llm.service';
import { MemoryService } from '../services/memory.service';

const llmService = new LLMService();
const memoryService = new MemoryService();

const MAX_MESSAGE_LENGTH = 250;

function sanitizeMessage(message: string): string {
  let clean = message.replace(/[\x00-\x1F\x7F]/g, '');

  const patterns = [
    /ignore\s+(all\s+)?previous\s+instructions?/gi,
    /you\s+are\s+(now\s+)?dan/gi,
    /forget\s+(all\s+)?(previous|your)/gi,
    /system\s*:/gi,
  ];

  for (const pattern of patterns) {
    clean = clean.replace(pattern, '[instrucción eliminada]');
  }

  return clean;
}

function isJunkInput(message: string): { isJunk: boolean; reason?: string } {
  const trimmed = message.trim();

  if (/^[?!\.¡¿]+$/.test(trimmed)) {
    return { isJunk: true, reason: 'puntuacion' };
  }

  if (/[bcdfghjklmnpqrstvwxyz]{5,}/i.test(trimmed)) {
    return { isJunk: true, reason: 'random' };
  }

  const words = trimmed.split(/\s+/);
  if (words.length <= 2 && trimmed.length < 8) {
    const saludos = /^(hola|buenos|dias|tardes|noches)$/i;

    const palabrasCortasValidas = /^(sap|sbo|s4|hana|ecc|b1|mm|sd|fi|pp|pm|co|qm|wm|tm|ps|ewm|basis|abap|fiori|btp|sdk|asesor|asesores|curso|cursos|formacion|precio|precios|costo|costos|cuota|cuotas|consulta|consultas|duda|dudas|rol|roles|perfil|perfiles|registro|informacion|catalogo|temario|modulo|modulos|virtual|online|presencial|itsystems)$/i;

    if (!saludos.test(trimmed) && !palabrasCortasValidas.test(trimmed)) {
      return { isJunk: true, reason: 'vago' };
    }
  }

  return { isJunk: false };
}

const JUNK_RESPONSES = {
  'puntuacion': '¡Hola! Parece que solo enviaste símbolos. Para poder ayudarte con información sobre nuestros cursos SAP, ¿podrías escribir tu pregunta con palabras? 😊',

  'random': '¡Hola! Tu mensaje no parece tener sentido claro. ¿Podrías escribirlo de otra forma? Estoy aquí para ayudarte con cualquier duda sobre cursos o roles SAP.',

  'vago': '¡Hola! Tu mensaje es un poco corto para entenderte bien. ¿Podrías darme más detalles sobre lo que necesitas? Por ejemplo, puedes preguntarme sobre cursos SAP, precios o perfiles profesionales.'
};

export const chatController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId, message } = req.body;

    if (!sessionId || typeof sessionId !== 'string' || sessionId.trim().length === 0) {
      res.status(400).json({
        error: 'El campo "sessionId" es requerido y debe ser un texto no vacio.'
      });
      return;
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      res.status(400).json({
        error: 'El campo "message" es requerido y debe ser un texto no vacio.'
      });
      return;
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      res.status(400).json({
        error: `El mensaje no puede exceder ${MAX_MESSAGE_LENGTH} caracteres.`
      });
      return;
    }

    const sanitized = sanitizeMessage(message.trim());
    const junkCheck = isJunkInput(sanitized);

    if (junkCheck.isJunk) {
      const response = JUNK_RESPONSES[junkCheck.reason as keyof typeof JUNK_RESPONSES];
      await memoryService.appendMessage(sessionId.trim(), 'user', sanitized);
      await memoryService.appendMessage(sessionId.trim(), 'assistant', response);
      res.json({ reply: response, limitReached: false });
      return;
    }

    const userResult = await memoryService.appendMessage(sessionId.trim(), 'user', sanitized);

    const reply = await llmService.getChatReply(userResult.messages);

    const assistantResult = await memoryService.appendMessage(sessionId.trim(), 'assistant', reply);

    res.json({
      reply,
      limitReached: assistantResult.limitReached
    });
  } catch (error) {
    console.error('Error en chatController:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};
