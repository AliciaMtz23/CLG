import { Router } from 'express';
import { loginAdministrador } from '../controllers/authControllers.js';

const router = Router();

router.post('/login-admin', loginAdministrador);

export default router;