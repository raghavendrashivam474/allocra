import { Router } from 'express';
import {
  getActivities,
  createActivity,
  updateActivityRelationships,
  validateActivities
} from '../controllers/activityController.js';

const router = Router();

router.get('/', getActivities);
router.get('/validation', validateActivities);
router.post('/', createActivity);
router.put('/:id/relationships', updateActivityRelationships);

export default router;
