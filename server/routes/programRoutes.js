import { Router } from 'express';
import { getPrograms, createProgram } from '../controllers/programController.js';

const router = Router();

router.get('/', getPrograms);
router.post('/', createProgram);

export default router;
