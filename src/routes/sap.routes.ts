import { Router } from 'express';
import { sapRegisterController } from '../controllers/sap.controller';

const router = Router();

router.post('/register', sapRegisterController);

export default router;
