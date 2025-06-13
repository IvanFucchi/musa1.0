import express from 'express';
import { protect, admin } from '../middleware/auth.js';
import { 
  createUGContent, 
  getUGCBySpot, 
  getUGCByUser, 
  getPendingUGContent, 
  deleteUGContent, 
  approveUGContent,
  updateUGContent 
} from '../controllers/ugcController.js';

const router = express.Router();

// Rotte pubbliche
router.get('/spot/:spotId', getUGCBySpot);

// Rotte protette
router.post('/', protect, createUGContent);
router.get('/user', protect, getUGCByUser);
router.route('/:id')
  .put(protect, updateUGContent)
  .delete(protect, deleteUGContent);

// Rotte admin
router.get('/pending', protect, admin, getPendingUGContent);
router.put('/:id/approve', protect, admin, approveUGContent);

export default router;
