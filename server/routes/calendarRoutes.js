import { Router } from 'express';
import { getCalendar, saveCalendar } from '../controllers/calendarController.js';

const router = Router();

router.get('/', getCalendar);
router.put('/', saveCalendar);

export default router;
