import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { config } from './config';
import chatRoutes from './routes/chat.routes';
import sapRoutes from './routes/sap.routes';
import { pool } from './services/db.service';

const app: Application = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', chatRoutes);
app.use('/api/sap', sapRoutes);

const CATALOGO_PATH = path.join(__dirname, '..', 'frontend', 'catalogo_cursos.json');

app.post('/api/admin/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (username === config.admin.user && password === config.admin.pass) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: 'Credenciales inválidas' });
  }
});

app.get('/api/admin/data', (_req: Request, res: Response) => {
  try {
    const data = JSON.parse(fs.readFileSync(CATALOGO_PATH, 'utf-8'));
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al cargar datos' });
  }
});

app.post('/api/admin/sync', (req: Request, res: Response) => {
  try {
    const { cursos, perfiles } = req.body;
    const currentData = JSON.parse(fs.readFileSync(CATALOGO_PATH, 'utf-8'));
    currentData.cursos = cursos;
    currentData.perfiles = perfiles;
    fs.writeFileSync(CATALOGO_PATH, JSON.stringify(currentData, null, 2), 'utf-8');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al sincronizar' });
  }
});

app.get('/api/admin/users', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM usuarios_sap ORDER BY fecha_registro DESC');
    res.json({ success: true, users: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al obtener usuarios' });
  }
});

app.get('/admin', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'admin.html'));
});

app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

const port = parseInt(process.env.PORT || '3000', 10);
app.listen(port, '0.0.0.0', () => {
  console.log(`ITSYSTEMS Academic Advisor running on port ${port}`);
  console.log(`Gemini model: ${config.gemini.model}`);
  console.log(`Frontend static files: ${path.join(__dirname, '..', 'frontend')}`);
});
