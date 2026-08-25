import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { config } from './config';
import chatRoutes from './routes/chat.routes';
import sapRoutes from './routes/sap.routes';

const app: Application = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', chatRoutes);
app.use('/api/sap', sapRoutes);

app.listen(config.port, () => {
  console.log(`ITSYSTEMS Academic Advisor running on port ${config.port}`);
  console.log(`Gemini model: ${config.gemini.model}`);
});
