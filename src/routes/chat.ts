import { Router } from 'express';
import { getMessages, sendMessage } from '../controllers/chat.controller';

const router = Router();

router.get('/messages', getMessages);
router.post('/messages', sendMessage);

export default router;