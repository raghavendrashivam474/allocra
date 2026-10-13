import { Router } from 'express';
import {
  getActivities,
  createActivity,
  updateActivityRelationships
} from '../controllers/activityController.js';

const router = Router();

router.get('/', getActivities);
router.post('/', createActivity);
router.put('/:id/relationships', updateActivityRelationships);

export default router;
