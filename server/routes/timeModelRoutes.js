import { Router } from 'express';
import { getTimeModel, saveTimeModel } from '../controllers/timeModelController.js';

const router = Router();

router.get('/', getTimeModel);
router.put('/', saveTimeModel);

export default router;
