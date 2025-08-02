import { Router } from 'express';
import { chatController} from '../controllers/chat.controller';

const router = Router();

router.get('/messages', chatController.getMessages);
router.post('/messages', chatController.sendMessage);

export default router;