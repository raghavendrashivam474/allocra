import { Router } from 'express';
import { getReadiness } from '../controllers/setupController.js';

const router = Router();

router.get('/readiness', getReadiness);

export default router;
