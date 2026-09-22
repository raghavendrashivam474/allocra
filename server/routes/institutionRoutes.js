import { Router } from 'express';
import { getInstitution, saveInstitution } from '../controllers/institutionController.js';

const router = Router();

router.get('/', getInstitution);
router.post('/', saveInstitution);

export default router;
