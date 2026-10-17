import express from 'express';
import { 
  getConversations, 
  getMessages, 
  sendMessage, 
  checkChatEligibility 
} from '../../controllers/user/chatController.js';

const router = express.Router();

router.get('/chats/conversations', getConversations);
router.get('/chats/messages/:otherUserId', getMessages);
router.post('/chats/messages', sendMessage);
router.get('/chats/eligibility/:targetUserId', checkChatEligibility);

export default router;
