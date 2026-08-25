import { Request, Response } from 'express';
import { LLMService } from '../services/llm.service';
import { MemoryService } from '../services/memory.service';

const llmService = new LLMService();
const memoryService = new MemoryService();

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

    const userResult = await memoryService.appendMessage(sessionId.trim(), 'user', message.trim());

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
