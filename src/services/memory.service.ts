import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';

const SESSIONS_FILE = resolve(process.cwd(), 'sesiones.json');
const MAX_HISTORY_MESSAGES = 25;

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AppendMessageResult {
  messages: Message[];
  limitReached: boolean;
}

export class MemoryService {
  private sessions: Map<string, Message[]>;
  private loaded: boolean;

  constructor() {
    this.sessions = new Map();
    this.loaded = false;
  }

  async loadSessions(): Promise<void> {
    if (this.loaded) {
      return;
    }

    try {
      const data = await readFile(SESSIONS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      this.sessions = new Map(Object.entries(parsed));
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        this.sessions = new Map();
      } else {
        console.error('Error al leer sesiones:', error.message);
        this.sessions = new Map();
      }
    }

    this.loaded = true;
  }

  async saveSessions(): Promise<void> {
    try {
      const obj = Object.fromEntries(this.sessions);
      await writeFile(SESSIONS_FILE, JSON.stringify(obj, null, 2), 'utf-8');
    } catch (error: any) {
      console.error('Error al guardar sesiones:', error.message);
    }
  }

  getOrCreateSession(sessionId: string): Message[] {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, []);
    }
    return this.sessions.get(sessionId)!;
  }

  addMessage(sessionId: string, role: 'user' | 'assistant', content: string): AppendMessageResult {
    const session = this.getOrCreateSession(sessionId);
    session.push({ role, content });

    const limitReached = session.length >= MAX_HISTORY_MESSAGES;

    return { messages: session, limitReached };
  }

  async appendMessage(sessionId: string, role: 'user' | 'assistant', content: string): Promise<AppendMessageResult> {
    await this.loadSessions();
    const result = this.addMessage(sessionId, role, content);

    if (result.limitReached) {
      await this.saveSessions();
      this.sessions.delete(sessionId);
    }

    return result;
  }

  async saveAndClear(): Promise<void> {
    await this.saveSessions();
  }
}
