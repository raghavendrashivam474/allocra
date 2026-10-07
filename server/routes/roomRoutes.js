import { Router } from 'express';
import { getRooms, createRoom } from '../controllers/roomController.js';

const router = Router();

router.get('/', getRooms);
router.post('/', createRoom);

export default router;
