import { Router } from 'express';
import { getFaculty, createFaculty } from '../controllers/facultyController.js';

const router = Router();

router.get('/', getFaculty);
router.post('/', createFaculty);

export default router;
