import express from 'express';
import { getTerms, createTerm } from '../controllers/termController.js';

const router = express.Router();

router.get('/', getTerms);
router.post('/', createTerm);

export default router;
